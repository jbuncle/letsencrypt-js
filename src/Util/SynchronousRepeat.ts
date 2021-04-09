import { BigTimeout } from "./BigTimeout";

/**
 * Repeat an operation after specified delay, synchronously -
 * i.e. without overlapping (in the case of an operation which takes longer than the delay).
 * 
 * Note, if the callback contains asynchronous operations, then this execution time won't be considered.
 */
export class SynchronousRepeat {

    private running: boolean = false;

    private currentTimeout: BigTimeout | undefined;


    public constructor(
        private readonly callback: () => Promise<void>,
        private readonly delayMs: number,
    ) {
        if (isNaN(+delayMs)) {
            throw new Error(`Delay is not a number, '${delayMs}'`);
        }
    }

    public async run(): Promise<void> {

        if (this.running) {
            throw new Error(`Already running`);
        }

        this.running = true;
        await this.runAndRepeat();
    }

    public stop(): void {
        // Stop futher executions
        this.running = false;
        if (this.currentTimeout) {
            // Stop existing timeout
            this.currentTimeout.stop();
        }
    }

    private async runAndRepeat(): Promise<void> {
        if (!this.running) {
            return;
        }

        const start = Date.now();

        // Run callback
        await this.callback();

        // Get elapsed time
        const elapsed = Date.now() - start;
        let delay = this.delayMs - elapsed;

        if (delay < 0) {
            // Time elapsed in last execution was longer than target delay
            // Run immediately
            delay = 0;
        }

        // Sleep
        await this.createTimeout(delay);
        // Run next iteration
        await this.runAndRepeat();
    }

    private async createTimeout(delay: number): Promise<void> {
        return new Promise((resolve, reject) => {

            this.currentTimeout = BigTimeout.setTimeout(() => {
                try {
                    resolve();
                } catch (e: unknown) {
                    reject(e);
                }
            }, delay);
        });
    }


}
