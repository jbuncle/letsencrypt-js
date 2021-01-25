import type { CertMonitorI } from "./CertMonitorI";

export interface CertMonitorFactoryI {
    create: () => CertMonitorI;
}