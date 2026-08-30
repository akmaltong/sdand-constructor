import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SceneOperations } from '../operations';
/**
 * `pascal://constraints/{levelId}` — per-level geometric constraints used as
 * input hints for agents: slab nodes (with polygons/holes/elevation) + each
 * wall's plan-view footprint polygon.
 */
export declare function registerConstraints(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=constraints.d.ts.map