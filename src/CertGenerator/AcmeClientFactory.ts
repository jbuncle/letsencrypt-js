import type { ClientOptions} from "acme-client";
import { Client, directory, forge } from "acme-client";

type LeDirectoryUrl = typeof directory.letsencrypt.production | typeof directory.letsencrypt.staging;

export class AcmeClientFactory {

    public constructor(
        private readonly isStaging: boolean = true,
    ) { }

    public async create(): Promise<Client> {
        const directoryUrl: LeDirectoryUrl = this.getLeDirectoryUrl();
        const accountKey = await this.generateAccountKey();
        const clientOptions: ClientOptions = {
            directoryUrl,
            accountKey
        };
        return new Client(clientOptions);
    }

    private async generateAccountKey(): Promise<Buffer | string> {
        return forge.createPrivateKey();
    }

    private getLeDirectoryUrl(): LeDirectoryUrl {
        if (this.isStaging) {
            return directory.letsencrypt.staging;
        } else {
            return directory.letsencrypt.production;
        }
    }
}