import { existsSync, promises as fs } from "fs";
import { join } from "path";
import type { AccountKeyStoreI } from "./AccountKeyStoreI";

/**
 * File system key store.
 */
export class FileSystemKeyStore implements AccountKeyStoreI {

    public constructor(
        private readonly accountKeyDir: string
    ) { }

    public async getKey(accountEmail: string): Promise<Buffer> {
        if (!(await this.hasKey(accountEmail))) {
            throw new Error(`Missing key for '${accountEmail}'`);
        }

        const keyPath: string = this.getKeyPath(accountEmail);
        const file: Buffer = await fs.readFile(keyPath);

        return file;
    }

    public async hasKey(accountEmail: string): Promise<boolean> {
        const keyPath: string = this.getKeyPath(accountEmail);
        if (!existsSync(keyPath)) {
            return false;
        }

        const stat = await fs.stat(keyPath);

        return stat.isFile();
    }

    public async storeKey(accountEmail: string, key: Buffer): Promise<void> {
        const keyPath: string = this.getKeyPath(accountEmail);
        await fs.writeFile(keyPath, key);
    }

    private getKeyPath(accountEmail: string): string {
        // Escape special chars to prevent filename injection attack
        const filename: string = accountEmail.replace(/[^a-z0-9@]/gi, `_`).toLowerCase();

        return join(this.accountKeyDir, `${filename}.key`);
    }
}