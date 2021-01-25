import { accessSync, constants, lstatSync } from "fs";
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

/**
 * Factory for creating certs for a common Nginx server configuration.
 */
export class NginxCertMonitorFactory implements CertMonitorFactoryI {

    private accountKeyDir: string = `/etc/letsencrypt/accounts`;

    private webRoot: string = `/var/www/html`;

    private certsDir: string = `/etc/nginx/certs/%s`;

    private certFilePathFormat: string = `/etc/nginx/certs/%s.crt`;

    private keyFilePathFormat: string = `/etc/nginx/certs/%s.key`;

    private caFilePathFormat: string = `/etc/nginx/certs/%s.chain.pem`;

    private dhparamFile: string = `/etc/nginx/certs/dhparam.pem`;

    private dhparamPathFormat: string = `/etc/nginx/certs/%s.dhparam.pem `;

    public constructor(
        private readonly expiryThesholdDays: number = 10
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

    public setDhparamPaths(dhparamPathFormat: string): NginxCertMonitorFactory {
        this.dhparamPathFormat = dhparamPathFormat;
        return this;
    }

    public setDhparamFile(dhparamFile: string): NginxCertMonitorFactory {
        this.dhparamFile = dhparamFile;
        return this;
    }

    public create(): CertMonitorI {

        this.assertIsWritableDir(this.accountKeyDir);
        this.assertIsWritableDir(this.certsDir);
        this.assertIsWritableDir(this.webRoot);

        const accountKeyProvider: AccountKeyProviderI = this.createAccountKeyProvider(this.accountKeyDir);
        const clientFactory: ClientFactory = new ClientFactory(accountKeyProvider);
        const challengeHandler: ChallengeHandlerI = new WebRootChallengeHandlerFactory().create(this.webRoot);
        const certGenerator: CertGenerator = new CertGenerator(clientFactory, challengeHandler);

        const certStore: CertStoreI = new SymlinkFSCertHandler(
            this.certsDir,
            this.certFilePathFormat,
            this.keyFilePathFormat,
            this.caFilePathFormat,
            this.dhparamFile,
            this.dhparamPathFormat,
        );

        const certHandler: CertHandler = new CertHandler(certGenerator, certStore, this.expiryThesholdDays);

        return new CertMonitor(certHandler);
    }

    private assertIsWritableDir(dir: string): void {
        if (!lstatSync(dir).isDirectory()) {
            throw new Error(`Path '${dir}' is not a directory`);
        }
        try {
            accessSync(dir, constants.W_OK);
        } catch (e: unknown) {
            throw new Error(`Path '${dir}' is not writable`);
        }

    }

    private createAccountKeyProvider(accountKeyDir: string | undefined): AccountKeyProviderI {
        if (accountKeyDir !== undefined) {
            try {
                accessSync(accountKeyDir, constants.W_OK);
                return new FileAccountKeyProvider(accountKeyDir, new AccountKeyGenerator());
            } catch (e: unknown) {
                throw new Error(`Can't access '${accountKeyDir}'`);
            }
        } else {
            return new AccountKeyGenerator();
        }
    }
}