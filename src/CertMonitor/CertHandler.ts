import type { CertGenerator } from "../CertGenerator/Impl/CertGenerator";
import type { CertResultI } from "../CertGenerator/CertResultI";
import { PemUtility as PemUtility } from "../Util/PemUtility";
import type { CertStoreI } from "../CertStore/CertStoreI";
import { CertHandlerEvent } from "./CertHandlerEvent";
import { ActionLock } from "./ActionLock";

/**
 * Handle creation of a certificate & key on filesystem.
 */
export class CertHandler {


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
        private readonly actionLock: ActionLock<CertHandlerEvent> = new ActionLock()
    ) { }

    /**
     * Generate or renew certificate for given domain name.
     *
     * @param commonName 
     * @param accountEmail 
     */
    public async generateOrRenewCertificate(commonName: string, accountEmail: string): Promise<CertHandlerEvent> {
        return this.actionLock.performAction(commonName, CertHandlerEvent.INPROGRESS, async (): Promise<CertHandlerEvent> => {
            return this.doRenewal(commonName, accountEmail);
        });
    }

    private async doRenewal(commonName: string, accountEmail: string): Promise<CertHandlerEvent> {
        await this.certStore.prepare(commonName);
        if (!await this.certStore.hasCert(commonName)) {
            // Create
            await this.generateCertificate(commonName, accountEmail);

            return CertHandlerEvent.CREATED;

        }
        if (!await this.renewalRequired(commonName)) {
            // Renew
            await this.generateCertificate(commonName, accountEmail);

            return CertHandlerEvent.RENEWED;
        }
        return CertHandlerEvent.SKIPPED;
    }

    private async generateCertificate(commonName: string, accountEmail: string): Promise<void> {
        const result: CertResultI = await this.certGenerator.generate({
            commonName,
        }, accountEmail);

        await this.certStore.store(commonName, result);
    }

    private async renewalRequired(commonName: string): Promise<boolean> {
        const crtPem: Buffer = await this.certStore.getCert(commonName);
        const pemUtility: PemUtility = new PemUtility();

        return pemUtility.getDaysTillExpiry(String(crtPem)) < this.expiryThresholdDays;
    }

}