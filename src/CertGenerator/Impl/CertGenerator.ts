import type { Authorization, Client, ClientAutoOptions } from "acme-client";
import type { Challenge } from "acme-client/types/rfc8555";
import { forge } from "acme-client";
import type { ClientFactoryI } from "../../Client/ClientFactoryI";
import { PemUtility } from "../../Util/PemUtility";
import type { CertResultI } from "../CertResultI";
import type { CsrOptionsI } from "../CsrOptionsI";
import type { CertGeneratorI } from "../CertGeneratorI";
import type { ChallengeHandlerI } from "../../ChallengeHandler";
import type { CertGeneratorOptions } from "./CertGeneratorOptions";

/**
 * Main class responsible for actually generating a certificate.
 */
export class CertGenerator implements CertGeneratorI {

    public constructor(
        private readonly clientFactory: ClientFactoryI,
        private readonly challengeHandler: ChallengeHandlerI,
        private readonly options: CertGeneratorOptions
    ) { }

    /**
     * 
     * @param csrOptions 
     * @param accountEmail Account email (not certificate email) 
     */
    public async generate(
        csrOptions: CsrOptionsI,
        accountEmail: string
    ): Promise<CertResultI> {

        // Create ACME client
        const client: Client = await this.clientFactory.create(accountEmail);

        // Create CSR (Certificate Signing Request)
        const [sslPrivateKey, csr] = await forge.createCsr(csrOptions);

        const challengeCreateFn: ChallengeCallback = async (authorisation: Authorization, challenge: Challenge, keyAuthorization: string): Promise<boolean> => {
            return this.challengeHandler.create(authorisation, challenge, keyAuthorization);
        };
        const challengeRemoveFn: ChallengeCallback = async (authorisation: Authorization, challenge: Challenge, keyAuthorization: string): Promise<boolean> => {
            return this.challengeHandler.remove(authorisation, challenge, keyAuthorization);
        }

        const options: ClientAutoOptions = {
            ...this.options,
            challengePriority: this.challengeHandler.getTypes(),
            csr,
            email: accountEmail,
            challengeCreateFn,
            challengeRemoveFn,
        };

        const cert: string = await client.auto(options);
        const pemUtility: PemUtility = new PemUtility();
        const caCert: string = pemUtility.getCaCertFromFullChain(cert);

        const result: CertResultI = {
            privateKey: sslPrivateKey.toString(),
            certificate: cert.toString(),
            caCert: caCert,
        };

        return result;
    }
}

type ChallengeCallback = (authz: Authorization, challenge: Challenge, keyAuthorization: string) => Promise<boolean>;


