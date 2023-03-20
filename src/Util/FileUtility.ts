import { existsSync, constants } from "fs";
import { access } from "fs/promises";
import { dirname } from "path";

/**
 * Check if a file exists at the given path.
 *
 * @param filepath The file path to check.
 *
 * @returns True if file exists
 */
async function fileExists(filepath: string): Promise<boolean> {
    try {
        return existsSync(filepath);
    } catch (e: unknown) {
        return false;
    }
}

/**
 * Check if the file can be overwritten.
 *
 * @param filepath The file path to check.
 *
 * @returns True if the file can be overwritten.
 */
async function canWrite(filepath: string): Promise<boolean> {
    try {
        await access(filepath, constants.W_OK)
        return true;
    } catch (e: unknown) {
        return false;
    }
}

/**
 * Check if the file can be created (i.e. the containing directory is writeable).
 *
 * @param filepath The file path to check.
 *
 * @returns True if the file can be created.
 */
async function canCreate(filepath: string): Promise<boolean> {
    try {
        const dir: string = dirname(filepath);
        await access(dir, constants.W_OK)
        return true;
    } catch (e: unknown) {
        return false;
    }
}

/**
 * Check if a file can be written to or created.
 *
 * @param filepath The file path to check.
 *
 * @returns True if the file can be written or created.
 */
export async function canWriteOrCreate(filepath: string): Promise<boolean> {
    if (await fileExists(filepath)) {
        return canWrite(filepath);
    } else {
        return canCreate(filepath);
    }
}