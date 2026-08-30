import { SceneBridge } from '../../bridge/scene-bridge';
import { type SceneOperations } from '../../operations';
import { type ProjectCreateOptions, type ProjectStatus, type SceneListOptions, type SceneMeta, type SceneMutateOptions, type SceneSaveOptions, type SceneStore, type SceneWithGraph } from '../../storage/types';
export type StoredTextContent = {
    type: string;
    text: string;
};
export declare function parseToolText(content: StoredTextContent[]): Record<string, unknown>;
export declare function createTestSceneOperations(options?: {
    bridge?: SceneBridge;
    store?: InMemorySceneStore;
}): {
    bridge: SceneBridge;
    store: InMemorySceneStore;
    operations: SceneOperations;
};
/**
 * In-memory `SceneStore` for tests. Backed by a plain `Map` keyed by id.
 * Implements the full interface including optimistic concurrency via
 * `expectedVersion`.
 */
export declare class InMemorySceneStore implements SceneStore {
    readonly backend: "sqlite";
    private readonly data;
    private readonly projects;
    private idCounter;
    private projectCounter;
    createProject(opts: ProjectCreateOptions): Promise<ProjectStatus>;
    getProjectStatus(id: string): Promise<ProjectStatus | null>;
    save(opts: SceneSaveOptions): Promise<SceneMeta>;
    load(id: string): Promise<SceneWithGraph | null>;
    list(opts?: SceneListOptions): Promise<SceneMeta[]>;
    delete(id: string, opts?: SceneMutateOptions): Promise<boolean>;
    rename(id: string, newName: string, opts?: SceneMutateOptions): Promise<SceneMeta>;
    private touchProject;
    private toMeta;
    private toProjectStatus;
}
//# sourceMappingURL=test-utils.d.ts.map