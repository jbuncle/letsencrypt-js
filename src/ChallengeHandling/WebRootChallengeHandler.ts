import type { LoggerInterface } from "@jbuncle/logging-js";
import type { Authorization, Challenge } from "acme-client/types/rfc8555";
import { accessSync, constants, existsSync, mkdirSync, promises as fs, readdirSync, rmdirSync } from 'fs';
import { join } from "path";
import type { ChallengeHandlerI } from "../ChallengeHandlerI";

/**
 * Challenge handler which writes static web challenge files to a directory.
 */
export class WebRootChallengeHandler implements ChallengeHandlerI {

    public constructor(
        private readonly logger: LoggerInterface,
        private readonly webRoot: string = `/var/www/html`,
    ) {
        try {
            accessSync(webRoot, constants.W_OK);
        } catch (e: unknown) {
            throw new Error(`Can't access '${webRoot}'`);
        }
    }

    public getTypes(): string[] {
        return [`http-01`];
    }

    public async create(authz: Authorization, challenge: Challenge, keyAuthorization: string): Promise<boolean> {

        // Ensure acme-challenge directory exists
        const parentPath: string = this.mkdirs(this.getWebRoot(), `.well-known`, `acme-challenge`);

        const filePath: string = join(parentPath, challenge.token);

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

        this.rmdirs(this.getWebRoot(), `.well-known`, `acme-challenge`);
        return true;
    }

    /**
     * Create each path in the parent path.
     * @param parts 
     */
    private mkdirs(path: string, ...parts: string[]): string {
        for (const part of parts) {
            path = join(path, part);
            this.mkdir(path);
        }

        return path;
    }

    private rmdirs(path: string, ...parts: string[]): void {
        const paths: string[] = [];
        for (const part of parts) {
            paths.push(join(path, part));
        }

        const reversed: string[] = paths.reverse();
        for (const fullPath of reversed) {
            const removed: boolean = this.rmdir(fullPath);
            if (!removed) {
                // Can't remove any more if top level isn't empty
                return;
            }
        }
    }

    private rmdir(dir: string): boolean {
        if (existsSync(dir)) {
            return true;
        }
        const files: string[] = readdirSync(dir);
        if (files.length <= 0) {
            rmdirSync(dir);
            return true;
        }
        return false;
    }

    private mkdir(dir: string): void {
        if (!existsSync(dir)) {
            mkdirSync(dir);
        }
    }

    private getWebRoot(): string {
        return this.webRoot;
    }
}