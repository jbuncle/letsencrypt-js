/* eslint-disable @typescript-eslint/naming-convention */
import { existsSync, readFileSync, symlinkSync, writeFileSync } from "fs";
import type { CertResult } from "../CertGenerator/CertResult";
import type { CertStoreI } from "./CertStore";
import { format } from "util";
import { join, relative } from "path";

/**
 * CertHandler that stores certs in a directory and symlinks to them.
 */
export class SymlinkFSCertHandler implements CertStoreI {

    private static readonly CERT_NAME: string = `fullchain.pem`;

    private static readonly KEY_NAME: string = `key.pem`;

    private static readonly CA_NAME: string = `chain.pem`;

    public constructor(
        private readonly storeDirFormat: string,
        private readonly certFilePathFormat: string,
        private readonly keyFilePathFormat: string,
        private readonly caFilePathFormat: string,
        private readonly dhparamFile?: string | undefined,
        private readonly dhparamFilePathFormat?: string | undefined,
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
        const storeDir: string = this.getStoreDir(commonName);

        const certPath: string = join(storeDir, SymlinkFSCertHandler.CERT_NAME);
        const keyPath: string = join(storeDir, SymlinkFSCertHandler.KEY_NAME);
        const caPath: string = join(storeDir, SymlinkFSCertHandler.CA_NAME);

        // Write to fs
        writeFileSync(certPath, result.certificate);
        writeFileSync(keyPath, result.privateKey);
        writeFileSync(caPath, result.caCert);

        // Create symlinks
        this.createRelativeSymlink(certPath, this.certFilePathFormat, commonName);
        this.createRelativeSymlink(keyPath, this.keyFilePathFormat, commonName);
        this.createRelativeSymlink(caPath, this.caFilePathFormat, commonName);

        if (this.dhparamFile !== undefined && this.dhparamFilePathFormat !== undefined && existsSync(this.dhparamFile)) {
            this.createRelativeSymlink(this.dhparamFile, this.dhparamFilePathFormat, commonName);
        }
    }

    private createRelativeSymlink(linkTargetPath: string, linkPathFormat: string, commonName: string): void {
        const linkPath: string = format(linkPathFormat, commonName);
        const relativePath: string = relative(linkTargetPath, linkPath);
        symlinkSync(linkTargetPath, relativePath);
    }

    private getStoreDir(commonName: string): string {
        return format(this.storeDirFormat, commonName);
    }

    private getCertPath(commonName: string): string {
        return format(this.certFilePathFormat, commonName);
    }
}