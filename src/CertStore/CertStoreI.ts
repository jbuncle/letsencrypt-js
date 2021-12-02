import type { CertResultI } from "../CertGenerator/CertResultI";

export interface CertStoreI {

    prepare: (commonName: string) => Promise<void>;
    
    getCert: (commonName: string) => Promise<Buffer>;
    
    store: (commonName: string, result: CertResultI) => Promise<void>;

    hasCert: (commonName: string) => Promise<boolean>;
}