import type { AccountKeyProviderI } from "../AccountKeyProviderI";
import type { CertGeneratorOptions } from "../CertGenerator/Impl/CertGeneratorOptions";
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
import type { BasicCertMonitorFactoryOptions } from "./BasicCertMonitorFactoryOptions";

/**
 * Factory for creating basic CertMonitorI instances.
 */
export class BasicCertMonitorFactory implements CertMonitorFactoryI {

    public constructor(
        private readonly options: BasicCertMonitorFactoryOptions
    ) { }

    public create(staging: boolean): CertMonitorI {
        const expiryThresholdDays: number = this.options.expiryThresholdDays ?? 30;

        const accountKeyProvider: AccountKeyProviderI = this.createAccountKeyProvider(this.options.accountKeyDir);
        const clientFactory: ClientFactory = new ClientFactory(accountKeyProvider, staging);
        const challengeHandler: ChallengeHandlerI = new CombinedChallengeHandler(this.options.handlers);

        const certGeneratorOptions: CertGeneratorOptions = {
            termsOfServiceAgreed: this.options.termsOfServiceAgreed,
            skipChallengeVerification: this.options.skipChallengeVerification,
        };
        const certGenerator: CertGenerator = new CertGenerator(clientFactory, challengeHandler, certGeneratorOptions);
        const certStore: CertStoreI = new BasicFSCertStore(
            this.options.certFilePathFormat,
            this.options.keyFilePathFormat,
            this.options.caFilePathFormat
        );
        const certHandler: CertHandler = new CertHandler(certGenerator, certStore, expiryThresholdDays);

        return new CertMonitor(certHandler);
    }

    private createAccountKeyProvider(accountKeyDir: string | undefined): AccountKeyProviderI {
        const accountKeyProviderFactory = new AccountKeyProviderFactory();

        return accountKeyProviderFactory.createAccountKeyProvider(accountKeyDir);
    }
}