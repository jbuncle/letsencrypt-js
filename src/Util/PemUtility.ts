import { pki } from "node-forge";

/**
 * Utility for inspecting PEM formatted certificates.
 */
export class PemUtility {

    public getDaysTillExpiry(pem: string): number {
        const cert = pki.certificateFromPem(pem)
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