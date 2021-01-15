export interface CertMonitorI {
    start: (frequencyMinutes: number) => void;
    stop: () => void;
    add: (names: string[], accountEmail: string) => void;
    remove: (commonNames: string[]) => void;
    
}