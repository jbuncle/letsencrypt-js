import { existsSync, promises as fs } from "fs";
import { join } from "path";
import type { AccountKeyProviderI } from "../AccountKeyProviderI";
import type { AccountKeyGenerator } from "./AccountKeyGenerator";

/**
 * AccountKeyProviderI that reads account key from a file, generating one if it doesn't exit.
 */
export class FileAccountKeyProvider implements AccountKeyProviderI {

    public constructor(
        private readonly accountKeyDir: string,
        private readonly accountKeyGenerator?: AccountKeyGenerator,
    ) { }

    public async getAccountKey(accountEmail: string): Promise<Buffer> {

        const keyPath: string = this.getKeyPath(accountEmail);
        if (!existsSync(keyPath)) {
            if (this.accountKeyGenerator === undefined) {
                throw new Error(`Key file doesn't exist`);
            } else {
                const generated: Buffer = await this.accountKeyGenerator.getAccountKey();
                await fs.writeFile(keyPath, generated);
            }
        }

        return fs.readFile(keyPath);
    }

    private getKeyPath(accountEmail: string): string {
        // Escape special chars to prevent filename injection attack
        const filename: string = accountEmail.replace(/[^a-z0-9@]/gi, `_`).toLowerCase();

        return join(this.accountKeyDir, `${filename}.key`);
    }
}