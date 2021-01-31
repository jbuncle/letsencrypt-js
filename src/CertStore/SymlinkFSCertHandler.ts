/* eslint-disable @typescript-eslint/naming-convention */
import type { Stats } from "fs";
import { existsSync, promises as fs } from "fs";
import type { CertResult } from "../CertGenerator/CertResult";
import type { CertStoreI } from "./CertStore";
import { format } from "util";
import { dirname, join, relative } from "path";
import { assertPathIsDir, assertPathIsWritable } from "../Util/Assert";
import type { LoggerInterface } from "@jbuncle/logging-js";
import { Logger } from "@jbuncle/logging-js";

/**
 * CertHandler that stores certs in a directory and symlinks to them.
 */
export class SymlinkFSCertHandler implements CertStoreI {

    private static readonly CERT_NAME: string = `fullchain.pem`;

    private static readonly KEY_NAME: string = `key.pem`;

    private static readonly CA_NAME: string = `chain.pem`;

    private readonly logger: LoggerInterface = Logger.getLogger(SymlinkFSCertHandler.name);

    public constructor(
        private readonly storeDirFormat: string,
        private readonly certLinkPathFormat: string,
        private readonly keyLinkPathFormat: string,
        private readonly caLinkPathFormat: string,
        private readonly dhparamFile?: string | undefined,
        private readonly dhparamFilePathFormat?: string | undefined,
    ) { }

    /**
     * Get the certificate string.
     *
     * @param commonName 
     */
    public async getCert(commonName: string): Promise<Buffer> {
        const certPath: string = this.getCertRealPath(commonName);
        return fs.readFile(certPath);
    }

    /**
     * Check if the certificate exists.
     *
     * @param commonName 
     */
    public async hasCert(commonName: string): Promise<boolean> {
        // Check we have both the symlink and the actual cert
        return existsSync(this.getCertLinkPath(commonName)) && existsSync(this.getCertRealPath(commonName));
    }

    public async prepare(commonName: string): Promise<void> {
        const storeDir: string = this.getCertsDir(commonName);

        if (!existsSync(storeDir)) {
            const parentDir = dirname(storeDir);
            assertPathIsDir(parentDir);
            assertPathIsWritable(parentDir);
            this.logger.debug(`Creating directory '${storeDir}'`);
            await fs.mkdir(storeDir);
        } else {
            assertPathIsDir(storeDir);
        }
        // Ensure path is writable
        assertPathIsWritable(storeDir);

        const certLinkPath: string = format(this.certLinkPathFormat, commonName);
        const keyLinkPath: string = format(this.keyLinkPathFormat, commonName);
        const caLinkPath: string = format(this.caLinkPathFormat, commonName);

        if (existsSync(certLinkPath)) {
            assertPathIsWritable(certLinkPath);
        }
        if (existsSync(keyLinkPath)) {
            assertPathIsWritable(keyLinkPath);
        }
        if (existsSync(caLinkPath)) {
            assertPathIsWritable(caLinkPath);
        }
    }

    /**
     * Store the cert data for the domain.
     *
     * @param commonName The domain name.
     * @param result The data to store
     */
    public async store(commonName: string, result: CertResult): Promise<void> {
        const storeDir: string = this.getCertsDir(commonName);

        const certPath: string = this.getCertRealPath(commonName);
        const keyPath: string = join(storeDir, SymlinkFSCertHandler.KEY_NAME);
        const caPath: string = join(storeDir, SymlinkFSCertHandler.CA_NAME);

        const promises: Promise<unknown>[] = [
            this.createAndLink(certPath, result.certificate, format(this.certLinkPathFormat, commonName)),
            this.createAndLink(keyPath, result.privateKey, format(this.keyLinkPathFormat, commonName)),
            this.createAndLink(caPath, result.caCert, format(this.caLinkPathFormat, commonName)),
        ];

        if (this.dhparamFile !== undefined && this.dhparamFilePathFormat !== undefined && existsSync(this.dhparamFile)) {
            promises.push(this.symlink(this.dhparamFile, format(this.dhparamFilePathFormat, commonName)));
        }
        // Wait for promises to finish
        await this.all(...promises);
    }

    private async all(...promises: Promise<unknown>[]): Promise<unknown> {
        return Promise.all(promises);
    }

    private async createAndLink(realPath: string, content: string, linkPath: string): Promise<void> {
        await this.writeFileSync(realPath, content);
        await this.symlink(realPath, linkPath);
    }

    private async writeFileSync(filepath: string, content: Buffer | string): Promise<void> {
        this.logger.debug(`Writing to '${filepath}'`);
        return fs.writeFile(filepath, content);
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

    private async symlink(linkTargetPath: string, linkPath: string): Promise<void> {
        const relativePath: string = relative(linkTargetPath, linkPath);

        if (existsSync(linkPath)) {
            // Path exists
            const stat: Stats = await fs.lstat(linkPath);
            if (stat.isSymbolicLink() && await fs.readlink(linkPath) === relativePath) {
                // Already a symlink pointing to the correct path - nothing to do
                return;
            }
            // Not a symlink or is pointing to the wrong target (and therefore needs removing before we update)
            this.logger.debug(`Removing bad file at '${linkPath}'`);
            await fs.unlink(linkPath);
        }
        this.logger.debug(`Creating symlink '${linkTargetPath}' => '${relativePath}'`);
        return fs.symlink(linkTargetPath, relativePath);

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
        return format(this.certLinkPathFormat, commonName);
    }
}