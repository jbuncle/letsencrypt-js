import type { LoggerInterface } from "@jbuncle/logging-js";
import type { CloudFlareApi as CloudflareApi } from "../../CloudflareApi/CloudflareApi";
import type { DNSRecordI } from "../../DNS/DNSRecordI";
import type { CloudflareResponeDnsI } from "../../CloudflareApi/CloudflareResponeDnsI";
import type { ChallengeHandlerI } from "../ChallengeHandlerI";
import { AbstractDnsChallengeHandler } from "./AbstractDnsChallengeHandler";

export class CloudflareDnsChallengeHandler extends AbstractDnsChallengeHandler implements ChallengeHandlerI {


    public constructor(
        logger: LoggerInterface,
        private readonly cloudflareApi: CloudflareApi,
    ) {
        super(logger);
    }


    protected async addRecord(dnsRecord: DNSRecordI): Promise<boolean> {
        await this.cloudflareApi.addRecord(dnsRecord);
        return true;
    }

    protected async removeRecord(dnsRecord: DNSRecordI): Promise<boolean> {
        const id: string = await this.findRecord(dnsRecord);

        this.logger.info(`Deleting '${id}'`, {});
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