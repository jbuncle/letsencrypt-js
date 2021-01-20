import { existsSync, promises as fs } from "fs";
import type { AccountKeyProviderI as AccountKeyProviderI } from "../AccountKeyProviderI";
import type { AccountKeyGenerator } from "./AccountKeyGenerator";


export class FileAccountKeyProvider implements AccountKeyProviderI {

    public constructor(
        private readonly accountKeyPath: string,
        private readonly accountKeyGenerator?: AccountKeyGenerator,
    ) { }


    public async getAccountKey(): Promise<Buffer> {
        if (!existsSync(this.accountKeyPath)) {
            if (this.accountKeyGenerator === undefined) {
                throw new Error("Key file doesn't exist");
            } else {
                const generated: Buffer =  await this.accountKeyGenerator.getAccountKey();
                await fs.writeFile(this.accountKeyPath, generated);
            }
        }

        return fs.readFile(this.accountKeyPath);
    }
}