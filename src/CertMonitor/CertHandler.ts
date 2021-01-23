import { writeFileSync, existsSync, readFileSync } from "fs";
import type { CertGenerator } from "../CertGenerator/CertGenerator";
import type { CertResult } from "../CertGenerator/CertResult";
import { PemUtility as PemUtility } from "../Util/PemUtility";
import { format } from "util";

/**
 * Handle creation of a certificate & key on filesystem.
 */
export class CertHandler {

    /**
     * Domain currently being processed (use to prevent asynchronous processing of the same domain).
     */
    private readonly inProgressDomains: Record<string, boolean> = {};

    /**
      * 
      * @param certGenerator - CertGenerator that fetches the certificate from the certificate authority
      * @param certFilePathFormat - String format for cert (recives commonName) e.g. /certs/%s.crt
      * @param keyFilePathFormat - String format for key (recives commonName) e.g. /certs/%s.key
      * @param caFilePathFormat - String format for key (recives commonName) e.g. /certs/%s.chain.pem
      */
    public constructor(
        private readonly certGenerator: CertGenerator,
        private readonly certFilePathFormat: string,
        private readonly keyFilePathFormat: string,
        private readonly caFilePathFormat: string,
        private readonly expiryThesholdDays: number = 5,
    ) { }

    /**
     * Generate or renew certificate for given domain name.
     *
     * @param commonName 
     * @param accountEmail 
     */
    public async generateOrRenewCertificate(commonName: string, accountEmail: string): Promise<boolean> {
        // TODO: add async protection - to avoid 2 processes generating same for same domain
        // Check if certificate exists or needs renewal
        const certPath: string = this.getCertPath(commonName);
        if (this.requiresRegeneration(certPath) && !this.inProgress(commonName)) {

            this.inProgressDomains[commonName] = true;
            try {
                const result: CertResult = await this.certGenerator.generate({
                    commonName,
                }, accountEmail);

                const keyPath: string = this.getKeyPath(commonName);
                const caFilePath: string = this.getCaFilePath(commonName);

                // Write cert
                writeFileSync(certPath, result.certificate);
                // Write key
                writeFileSync(keyPath, result.privateKey);
                // Write key
                writeFileSync(caFilePath, result.publicKey);
            } finally {
                this.inProgressDomains[commonName] = false;
            }
            return true;
        }
        return false;
    }

    private inProgress(commonName: string): boolean {
        if (Object.prototype.hasOwnProperty.call(this.inProgressDomains, commonName) === true) {
            return this.inProgressDomains[commonName];
        }
        return false;
    }

    private getCertPath(commonName: string): string {
        return format(this.certFilePathFormat, commonName);
    }

    private getKeyPath(commonName: string): string {
        return format(this.keyFilePathFormat, commonName);
    }

    private getCaFilePath(commonName: string): string {
        return format(this.caFilePathFormat, commonName);
    }

    private requiresRegeneration(certPath: string): boolean {
        return !existsSync(certPath) || this.renewalRequired(certPath, this.expiryThesholdDays);
    }

    private renewalRequired(certPath: string, expiryThesholdDays: number): boolean {
        const crtPem: Buffer = readFileSync(certPath);
        const pemUtility: PemUtility = new PemUtility();

        return pemUtility.getDaysTillExpiry(String(crtPem)) < expiryThesholdDays;
    }

}