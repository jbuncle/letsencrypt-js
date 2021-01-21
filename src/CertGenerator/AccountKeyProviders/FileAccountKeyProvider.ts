import { existsSync, promises as fs } from "fs";
import { join } from "path";
import type { AccountKeyProviderI as AccountKeyProviderI } from "../AccountKeyProviderI";
import type { CsrOptions } from "../CsrOptions";
import type { AccountKeyGenerator } from "./AccountKeyGenerator";


export class FileAccountKeyProvider implements AccountKeyProviderI {

    public constructor(
        private readonly accountKeyDir: string,
        private readonly accountKeyGenerator?: AccountKeyGenerator,
    ) { }


    public async getAccountKey(csrOptions: CsrOptions): Promise<Buffer> {

        const keyPath: string = this.getKeyPath(csrOptions);
        if (!existsSync(keyPath)) {
            if (this.accountKeyGenerator === undefined) {
                throw new Error("Key file doesn't exist");
            } else {
                const generated: Buffer = await this.accountKeyGenerator.getAccountKey();
                await fs.writeFile(keyPath, generated);
            }
        }

        return fs.readFile(keyPath);
    }

    private getKeyPath(csrOptions: CsrOptions): string {
        let emailAddress: string | undefined = csrOptions.emailAddress;
        if (emailAddress === undefined) {
            emailAddress = 'default';
        }
        // Escape special chars to prevent filename injection attack
        const filename: string = emailAddress.replace(/[^a-z0-9@]/gi, '_').toLowerCase();

        return join(this.accountKeyDir, `${filename}.key`);
    }
}