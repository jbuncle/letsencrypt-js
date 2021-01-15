/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/naming-convention */
import type { RecordType } from "../DNS/RecordType";


export interface CloudflareResponeDnsI {
    id: string;
    type: RecordType;
    name: string;
    content: string;
    proxiable: boolean;
    proxied: boolean;
    ttl: number;
    locked: boolean;
    zone_id: string;
    zone_name: string;
    created_on: string;
    modified_on: string;
    data: {};
    meta: {
        auto_added: boolean;
        source: string;
    };
}
