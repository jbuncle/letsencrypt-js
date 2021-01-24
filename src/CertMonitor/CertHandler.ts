import type { CertGenerator } from "../CertGenerator/CertGenerator";
import type { CertResult } from "../CertGenerator/CertResult";
import { PemUtility as PemUtility } from "../Util/PemUtility";
import type { CertStoreI } from "../CertStore/CertStore";

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
      */
    public constructor(
        private readonly certGenerator: CertGenerator,
        private readonly certStore: CertStoreI,
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
        if ((!this.certStore.hasCert(commonName) || this.renewalRequired(commonName)) && !this.inProgress(commonName)) {

            this.inProgressDomains[commonName] = true;
            try {
                const result: CertResult = await this.certGenerator.generate({
                    commonName,
                }, accountEmail);

                this.certStore.store(commonName, result);
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

    private renewalRequired(commonName: string): boolean {
        const crtPem: Buffer = this.certStore.getCert(commonName);
        const pemUtility: PemUtility = new PemUtility();

        return pemUtility.getDaysTillExpiry(String(crtPem)) < this.expiryThesholdDays;
    }

}