import type { ChallengeHandlerI } from "./ChallengeHandlerI";
import type { ChallengeHandlerFactoryI } from "./ChallengeHandlerFactoryI";
import { WebRootChallengeHandler } from "./Impl/WebRootChallengeHandler";

/**
 * Factory for creating web root based ChallengeHandlerI.
 */
export class WebRootChallengeHandlerFactory implements ChallengeHandlerFactoryI {

    public constructor(
        private readonly path: string,
    ) { }

    public create(): ChallengeHandlerI {
        return new WebRootChallengeHandler(this.path);
    }
}