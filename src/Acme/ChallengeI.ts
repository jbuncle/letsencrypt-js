/* eslint-disable @typescript-eslint/ban-types */

export interface ChallengeI {

    type: 'dns-01' | 'http-01';
    token: string;
    url: string;
    status: 'invalid' | 'pending' | 'processing' | 'valid';
    validated?: string;
    error?: object;
}
