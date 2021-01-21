import type { CsrOptions } from "./CsrOptions";

export interface AccountKeyProviderI {

    getAccountKey: (csrOptions: CsrOptions) => Promise<Buffer>;
}