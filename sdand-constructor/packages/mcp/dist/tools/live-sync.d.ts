import type { SceneGraph } from '@pascal-app/core/clone-scene-graph';
import type { SceneOperations } from '../operations';
export declare function syncDerivedStairOpenings(operations: SceneOperations): number;
/**
 * Persist the bridge's current graph to the active scene and append a live
 * event for browser subscribers. No-ops when the MCP session is not currently
 * bound to a saved scene.
 */
export declare function publishLiveSceneSnapshot(operations: SceneOperations, kind: string): Promise<void>;
export declare function appendLiveSceneEvent(operations: SceneOperations, sceneId: string, version: number, kind: string, graph: SceneGraph): Promise<void>;
//# sourceMappingURL=live-sync.d.ts.map