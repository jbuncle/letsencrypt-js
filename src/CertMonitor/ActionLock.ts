/**
 * Class for prevent actions occurring at the same time.
 */
export class ActionLock<T> {


    /**
     * Keys currently being processed (use to prevent asynchronous processing of the same action).
     */
    private readonly inProgressDomains: Record<string, boolean> = {};

    /**
     * Safely perform an action, skipping if an action for the key is already in progress.
     *
     * @param key A unique key for the action to not be done simultaneously
     * @param defaultAction The return value if the action is already in progress
     * @param action The action function to perform
     *
     * @returns The return value from the action callback, or the default action.
     */
    public async performAction(key: string, defaultAction: T, action: () => Promise<T>): Promise<T> {

        if (!this.inProgress(key)) {
            this.inProgressDomains[key] = true;
            try {
                return await action();
            } finally {
                this.inProgressDomains[key] = false;
            }
        }
        return defaultAction;
    }

    private inProgress(commonName: string): boolean {
        if (Object.prototype.hasOwnProperty.call(this.inProgressDomains, commonName) === true) {
            return this.inProgressDomains[commonName];
        }
        return false;
    }

}