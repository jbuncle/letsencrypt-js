import type { LoggerInterface } from "@jbuncle/logging-js";
import { accessSync, constants } from "fs";
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
        accountKeyDir?: string,
        expiryThesholdDays: number = 10
    ): CertMonitorI {
        const accountKeyProvider: AccountKeyProviderI = this.createAccountKeyProvider(accountKeyDir);
        const acmeClientFactory: AcmeClientFactory = new AcmeClientFactory(accountKeyProvider);
        const acmeChallengeHandler: ChallengeHandlerI = new ChallengeHandler(logger, handlers);
        const certGenerator: CertGenerator = new CertGenerator(logger, acmeClientFactory, acmeChallengeHandler);
        const certHandler: CertHandler = new CertHandler(certGenerator, certFilePathFormat, keyFilePathFormat, expiryThesholdDays);

        return new CertMonitor(certHandler);
    }

    private createAccountKeyProvider(accountKeyPath: string | undefined): AccountKeyProviderI {
        if (accountKeyPath !== undefined) {
            try {
                accessSync(accountKeyPath, constants.W_OK);
                return new FileAccountKeyProvider(accountKeyPath, new AccountKeyGenerator());
            } catch (e: unknown) {
                throw new Error(`Can't access '${accountKeyPath}'`);
            }
        } else {
            return new AccountKeyGenerator();
        }
    }
}