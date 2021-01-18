import type { AuthorizationI } from "./AuthorizationI";
import type { ChallengeI } from "./ChallengeI";

export interface ChallengeHandlerI {
    getTypes: () => string[];
    remove: (authz: AuthorizationI, challenge: ChallengeI, keyAuthorization: string) => Promise<boolean>;
    create: (authz: AuthorizationI, challenge: ChallengeI, keyAuthorization: string) => Promise<boolean>;
}