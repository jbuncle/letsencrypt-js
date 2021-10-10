import { accessSync, constants } from "fs";
import { CertGenerator } from "../CertGenerator/CertGenerator";
import { CertHandler } from "../CertMonitor/CertHandler";
import { CertMonitor } from "../CertMonitor/CertMonitor";
import type { CertMonitorFactoryI } from "../CertMonitorFactoryI";
import type { CertMonitorI } from "../CertMonitorI";
import { BasicFSCertStore } from "../CertStore/BasicFSCertStore";
import type { CertStoreI } from "../CertStore/CertStore";
import type { ChallengeHandlerI } from "../ChallengeHandlerI";
import { CombinedChallengeHandler } from "../ChallengeHandling/CombinedChallengeHandler";
import type { AccountKeyProviderI } from "../Client/AccountKeyProviderI";
import { AccountKeyGenerator } from "../Client/AccountKeyProviders/AccountKeyGenerator";
import { FileAccountKeyProvider } from "../Client/AccountKeyProviders/FileAccountKeyProvider";
import { ClientFactory } from "../Client/ClientFactory";

/**
 * Factory for creating basic CertMonitorI instances.
 */
export class BasicCertMonitorFactory implements CertMonitorFactoryI {

    public constructor(
        private readonly handlers: ChallengeHandlerI[],
        private readonly certFilePathFormat: string,
        private readonly keyFilePathFormat: string,
        private readonly caFilePathFormat: string,
        private readonly accountKeyDir?: string,
        private readonly expiryThresholdDays: number = 30
    ) { }

    public create(staging: boolean): CertMonitorI {
        const accountKeyProvider: AccountKeyProviderI = this.createAccountKeyProvider(this.accountKeyDir);
        const clientFactory: ClientFactory = new ClientFactory(accountKeyProvider, staging);
        const challengeHandler: ChallengeHandlerI = new CombinedChallengeHandler(this.handlers);

        const certGenerator: CertGenerator = new CertGenerator(clientFactory, challengeHandler);
        const certStore: CertStoreI = new BasicFSCertStore(
            this.certFilePathFormat,
            this.keyFilePathFormat,
            this.caFilePathFormat
        );
        const certHandler: CertHandler = new CertHandler(certGenerator, certStore, this.expiryThresholdDays);

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