import type { CertMonitorEvent } from "./CertMonitorEvent";

/**
 * Process for watching given domain certificates for renewal (or initial generation).
 */
export interface CertMonitorI {

    /**
     * Update domain name watch list with given object (of domain => email key:value pairs).
     *
     * @param The domains.
     */
    set: (domains: Record<string, string>) => void;

    /**
     * Start watching for changes.
     *
     * @param frequencyMinutes 
     */
    start: (frequencyMinutes: number) => void;

    /**
     * Stop watching certificates.
     */
    stop: () => void;

    /**
     * Add event listener.
     *
     * @param events The events to listen to, or undefined to listen to all events.
     * @param callback The event listener.
     */
    on: (events: CertMonitorEvent[] | undefined, callback: (...args: unknown[]) => void) => void;
}

