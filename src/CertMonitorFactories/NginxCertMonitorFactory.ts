import { CertGenerator } from "../CertGenerator/CertGenerator";
import { CertHandler } from "../CertMonitor/CertHandler";
import { CertMonitor } from "../CertMonitor/CertMonitor";
import type { CertMonitorFactoryI } from "../CertMonitorFactoryI";
import type { CertMonitorI } from "../CertMonitorI";
import type { CertStoreI } from "../CertStore/CertStore";
import { SymlinkFSCertHandler } from "../CertStore/SymlinkFSCertHandler";
import type { ChallengeHandlerI } from "../ChallengeHandlerI";
import type { AccountKeyProviderI } from "../Client/AccountKeyProviderI";
import { AccountKeyGenerator } from "../Client/AccountKeyProviders/AccountKeyGenerator";
import { FileAccountKeyProvider } from "../Client/AccountKeyProviders/FileAccountKeyProvider";
import { ClientFactory } from "../Client/ClientFactory";
import { WebRootChallengeHandlerFactory } from "../HandlerFactories";
import { Assert } from "@jbuncle/core-js";

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
        private readonly expiryThresholdDays: number = 30
    ) { }

    public setAccountKeyDir(accountKeyDir: string): NginxCertMonitorFactory {
        this.accountKeyDir = accountKeyDir;
        return this;
    }

    public setWebRoot(webRoot: string): NginxCertMonitorFactory {
        this.webRoot = webRoot;
        return this;
    }

    public setCertsDir(certsDir: string): NginxCertMonitorFactory {
        this.certsDir = certsDir;
        return this;
    }

    public setCertFilePathFormat(certFilePathFormat: string): NginxCertMonitorFactory {
        this.certFilePathFormat = certFilePathFormat;
        return this;
    }

    public setKeyFilePathFormat(keyFilePathFormat: string): NginxCertMonitorFactory {
        this.keyFilePathFormat = keyFilePathFormat;
        return this;
    }

    public setCaFilePathFormat(caFilePathFormat: string): NginxCertMonitorFactory {
        this.caFilePathFormat = caFilePathFormat;
        return this;
    }

    /**
     * Set format for domain DH params file path.
     *
     * @param dhparamsPathFormat
     */
    public setDhparamsPathFormat(dhparamsPathFormat: string): NginxCertMonitorFactory {
        this.dhparamsPathFormat = dhparamsPathFormat;
        return this;
    }

    /**
     * The path to the DH params file
     *
     * @param dhparamsFile 
     */
    public setDhparamsFile(dhparamsFile: string): NginxCertMonitorFactory {
        this.dhparamsFile = dhparamsFile;
        return this;
    }

    public create(staging: boolean): CertMonitorI {

        Assert.assertPathIsDir(this.accountKeyDir);
        Assert.assertPathIsDir(this.webRoot);

        Assert.assertPathWriteable(this.accountKeyDir);
        Assert.assertPathWriteable(this.webRoot);

        const accountKeyProvider: AccountKeyProviderI = this.createAccountKeyProvider(this.accountKeyDir);
        const clientFactory: ClientFactory = new ClientFactory(accountKeyProvider, staging);
        const challengeHandler: ChallengeHandlerI = new WebRootChallengeHandlerFactory().create(this.webRoot);
        const certGenerator: CertGenerator = new CertGenerator(clientFactory, challengeHandler);

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
        if (accountKeyDir !== undefined) {
            Assert.assertPathIsDir(accountKeyDir);
            Assert.assertPathWriteable(accountKeyDir);
            return new FileAccountKeyProvider(accountKeyDir, new AccountKeyGenerator());
        } else {
            return new AccountKeyGenerator();
        }
    }
}