export type SafeFetchOptions = {
    maxBytes?: number;
    timeoutMs?: number;
    /** Request `Accept` header to send. */
    accept?: string;
};
export type SafeFetchResult = {
    buffer: Buffer;
    contentType: string | null;
    finalUrl: string;
    hops: string[];
};
/**
 * SSRF-safe fetch that follows redirects manually, revalidating the host
 * allowlist + private-IP check on every hop. Throws `McpError` for blocked
 * URLs, non-2xx responses, oversize bodies, or timeouts.
 */
export declare function safeFetch(urlStr: string, opts?: SafeFetchOptions): Promise<SafeFetchResult>;
//# sourceMappingURL=safe-fetch.d.ts.map