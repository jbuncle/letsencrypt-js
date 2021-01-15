import type { LoggerInterface } from "@jbuncle/logging-js";
import type { Authorization, Challenge } from "acme-client/types/rfc8555";
import { promises as fs } from 'fs';
import type { ChallengeHandlerI } from "../ChallengeHandlerI";

export class WebRootChallengeHandler implements ChallengeHandlerI {

    public constructor(
        private readonly logger: LoggerInterface,
        private readonly webRoot: string = '/var/www/html',
    ) { }

    public getTypes(): string[] {
        return ['http-01'];
    }

    public async create(authz: Authorization, challenge: Challenge, keyAuthorization: string): Promise<boolean> {

        const filePath = `${this.getWebRoot()}/.well-known/acme-challenge/${challenge.token}`;

        this.logger.info(`Creating challenge response for ${authz.identifier.value} at path: ${filePath}`, {});

        this.logger.debug(`Writing authorisation key to '${filePath}'`, {});
        await fs.writeFile(filePath, keyAuthorization);

        return true;
    }


    public async remove(authz: Authorization, challenge: Challenge): Promise<boolean> {

        const filePath: string = `${this.getWebRoot()}/.well-known/acme-challenge/${challenge.token}`;

        this.logger.info(`Removing challenge response for ${authz.identifier.value} at path: ${filePath}`, {});

        /* Replace this */
        this.logger.debug(`Removing "${filePath}"`, {});
        await fs.unlink(filePath);
        return true;
    }

    private getWebRoot(): string {
        return this.webRoot;
    }
}