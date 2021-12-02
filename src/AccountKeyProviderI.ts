/**
 * Interface for instances that provide account keys.
 */
export interface AccountKeyProviderI {

    getAccountKey: (accountEmail: string) => Promise<Buffer>;
}