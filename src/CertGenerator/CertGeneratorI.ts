import type { CertResultI } from "./CertResultI";
import type { CsrOptionsI } from "./CsrOptionsI";

export interface CertGeneratorI {
    generate: (
        csrOptions: CsrOptionsI,
        accountEmail: string
    ) => Promise<CertResultI>;
}