import { existsSync, readFileSync, writeFileSync } from "fs";
import type { CertResult } from "../CertGenerator/CertResult";
import type { CertStoreI } from "./CertStore";
import { format } from "util";

/**
 * CertHandler that stores certs directly to the file system.
 */
export class BasicFSCertStore implements CertStoreI {

    /**
     * 
     * @param {string} certFilePathFormat - String format for cert (recives commonName) e.g. /certs/%s.crt
     * @param {string} keyFilePathFormat - String format for key (recives commonName) e.g. /certs/%s.key
     * @param {string} caFilePathFormat - String format for key (recives commonName) e.g. /certs/%s.chain.pem
     */
    public constructor(
        private readonly certFilePathFormat: string,
        private readonly keyFilePathFormat: string,
        private readonly caFilePathFormat: string,
    ) { }

    public getCert(commonName: string): Buffer {
        const certPath: string = this.getCertPath(commonName);
        const crtPem: Buffer = readFileSync(certPath);
        return crtPem;
    }

    public hasCert(commonName: string): boolean {
        const certPath: string = this.getCertPath(commonName);
        return existsSync(certPath);
    }

    public store(commonName: string, result: CertResult): void {
        // Write cert
        this.writeToPattern(this.certFilePathFormat, commonName, result.certificate);
        // Write key
        this.writeToPattern(this.keyFilePathFormat, commonName, result.privateKey);
        // Write key
        this.writeToPattern(this.caFilePathFormat, commonName, result.caCert);
    }

    private writeToPattern(pattern: string, commonName: string, content: string): void {
        const filepath: string = format(pattern, commonName);
        writeFileSync(filepath, content);
    }

    private getCertPath(commonName: string): string {
        return format(this.certFilePathFormat, commonName);
    }

}