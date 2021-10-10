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
     * @param certStore
     * @param expiryThresholdDays
     */
    public constructor(
        private readonly certGenerator: CertGenerator,
        private readonly certStore: CertStoreI,
        private readonly expiryThresholdDays: number = 5,
    ) { }

    /**
     * Generate or renew certificate for given domain name.
     *
     * @param commonName 
     * @param accountEmail 
     */
    public async generateOrRenewCertificate(commonName: string, accountEmail: string): Promise<boolean> {

        if (!this.inProgress(commonName)) {
            this.inProgressDomains[commonName] = true;
            try {
                // Check if certificate exists or needs renewal
                return await this.doRenewal(commonName, accountEmail);
            } finally {
                this.inProgressDomains[commonName] = false;
            }
        }
        return false;
    }

    private async doRenewal(commonName: string, accountEmail: string): Promise<boolean> {
        await this.certStore.prepare(commonName);
        if (!(await this.certStore.hasCert(commonName)) || await this.renewalRequired(commonName)) {

            const result: CertResult = await this.certGenerator.generate({
                commonName,
            }, accountEmail);

            await this.certStore.store(commonName, result);

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

    private async renewalRequired(commonName: string): Promise<boolean> {
        const crtPem: Buffer = await this.certStore.getCert(commonName);
        const pemUtility: PemUtility = new PemUtility();

        return pemUtility.getDaysTillExpiry(String(crtPem)) < this.expiryThresholdDays;
    }

}