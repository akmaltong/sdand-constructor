import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
/**
 * Throw a structured MCP error. The SDK translates `McpError` into a
 * JSON-RPC error response automatically.
 */
export function throwMcpError(code, message, data) {
    throw new McpError(code, message, data);
}
/**
 * Return a non-throwing tool error payload — used for structured failures that
 * we want the client to see inline in `content` rather than as a protocol
 * error. Sets `isError: true` so SDK clients treat it as a failure.
 */
export function toolError(message, data) {
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({ error: message, ...(data ?? {}) }),
            },
        ],
        isError: true,
    };
}
export { ErrorCode, McpError };
