import type { DNSRecordI } from "../DNS/DNSRecordI";

export interface CloudFlareDNSRecordI extends DNSRecordI {
    proxies?: boolean;
}
