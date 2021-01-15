import type { ChallengeI } from "./ChallengeI";


export interface AuthorizationI {
    identifier: {
        type: string;
        value: string;
    };
    status: 'deactivated' | 'expired' | 'invalid' | 'pending' | 'revoked' | 'valid';
    challenges: ChallengeI[];
    expires?: string;
    wildcard?: boolean;
}
