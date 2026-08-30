import type { SceneGraph } from '@pascal-app/core/clone-scene-graph';
import type { AnyNode, AnyNodeId, AnyNodeType } from '@pascal-app/core/schema';
import type { ActiveSceneMeta, Patch, SceneBridge, ValidationResult } from '../bridge/scene-bridge';
import type { ProjectCreateOptions, ProjectStatus, SceneEvent, SceneEventAppendOptions, SceneEventListOptions, SceneListOptions, SceneMeta, SceneMutateOptions, SceneSaveOptions, SceneStore, SceneWithGraph } from '../storage/types';
export type CreateSceneOperationsOptions = {
    bridge?: SceneBridge;
    store?: SceneStore;
};
export interface SceneOperations {
    readonly hasBridge: boolean;
    readonly hasStore: boolean;
    readonly hasSceneEvents: boolean;
    readonly canAppendSceneEvents: boolean;
    readonly canListSceneEvents: boolean;
    readonly canCreateProject: boolean;
    readonly canGetProjectStatus: boolean;
    readonly storeBackend: SceneStore['backend'] | null;
    setActiveScene(meta: ActiveSceneMeta): void;
    getActiveScene(): ActiveSceneMeta | null;
    clearActiveScene(): void;
    loadDefault(): void;
    setScene(nodes: Record<AnyNodeId, AnyNode>, rootNodeIds: AnyNodeId[]): void;
    exportJSON(): SceneGraph & {
        collections: Record<string, unknown>;
    };
    exportSceneGraph(): SceneGraph;
    loadJSON(json: string | SceneGraph): void;
    getNode(id: AnyNodeId): AnyNode | null;
    getNodes(): Record<AnyNodeId, AnyNode>;
    getRootNodeIds(): AnyNodeId[];
    getChildren(parentId: AnyNodeId): AnyNode[];
    getAncestry(id: AnyNodeId): AnyNode[];
    findNodes(filter: {
        type?: AnyNodeType;
        parentId?: AnyNodeId | null;
        levelId?: AnyNodeId;
    }): AnyNode[];
    resolveLevelId(id: AnyNodeId): AnyNodeId | null;
    createNode(node: AnyNode, parentId?: AnyNodeId): AnyNodeId;
    updateNode(id: AnyNodeId, data: Partial<AnyNode>): void;
    deleteNode(id: AnyNodeId, cascade?: boolean): string[];
    applyPatch(patches: Patch[]): {
        appliedOps: number;
        deletedIds: AnyNodeId[];
        createdIds: AnyNodeId[];
    };
    undo(steps?: number): number;
    redo(steps?: number): number;
    validateScene(): ValidationResult;
    flushDirty(): string[];
    getHistory(): {
        pastCount: number;
        futureCount: number;
    };
    clearHistory(): void;
    createProject(options: ProjectCreateOptions): Promise<ProjectStatus>;
    getProjectStatus(id: string): Promise<ProjectStatus | null>;
    saveScene(options: SceneSaveOptions): Promise<SceneMeta>;
    loadStoredScene(id: string): Promise<SceneWithGraph | null>;
    listScenes(options?: SceneListOptions): Promise<SceneMeta[]>;
    deleteStoredScene(id: string, options?: SceneMutateOptions): Promise<boolean>;
    renameStoredScene(id: string, newName: string, options?: SceneMutateOptions): Promise<SceneMeta>;
    appendSceneEvent(options: SceneEventAppendOptions): Promise<SceneEvent | null>;
    listSceneEvents(id: string, options?: SceneEventListOptions): Promise<SceneEvent[]>;
}
export declare function createSceneOperations(options: CreateSceneOperationsOptions): SceneOperations;
//# sourceMappingURL=scene-operations.d.ts.map