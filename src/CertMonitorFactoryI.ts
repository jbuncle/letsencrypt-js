import type { LoggerInterface } from "@jbuncle/logging-js";
import type { ChallengeHandlerI, CertMonitorI } from ".";

export interface CertMonitorFactoryI {
    createCertMonitor: (
        logger: LoggerInterface,
        handlers: ChallengeHandlerI[],
        certFilePathFormat: string,
        keyFilePathFormat: string,
        expiryThesholdDays?: number
    ) => CertMonitorI;
}