import type { LoggerInterface } from "@jbuncle/logging-js";
import type { ChallengeHandlerI, CertMonitorI } from ".";

export interface CertMonitorFactoryI {
    create: (
        logger: LoggerInterface,
        handlers: ChallengeHandlerI[],
        certFilePathFormat: string,
        keyFilePathFormat: string,
        caFilePathFormat: string,
        accountKeyPath?: string,
        expiryThesholdDays?: number
    ) => CertMonitorI;
}