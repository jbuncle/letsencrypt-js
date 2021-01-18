import type { CertHandler } from "./CertHandler";
import type { CertMonitorI } from "../CertMonitorI";
import { SynchronousRepeat } from "../Util/SynchronousRepeat";
import type { LoggerInterface } from "@jbuncle/logging-js";
import type { Task } from "../Util/Task";
import { TaskBatching } from "../Util/TaskBatching";

/**
 * Class for monitoring certificates - renewing or creating certificates as needed.
 */
export class CertMonitor implements CertMonitorI {

    /**
     * Map of domains and emails.
     */
    private readonly domains: Record<string, string> = {};

    private intervalTimeout: SynchronousRepeat | undefined = undefined;

    /**
     * 
     * @param certHandler 
     */
    public constructor(
        private readonly certHandler: CertHandler,
        private readonly logger: LoggerInterface,
    ) { }

    public async start(frequencyMinutes: number): Promise<void> {
        if (this.intervalTimeout !== undefined) {
            throw new Error("Already running");
        }

        const ms: number = frequencyMinutes * 60000;
        // TODO: don't use interval as slow operations can result in overalapping
        this.intervalTimeout = new SynchronousRepeat(async () => {
            // Run in task pool to avoid going crazy with tasks
            return new TaskBatching().run(this.createTasks(), 5)
        }, ms);

        await this.intervalTimeout.run();
    }

    public stop(): void {
        if (this.intervalTimeout === undefined) {
            return;
        }
        this.intervalTimeout.stop();
        this.intervalTimeout = undefined;
    }

    public set(newDomainSet: Record<string, string>): void {

        const removals: string[] = this.keyDifference(this.domains, newDomainSet);
        const additions: string[] = this.keyDifference(newDomainSet, this.domains);

        // Remove domains
        this.remove(removals);

        // Update with all records (overwrite any changed emails)
        this.forObject(newDomainSet, (key: string, value: string) => {
            this.domains[key] = value;
        });

        this.notifyAddition(additions);
    }

    public add(names: string[], accountEmail: string): void {
        for (const name of names) {
            this.doAdd(name, accountEmail);
        }
        this.notifyAddition(names);
    }

    public remove(commonNames: string[]): void {
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

    private doAdd(name: string, accountEmail: string): void {
        this.domains[name] = accountEmail;
    }

    private notifyAddition(names: string[]): void {
        // Check if we need to process now, because we're already running
        if (!this.isRunning()) {
            return;
        }
        const tasks: Generator<Task<boolean>> = this.createTasks(...names);
        void new TaskBatching().run(tasks, 1);
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
                const result: boolean = await this.certHandler.generateOrRenewCertificate(domainName, accountEmail);
                if (result) {
                    this.logger.info(`Generated certificate for ${domainName}`, {});
                } else {
                    this.logger.info(`Skipped generating certificate for ${domainName}`, {});
                }
                return result;
            } catch (e: unknown) {
                this.logger.error(String(e), {});
                return false;
            }
        };
    }
}
