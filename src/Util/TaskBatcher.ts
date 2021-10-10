import type { Task } from "./Task";

/**
 * Runs a number of asynchronous tasks in batches of a predefined size.
 */
export class TaskBatcher<T> {

    private readonly tasks: Task<T>[] = [];

    private currentPromise: Promise<void> | undefined = undefined;

    public constructor(
        private readonly size: number,
    ) { }

    public async addAndRun(tasks: Generator<Task<T>>): Promise<void> {

        for (const task of tasks) {
            this.tasks.push(task);
        }
        if (this.currentPromise !== undefined) {
            return this.currentPromise;
        }

        this.currentPromise = this.runBatch();
        await this.currentPromise;
        this.currentPromise = undefined;
    }

    /**
     * Run batches, recursively
     */
    private async runBatch(): Promise<void> {
        if (this.tasks.length < 1) {
            return;
        }
        try {

            const batch: Task<T>[] = this.shiftN(this.size);
            await this.invokeTasks(batch);

        } finally {
            // Run recursively in "finally" as this avoids an error in the previous batch breaking the batcher
            await this.runBatch();
        }
    }

    private async invokeTasks(tasks: Task<T>[]): Promise<T[]> {
        const promises: Promise<T>[] = [];
        for (const task of tasks) {
            const promise: Promise<T> = task();
            promises.push(promise);
        }
        return Promise.all(promises);
    }

    private shiftN(size: number): Task<T>[] {
        const shifted: Task<T>[] = [];
        while (shifted.length < size && this.tasks.length > 0) {
            const task: Task<T> | undefined = this.tasks.shift();
            if (task !== undefined) {
                shifted.push(task);
            }
        }
        return shifted;
    }

}

