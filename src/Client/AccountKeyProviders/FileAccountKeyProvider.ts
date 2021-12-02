
import type { AccountKeyProviderI } from "../../AccountKeyProviderI";
import type { AccountKeyGenerator } from "./AccountKeyGenerator";
import type { AccountKeyStoreI } from "./AccountKeyStoreI";

/**
 * AccountKeyProviderI that reads account key from a file, generating one if it doesn't exit.
 */
export class StoredAccountKeyProvider implements AccountKeyProviderI {

    public constructor(
        private readonly keyStore: AccountKeyStoreI,
        private readonly accountKeyGenerator: AccountKeyGenerator,
    ) { }

    public async getAccountKey(accountEmail: string): Promise<Buffer> {

        if (!(await this.keyStore.hasKey(accountEmail))) {
            const generated: Buffer = await this.accountKeyGenerator.getAccountKey(accountEmail);
            await this.keyStore.storeKey(accountEmail, generated);
        }

        return this.keyStore.getKey(accountEmail);
    }
}