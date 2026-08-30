import { type ProjectCreateOptions, type ProjectStatus, type SceneEvent, type SceneEventAppendOptions, type SceneEventListOptions, type SceneListOptions, type SceneMeta, type SceneMutateOptions, type SceneSaveOptions, type SceneStore, type SceneWithGraph } from './types';
export interface SqliteSceneStoreOptions {
    /** Exact SQLite database file path. If omitted, resolved from env. */
    databasePath?: string;
    /** Optional env override for default path and size-limit resolution. */
    env?: NodeJS.ProcessEnv;
    /** Maximum UTF-8 byte length of graph JSON. Defaults to 10 MB. */
    maxSceneBytes?: number;
}
/**
 * Resolves Pascal's local SQLite database path.
 *
 * Precedence:
 * 1. `PASCAL_DB_PATH`
 * 2. `PASCAL_DATA_DIR/pascal.db`
 * 3. On Windows: `%APPDATA%/Pascal/data/pascal.db`
 * 4. `$XDG_DATA_HOME/pascal/data/pascal.db`
 * 5. `$HOME/.pascal/data/pascal.db`
 */
export declare function resolveDefaultDatabasePath(env?: NodeJS.ProcessEnv): string;
/**
 * SQLite-backed implementation of `SceneStore`.
 *
 * Uses one local database file, WAL mode, and transaction-scoped version checks
 * so a local editor and MCP process can safely share scenes on one machine.
 */
export declare class SqliteSceneStore implements SceneStore {
    readonly backend: "sqlite";
    readonly databasePath: string;
    private readonly maxSceneBytes;
    private readonly projectPlaceholders;
    private db;
    private dbPromise;
    constructor(opts?: SqliteSceneStoreOptions);
    createProject(opts: ProjectCreateOptions): Promise<ProjectStatus>;
    getProjectStatus(id: string): Promise<ProjectStatus | null>;
    save(opts: SceneSaveOptions): Promise<SceneMeta>;
    load(id: string): Promise<SceneWithGraph | null>;
    list(opts?: SceneListOptions): Promise<SceneMeta[]>;
    delete(id: string, opts?: SceneMutateOptions): Promise<boolean>;
    rename(id: string, newName: string, opts?: SceneMutateOptions): Promise<SceneMeta>;
    appendSceneEvent(opts: SceneEventAppendOptions): Promise<SceneEvent>;
    listSceneEvents(sceneId: string, opts?: SceneEventListOptions): Promise<SceneEvent[]>;
    close(): void;
    private database;
    private migrate;
    private withWriteTransaction;
    private getRow;
    private generateUniqueId;
}
//# sourceMappingURL=sqlite-scene-store.d.ts.map