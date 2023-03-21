export enum CertMonitorEvent {
    GENERATED = `generated`,
    RENEWED = `renewed`,
    SKIPPED = `skipped`,
    ERROR = `error`,
    STARTED = `started`,
    STOPPED = `stopped`,

    START_DOMAIN = `start-domain`,
    DOMAINS_ADDED = `domains-updated`,
    DOMAINS_REMOVED = `domains-removed`,

}