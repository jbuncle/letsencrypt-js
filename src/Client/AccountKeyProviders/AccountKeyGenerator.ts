import { forge } from "acme-client";
import type { AccountKeyProviderI } from "../../AccountKeyProviderI";

/**
 * Generates a new account key each time.
 */
export class AccountKeyGenerator implements AccountKeyProviderI {

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async getAccountKey(accountEmail: string): Promise<Buffer> {
        return forge.createPrivateKey();
    }
}