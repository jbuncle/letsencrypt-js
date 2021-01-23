import { pem, pki } from "node-forge";

/**
 * Utility for inspecting PEM formatted certificates.
 */
export class PemUtility {

    public getCaCertFromFullChain(str: string): string {
        const decoded: pem.ObjectPEM[] = pem.decode(str);
        const lastPem: pem.ObjectPEM = decoded[decoded.length - 1];
        const lastPemString: string = pem.encode(lastPem);

        const certificate: pki.Certificate = pki.certificateFromPem(lastPemString);
        
        return pki.certificateToPem(certificate);
    }

    public getDaysTillExpiry(content: string): number {
        const cert = pki.certificateFromPem(content)
        const expiry: Date = cert.validity.notAfter;

        return this.dayCount(new Date(), expiry);
    }

    private dayCount(start: Date, end: Date): number {
        let dayCount: number = 0
        while (end > start) {
            dayCount++
            start.setDate(start.getDate() + 1)
        }

        return dayCount
    }
}