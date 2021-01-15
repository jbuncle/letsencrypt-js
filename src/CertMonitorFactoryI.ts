import type { LoggerInterface } from "@jbuncle/logging-js";
import type { AcmeChallengeHandlerI, CertMonitorI } from ".";

export interface CertMonitorFactoryI {
    createCertMonitor: (
        logger: LoggerInterface,
        handlers: AcmeChallengeHandlerI[],
        certFilePathFormat: string,
        keyFilePathFormat: string,
        expiryThesholdDays?: number
    ) => CertMonitorI;
}