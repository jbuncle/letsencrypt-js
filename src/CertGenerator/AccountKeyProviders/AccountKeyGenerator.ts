import { forge } from "acme-client";
import type { AccountKeyProviderI as AccountKeyProviderI } from "../AccountKeyProviderI";


export class AccountKeyGenerator implements AccountKeyProviderI {

    public async getAccountKey(): Promise<Buffer> {
        return forge.createPrivateKey();
    }
}