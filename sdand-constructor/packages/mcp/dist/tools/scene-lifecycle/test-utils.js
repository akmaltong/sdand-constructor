import { SceneBridge } from '../../bridge/scene-bridge';
import { createSceneOperations } from '../../operations';
import { SceneNotFoundError, SceneVersionConflictError, } from '../../storage/types';
import { computeGraphHash, editorUrlFor } from './metadata';
export function parseToolText(content) {
    return JSON.parse(content[0].text);
}
export function createTestSceneOperations(options) {
    const bridge = options?.bridge ?? new SceneBridge();
    const store = options?.store ?? new InMemorySceneStore();
    const operations = createSceneOperations({ bridge, store });
    return { bridge, store, operations };
}
/**
 * In-memory `SceneStore` for tests. Backed by a plain `Map` keyed by id.
 * Implements the full interface including optimistic concurrency via
 * `expectedVersion`.
 */
export class InMemorySceneStore {
    backend = 'sqlite';
    data = new Map();
    projects = new Map();
    idCounter = 0;
    projectCounter = 0;
    async createProject(opts) {
        const id = opts.id ?? `project_${++this.projectCounter}`;
        const now = new Date().toISOString();
        this.projects.set(id, {
            id,
            name: opts.name,
            ownerId: opts.ownerId ?? null,
            isPrivate: opts.isPrivate ?? true,
            thumbnailUrl: null,
            createdAt: now,
            updatedAt: now,
        });
        return this.toProjectStatus(id);
    }
    async getProjectStatus(id) {
        if (!(this.projects.has(id) || this.data.has(id)))
            return null;
        return this.toProjectStatus(id);
    }
    async save(opts) {
        const existing = opts.id ? this.data.get(opts.id) : undefined;
        if (existing) {
            if (opts.expectedVersion !== undefined && existing.version !== opts.expectedVersion) {
                throw new SceneVersionConflictError(`Expected version ${opts.expectedVersion}, have ${existing.version}`);
            }
            const now = new Date().toISOString();
            const nodeCount = Object.keys(opts.graph.nodes ?? {}).length;
            const serialized = JSON.stringify(opts.graph);
            const updated = {
                id: existing.id,
                name: opts.name,
                projectId: opts.projectId ?? existing.projectId,
                thumbnailUrl: opts.thumbnailUrl ?? existing.thumbnailUrl,
                version: existing.version + 1,
                createdAt: existing.createdAt,
                updatedAt: now,
                ownerId: opts.ownerId ?? existing.ownerId,
                sizeBytes: serialized.length,
                nodeCount,
                editorUrl: existing.editorUrl ?? `/editor/${existing.id}`,
                url: existing.url ?? `/editor/${existing.id}`,
                published: true,
                graphHash: computeGraphHash(opts.graph),
                graph: opts.graph,
            };
            this.data.set(existing.id, updated);
            this.touchProject(existing.id, opts.name, updated.updatedAt);
            return this.toMeta(updated);
        }
        if (opts.expectedVersion !== undefined) {
            throw new SceneVersionConflictError('Cannot pass expectedVersion for a new scene');
        }
        const id = opts.id ?? `scene_${++this.idCounter}`;
        const now = new Date().toISOString();
        const serialized = JSON.stringify(opts.graph);
        const nodeCount = Object.keys(opts.graph.nodes ?? {}).length;
        const record = {
            id,
            name: opts.name,
            projectId: opts.projectId ?? (this.projects.has(id) ? id : null),
            thumbnailUrl: opts.thumbnailUrl ?? null,
            version: 1,
            createdAt: now,
            updatedAt: now,
            ownerId: opts.ownerId ?? null,
            sizeBytes: serialized.length,
            nodeCount,
            editorUrl: `/editor/${id}`,
            url: `/editor/${id}`,
            published: true,
            graphHash: computeGraphHash(opts.graph),
            graph: opts.graph,
        };
        this.data.set(id, record);
        this.touchProject(id, opts.name, now);
        return this.toMeta(record);
    }
    async load(id) {
        const rec = this.data.get(id);
        if (!rec)
            return null;
        return {
            ...rec,
            graph: JSON.parse(JSON.stringify(rec.graph)),
        };
    }
    async list(opts) {
        let scenes = Array.from(this.data.values()).map((r) => this.toMeta(r));
        if (opts?.projectId !== undefined) {
            scenes = scenes.filter((s) => s.projectId === opts.projectId);
        }
        if (opts?.ownerId !== undefined) {
            scenes = scenes.filter((s) => s.ownerId === opts.ownerId);
        }
        scenes.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
        if (opts?.limit !== undefined)
            scenes = scenes.slice(0, opts.limit);
        return scenes;
    }
    async delete(id, opts) {
        const rec = this.data.get(id);
        if (!rec)
            throw new SceneNotFoundError(`Scene ${id} not found`);
        if (opts?.expectedVersion !== undefined && rec.version !== opts.expectedVersion) {
            throw new SceneVersionConflictError(`Expected version ${opts.expectedVersion}, have ${rec.version}`);
        }
        return this.data.delete(id);
    }
    async rename(id, newName, opts) {
        const rec = this.data.get(id);
        if (!rec)
            throw new SceneNotFoundError(`Scene ${id} not found`);
        if (opts?.expectedVersion !== undefined && rec.version !== opts.expectedVersion) {
            throw new SceneVersionConflictError(`Expected version ${opts.expectedVersion}, have ${rec.version}`);
        }
        const updated = {
            ...rec,
            name: newName,
            version: rec.version + 1,
            updatedAt: new Date().toISOString(),
        };
        this.data.set(id, updated);
        this.touchProject(id, newName, updated.updatedAt);
        return this.toMeta(updated);
    }
    touchProject(id, name, updatedAt) {
        const existing = this.projects.get(id);
        if (existing) {
            this.projects.set(id, { ...existing, name, updatedAt });
            return;
        }
        this.projects.set(id, {
            id,
            name,
            ownerId: null,
            isPrivate: true,
            thumbnailUrl: null,
            createdAt: updatedAt,
            updatedAt,
        });
    }
    toMeta(rec) {
        const editorUrl = editorUrlFor(rec);
        return {
            id: rec.id,
            name: rec.name,
            projectId: rec.projectId,
            thumbnailUrl: rec.thumbnailUrl,
            version: rec.version,
            createdAt: rec.createdAt,
            updatedAt: rec.updatedAt,
            ownerId: rec.ownerId,
            sizeBytes: rec.sizeBytes,
            nodeCount: rec.nodeCount,
            editorUrl,
            url: editorUrl,
            published: rec.published ?? true,
            graphHash: rec.graphHash ?? computeGraphHash(rec.graph),
        };
    }
    toProjectStatus(id) {
        const project = this.projects.get(id);
        const scene = this.data.get(id);
        const now = new Date().toISOString();
        const editorUrl = `/editor/${id}`;
        return {
            id,
            projectId: id,
            name: scene?.name ?? project?.name ?? id,
            editorUrl,
            url: editorUrl,
            ownerId: scene?.ownerId ?? project?.ownerId ?? null,
            thumbnailUrl: scene?.thumbnailUrl ?? project?.thumbnailUrl ?? null,
            publishedVersion: scene?.version ?? null,
            latestVersion: scene?.version ?? null,
            draftVersion: null,
            browserVisibleVersion: scene?.version ?? null,
            version: scene?.version ?? 0,
            isEmpty: !scene || scene.nodeCount === 0,
            sizeBytes: scene?.sizeBytes ?? 0,
            nodeCount: scene?.nodeCount ?? 0,
            graphHash: scene?.graphHash ?? (scene ? computeGraphHash(scene.graph) : null),
            createdAt: scene?.createdAt ?? project?.createdAt ?? now,
            updatedAt: scene?.updatedAt ?? project?.updatedAt ?? now,
        };
    }
}
