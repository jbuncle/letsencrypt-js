/* eslint-disable @typescript-eslint/naming-convention */
import type { Stats } from "fs";
import { accessSync, constants, existsSync, promises as fs } from "fs";
import type { CertResult } from "../CertGenerator/CertResult";
import type { CertStoreI } from "./CertStore";
import { format } from "util";
import { dirname, join, relative } from "path";
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
        private readonly dhparamLinkPathFormat?: string | undefined,
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
            this.logger.debug(`Creating directory '${storeDir}'`);
            accessSync(parentDir, constants.W_OK);
            await fs.mkdir(storeDir);
        }
        // Ensure path is writable
        accessSync(storeDir, constants.W_OK);

        const certLinkPath: string = format(this.certLinkPathFormat, commonName);
        const keyLinkPath: string = format(this.keyLinkPathFormat, commonName);
        const caLinkPath: string = format(this.caLinkPathFormat, commonName);

        if (existsSync(certLinkPath)) {
            accessSync(certLinkPath, constants.W_OK);
        }
        if (existsSync(keyLinkPath)) {
            accessSync(keyLinkPath, constants.W_OK);
        }
        if (existsSync(caLinkPath)) {
            accessSync(caLinkPath, constants.W_OK);
        }

        // Fix symlinks if needed
        await this.fixLinks(commonName);
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

        if (this.dhparamFile !== undefined && this.dhparamLinkPathFormat !== undefined && existsSync(this.dhparamFile)) {
            const dhparamLinkPath: string = format(this.dhparamLinkPathFormat, commonName);
            promises.push(this.symlink(this.dhparamFile, dhparamLinkPath));
        }

        // Wait for promises to finish
        await this.all(...promises);
    }

    private async fixLinks(commonName: string): Promise<unknown[]> {
        const storeDir: string = this.getCertsDir(commonName);

        const promises: Promise<unknown>[] = [];

        const certPath: string = this.getCertRealPath(commonName);
        const certLinkPath = format(this.certLinkPathFormat, commonName);
        if (existsSync(certPath) && !(await this.checkSymlink(certLinkPath))) {
            promises.push(this.symlink(certPath, certLinkPath));
        }

        const keyLinkPath: string = format(this.keyLinkPathFormat, commonName);
        const keyPath: string = join(storeDir, SymlinkFSCertHandler.KEY_NAME);
        if (existsSync(keyPath) && !(await this.checkSymlink(keyLinkPath))) {
            promises.push(this.symlink(keyPath, keyLinkPath));
        }

        const caLinkPath: string = format(this.caLinkPathFormat, commonName);
        const caPath: string = join(storeDir, SymlinkFSCertHandler.CA_NAME);
        if (existsSync(caPath) && !(await this.checkSymlink(caLinkPath))) {
            promises.push(this.symlink(caPath, caLinkPath));
        }

        if (this.dhparamFile !== undefined && this.dhparamLinkPathFormat !== undefined) {
            const dhparamLinkPath: string = format(this.dhparamLinkPathFormat, commonName);
            if (existsSync(this.dhparamFile) && !(await this.checkSymlink(dhparamLinkPath))) {
                promises.push(this.symlink(this.dhparamFile, dhparamLinkPath));
            }
        }

        // Wait for promises to finish
        return this.all(...promises);
    }

    private async all(...promises: Promise<unknown>[]): Promise<unknown[]> {
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

    private async symlink(targetFilePath: string, linkPath: string): Promise<void> {
        const relativeTargetPath: string = relative(dirname(linkPath), targetFilePath);

        if (existsSync(linkPath)) {
            // Path exists
            const stat: Stats = await fs.lstat(linkPath);
            if (stat.isSymbolicLink() && await fs.readlink(linkPath) === relativeTargetPath) {
                // Already a symlink pointing to the correct path - nothing to do
                return;
            }
            // Not a symlink or is pointing to the wrong target (and therefore needs removing before we update)
            this.logger.info(`Removing bad file at '${linkPath}'`);
            await fs.unlink(linkPath);
        }

        this.logger.info(`Creating symlink '${linkPath}' => '${relativeTargetPath}'`);

        try {
            await fs.symlink(relativeTargetPath, linkPath);
        } catch (e: unknown) {
            const error: Error = e as Error;
            throw new Error(`Error creating symlink '${linkPath}' => '${relativeTargetPath}', due to '${error.message}'`);
        }
    }

    private async checkSymlink(linkPath: string): Promise<boolean> {
        // Check link exists
        if (!existsSync(linkPath)) {
            return false;
        }
        // Check if path is a symlink
        const stat: Stats = await fs.lstat(linkPath);
        if (!stat.isSymbolicLink()) {
            return false;
        }

        // Check if link target is valid
        const target: string = await fs.readlink(linkPath);
        if (!existsSync(target)) {
            return false;
        }
        // All checks passed
        return true;
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