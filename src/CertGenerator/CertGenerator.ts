import type { Authorization, ClientAutoOptions } from "acme-client";
import { forge } from "acme-client";
import type { Challenge } from "acme-client/types/rfc8555";
import type { CsrOptionsI } from "./CsrOptions";
import type { CertResult } from "./CertResult";
import type { ChallengeHandlerI } from "../ChallengeHandlerI";
import { PemUtility } from "../Util/PemUtility";
import type { ClientFactoryI } from "../ClientFactoryI";

/**
 * Main class responsible for actually generating a certificate.
 */
export class CertGenerator {

    public constructor(
        private readonly clientFactory: ClientFactoryI,
        private readonly challengeHandler: ChallengeHandlerI,
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
        const client = await this.clientFactory.create(accountEmail);

        // Create CSR (Certificate Signing Request)
        const [sslPrivateKey, csr] = await forge.createCsr(csrOptions);

        const challengeCreateFn: ChallengeCallback = async(authorisation: Authorization, challenge: Challenge, keyAuthorization: string): Promise<boolean> => {
            return this.challengeHandler.create(authorisation, challenge, keyAuthorization);
        };
        const challengeRemoveFn: ChallengeCallback = async(authorisation: Authorization, challenge: Challenge, keyAuthorization: string): Promise<boolean> => {
            return this.challengeHandler.remove(authorisation, challenge, keyAuthorization);
        }

        const options: ClientAutoOptions = {
            challengePriority: this.challengeHandler.getTypes(),
            csr,
            email: accountEmail,
            termsOfServiceAgreed: true,
            challengeCreateFn,
            challengeRemoveFn,
        };

        const cert: string = await client.auto(options);
        const pemUtility: PemUtility = new PemUtility();
        const caCert: string = pemUtility.getCaCertFromFullChain(cert);

        const result: CertResult = {
            privateKey: sslPrivateKey.toString(),
            certificate: cert.toString(),
            caCert: caCert,
        };

        return result;
    }
}

type ChallengeCallback = (authz: Authorization, challenge: Challenge, keyAuthorization: string) => Promise<boolean>;


