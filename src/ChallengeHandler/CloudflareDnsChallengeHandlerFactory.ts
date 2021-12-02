import { CloudFlareApi as CloudflareApi } from "../CloudflareApi/CloudflareApi";
import type { ChallengeHandlerI } from "./ChallengeHandlerI";
import { CloudflareDnsChallengeHandler } from "./Impl/CloudflareDnsChallengeHandler";
import type { ChallengeHandlerFactoryI } from "./ChallengeHandlerFactoryI";

/**
 * Factory for creating Cloudflare DNS based ChallengeHandlerI.
 */
export class CloudflareDnsChallengeHandlerFactory implements ChallengeHandlerFactoryI {

    private constructor(
        private readonly authToken: string,
        private readonly zoneId: string,
    ) { }

    public create(): ChallengeHandlerI {
        const cloudflareApi: CloudflareApi = new CloudflareApi(this.authToken, this.zoneId);
        return new CloudflareDnsChallengeHandler(
            cloudflareApi
        );
    }
}