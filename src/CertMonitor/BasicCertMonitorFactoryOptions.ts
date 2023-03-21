import type { ChallengeHandlerI } from "../ChallengeHandler";



export interface BasicCertMonitorFactoryOptions {
    // The challenge handlers to respond to LetsEncrypt
    handlers: ChallengeHandlerI[];
    // Format of the cert path, e.g. /certs/%s.crt
    certFilePathFormat: string;
    // Format of the key path, e.g. /certs/%s.key
    keyFilePathFormat: string;
    // Format of the key path, e.g. /certs/%s.chain.pem
    caFilePathFormat: string;
    // The directory to store account keys
    accountKeyDir?: string;
    // Whether terms of server are accepted 
    termsOfServiceAgreed: boolean;
    // The number of days before certificate expiry to renew (default 30)
    expiryThresholdDays?: number;
    // Whether to skip internal challenge verification (as internal challenges may not work depending on internal setup)
    skipChallengeVerification?: boolean;
}
