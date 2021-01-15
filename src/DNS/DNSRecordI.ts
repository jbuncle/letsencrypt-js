import type { RecordType } from "./RecordType";

export interface DNSRecordI {
    type: RecordType;
    name: string;
    content: string;
    ttl: number;
    priority?: number;
}
