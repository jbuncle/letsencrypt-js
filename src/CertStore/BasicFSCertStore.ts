import { existsSync, promises as fs } from "fs";
import { mkdir } from "fs/promises";
import { userInfo } from "os";
import { dirname } from "path";
import { format } from "util";
import type { CertResultI } from "../CertGenerator/CertResultI";
import { LetsEncryptJsError } from "../LetsEncryptJsError";
import { canWriteOrCreate } from "../Util/FileUtility";
import type { CertStoreI } from "./CertStoreI";

/**
 * CertHandler that stores certs directly to the file system.
 */
export class BasicFSCertStore implements CertStoreI {

    /**
     *
     * @param certFilePathFormat - String format for cert (receives commonName) e.g. /certs/%s.crt
     * @param keyFilePathFormat - String format for key (receives commonName) e.g. /certs/%s.key
     * @param caFilePathFormat - String format for key (receives commonName) e.g. /certs/%s.chain.pem
     */
    public constructor(
        private readonly certFilePathFormat: string,
        private readonly keyFilePathFormat: string,
        private readonly caFilePathFormat: string,
    ) { }

    public async prepare(commonName: string): Promise<void> {
        // Create directories
        await Promise.all([
            this.createParentDirs(this.certFilePathFormat, commonName),
            this.createParentDirs(this.keyFilePathFormat, commonName),
            this.createParentDirs(this.caFilePathFormat, commonName),
        ]);
        // Ensure paths are writeable
        await Promise.all([
            this.checkAccess(this.certFilePathFormat, commonName),
            this.checkAccess(this.keyFilePathFormat, commonName),
            this.checkAccess(this.caFilePathFormat, commonName),
        ]);
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

    public async store(commonName: string, result: CertResultI): Promise<void> {
        await Promise.all([
            this.writeFile(this.certFilePathFormat, commonName, result.certificate),
            this.writeFile(this.keyFilePathFormat, commonName, result.privateKey),
            this.writeFile(this.caFilePathFormat, commonName, result.caCert),
        ]);
    }

    private async writeFile(pattern: string, commonName: string, content: string): Promise<void> {
        const filepath: string = format(pattern, commonName);
        return fs.writeFile(filepath, content);
    }

    private async checkAccess(pattern: string, commonName: string): Promise<void> {
        const filepath: string = format(pattern, commonName);
        const writeable: boolean = await canWriteOrCreate(filepath)
        if (!writeable) {
            throw new LetsEncryptJsError(`Cannot create or write '${filepath}', user: '${userInfo().username}'`);
        }
    }

    private async createParentDirs(pattern: string, commonName: string): Promise<void> {
        const filepath: string = format(pattern, commonName);
        const dir: string = dirname(filepath);
        try {
            await mkdir(dir, { recursive: true });
        } catch (e: unknown) {
            throw new LetsEncryptJsError(`Failed to create parent directories '${dir}' for '${filepath}'`);
        }
    }

    private getCertPath(commonName: string): string {
        return format(this.certFilePathFormat, commonName);
    }

}