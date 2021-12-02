import type { ChallengeHandlerI } from "../ChallengeHandler";
import type { ClientFactoryI } from "../Client/ClientFactoryI";
import type { CertGeneratorI } from "./CertGeneratorI";
import { CertGenerator } from "./Impl/CertGenerator";


/**
 * Factory for creating CertGenerators.
 */
export class CertGeneratorFactory {


    public constructor(
        private readonly clientFactory : ClientFactoryI,
        private readonly challengeHandler: ChallengeHandlerI
    ){}

    public create(): CertGeneratorI {

        return new CertGenerator(this.clientFactory, this.challengeHandler);
    }
}