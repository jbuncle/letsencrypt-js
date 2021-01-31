import type { CertResult } from "../CertGenerator/CertResult";

export interface CertStoreI {

    prepare: (commonName: string) => Promise<void>;
    
    getCert: (commonName: string) => Promise<Buffer>;
    
    store: (commonName: string, result: CertResult) => Promise<void>;

    hasCert: (commonName: string) => Promise<boolean>;
}