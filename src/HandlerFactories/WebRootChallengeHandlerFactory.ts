import type { ChallengeHandlerI } from "../ChallengeHandlerI";
import { WebRootChallengeHandler } from "../ChallengeHandling/WebRootChallengeHandler";

/**
 * Factory for creating web root based ChallengeHandlerI.
 */
export class WebRootChallengeHandlerFactory {

    public create(path: string): ChallengeHandlerI {
        return new WebRootChallengeHandler(path);
    }
}