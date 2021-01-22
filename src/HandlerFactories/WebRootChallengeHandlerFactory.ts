import type { LoggerInterface } from "@jbuncle/logging-js";
import type { ChallengeHandlerI } from "../ChallengeHandlerI";
import { WebRootChallengeHandler } from "../ChallengeHandling/WebRootChallengeHandler";

/**
 * Factory for creating web root based ChallengeHandlerI.
 */
export class WebRootChallengeHandlerFactory {

    public create(logger: LoggerInterface, path: string): ChallengeHandlerI {
        return new WebRootChallengeHandler(logger, path);
    }
}