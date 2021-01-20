import type { CsrOptions } from "acme-client/types";

export interface AccountKeyProviderI {

    getAccountKey: (csrOptions: CsrOptions) => Promise<Buffer>;
}