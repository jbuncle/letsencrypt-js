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

    /**
     * Get the certificate string.
     *
     * @param commonName 
     */
    public getCert(commonName: string): Buffer {
        const certPath: string = this.getCertRealPath(commonName);
        return readFileSync(certPath);
    }

    /**
     * Check if the certificate exists.
     *
     * @param commonName 
     */
    public hasCert(commonName: string): boolean {
        // Check we have symlink and the actual cert
        return existsSync(this.getCertLinkPath(commonName)) && existsSync(this.getCertRealPath(commonName));
    }

    /**
     * Store the cert data for the domain.
     *
     * @param commonName The domain name.
     * @param result The data to store
     */
    public store(commonName: string, result: CertResult): void {
        const storeDir: string = this.getCertsDir(commonName);

        const certPath: string = this.getCertRealPath(commonName);
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

    /**
     * Get the real path to where the cert is actually stored.
     *
     * @param commonName 
     */
    private getCertRealPath(commonName: string): string {
        const storeDir: string = this.getCertsDir(commonName);
        return join(storeDir, SymlinkFSCertHandler.CERT_NAME);
    }

    /**
     * Create symlink as a relative path.
     *
     * @param linkTargetPath 
     * @param linkPathFormat 
     * @param commonName 
     */
    private createRelativeSymlink(linkTargetPath: string, linkPathFormat: string, commonName: string): void {
        const linkPath: string = format(linkPathFormat, commonName);
        const relativePath: string = relative(linkTargetPath, linkPath);
        symlinkSync(linkTargetPath, relativePath);
    }

    /**
     * Get path to directory where the certs & keys are actually stored.
     *
     * @param commonName 
     */
    private getCertsDir(commonName: string): string {
        return format(this.storeDirFormat, commonName);
    }

    private getCertLinkPath(commonName: string): string {
        return format(this.certFilePathFormat, commonName);
    }
}