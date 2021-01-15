import type { LoggerInterface } from "@jbuncle/logging-js";
import type { AcmeChallengeHandlerI, CertMonitorFactoryI, CertMonitorI } from ".";
import { ChallengeHandler } from "./Acme/ChallengeHandler";
import { AcmeClientFactory } from "./CertGenerator/AcmeClientFactory";
import { CertGenerator } from "./CertGenerator/CertGenerator";
import { CertHandler } from "./Impl/CertHandler";
import { CertMonitor } from "./Impl/CertMonitor";


export class CertMonitorFactory implements CertMonitorFactoryI {


    public createCertMonitor(
        logger: LoggerInterface,
        handlers: AcmeChallengeHandlerI[],
        certFilePathFormat: string,
        keyFilePathFormat: string,
        expiryThesholdDays: number = 10
    ): CertMonitorI {

        const acmeClientFactory: AcmeClientFactory = new AcmeClientFactory();
        const acmeChallengeHandler: AcmeChallengeHandlerI = new ChallengeHandler(logger, handlers);
        const certGenerator: CertGenerator = new CertGenerator(logger, acmeClientFactory, acmeChallengeHandler);
        const certHandler: CertHandler = new CertHandler(certGenerator, certFilePathFormat, keyFilePathFormat, expiryThesholdDays);

        return new CertMonitor(certHandler, logger);
    }
}