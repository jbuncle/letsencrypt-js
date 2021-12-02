import type { CloudFlareApi } from "../../CloudflareApi/CloudflareApi";
import type { CloudflareResponeDnsI } from "../../CloudflareApi/CloudflareResponeDnsI";
import type { DNSRecordI } from "../../DNS/DNSRecordI";
import type { ChallengeHandlerI } from "../ChallengeHandlerI";
import { AbstractDnsChallengeHandler } from "./AbstractDnsChallengeHandler";


/**
 * DNS Challenge Handler using the Cloudflare API.
 */
export class CloudflareDnsChallengeHandler extends AbstractDnsChallengeHandler implements ChallengeHandlerI {

    public constructor(
        private readonly cloudflareApi: CloudFlareApi,
    ) {
        super();
    }

    protected async addRecord(dnsRecord: DNSRecordI): Promise<boolean> {
        await this.cloudflareApi.addRecord(dnsRecord);
        return true;
    }

    protected async removeRecord(dnsRecord: DNSRecordI): Promise<boolean> {
        const id: string = await this.findRecord(dnsRecord);

        await this.cloudflareApi.deleteRecord(id);

        return true;
    }

    private async findRecord(search: DNSRecordI): Promise<string> {
        const records: CloudflareResponeDnsI[] = await this.cloudflareApi.listRecords()
        const record: CloudflareResponeDnsI | undefined = records.find((currentRecord: CloudflareResponeDnsI) => {
            return currentRecord.name === search.name
                && currentRecord.type === search.type
                && currentRecord.content === search.content;
        });
        if (record === undefined) {
            throw new Error(`Failed to find record for ${search.name}`)
        }
        return record.id;
    }
}