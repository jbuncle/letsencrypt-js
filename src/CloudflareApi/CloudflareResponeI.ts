export interface CloudflareResponseI<T> {
    success: boolean;
    errors: string[];
    messages: string[];
    result: T;
}
