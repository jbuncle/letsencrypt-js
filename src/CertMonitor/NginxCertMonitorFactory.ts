import { accessSync, constants, statSync } from "fs";
import type { CertMonitorFactoryI, CertMonitorI } from ".";
import type { AccountKeyProviderI } from "..";
import { CertGenerator } from "../CertGenerator/Impl/CertGenerator";
import type { CertStoreI } from "../CertStore/CertStoreI";
import { SymlinkFSCertHandler } from "../CertStore/SymlinkFSCertHandler";
import type { ChallengeHandlerI } from "../ChallengeHandler";
import { WebRootChallengeHandlerFactory } from "../ChallengeHandler/WebRootChallengeHandlerFactory";
import { AccountKeyProviderFactory } from "../Client/AccountKeyProviderFactory";
import { ClientFactory } from "../Client/ClientFactory";
import type { ClientFactoryI } from "../Client/ClientFactoryI";
import { CertHandler } from "./CertHandler";
import { CertMonitor } from "./CertMonitor";
import { LetsEncryptJsError } from "../LetsEncryptJsError";
/**
 * Factory for creating certs for a common Nginx server configuration.
 */
export class NginxCertMonitorFactory implements CertMonitorFactoryI {

    private accountKeyDir: string = `/etc/letsencrypt/accounts`;

    private webRoot: string = `/usr/share/nginx/html`;

    private certsDir: string = `/etc/nginx/certs/%s`;

    private certFilePathFormat: string = `/etc/nginx/certs/%s.crt`;

    private keyFilePathFormat: string = `/etc/nginx/certs/%s.key`;

    private caFilePathFormat: string = `/etc/nginx/certs/%s.chain.pem`;

    private dhparamsFile: string = `/etc/nginx/certs/dhparam.pem`;

    private dhparamsPathFormat: string = `/etc/nginx/certs/%s.dhparam.pem`;

    public constructor(
        private readonly termsOfServiceAgreed: boolean,
        private readonly expiryThresholdDays: number = 30,
        private readonly skipChallengeVerification: boolean = true
    ) { }

    public setAccountKeyDir(accountKeyDir: string): this {
        this.accountKeyDir = accountKeyDir;
        return this;
    }

    public setWebRoot(webRoot: string): this {
        this.webRoot = webRoot;
        return this;
    }

    public setCertsDir(certsDir: string): this {
        this.certsDir = certsDir;
        return this;
    }

    public setCertFilePathFormat(certFilePathFormat: string): this {
        this.certFilePathFormat = certFilePathFormat;
        return this;
    }

    public setKeyFilePathFormat(keyFilePathFormat: string): this {
        this.keyFilePathFormat = keyFilePathFormat;
        return this;
    }

    public setCaFilePathFormat(caFilePathFormat: string): this {
        this.caFilePathFormat = caFilePathFormat;
        return this;
    }

    /**
     * Set format for domain DH params file path.
     *
     * @param dhparamsPathFormat
     */
    public setDhparamsPathFormat(dhparamsPathFormat: string): this {
        this.dhparamsPathFormat = dhparamsPathFormat;
        return this;
    }

    /**
     * The path to the DH params file
     *
     * @param dhparamsFile 
     */
    public setDhparamsFile(dhparamsFile: string): this {
        this.dhparamsFile = dhparamsFile;
        return this;
    }

    public create(staging: boolean): CertMonitorI {

        if (!statSync(this.accountKeyDir).isDirectory()) {
            throw new LetsEncryptJsError(`Directory '${this.accountKeyDir}' doesn't exist`);
        }
        if (!statSync(this.webRoot).isDirectory()) {
            throw new LetsEncryptJsError(`Directory '${this.webRoot}' doesn't exist`);
        }
        accessSync(this.accountKeyDir, constants.W_OK);
        accessSync(this.webRoot, constants.W_OK);

        const accountKeyProvider: AccountKeyProviderI = this.createAccountKeyProvider(this.accountKeyDir);
        const clientFactory: ClientFactoryI = new ClientFactory(accountKeyProvider, staging);
        const challengeHandler: ChallengeHandlerI = new WebRootChallengeHandlerFactory(this.webRoot).create();
        const certGenerator: CertGenerator = new CertGenerator(clientFactory, challengeHandler, {
            termsOfServiceAgreed: this.termsOfServiceAgreed,
            skipChallengeVerification: this.skipChallengeVerification,
        });

        const certStore: CertStoreI = new SymlinkFSCertHandler(
            this.certsDir,
            this.certFilePathFormat,
            this.keyFilePathFormat,
            this.caFilePathFormat,
            this.dhparamsFile,
            this.dhparamsPathFormat,
        );

        const certHandler: CertHandler = new CertHandler(
            certGenerator,
            certStore,
            this.expiryThresholdDays
        );

        return new CertMonitor(certHandler);
    }

    private createAccountKeyProvider(accountKeyDir: string | undefined): AccountKeyProviderI {
        const accountKeyProviderFactory = new AccountKeyProviderFactory();

        return accountKeyProviderFactory.createAccountKeyProvider(accountKeyDir);
    }
}