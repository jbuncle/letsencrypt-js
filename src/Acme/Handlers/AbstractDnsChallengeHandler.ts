import type { LoggerInterface } from "@jbuncle/logging-js";
import type { DNSRecordI } from "../../DNS/DNSRecordI";
import { RecordType } from "../../DNS/RecordType";
import type { ChallengeHandlerI } from "../ChallengeHandlerI";
import type { ChallengeI } from "../ChallengeI";
import type { AuthorizationI } from "../AuthorizationI";

export abstract class AbstractDnsChallengeHandler implements ChallengeHandlerI {


    public constructor(
        protected readonly logger: LoggerInterface,
    ) { }

    public getTypes(): string[] {
        return ['dns-01'];
    }

    public async create(authz: AuthorizationI, challenge: ChallengeI, keyAuthorization: string): Promise<boolean> {

        const dnsRecord: DNSRecordI = this.createDnsRecordForAuth(authz, keyAuthorization);
        await this.addRecord(dnsRecord);

        this.logger.info('Creating', dnsRecord);

        return true;
    }


    public async remove(authz: AuthorizationI, challenge: ChallengeI, keyAuthorization: string): Promise<boolean> {

        const dnsRecord: DNSRecordI = this.createDnsRecordForAuth(authz, keyAuthorization);
        await this.removeRecord(dnsRecord);

        return true;
    }
    
    private createDnsRecordForAuth(authz: AuthorizationI, keyAuthorization: string): DNSRecordI {
        const dnsRecord: DNSRecordI = {
            name: `_acme-challenge.${authz.identifier.value}`,
            content: keyAuthorization,
            ttl: 120,
            type: RecordType.TXT
        };
        return dnsRecord;
    }

    protected abstract addRecord(dnsRecord: DNSRecordI): Promise<boolean>;

    protected abstract removeRecord(dnsRecord: DNSRecordI): Promise<boolean>;



}