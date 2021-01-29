import { lstatSync, accessSync, constants } from "fs";


export const assertPathIsWritable = (dir: string): void => {
    try {
        accessSync(dir, constants.W_OK);
    } catch (e: unknown) {
        throw new Error(`Path '${dir}' is not writable`);
    }

}

export const assertPathIsDir = (dir: string): void => {
    if (!lstatSync(dir).isDirectory()) {
        throw new Error(`Path '${dir}' is not a directory`);
    }
}