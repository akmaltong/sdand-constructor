export function createSceneOperations(options) {
    return new SceneOperationsFacade(options);
}
class SceneOperationsFacade {
    #bridge;
    #store;
    constructor(options) {
        this.#bridge = options.bridge;
        this.#store = options.store;
    }
    get hasBridge() {
        return this.#bridge !== undefined;
    }
    get hasStore() {
        return this.#store !== undefined;
    }
    get hasSceneEvents() {
        return this.canAppendSceneEvents && this.canListSceneEvents;
    }
    get canAppendSceneEvents() {
        return typeof this.#store?.appendSceneEvent === 'function';
    }
    get canListSceneEvents() {
        return typeof this.#store?.listSceneEvents === 'function';
    }
    get canCreateProject() {
        return typeof this.#store?.createProject === 'function';
    }
    get canGetProjectStatus() {
        return typeof this.#store?.getProjectStatus === 'function';
    }
    get storeBackend() {
        return this.#store?.backend ?? null;
    }
    setActiveScene(meta) {
        this.requireBridge().setActiveScene(meta);
    }
    getActiveScene() {
        return this.requireBridge().getActiveScene();
    }
    clearActiveScene() {
        this.requireBridge().clearActiveScene();
    }
    loadDefault() {
        this.requireBridge().loadDefault();
    }
    setScene(nodes, rootNodeIds) {
        this.requireBridge().setScene(nodes, rootNodeIds);
    }
    exportJSON() {
        return this.requireBridge().exportJSON();
    }
    exportSceneGraph() {
        const exported = this.exportJSON();
        return {
            nodes: exported.nodes,
            rootNodeIds: exported.rootNodeIds,
            collections: exported.collections,
        };
    }
    loadJSON(json) {
        this.requireBridge().loadJSON(json);
    }
    getNode(id) {
        return this.requireBridge().getNode(id);
    }
    getNodes() {
        return this.requireBridge().getNodes();
    }
    getRootNodeIds() {
        return this.requireBridge().getRootNodeIds();
    }
    getChildren(parentId) {
        return this.requireBridge().getChildren(parentId);
    }
    getAncestry(id) {
        return this.requireBridge().getAncestry(id);
    }
    findNodes(filter) {
        return this.requireBridge().findNodes(filter);
    }
    resolveLevelId(id) {
        return this.requireBridge().resolveLevelId(id);
    }
    createNode(node, parentId) {
        return this.requireBridge().createNode(node, parentId);
    }
    updateNode(id, data) {
        this.requireBridge().updateNode(id, data);
    }
    deleteNode(id, cascade) {
        return this.requireBridge().deleteNode(id, cascade);
    }
    applyPatch(patches) {
        return this.requireBridge().applyPatch(patches);
    }
    undo(steps) {
        return this.requireBridge().undo(steps);
    }
    redo(steps) {
        return this.requireBridge().redo(steps);
    }
    validateScene() {
        return this.requireBridge().validateScene();
    }
    flushDirty() {
        return this.requireBridge().flushDirty();
    }
    getHistory() {
        return this.requireBridge().getHistory();
    }
    clearHistory() {
        this.requireBridge().clearHistory();
    }
    async createProject(options) {
        const store = this.requireStore();
        if (!store.createProject) {
            throw new Error('create_project_unavailable');
        }
        return store.createProject(options);
    }
    async getProjectStatus(id) {
        const store = this.requireStore();
        if (store.getProjectStatus) {
            return store.getProjectStatus(id);
        }
        const scene = await store.load(id);
        if (!scene)
            return null;
        const editorUrl = scene.editorUrl ?? `/editor/${scene.id}`;
        return {
            id: scene.id,
            projectId: scene.projectId ?? scene.id,
            name: scene.name,
            editorUrl,
            url: editorUrl,
            ownerId: scene.ownerId,
            thumbnailUrl: scene.thumbnailUrl,
            publishedVersion: scene.published === false ? null : scene.version,
            latestVersion: scene.version,
            draftVersion: null,
            browserVisibleVersion: scene.version,
            version: scene.version,
            isEmpty: scene.nodeCount === 0,
            sizeBytes: scene.sizeBytes,
            nodeCount: scene.nodeCount,
            graphHash: scene.graphHash ?? null,
            createdAt: scene.createdAt,
            updatedAt: scene.updatedAt,
        };
    }
    async saveScene(options) {
        return this.requireStore().save(options);
    }
    async loadStoredScene(id) {
        return this.requireStore().load(id);
    }
    async listScenes(options) {
        return this.requireStore().list(options);
    }
    async deleteStoredScene(id, options) {
        return this.requireStore().delete(id, options);
    }
    async renameStoredScene(id, newName, options) {
        return this.requireStore().rename(id, newName, options);
    }
    async appendSceneEvent(options) {
        const append = this.requireStore().appendSceneEvent;
        if (!append)
            return null;
        return append(options);
    }
    async listSceneEvents(id, options) {
        const list = this.requireStore().listSceneEvents;
        if (!list) {
            throw new Error('scene_events_unavailable');
        }
        return list(id, options);
    }
    requireBridge() {
        if (!this.#bridge) {
            throw new Error('scene_bridge_unavailable');
        }
        return this.#bridge;
    }
    requireStore() {
        if (!this.#store) {
            throw new Error('scene_store_unavailable');
        }
        return this.#store;
    }
}
