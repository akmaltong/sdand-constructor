import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
export type HttpTransportHandle = {
    /** Host interface the server is listening on. */
    host: string;
    /** Port the server is actually listening on (useful when caller passed 0). */
    port: number;
    /** Gracefully close the HTTP server and the MCP transport. */
    close(): Promise<void>;
};
export type HttpTransportOptions = {
    /**
     * Network interface to bind. Defaults to loopback. Binding to a non-loopback
     * interface requires an auth token.
     */
    host?: string;
    /** Bearer token for HTTP MCP calls. Defaults to PASCAL_MCP_HTTP_TOKEN. */
    authToken?: string;
    /** Exact CORS origins allowed to call this transport. Loopback origins are allowed. */
    allowedOrigins?: string[];
    /** Per-client request cap per minute. Set <= 0 to disable. */
    rateLimitPerMinute?: number;
};
/**
 * Attach an `McpServer` to a Streamable HTTP transport bound to a local port.
 *
 * Uses the SDK's Node-flavored `StreamableHTTPServerTransport`, which accepts
 * `IncomingMessage`/`ServerResponse` directly via `handleRequest(req, res)`.
 * A new session ID is generated per connection (stateful mode).
 *
 * Listens on `127.0.0.1:<port>` (pass `0` for an ephemeral port in tests). The
 * returned handle exposes the actual bound port and a `close()` that stops
 * the underlying Node HTTP server. To bind a public interface, pass `host` and
 * configure an auth token.
 */
export declare function connectHttp(server: McpServer, port: number, options?: HttpTransportOptions): Promise<HttpTransportHandle>;
//# sourceMappingURL=http.d.ts.map