import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SceneOperations } from '../../operations';
/**
 * Register the vision-input tools that defer to the MCP host's sampling
 * capability. No vision model is bundled in this package — if the host does
 * not advertise `sampling` support, calling either tool returns
 * `sampling_unavailable`.
 */
export declare function registerVisionTools(server: McpServer, operations: SceneOperations): void;
export { analyzeFloorplanImageInput, analyzeFloorplanImageOutput, registerAnalyzeFloorplanImage, } from './analyze-floorplan-image';
export { analyzeRoomPhotoInput, analyzeRoomPhotoOutput, registerAnalyzeRoomPhoto, } from './analyze-room-photo';
//# sourceMappingURL=index.d.ts.map