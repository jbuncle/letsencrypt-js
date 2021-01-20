import type { Task } from "./Task";

/**
 * Runs a number of asynchronous tasks in batches.
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

        this.currentPromise = this.run();
        await this.currentPromise;
        this.currentPromise = undefined;
    }

    private async run(): Promise<void> {
        while (this.tasks.length > 0) {
            const batch: Task<T>[] = this.shiftN(this.size);
            await this.invokeTasks(batch);
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

