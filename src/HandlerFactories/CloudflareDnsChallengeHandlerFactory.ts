import type { LoggerInterface } from "@jbuncle/logging-js";
import { CloudFlareApi as CloudflareApi } from "../CloudflareApi/CloudflareApi";
import type { ChallengeHandlerI } from "../ChallengeHandlerI";
import { CloudflareDnsChallengeHandler } from "../Acme/Handlers/CloudflareDnsChallengeHandler";

export class CloudflareDnsChallengeHandlerFactory {

    public create(
        logger: LoggerInterface,
        authToken: string,
        zoneId: string,
    ): ChallengeHandlerI {
        const cloudflarApi: CloudflareApi = new CloudflareApi(authToken, zoneId);
        return new CloudflareDnsChallengeHandler(
            logger,
            cloudflarApi
        );
    }
}