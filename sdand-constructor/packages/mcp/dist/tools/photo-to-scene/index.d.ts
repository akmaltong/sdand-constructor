import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SceneOperations } from '../../operations';
/**
 * Register the `photo_to_scene` orchestrator tool. Chains the vision
 * (`analyze_floorplan_image`-equivalent sampling call) → SceneGraph
 * synthesis → optional scene save → bridge setScene so callers get a navigable
 * Pascal scene from a single photo upload.
 */
export declare function registerPhotoToSceneTool(server: McpServer, bridge: SceneOperations): void;
export { photoToSceneInput, photoToSceneOutput, registerPhotoToScene, } from './photo-to-scene';
//# sourceMappingURL=index.d.ts.map