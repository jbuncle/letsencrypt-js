export interface AccountKeyProviderI {

    getAccountKey: (accountEmail: string) => Promise<Buffer>;
}