import { forge } from "acme-client";
import type { AccountKeyProviderI } from "../AccountKeyProviderI";

/**
 * Generates a new account key each time.
 */
export class AccountKeyGenerator implements AccountKeyProviderI {

    public async getAccountKey(): Promise<Buffer> {
        return forge.createPrivateKey();
    }
}