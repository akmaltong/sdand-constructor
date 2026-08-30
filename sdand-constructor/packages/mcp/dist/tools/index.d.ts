import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SceneOperations } from '../operations';
/**
 * Register every non-vision MCP tool against the given server.
 * Vision tools (analyze_floorplan_image, analyze_room_photo) are registered
 * separately via `registerVisionTools` (Agent E).
 *
 * Scene-lifecycle tools (save/load/list/delete/rename scene) are registered
 * when persistence operations are available.
 */
export declare function registerTools(server: McpServer, operations: SceneOperations): void;
//# sourceMappingURL=index.d.ts.map