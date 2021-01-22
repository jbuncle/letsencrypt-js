import { CloudFlareApi as CloudflareApi } from "../CloudflareApi/CloudflareApi";
import type { ChallengeHandlerI } from "../ChallengeHandlerI";
import { CloudflareDnsChallengeHandler } from "../ChallengeHandling/CloudflareDnsChallengeHandler";

/**
 * Factory for creating Cloudflare DNS based ChallengeHandlerI.
 */
export class CloudflareDnsChallengeHandlerFactory {

    public create(
        authToken: string,
        zoneId: string
    ): ChallengeHandlerI {
        const cloudflareApi: CloudflareApi = new CloudflareApi(authToken, zoneId);
        return new CloudflareDnsChallengeHandler(
            cloudflareApi
        );
    }
}