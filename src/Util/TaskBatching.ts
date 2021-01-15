import type { Task } from "./Task";

/**
 * Runs a number of asynchronous tasks in batches.
 */
export class TaskBatching {

    public async run<T>(tasks: Generator<Task<T>>, batchSize: number): Promise<void> {

        let promises: Promise<T>[] = [];
        for (const task of tasks) {
            const promise: Promise<T> = task();
            promises.push(promise);
            if (promises.length >= batchSize) {
                // Wait for all promises to complete
                await Promise.all(promises);
                // Reset
                promises = [];
            }
        }
        if (promises.length > 0) {
            // Complete any remainder
            await Promise.all(promises);
            return;
        }
    }

}

