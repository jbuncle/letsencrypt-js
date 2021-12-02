

export interface AccountKeyStoreI {

    getKey: (accountEmail: string) => Promise<Buffer>;

    hasKey: (accountEmail: string) => Promise<boolean>;

    storeKey: (accountEmail: string, key: Buffer) => Promise<void>;
}