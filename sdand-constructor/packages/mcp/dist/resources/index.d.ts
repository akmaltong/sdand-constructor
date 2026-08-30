import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SceneOperations } from '../operations';
/**
 * Registers all MCP resources exposed by `@pascal-app/mcp`.
 *
 * Resources:
 * - `pascal://scene/current`          — application/json, full snapshot
 * - `pascal://scene/current/summary`  — text/markdown, human summary
 * - `pascal://catalog/items`          — application/json, host-supplied catalog
 * - `pascal://constraints/{levelId}`  — application/json, per-level constraints
 * - `pascal://agent-guide`            — text/markdown, MCP-first agent guide
 * - `pascal://agent/guide`            — text/markdown, legacy alias
 */
export declare function registerResources(server: McpServer, operations: SceneOperations): void;
//# sourceMappingURL=index.d.ts.map