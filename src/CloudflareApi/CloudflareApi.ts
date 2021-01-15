/* eslint-disable @typescript-eslint/naming-convention */
import type { ClientRequest, IncomingHttpHeaders } from "http";
import type { RequestOptions } from "https";
import { request } from "https";
import type { CloudFlareDNSRecordI } from "./CloudFlareDNSRecordI";
import type { CloudflareResponseI } from "./CloudflareResponeI";
import type { CloudflareResponeDnsI } from "./CloudflareResponeDnsI";


interface HttpResponse<T> {
    headers: IncomingHttpHeaders;
    data: T,
}

enum HttpRequestMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
}
type CloudflareHttpResponse<R> = HttpResponse<CloudflareResponseI<R>>;

export class CloudFlareApi {

    public constructor(
        private readonly authToken: string,
        private readonly zoneId: string,
        private readonly host: string = 'api.cloudflare.com',
    ) { }

    public async listRecords(): Promise<CloudflareResponeDnsI[]> {
        const endpoint: string = `/client/v4/zones/${this.zoneId}/dns_records`;
        const response: CloudflareHttpResponse<CloudflareResponeDnsI[]> = await this.httpsRequest(endpoint, HttpRequestMethod.GET, {});

        if (!response.data.success) {
            throw new Error(response.data.errors.join(' => '));
        }
        return response.data.result;
    }

    public async addRecord(record: CloudFlareDNSRecordI): Promise<CloudflareResponeDnsI> {
        const endpoint: string = `/client/v4/zones/${this.zoneId}/dns_records`;
        const response: CloudflareHttpResponse<CloudflareResponeDnsI> = await this.httpsRequest(endpoint, HttpRequestMethod.POST, record);

        if (!response.data.success) {
            throw new Error(response.data.messages.join(' => '));
        }
        return response.data.result;
    }

    public async deleteRecord(identifier: string): Promise<CloudflareResponeDnsI> {
        if (identifier.length <= 0) {
            throw new Error(`Bad identifier '${identifier}'`);
        }
        const endpoint: string = `/client/v4/zones/${this.zoneId}/dns_records/${identifier}`;
        const response: CloudflareHttpResponse<CloudflareResponeDnsI> = await this.httpsRequest(endpoint, HttpRequestMethod.DELETE, {});

        if (!response.data.success) {
            throw new Error(response.data.messages.join(' => '));
        }
        return response.data.result;
    }

    private async httpsRequest<T, R>(path: string, method: HttpRequestMethod, data: T): Promise<CloudflareHttpResponse<R>> {

        return new Promise<CloudflareHttpResponse<R>>((resolve: (value: CloudflareHttpResponse<R>) => void, reject: (reason?: unknown) => void) => {

            const postData: string = JSON.stringify(data);
            const options: RequestOptions = {
                protocol: 'https:',
                hostname: this.host,
                port: 443,
                path,
                method,
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req: ClientRequest = request(options, (res) => {
                let responseData: string = '';
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                res.on('end', () => {
                    resolve({
                        headers: res.headers,
                        data: JSON.parse(responseData) as CloudflareResponseI<R>,
                    })
                });
            });

            req.on('error', (e) => {
                reject(e);
            });

            // Write data to request body
            req.write(postData);
            req.end();
        });
    }
}

