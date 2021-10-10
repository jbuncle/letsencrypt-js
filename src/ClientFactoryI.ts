import type { Client } from "acme-client/types";

export interface ClientFactoryI {

    create: (accountEmail: string) => Promise<Client>;

}