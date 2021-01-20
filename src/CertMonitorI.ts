import type { CertMonitorEvent } from "./CertMonitorEvent";

export interface CertMonitorI {
    set: (newDomainSet: Record<string, string>) => void;
    start: (frequencyMinutes: number) => void;
    stop: () => void;
    add: (names: string[], accountEmail: string) => void;
    remove: (commonNames: string[]) => void;
    on: (event: CertMonitorEvent, callback: () => void) => void;
}

