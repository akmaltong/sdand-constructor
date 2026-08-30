import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SceneOperations } from '../operations';
/**
 * `pascal://catalog/items` — small built-in item catalog for standalone MCP.
 *
 * The editor UI owns the full catalog. MCP intentionally keeps a dependency-free
 * subset so headless agents can still place realistic furniture and fixtures.
 */
export declare function registerCatalogItems(server: McpServer, _bridge: SceneOperations): void;
//# sourceMappingURL=catalog-items.d.ts.map