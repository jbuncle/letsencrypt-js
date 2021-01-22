import type { ClientOptions } from "acme-client";
import { Client, directory } from "acme-client";
import type { AccountKeyProviderI } from "./AccountKeyProviderI";

type LeDirectoryUrl = typeof directory.letsencrypt.production | typeof directory.letsencrypt.staging;


/**
 * Factory for create ACME Clients.
 */
export class AcmeClientFactory {

    /**
     *
     * @param isStaging 
     * @param accountKeyPath  Path to LE account key, will generate if file doesn't exist.
     */
    public constructor(
        private readonly accountKeyProvider: AccountKeyProviderI,
        private readonly isStaging: boolean = true,
    ) { }

    public async create(accountEmail: string): Promise<Client> {
        const directoryUrl: LeDirectoryUrl = this.getLeDirectoryUrl();
        const accountKey = await this.accountKeyProvider.getAccountKey(accountEmail)
        const clientOptions: ClientOptions = {
            directoryUrl,
            accountKey
        };
        return new Client(clientOptions);
    }

    private getLeDirectoryUrl(): LeDirectoryUrl {
        if (this.isStaging) {
            return directory.letsencrypt.staging;
        } else {
            return directory.letsencrypt.production;
        }
    }
}