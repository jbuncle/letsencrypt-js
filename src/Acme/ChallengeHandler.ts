import type { LoggerInterface } from "@jbuncle/logging-js";
import type { AuthorizationI } from "../AuthorizationI";
import type { ChallengeHandlerI } from "../ChallengeHandlerI";
import type { ChallengeI } from "../ChallengeI";

export class ChallengeHandler implements ChallengeHandlerI {

    private readonly handlers: Record<string, ChallengeHandlerI> = {};

    public constructor(
        private readonly logger: LoggerInterface,
        handlers: ChallengeHandlerI[]
    ) {
        this.handlers = {};
        for (const handler of handlers) {
            for (const type of handler.getTypes()) {
                this.handlers[type] = handler;
            }
        }
    }

    /**
     * Get types supported.
     */
    public getTypes(): string[] {
        return Object.keys(this.handlers);
    }

    /**
     * Function used to satisfy an ACME challenge
     *
     * @param {object} authz Authorization object
     * @param {object} challenge Selected challenge
     * @param {string} keyAuthorization Authorization key
     * @returns {Promise}
     */
    public async create(authz: AuthorizationI, challenge: ChallengeI, keyAuthorization: string): Promise<boolean> {
        this.logger.info('Triggered challengeCreateFn()', {});
        const challengeType: string = challenge.type;

        const handler: ChallengeHandlerI = this.getHandler(challengeType);

        return handler.create(authz, challenge, keyAuthorization);
    }


    /**
     * Function used to remove an ACME challenge response
     *
     * @param {object} authz Authorization object
     * @param {object} challenge Selected challenge
     * @param {string} keyAuthorization Authorization key
     * @returns {Promise}
     */
    public async remove(authz: AuthorizationI, challenge: ChallengeI, keyAuthorization: string): Promise<boolean> {
        this.logger.info('Triggered challengeRemoveFn()', {});
        const challengeType: string = challenge.type;

        const handler: ChallengeHandlerI = this.getHandler(challengeType);

        return handler.remove(authz, challenge, keyAuthorization);
    }

    private getHandler(challengeType: string): ChallengeHandlerI {
        if (!(Object.prototype.hasOwnProperty.call(this.handlers, challengeType) as boolean)) {
            throw new Error("Unsupported challenge type");
        }
        return this.handlers[challengeType];

    }
}
