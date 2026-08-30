import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SceneOperations } from '../operations';
/**
 * Registers all MCP prompts exposed by `@pascal-app/mcp`:
 * - `from_brief`                — generate a scene from a natural-language brief
 * - `iterate_on_feedback`       — minimal-diff patches from user feedback
 * - `renovation_from_photos`    — photo-driven renovation plan via vision tools
 */
export declare function registerPrompts(server: McpServer, operations: SceneOperations): void;
//# sourceMappingURL=index.d.ts.map