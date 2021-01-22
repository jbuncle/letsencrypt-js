import type { Authorization, ClientAutoOptions} from "acme-client";
import { forge } from "acme-client";
import type { Challenge } from "acme-client/types/rfc8555";
import type { AcmeClientFactory } from "../Client/AcmeClientFactory";
import type { CsrOptionsI } from "./CsrOptions";
import type { CertResult } from "./CertResult";
import type { ChallengeHandlerI } from "../ChallengeHandlerI";

/**
 * Main class responsible for actually generating a certficate.
 */
export class CertGenerator {

    public constructor(
        private readonly acmeClientFactory: AcmeClientFactory,
        private readonly acmeChallengeHandler: ChallengeHandlerI,
    ) { }

    /**
     * 
     * @param csrOptions 
     * @param accountEmail Account email (not certificate email) 
     */
    public async generate(
        csrOptions: CsrOptionsI,
        accountEmail: string
    ): Promise<CertResult> {

        // Create ACME client
        const client = await this.acmeClientFactory.create(accountEmail);

        // Create CSR (Certificate Signing Request)
        const [sslPrivateKey, csr] = await forge.createCsr(csrOptions);

        const challengeCreateFn: ChallengeCallback = async(authz: Authorization, challenge: Challenge, keyAuthorization: string): Promise<boolean> => {
            return this.acmeChallengeHandler.create(authz, challenge, keyAuthorization);
        };
        const challengeRemoveFn: ChallengeCallback = async(authz: Authorization, challenge: Challenge, keyAuthorization: string): Promise<boolean> => {
            return this.acmeChallengeHandler.remove(authz, challenge, keyAuthorization);
        }

        const options: ClientAutoOptions = {
            challengePriority: this.acmeChallengeHandler.getTypes(),
            csr,
            email: accountEmail,
            termsOfServiceAgreed: true,
            challengeCreateFn,
            challengeRemoveFn,
        };

        const cert: string = await client.auto(options);

        const result: CertResult = {
            privateKey: sslPrivateKey.toString(),
            certificate: cert.toString(),
        };

        return result;
    }
}

type ChallengeCallback = (authz: Authorization, challenge: Challenge, keyAuthorization: string) => Promise<boolean>;


