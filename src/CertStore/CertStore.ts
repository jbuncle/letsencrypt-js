import type { CertResult } from "../CertGenerator/CertResult";

export interface CertStoreI {

    getCert: (commonName: string) => Buffer;
    
    store: (commonName: string, result: CertResult) => void;

    hasCert: (commonName: string) => boolean;
}