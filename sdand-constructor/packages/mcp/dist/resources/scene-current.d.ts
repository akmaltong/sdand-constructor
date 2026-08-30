import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SceneOperations } from '../operations';
/**
 * `pascal://scene/current` — full `{ nodes, rootNodeIds, collections }` snapshot.
 *
 * Static URI (not a template). MIME `application/json`.
 */
export declare function registerSceneCurrent(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=scene-current.d.ts.map