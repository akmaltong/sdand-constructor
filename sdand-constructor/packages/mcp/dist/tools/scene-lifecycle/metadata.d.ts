import type { SceneGraph } from '@pascal-app/core/clone-scene-graph';
import type { SceneOperations } from '../../operations';
import type { ProjectStatus, SceneMeta } from '../../storage/types';
export declare function computeGraphHash(graph: SceneGraph): string;
export declare function editorUrlFor(meta: Pick<SceneMeta, 'id' | 'editorUrl' | 'url'>): string;
export declare function sceneMetaPayload(meta: SceneMeta, graph?: SceneGraph): {
    id: string;
    name: string;
    projectId: string | null;
    thumbnailUrl: string | null;
    version: number;
    createdAt: string;
    updatedAt: string;
    ownerId: string | null;
    sizeBytes: number;
    nodeCount: number;
    editorUrl: string;
    url: string;
    published: boolean;
    isDraft: boolean;
    saveMode: import("../../storage").SceneSaveMode;
    graphHash: string | undefined;
};
export declare function projectStatusPayload(status: ProjectStatus, nextStep?: string): {
    nextStep?: string | undefined;
    id: string;
    projectId: string;
    name: string;
    editorUrl: string;
    url: string;
    ownerId: string | null;
    thumbnailUrl: string | null;
    publishedVersion: number | null;
    latestVersion: number | null;
    draftVersion: number | null;
    browserVisibleVersion: number | null;
    version: number;
    isEmpty: boolean;
    sizeBytes: number;
    nodeCount: number;
    graphHash: string | null;
    createdAt: string;
    updatedAt: string;
};
export declare function currentLevelContext(operations: SceneOperations): {
    levelIds: string[];
    defaultLevelId: string | null;
};
//# sourceMappingURL=metadata.d.ts.map