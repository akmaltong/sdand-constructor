import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SceneOperations } from '../../operations';
/**
 * Register the scene-lifecycle MCP tools (`save_scene`, `load_scene`,
 * `list_scenes`, `delete_scene`, `rename_scene`) against the given server.
 * All tools operate against shared scene operations so MCP, REST, and future CLI
 * entry points share the same storage boundary.
 */
export declare function registerSceneLifecycleTools(server: McpServer, operations: SceneOperations): void;
export { createProjectInput, createProjectOutput, registerCreateProject } from './create-project';
export { deleteSceneInput, deleteSceneOutput, registerDeleteScene } from './delete-scene';
export { getProjectStatusInput, getProjectStatusOutput, registerGetProjectStatus, } from './get-project-status';
export { listScenesInput, listScenesOutput, registerListScenes } from './list-scenes';
export { loadSceneInput, loadSceneOutput, registerLoadScene } from './load-scene';
export { registerRenameScene, renameSceneInput, renameSceneOutput } from './rename-scene';
export { registerSaveScene, saveSceneInput, saveSceneOutput } from './save-scene';
//# sourceMappingURL=index.d.ts.map