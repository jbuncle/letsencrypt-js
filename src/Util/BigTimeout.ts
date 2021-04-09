/**
 * BigTimeout - Class for setting timeouts that are larger than the max allowed for setTimeout.
 */
export class BigTimeout {

    private static readonly max32bit = 2147483647;

    private currentTimer: NodeJS.Timeout | undefined;

    private constructor(
        private readonly callback: () => void,
        private readonly endTime: number
    ) { }

    public static setTimeout(callback: () => void, duration: number): BigTimeout {
        const bigTimeout: BigTimeout = new BigTimeout(callback, duration + BigTimeout.currentTimeMilliseconds());

        bigTimeout.run();
        return bigTimeout;
    }

    private static currentTimeMilliseconds(): number {
        const hrTime: [number, number] = process.hrtime();
        return hrTime[0] * 1000000 + hrTime[1] / 1000;
    }

    public stop(): void {
        if (this.currentTimer !== undefined) {
            clearTimeout(this.currentTimer);
        }
    }

    /**
     * 
     * @param callback 
     * @param days 
     */
    private run(): void {
        const remainingTime: number = this.remaining();

        if (remainingTime <= 0) {
            // Done
            this.callback();
            if (this.currentTimer !== undefined) {
                clearTimeout(this.currentTimer);
            }
            this.currentTimer = undefined;

            return;
        }

        // Run timer in chunks
        const timeout: number = this.getNextTimeoutTime(remainingTime);

        this.currentTimer = setTimeout(() => {
            this.run();
        }, timeout);
    }

    private remaining(): number {
        return this.endTime - BigTimeout.currentTimeMilliseconds();
    }

    /**
     * Get next period length in milliseconds to delay for.
     *
     * The remaining time is passed rather than using the member to avoid issues in regards to time passing between checks and this invocation.
     *
     * @param remainingTime 
     * @returns 
     */
    private getNextTimeoutTime(remainingTime: number): number {
        let timeout: number = 0;
        if (remainingTime >= BigTimeout.max32bit) {
            timeout = BigTimeout.max32bit;
        } else {
            timeout = remainingTime;
        }
        return timeout;
    }
}
