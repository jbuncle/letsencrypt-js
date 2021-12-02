import type { AccountKeyProviderI } from "../AccountKeyProviderI";
import { CertGenerator } from "../CertGenerator/Impl/CertGenerator";
import { CertHandler } from "./CertHandler";
import { CertMonitor } from "./CertMonitor";
import type { CertMonitorFactoryI } from "./CertMonitorFactoryI";
import type { CertMonitorI } from "./CertMonitorI";
import { BasicFSCertStore } from "../CertStore/BasicFSCertStore";
import type { CertStoreI } from "../CertStore/CertStoreI";
import { CombinedChallengeHandler } from "../ChallengeHandler/Impl/CombinedChallengeHandler";
import { AccountKeyProviderFactory } from "../Client/AccountKeyProviderFactory";
import { ClientFactory } from "../Client/ClientFactory";
import type { ChallengeHandlerI } from "../ChallengeHandler";

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

    private createAccountKeyProvider(accountKeyDir: string | undefined): AccountKeyProviderI {
        const accountKeyProviderFactory = new AccountKeyProviderFactory();

        return accountKeyProviderFactory.createAccountKeyProvider(accountKeyDir);
    }
}