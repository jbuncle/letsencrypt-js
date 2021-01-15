import type { Authorization, ClientAutoOptions} from "acme-client";
import { forge } from "acme-client";
import type { Challenge } from "acme-client/types/rfc8555";
import type { AcmeClientFactory } from "./AcmeClientFactory";
import type { CsrOptions } from "./CsrOptions";
import type { LoggerInterface } from "@jbuncle/logging-js";
import type { ChallengeHandlerI } from "../Acme/ChallengeHandlerI";
import type { CertResult } from "./CertResult";


export class CertGenerator {

    public constructor(
        private readonly logger: LoggerInterface,
        private readonly acmeClientFactory: AcmeClientFactory,
        private readonly acmeChallengeHandler: ChallengeHandlerI,
    ) { }

    /**
     * 
     * @param csrOptions 
     * @param accountEmail Account email (not certificate email) 
     */
    public async generate(
        csrOptions: CsrOptions,
        accountEmail: string
    ): Promise<CertResult> {

        // Create ACME client
        const client = await this.acmeClientFactory.create();

        // Create CSR (Certificate Signing Request)
        const [key, csr] = await forge.createCsr(csrOptions);

        const challengeCreateFn: ChallengeCallback = async (authz: Authorization, challenge: Challenge, keyAuthorization: string): Promise<boolean> => {
            return this.acmeChallengeHandler.create(authz, challenge, keyAuthorization);
        };
        const challengeRemoveFn: ChallengeCallback = async (authz: Authorization, challenge: Challenge, keyAuthorization: string): Promise<boolean> => {
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

        // this.logger.info(`CSR:\n${csr.toString()}`);
        // this.logger.info(`Private key:\n${key.toString()}`);


        // this.logger.info('Generating certificate');
        const cert: string = await client.auto(options);

        const result: CertResult = {
            privateKey: key.toString(),
            certificate: cert.toString(),
        };
        this.logger.info(JSON.stringify(result), {});

        return result;
    }
}

type ChallengeCallback = (authz: Authorization, challenge: Challenge, keyAuthorization: string) => Promise<boolean>;


