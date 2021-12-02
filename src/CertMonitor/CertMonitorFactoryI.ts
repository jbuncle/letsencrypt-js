import type { CertMonitorI } from "./CertMonitorI";

export interface CertMonitorFactoryI {
    create: (staging: boolean) => CertMonitorI;
}