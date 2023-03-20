import { EventEmitter } from "events";
import { SynchronousRepeat } from "../Util/SynchronousRepeat";
import type { Task } from "../Util/Task";
import { TaskBatcher } from "../Util/TaskBatcher";
import type { CertHandler } from "./CertHandler";
import { CertHandlerEvent } from "./CertHandlerEvent";
import { CertMonitorEvent } from "./CertMonitorEvent";
import type { CertMonitorI } from "./CertMonitorI";
import { LetsEncryptJsError } from "../LetsEncryptJsError";

/**
 * Class for monitoring certificates - renewing or creating certificates as needed.
 */
export class CertMonitor implements CertMonitorI {

    /**
     * Map of domains and emails.
     */
    private readonly domains: Record<string, string> = {};

    /**
     * Map of domains and emails.
     */
    private readonly eventEmitter: EventEmitter = new EventEmitter();

    /**
     * TaskBatcher - for limiting processes for generating certificates.
     */
    private readonly taskBatcher: TaskBatcher<boolean> = new TaskBatcher<boolean>(5);

    /**
     * Interval for check if certificates require renewal.
     */
    private intervalTimeout: SynchronousRepeat | undefined = undefined;

    /**
     *
     * @param certHandler 
     */
    public constructor(
        private readonly certHandler: CertHandler,
    ) { }

    /**
     * Add event listener.
     *
     * @param events The events to listen to, or undefined to listen to all events.
     * @param callback The event listener.
     */
    public on(events: CertMonitorEvent[] | undefined, callback: (event: CertMonitorEvent, ...args: unknown[]) => void): void {
        if (events === undefined) {
            events = [
                CertMonitorEvent.ERROR,
                CertMonitorEvent.GENERATED,
                CertMonitorEvent.RENEWED,
                CertMonitorEvent.SKIPPED,
                CertMonitorEvent.STARTED,
                CertMonitorEvent.STOPPED,
            ];
        }
        for (const event of events) {
            this.onEvent(event, callback);
        }
    }

    /**
     * Start watching for changes.
     *
     * @param frequencyMinutes 
     */
    public async start(frequencyMinutes: number): Promise<void> {
        if (this.intervalTimeout !== undefined) {
            throw new LetsEncryptJsError(`Already running`);
        }

        const ms: number = frequencyMinutes * 60000;

        this.intervalTimeout = new SynchronousRepeat(async (): Promise<void> => {
            // Run in task pool to avoid going crazy with tasks
            const tasks: Generator<Task<boolean>> = this.createTasks();
            return this.taskBatcher.addAndRun(tasks);
        }, ms);
        this.emit(CertMonitorEvent.STARTED);

        await this.intervalTimeout.run();
    }

    /**
     * Stop watching certificates.
     */
    public stop(): void {
        if (this.intervalTimeout === undefined) {
            return;
        }
        this.intervalTimeout.stop();
        this.intervalTimeout = undefined;
        this.emit(CertMonitorEvent.STOPPED);
    }

    /**
     * Update the domains list (of watched certificates).
     *
     * Removes any missing domains from this instance.
     *
     * @param domains
     */
    public set(domains: Record<string, string>): void {

        const removals: string[] = this.keyDifference(this.domains, domains);
        const additions: string[] = this.keyDifference(domains, this.domains);

        // Remove domains
        this.remove(removals);

        // Update with all records (overwrite any changed emails)
        this.forObject(domains, (key: string, value: string) => {
            this.domains[key] = value;
        });

        this.notifyAddition(additions);
    }

    private onEvent(event: CertMonitorEvent, callback: (event: CertMonitorEvent, ...args: unknown[]) => void): void {
        this.eventEmitter.on(event, (...args: unknown[]) => {
            callback(event, ...args);
        });
    }

    /**
     * Remove the given domain names.
     *
     * @param commonNames 
     */
    private remove(commonNames: string[]): void {
        // Consider removing certificates
        for (const commonName of commonNames) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete this.domains[commonName];
        }
    }

    private forObject<V>(object: Record<string, V>, callback: (key: string, value: V) => void): void {
        for (const key in object) {
            if (Object.prototype.hasOwnProperty.call(object, key) === true) {
                const value: V = object[key];
                callback(key, value);
            }
        }
    }

    private keyDifference(firstSet: Record<string, string>, secondSet: Record<string, string>): string[] {
        // Find keys in the first set that are not in the seconds
        return Object.keys(firstSet).filter((domainName: string) => {
            return !this.objectHasKey(secondSet, domainName);
        });
    }

    private objectHasKey(theDomains: Record<string, string>, domainName: string): boolean {
        return Object.prototype.hasOwnProperty.call(theDomains, domainName) === true;
    }

    private notifyAddition(names: string[]): void {
        if (names.length < 1) {
            // Nothing to do
            return;
        }
        // Check if we need to process now, because we're already running
        if (!this.isRunning()) {
            return;
        }
        const task: Generator<Task<boolean>> = this.createTasks(...names);
        void this.taskBatcher.addAndRun(task).finally();
    }

    private isRunning(): boolean {
        return this.intervalTimeout !== undefined;
    }

    private * createTasks(...domains: string[]): Generator<Task<boolean>> {

        let domainsToProcess: string[] = Object.keys(this.domains);
        if (domains.length > 0) {
            // Only process defined domain names
            domainsToProcess = domainsToProcess.filter((value) => {
                return domains.includes(value);
            });
        }

        for (const domain of domainsToProcess) {
            const accountEmail: string = this.domains[domain];
            yield this.createTask(domain, accountEmail);
        }
    }

    private createTask(domainName: string, accountEmail: string): Task<boolean> {
        // Create task (a function that creates a promise)
        return async (): Promise<boolean> => {
            // Handle exceptions
            try {
                const result: CertHandlerEvent = await this.certHandler.generateOrRenewCertificate(domainName, accountEmail);
                switch (result) {
                    case CertHandlerEvent.CREATED:
                        this.emit(CertMonitorEvent.GENERATED, domainName, accountEmail);
                        return true;
                    case CertHandlerEvent.RENEWED:
                        this.emit(CertMonitorEvent.RENEWED, domainName, accountEmail);
                        return true;
                    case CertHandlerEvent.SKIPPED:
                        this.emit(CertMonitorEvent.SKIPPED, domainName, accountEmail);
                        return false;
                    case CertHandlerEvent.INPROGRESS:
                        return false;
                }
            } catch (e: unknown) {
                const numErrorListeners: number = this.eventEmitter.listenerCount(CertMonitorEvent.ERROR);
                if (numErrorListeners < 1) {
                    throw new LetsEncryptJsError(`Unhandled error: ` + String(e));
                } else {
                    this.emit(CertMonitorEvent.ERROR, e);
                }
                return false;
            }
        };
    }

    private emit(event: CertMonitorEvent, ...args: unknown[]): void {
        this.eventEmitter.emit(event, ...args);
    }
}
