import type { LoggerInterface } from "@jbuncle/logging-js";
import { accessSync, constants } from "fs";
import { CombinedChallengeHandler } from "./ChallengeHandling/CombinedChallengeHandler";
import type { AccountKeyProviderI } from "./Client/AccountKeyProviderI";
import { AccountKeyGenerator } from "./Client/AccountKeyProviders/AccountKeyGenerator";
import { FileAccountKeyProvider } from "./Client/AccountKeyProviders/FileAccountKeyProvider";
import { AcmeClientFactory } from "./Client/AcmeClientFactory";
import { CertGenerator } from "./CertGenerator/CertGenerator";
import type { CertMonitorFactoryI } from "./CertMonitorFactoryI";
import type { CertMonitorI } from "./CertMonitorI";
import type { ChallengeHandlerI } from "./ChallengeHandlerI";
import { CertHandler } from "./CertMonitor/CertHandler";
import { CertMonitor } from "./CertMonitor/CertMonitor";

/**
 * Factory for creating CertMonitorI instances.
 */
export class CertMonitorFactory implements CertMonitorFactoryI {

    public create(
        logger: LoggerInterface,
        handlers: ChallengeHandlerI[],
        certFilePathFormat: string,
        keyFilePathFormat: string,
        caFilePathFormat: string,
        accountKeyDir?: string,
        expiryThesholdDays: number = 10
    ): CertMonitorI {
        const accountKeyProvider: AccountKeyProviderI = this.createAccountKeyProvider(accountKeyDir);
        const acmeClientFactory: AcmeClientFactory = new AcmeClientFactory(accountKeyProvider);
        const acmeChallengeHandler: ChallengeHandlerI = new CombinedChallengeHandler(logger, handlers);
        const certGenerator: CertGenerator = new CertGenerator(acmeClientFactory, acmeChallengeHandler);
        const certHandler: CertHandler = new CertHandler(certGenerator, certFilePathFormat, keyFilePathFormat, caFilePathFormat, expiryThesholdDays);

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