import type { LoggerInterface } from "@jbuncle/logging-js";
import { ChallengeHandler } from "./Acme/ChallengeHandler";
import type { AccountKeyProviderI } from "./CertGenerator/AccountKeyProviderI";
import { AccountKeyGenerator } from "./CertGenerator/AccountKeyProviders/AccountKeyGenerator";
import { FileAccountKeyProvider } from "./CertGenerator/AccountKeyProviders/FileAccountKeyProvider";
import { AcmeClientFactory } from "./CertGenerator/AcmeClientFactory";
import { CertGenerator } from "./CertGenerator/CertGenerator";
import type { CertMonitorFactoryI } from "./CertMonitorFactoryI";
import type { CertMonitorI } from "./CertMonitorI";
import type { ChallengeHandlerI } from "./ChallengeHandlerI";
import { CertHandler } from "./Impl/CertHandler";
import { CertMonitor } from "./Impl/CertMonitor";


export class CertMonitorFactory implements CertMonitorFactoryI {


    public createCertMonitor(
        logger: LoggerInterface,
        handlers: ChallengeHandlerI[],
        certFilePathFormat: string,
        keyFilePathFormat: string,
        accountKeyPath?: string,
        expiryThesholdDays: number = 10
    ): CertMonitorI {

        const accountKeyProvider: AccountKeyProviderI = this.createAccountKeyProvider(accountKeyPath);
        const acmeClientFactory: AcmeClientFactory = new AcmeClientFactory(accountKeyProvider);
        const acmeChallengeHandler: ChallengeHandlerI = new ChallengeHandler(logger, handlers);
        const certGenerator: CertGenerator = new CertGenerator(logger, acmeClientFactory, acmeChallengeHandler);
        const certHandler: CertHandler = new CertHandler(certGenerator, certFilePathFormat, keyFilePathFormat, expiryThesholdDays);

        return new CertMonitor(certHandler, logger);
    }

    private createAccountKeyProvider(accountKeyPath: string | undefined): AccountKeyProviderI {
        if (accountKeyPath !== undefined) {
            return new FileAccountKeyProvider(accountKeyPath, new AccountKeyGenerator());
        } else {
            return new AccountKeyGenerator();
        }
    }
}