import type { AuthorizationI } from "../AuthorizationI";
import type { ChallengeHandlerI } from "../ChallengeHandlerI";
import type { ChallengeI } from "../ChallengeI";

/**
 * Combine multiple challenge handlers into one.
 */
export class CombinedChallengeHandler implements ChallengeHandlerI {

    private readonly handlers: Record<string, ChallengeHandlerI> = {};

    public constructor(
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
     * 
     * @returns {string[]} The types.
     */
    public getTypes(): string[] {
        return Object.keys(this.handlers);
    }

    /**
     * Function used to satisfy an ACME challenge
     *
     * @param {AuthorizationI} authz Authorization object
     * @param {ChallengeI} challenge Selected challenge
     * @param {string} keyAuthorization Authorization key
     * @returns {Promise<boolean>}
     */
    public async create(authz: AuthorizationI, challenge: ChallengeI, keyAuthorization: string): Promise<boolean> {
        const challengeType: string = challenge.type;

        const handler: ChallengeHandlerI = this.getHandler(challengeType);

        return handler.create(authz, challenge, keyAuthorization);
    }


    /**
     * Function used to remove an ACME challenge response
     *
     * @param {AuthorizationI} authz Authorization object
     * @param {ChallengeI} challenge Selected challenge
     * @param {string} keyAuthorization Authorization key
     * @returns {Promise}
     */
    public async remove(authz: AuthorizationI, challenge: ChallengeI, keyAuthorization: string): Promise<boolean> {
        const challengeType: string = challenge.type;

        const handler: ChallengeHandlerI = this.getHandler(challengeType);

        return handler.remove(authz, challenge, keyAuthorization);
    }

    private getHandler(challengeType: string): ChallengeHandlerI {
        if (!(Object.prototype.hasOwnProperty.call(this.handlers, challengeType) as boolean)) {
            throw new Error(`Unsupported challenge type`);
        }
        return this.handlers[challengeType];

    }
}
