import type { CertMonitorEvent } from "./CertMonitorEvent";

/**
 * Process for watching given domain certificates for renewal (or initial generation).
 */
export interface CertMonitorI {

    /**
     * Update domains with given object (of domain => email key:value pairs).
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
     * @param event The event to listen to.
     * @param callback The even listener.
     */
    on: (event: CertMonitorEvent, callback: (...args: unknown[]) => void) => void;
}

