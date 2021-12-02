
import { accessSync, constants, statSync } from "fs";
import type { AccountKeyProviderI } from "..";
import { AccountKeyGenerator } from "./AccountKeyProviders/AccountKeyGenerator";
import type { AccountKeyStoreI } from "./AccountKeyProviders/AccountKeyStoreI";
import { StoredAccountKeyProvider } from "./AccountKeyProviders/FileAccountKeyProvider";
import { FileSystemKeyStore } from "./AccountKeyProviders/FileSystemKeyStore";

/**
 * Factory class for creating AccountKeyProviders.
 */
export class AccountKeyProviderFactory {

    public createAccountKeyProvider(accountKeyPath: string | undefined = undefined): AccountKeyProviderI {
        if (accountKeyPath !== undefined) {
            return this.createAccountFileSystemAccountKeyProvider(accountKeyPath);
        } else {
            return this.createAccountKeyGenerator();
        }
    }

    private createAccountKeyGenerator(): AccountKeyProviderI {
        return new AccountKeyGenerator();
    }

    private createAccountFileSystemAccountKeyProvider(accountKeyDir: string): AccountKeyProviderI {
        const generator: AccountKeyProviderI = this.createAccountKeyGenerator();

        // Ensure the storage directory is accessible
        const stat = statSync(accountKeyDir);
        if (!stat.isDirectory()) {
            throw new Error(`Directory '${accountKeyDir}' doesn't exist`);
        }
        accessSync(accountKeyDir, constants.W_OK);

        const keyStore: AccountKeyStoreI = new FileSystemKeyStore(accountKeyDir);

        return new StoredAccountKeyProvider(keyStore, generator);
    }



}