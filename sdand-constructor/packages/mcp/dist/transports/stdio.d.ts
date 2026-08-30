import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
/**
 * Attach an `McpServer` to the stdio transport.
 *
 * The server takes ownership of stdin/stdout for JSON-RPC messaging. Callers
 * must send any operator logging to stderr (not stdout) to avoid corrupting
 * the protocol stream.
 *
 * Resolves once the transport is started. The underlying transport keeps the
 * process alive as long as stdin is open, so callers typically just `await`
 * this and then let the event loop run.
 */
export declare function connectStdio(server: McpServer): Promise<void>;
//# sourceMappingURL=stdio.d.ts.map