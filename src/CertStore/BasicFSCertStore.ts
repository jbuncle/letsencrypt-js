import { existsSync, promises as fs } from "fs";
import type { CertResult } from "../CertGenerator/CertResult";
import type { CertStoreI } from "./CertStore";
import { format } from "util";

/**
 * CertHandler that stores certs directly to the file system.
 */
export class BasicFSCertStore implements CertStoreI {

    /**
     * 
     * @param certFilePathFormat - String format for cert (recives commonName) e.g. /certs/%s.crt
     * @param keyFilePathFormat - String format for key (recives commonName) e.g. /certs/%s.key
     * @param caFilePathFormat - String format for key (recives commonName) e.g. /certs/%s.chain.pem
     */
    public constructor(
        private readonly certFilePathFormat: string,
        private readonly keyFilePathFormat: string,
        private readonly caFilePathFormat: string,
    ) { }

    public async prepare(): Promise<void> {
        return;
    }

    public async getCert(commonName: string): Promise<Buffer> {
        const certPath: string = this.getCertPath(commonName);
        const crtPem: Buffer = await fs.readFile(certPath);
        return crtPem;
    }

    public async hasCert(commonName: string): Promise<boolean> {
        const certPath: string = this.getCertPath(commonName);
        return existsSync(certPath);
    }

    public async store(commonName: string, result: CertResult): Promise<void> {
        // Write cert
        await this.writeToPattern(this.certFilePathFormat, commonName, result.certificate);
        // Write key
        await this.writeToPattern(this.keyFilePathFormat, commonName, result.privateKey);
        // Write key
        await this.writeToPattern(this.caFilePathFormat, commonName, result.caCert);
    }

    private async writeToPattern(pattern: string, commonName: string, content: string): Promise<void> {
        const filepath: string = format(pattern, commonName);
        return fs.writeFile(filepath, content);
    }

    private getCertPath(commonName: string): string {
        return format(this.certFilePathFormat, commonName);
    }

}