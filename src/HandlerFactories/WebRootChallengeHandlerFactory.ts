import type { LoggerInterface } from "@jbuncle/logging-js";
import type { ChallengeHandlerI } from "../ChallengeHandlerI";
import { WebRootChallengeHandler } from "../Acme/Handlers/WebRootChallengeHandler";

export class WebRootChallengeHandlerFactory {

    public create(logger: LoggerInterface, path: string): ChallengeHandlerI {
        return new WebRootChallengeHandler(logger, path);
    }
}