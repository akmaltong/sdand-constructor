'use client';
import { temporal } from 'zundo';
import { create } from 'zustand';
import { BuildingNode } from '../schema';
import { generateCollectionId } from '../schema/collections';
import { DoorNode as DoorNodeSchema } from '../schema/nodes/door';
import { ElevatorNode as ElevatorNodeSchema } from '../schema/nodes/elevator';
import { LevelNode } from '../schema/nodes/level';
import { getPitchFromActiveRoofHeight, } from '../schema/nodes/roof-segment';
import { ShelfNode as ShelfNodeSchema } from '../schema/nodes/shelf';
import { SiteNode } from '../schema/nodes/site';
import { StairNode as StairNodeSchema } from '../schema/nodes/stair';
import { StairSegmentNode as StairSegmentNodeSchema } from '../schema/nodes/stair-segment';
import * as nodeActions from './actions/node-actions';
import { resetSceneHistoryPauseDepth } from './history-control';
function getFiniteNumber(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function getFiniteNumberInRange(value, fallback, min, max) {
    const finite = getFiniteNumber(value, fallback);
    return Math.min(Math.max(finite, min), max);
}
function getBoolean(value, fallback) {
    return typeof value === 'boolean' ? value : fallback;
}
function getEnumValue(value, allowed, fallback) {
    return typeof value === 'string' && allowed.includes(value) ? value : fallback;
}
function getNullableString(value) {
    return typeof value === 'string' && value.length > 0 ? value : null;
}
function getStringArray(value) {
    return Array.isArray(value)
        ? value.filter((entry) => typeof entry === 'string')
        : [];
}
function getVector3(value, fallback) {
    if (!Array.isArray(value) || value.length < 3) {
        return fallback;
    }
    return [
        getFiniteNumber(value[0], fallback[0]),
        getFiniteNumber(value[1], fallback[1]),
        getFiniteNumber(value[2], fallback[2]),
    ];
}
function normalizeStairNode(node) {
    const sanitized = {
        ...node,
        position: getVector3(node.position, [0, 0, 0]),
        rotation: getFiniteNumber(node.rotation, 0),
        stairType: getEnumValue(node.stairType, ['straight', 'curved', 'spiral'], 'straight'),
        fromLevelId: getNullableString(node.fromLevelId),
        toLevelId: getNullableString(node.toLevelId),
        slabOpeningMode: getEnumValue(node.slabOpeningMode, ['none', 'destination'], 'none'),
        openingOffset: getFiniteNumber(node.openingOffset, 0),
        width: getFiniteNumber(node.width, 1),
        totalRise: getFiniteNumber(node.totalRise, 2.5),
        stepCount: getFiniteNumber(node.stepCount, 10),
        thickness: getFiniteNumber(node.thickness, 0.25),
        fillToFloor: getBoolean(node.fillToFloor, true),
        innerRadius: getFiniteNumber(node.innerRadius, 0.9),
        sweepAngle: getFiniteNumber(node.sweepAngle, Math.PI / 2),
        topLandingMode: getEnumValue(node.topLandingMode, ['none', 'integrated'], 'none'),
        topLandingDepth: getFiniteNumber(node.topLandingDepth, 0.9),
        showCenterColumn: getBoolean(node.showCenterColumn, true),
        showStepSupports: getBoolean(node.showStepSupports, true),
        railingMode: getEnumValue(node.railingMode, ['none', 'left', 'right', 'both'], 'none'),
        railingHeight: getFiniteNumber(node.railingHeight, 0.92),
        children: getStringArray(node.children),
    };
    const parsed = StairNodeSchema.safeParse(sanitized);
    return parsed.success ? parsed.data : null;
}
function normalizeStairSegmentNode(node) {
    const sanitized = {
        ...node,
        position: getVector3(node.position, [0, 0, 0]),
        rotation: getFiniteNumber(node.rotation, 0),
        segmentType: getEnumValue(node.segmentType, ['stair', 'landing'], 'stair'),
        width: getFiniteNumber(node.width, 1),
        length: getFiniteNumber(node.length, 3),
        height: getFiniteNumber(node.height, 2.5),
        stepCount: getFiniteNumber(node.stepCount, 10),
        attachmentSide: getEnumValue(node.attachmentSide, ['front', 'left', 'right'], 'front'),
        fillToFloor: getBoolean(node.fillToFloor, true),
        thickness: getFiniteNumber(node.thickness, 0.25),
    };
    const parsed = StairSegmentNodeSchema.safeParse(sanitized);
    return parsed.success ? parsed.data : null;
}
function normalizeDoorNode(node) {
    const parsed = DoorNodeSchema.safeParse(node);
    return parsed.success ? { ...node, ...parsed.data } : null;
}
function normalizeShelfNode(node) {
    const sanitized = {
        ...node,
        children: getStringArray(node.children),
        position: getVector3(node.position, [0, 0, 0]),
        rotation: getVector3(node.rotation, [0, 0, 0]),
        width: getFiniteNumberInRange(node.width, 1.2, 0.3, 3.0),
        depth: getFiniteNumberInRange(node.depth, 0.3, 0.1, 1.0),
        thickness: getFiniteNumberInRange(node.thickness, 0.04, 0.01, 0.1),
        height: getFiniteNumberInRange(node.height, 0.9, 0.05, 2.5),
        rows: Math.round(getFiniteNumberInRange(node.rows, 1, 1, 8)),
        columns: Math.round(getFiniteNumberInRange(node.columns, 1, 1, 6)),
        style: getEnumValue(node.style, ['wall-shelf', 'bookshelf', 'open-rack', 'cubby'], 'wall-shelf'),
        withBack: getBoolean(node.withBack, false),
        withSides: getBoolean(node.withSides, true),
        withBottom: getBoolean(node.withBottom, false),
        bracketStyle: getEnumValue(node.bracketStyle, ['minimal', 'industrial', 'hidden'], 'minimal'),
    };
    const parsed = ShelfNodeSchema.safeParse(sanitized);
    return parsed.success ? parsed.data : null;
}
function normalizeElevatorNode(node) {
    const sanitized = {
        ...node,
        position: getVector3(node.position, [0, 0, 0]),
        rotation: getFiniteNumber(node.rotation, 0),
        width: getFiniteNumber(node.width, 1.84),
        depth: getFiniteNumber(node.depth, 1.84),
        shaftWidth: node.shaftWidth === undefined ? undefined : getFiniteNumber(node.shaftWidth, 1.84),
        shaftDepth: node.shaftDepth === undefined ? undefined : getFiniteNumber(node.shaftDepth, 1.84),
        shaftWallThickness: getFiniteNumber(node.shaftWallThickness, 0.09),
        cabHeight: getFiniteNumber(node.cabHeight, 2.35),
        doorWidth: getFiniteNumber(node.doorWidth, 0.95),
        doorHeight: getFiniteNumber(node.doorHeight, 2.1),
        fromLevelId: getNullableString(node.fromLevelId),
        toLevelId: getNullableString(node.toLevelId),
        servedLevelIds: node.servedLevelIds === undefined ? undefined : getStringArray(node.servedLevelIds),
        disabledLevelIds: getStringArray(node.disabledLevelIds),
        serviceOnlyLevelIds: getStringArray(node.serviceOnlyLevelIds),
        defaultLevelId: getNullableString(node.defaultLevelId),
        speed: getFiniteNumber(node.speed, 2.2),
        doorDurationMs: getFiniteNumber(node.doorDurationMs, 900),
        dwellMs: getFiniteNumber(node.dwellMs, 1400),
    };
    const parsed = ElevatorNodeSchema.safeParse(sanitized);
    return parsed.success ? parsed.data : null;
}
function findBuildingIdForLevel(levelId, nodes) {
    const level = nodes[levelId];
    const directBuildingId = typeof level?.parentId === 'string' ? level.parentId : null;
    if (directBuildingId && nodes[directBuildingId]?.type === 'building') {
        return directBuildingId;
    }
    for (const [candidateId, candidate] of Object.entries(nodes)) {
        if (candidate?.type !== 'building')
            continue;
        if (getStringArray(candidate.children).includes(levelId)) {
            return candidateId;
        }
    }
    return null;
}
function migrateElevatorParent(id, node, nodes) {
    const parentId = typeof node.parentId === 'string' ? node.parentId : null;
    if (!parentId)
        return node;
    const parent = parentId ? nodes[parentId] : null;
    if (parent?.type !== 'level')
        return node;
    const buildingId = findBuildingIdForLevel(parentId, nodes);
    if (!buildingId)
        return node;
    const building = buildingId ? nodes[buildingId] : null;
    if (building?.type !== 'building')
        return node;
    nodes[parentId] = {
        ...parent,
        children: getStringArray(parent.children).filter((childId) => childId !== id),
    };
    const buildingChildren = getStringArray(building.children);
    nodes[buildingId] = {
        ...building,
        children: buildingChildren.includes(id) ? buildingChildren : [...buildingChildren, id],
    };
    return {
        ...node,
        parentId: buildingId,
    };
}
function migrateWallSurfaceMaterials(node) {
    const hasInterior = node.interiorMaterial !== undefined || typeof node.interiorMaterialPreset === 'string';
    const hasExterior = node.exteriorMaterial !== undefined || typeof node.exteriorMaterialPreset === 'string';
    const legacyFinish = {
        material: node.material,
        materialPreset: typeof node.materialPreset === 'string' ? node.materialPreset : undefined,
    };
    if (!(hasInterior || hasExterior)) {
        if (legacyFinish.material === undefined && legacyFinish.materialPreset === undefined) {
            return node;
        }
        return {
            ...node,
            interiorMaterial: legacyFinish.material,
            interiorMaterialPreset: legacyFinish.materialPreset,
            exteriorMaterial: legacyFinish.material,
            exteriorMaterialPreset: legacyFinish.materialPreset,
        };
    }
    if (!hasInterior) {
        return {
            ...node,
            interiorMaterial: node.exteriorMaterial,
            interiorMaterialPreset: node.exteriorMaterialPreset,
        };
    }
    if (!hasExterior) {
        return {
            ...node,
            exteriorMaterial: node.interiorMaterial,
            exteriorMaterialPreset: node.interiorMaterialPreset,
        };
    }
    return node;
}
function migrateStairSurfaceMaterials(node) {
    const hasRailing = node.railingMaterial !== undefined || typeof node.railingMaterialPreset === 'string';
    const hasTread = node.treadMaterial !== undefined || typeof node.treadMaterialPreset === 'string';
    const hasSide = node.sideMaterial !== undefined || typeof node.sideMaterialPreset === 'string';
    const legacyFinish = {
        material: node.material,
        materialPreset: typeof node.materialPreset === 'string' ? node.materialPreset : undefined,
    };
    const resolveBodyFallback = () => {
        if (node.treadMaterial !== undefined || typeof node.treadMaterialPreset === 'string') {
            return {
                material: node.treadMaterial,
                materialPreset: typeof node.treadMaterialPreset === 'string' ? node.treadMaterialPreset : undefined,
            };
        }
        if (node.sideMaterial !== undefined || typeof node.sideMaterialPreset === 'string') {
            return {
                material: node.sideMaterial,
                materialPreset: typeof node.sideMaterialPreset === 'string' ? node.sideMaterialPreset : undefined,
            };
        }
        return legacyFinish;
    };
    if (!(hasRailing || hasTread || hasSide)) {
        if (legacyFinish.material === undefined && legacyFinish.materialPreset === undefined) {
            return node;
        }
        return {
            ...node,
            railingMaterial: legacyFinish.material,
            railingMaterialPreset: legacyFinish.materialPreset,
            treadMaterial: legacyFinish.material,
            treadMaterialPreset: legacyFinish.materialPreset,
            sideMaterial: legacyFinish.material,
            sideMaterialPreset: legacyFinish.materialPreset,
        };
    }
    const next = { ...node };
    if (!hasTread) {
        const fallback = node.sideMaterial !== undefined || typeof node.sideMaterialPreset === 'string'
            ? {
                material: node.sideMaterial,
                materialPreset: typeof node.sideMaterialPreset === 'string' ? node.sideMaterialPreset : undefined,
            }
            : resolveBodyFallback();
        next.treadMaterial = fallback.material;
        next.treadMaterialPreset = fallback.materialPreset;
    }
    if (!hasSide) {
        const fallback = node.treadMaterial !== undefined || typeof node.treadMaterialPreset === 'string'
            ? {
                material: node.treadMaterial,
                materialPreset: typeof node.treadMaterialPreset === 'string' ? node.treadMaterialPreset : undefined,
            }
            : resolveBodyFallback();
        next.sideMaterial = fallback.material;
        next.sideMaterialPreset = fallback.materialPreset;
    }
    if (!hasRailing) {
        const fallback = resolveBodyFallback();
        next.railingMaterial = fallback.material;
        next.railingMaterialPreset = fallback.materialPreset;
    }
    return next;
}
function migrateRoofSurfaceMaterials(node) {
    const hasTop = node.topMaterial !== undefined || typeof node.topMaterialPreset === 'string';
    const hasEdge = node.edgeMaterial !== undefined || typeof node.edgeMaterialPreset === 'string';
    const hasWall = node.wallMaterial !== undefined || typeof node.wallMaterialPreset === 'string';
    const legacyFinish = {
        material: node.material,
        materialPreset: typeof node.materialPreset === 'string' ? node.materialPreset : undefined,
    };
    if (!(hasTop || hasEdge || hasWall)) {
        if (legacyFinish.material === undefined && legacyFinish.materialPreset === undefined) {
            return node;
        }
        return {
            ...node,
            topMaterial: legacyFinish.material,
            topMaterialPreset: legacyFinish.materialPreset,
            edgeMaterial: legacyFinish.material,
            edgeMaterialPreset: legacyFinish.materialPreset,
            wallMaterial: legacyFinish.material,
            wallMaterialPreset: legacyFinish.materialPreset,
        };
    }
    const next = { ...node };
    if (!hasTop) {
        next.topMaterial = legacyFinish.material;
        next.topMaterialPreset = legacyFinish.materialPreset;
    }
    if (!hasEdge) {
        if (node.wallMaterial !== undefined || typeof node.wallMaterialPreset === 'string') {
            next.edgeMaterial = node.wallMaterial;
            next.edgeMaterialPreset =
                typeof node.wallMaterialPreset === 'string' ? node.wallMaterialPreset : undefined;
        }
        else {
            next.edgeMaterial = legacyFinish.material;
            next.edgeMaterialPreset = legacyFinish.materialPreset;
        }
    }
    if (!hasWall) {
        if (node.edgeMaterial !== undefined || typeof node.edgeMaterialPreset === 'string') {
            next.wallMaterial = node.edgeMaterial;
            next.wallMaterialPreset =
                typeof node.edgeMaterialPreset === 'string' ? node.edgeMaterialPreset : undefined;
        }
        else {
            next.wallMaterial = legacyFinish.material;
            next.wallMaterialPreset = legacyFinish.materialPreset;
        }
    }
    return next;
}
function migrateNodes(nodes) {
    const patchedNodes = { ...nodes };
    for (const [id, node] of Object.entries(patchedNodes)) {
        // 1. Item scale migration
        if (node.type === 'item' && !('scale' in node)) {
            patchedNodes[id] = { ...node, scale: [1, 1, 1] };
        }
        // 2. Old roof to new roof + segment migration
        if (node.type === 'roof' && !('children' in node)) {
            const oldRoof = node;
            const suffix = id.includes('_') ? id.split('_')[1] : Math.random().toString(36).slice(2);
            const segmentId = `rseg_${suffix}`;
            const segWidth = oldRoof.length ?? 8;
            const segDepth = (oldRoof.leftWidth ?? 2.2) + (oldRoof.rightWidth ?? 2.2);
            const legacyRoofHeight = oldRoof.height ?? 2.5;
            const segment = {
                object: 'node',
                id: segmentId,
                type: 'roof-segment',
                parentId: id,
                visible: oldRoof.visible ?? true,
                metadata: {},
                position: [0, 0, 0],
                rotation: 0,
                roofType: 'gable',
                width: segWidth,
                depth: segDepth,
                // Schema default (0.5), NOT 0: a zero-height wall builds a flat,
                // degenerate CSG brush → "Coplanar clip not handled" + NaN geometry, so
                // the migrated legacy roof never renders. New roofs use 0.5 too.
                wallHeight: 0.5,
                pitch: getPitchFromActiveRoofHeight({
                    roofType: 'gable',
                    width: segWidth,
                    depth: segDepth,
                    roofHeight: legacyRoofHeight,
                }),
                wallThickness: 0.1,
                deckThickness: 0.1,
                overhang: 0.3,
                shingleThickness: 0.05,
            };
            patchedNodes[segmentId] = segment;
            patchedNodes[id] = {
                ...oldRoof,
                children: [segmentId],
            };
        }
        // 2b. roof-segment: guarantee a valid positive pitch (degrees).
        // Saved scenes wrote `roofHeight` in metres; the schema now stores `pitch`
        // in degrees. Convert the legacy field when present, and — crucially — fall
        // back to the schema default for any segment that carries no usable pitch or
        // roofHeight (older/partial saves). Without this, the slope-frame guard
        // resolves a missing pitch to a FLAT frame, so the roof renders as a slab.
        // The migration result is cast, not zod-parsed, so the schema default never
        // applies on its own — this branch is the only place it lands.
        if (node.type === 'roof-segment') {
            const currentPitch = node.pitch;
            const hasValidPitch = typeof currentPitch === 'number' && currentPitch > 0;
            if (!hasValidPitch) {
                const { roofHeight, ...rest } = node;
                const width = typeof node.width === 'number' ? node.width : 8;
                const depth = typeof node.depth === 'number' ? node.depth : 6;
                const roofType = (typeof node.roofType === 'string' ? node.roofType : 'gable');
                const derived = typeof roofHeight === 'number' && roofHeight > 0
                    ? getPitchFromActiveRoofHeight({ roofType, width, depth, roofHeight })
                    : 0;
                // 40° matches the RoofSegmentNode schema default.
                patchedNodes[id] = { ...rest, pitch: derived > 0 ? derived : 40 };
            }
        }
        if (node.type === 'door') {
            const normalized = normalizeDoorNode(node);
            if (normalized) {
                patchedNodes[id] = normalized;
            }
        }
        if (node.type === 'stair') {
            const normalized = normalizeStairNode(migrateStairSurfaceMaterials(node));
            if (normalized) {
                patchedNodes[id] = normalized;
            }
        }
        if (node.type === 'stair-segment') {
            const normalized = normalizeStairSegmentNode(node);
            if (normalized) {
                patchedNodes[id] = normalized;
            }
        }
        if (node.type === 'wall') {
            patchedNodes[id] = migrateWallSurfaceMaterials(patchedNodes[id]);
        }
        if (node.type === 'shelf') {
            const normalized = normalizeShelfNode(node);
            if (normalized) {
                patchedNodes[id] = normalized;
            }
        }
        if (node.type === 'elevator') {
            const parentMigrated = migrateElevatorParent(id, node, patchedNodes);
            const normalized = normalizeElevatorNode(parentMigrated);
            if (normalized) {
                patchedNodes[id] = normalized;
            }
        }
        // Roof-segment hosting was added in this migration cycle (the same
        // pattern as shelf above). Older segments saved before the schema
        // gained `children` need the field initialised so
        // `createNode(chimney, segmentId)` finds an array to append to —
        // without this every "Add Element" click on the roof panel results
        // in an orphaned accessory (parented in scene state but never
        // appended to `seg.children`, so the renderer's recursive
        // `<NodeRenderer>` mount never sees it).
        if (node.type === 'roof-segment' && !Array.isArray(node.children)) {
            patchedNodes[id] = { ...node, children: [] };
        }
        if (node.type === 'roof') {
            patchedNodes[id] = migrateRoofSurfaceMaterials(patchedNodes[id]);
        }
        // Legacy: site.children used to hold nested BuildingNode / ItemNode
        // objects (see the SiteNode schema before the children-as-ids fix).
        // Flatten any leftover nested children into ids, and absorb the
        // embedded nodes into the flat map so the rest of the loader can
        // treat the site like every other parent.
        if (node.type === 'site' && Array.isArray(node.children)) {
            let needsFlatten = false;
            const flattened = [];
            for (const child of node.children) {
                if (typeof child === 'string') {
                    flattened.push(child);
                }
                else if (child && typeof child === 'object' && typeof child.id === 'string') {
                    needsFlatten = true;
                    flattened.push(child.id);
                    if (!patchedNodes[child.id]) {
                        patchedNodes[child.id] = { ...child, parentId: id };
                    }
                }
            }
            if (needsFlatten) {
                patchedNodes[id] = { ...node, children: flattened };
            }
        }
    }
    return patchedNodes;
}
function getNodeChildIds(node) {
    if (!('children' in node && Array.isArray(node.children))) {
        return [];
    }
    return node.children
        .map((child) => {
        if (typeof child === 'string')
            return child;
        if (child && typeof child === 'object' && 'id' in child && typeof child.id === 'string') {
            return child.id;
        }
        return null;
    })
        .filter((id) => typeof id === 'string');
}
function normalizeRootNodeIds(nodes, rootNodeIds) {
    const existingRootIds = rootNodeIds.filter((id) => Boolean(nodes[id]));
    const siteRootIds = existingRootIds.filter((id) => nodes[id]?.type === 'site');
    if (siteRootIds.length > 0) {
        return siteRootIds;
    }
    return existingRootIds.filter((id) => nodes[id]?.parentId === null);
}
function collectReachableNodeIds(nodes, rootNodeIds) {
    const reachable = new Set();
    const stack = [...rootNodeIds];
    const childIdsByParentId = new Map();
    for (const node of Object.values(nodes)) {
        if (!node.parentId)
            continue;
        const parentId = node.parentId;
        const children = childIdsByParentId.get(parentId) ?? [];
        children.push(node.id);
        childIdsByParentId.set(parentId, children);
    }
    while (stack.length > 0) {
        const id = stack.pop();
        if (!id || reachable.has(id))
            continue;
        const node = nodes[id];
        if (!node)
            continue;
        reachable.add(id);
        stack.push(...getNodeChildIds(node));
        stack.push(...(childIdsByParentId.get(id) ?? []));
    }
    return reachable;
}
const useScene = create()(temporal((set, get) => ({
    // 1. Flat dictionary of all nodes
    nodes: {},
    // 2. Root node IDs
    rootNodeIds: [],
    // 3. Dirty set
    dirtyNodes: new Set(),
    // 4. Collections
    collections: {},
    // 5. Read-only lock
    readOnly: false,
    setReadOnly: (readOnly) => set({ readOnly }),
    unloadScene: () => {
        set({
            nodes: {},
            rootNodeIds: [],
            dirtyNodes: new Set(),
            collections: {},
        });
    },
    clearScene: () => {
        get().unloadScene();
        get().loadScene(); // Default scene
    },
    setScene: (nodes, rootNodeIds) => {
        // Apply backward compatibility migrations
        const patchedNodes = migrateNodes(nodes);
        // Remove orphans: nodes whose parentId points to a non-existent node
        const cleanedNodes = { ...patchedNodes };
        for (const node of Object.values(cleanedNodes)) {
            if (node.parentId && !cleanedNodes[node.parentId]) {
                console.warn('[Scene] Removing orphan node', node.id, '(parentId', node.parentId, 'not found)');
                delete cleanedNodes[node.id];
            }
        }
        set({
            nodes: cleanedNodes,
            rootNodeIds,
            dirtyNodes: new Set(),
            collections: {},
        });
        const normalizedRootNodeIds = normalizeRootNodeIds(cleanedNodes, rootNodeIds);
        const reachableNodeIds = collectReachableNodeIds(cleanedNodes, normalizedRootNodeIds);
        if (normalizedRootNodeIds.length > 0) {
            for (const node of Object.values(cleanedNodes)) {
                if (reachableNodeIds.has(node.id))
                    continue;
                console.warn('[Scene] Removing unreachable node', node.id);
                delete cleanedNodes[node.id];
            }
        }
        set({
            nodes: cleanedNodes,
            rootNodeIds: normalizedRootNodeIds,
            dirtyNodes: new Set(),
            collections: {},
        });
        // Mark all nodes as dirty to trigger re-validation
        Object.values(cleanedNodes).forEach((node) => {
            get().markDirty(node.id);
        });
    },
    loadScene: () => {
        if (get().rootNodeIds.length > 0) {
            // Assign all nodes as dirty to force re-validation
            Object.values(get().nodes).forEach((node) => {
                get().markDirty(node.id);
            });
            return; // Scene already loaded
        }
        // Create hierarchy: Site → Building → Level
        const level0 = LevelNode.parse({
            level: 0,
            children: [],
        });
        const building = BuildingNode.parse({
            children: [level0.id],
        });
        const site = SiteNode.parse({
            children: [building.id],
        });
        // Define all nodes flat
        const nodes = {
            [site.id]: site,
            [building.id]: building,
            [level0.id]: level0,
        };
        // Site is the root
        const rootNodeIds = [site.id];
        set({ nodes, rootNodeIds });
    },
    markDirty: (id) => {
        get().dirtyNodes.add(id);
    },
    clearDirty: (id) => {
        get().dirtyNodes.delete(id);
    },
    createNodes: (ops) => nodeActions.createNodesAction(set, get, ops),
    createNode: (node, parentId) => nodeActions.createNodesAction(set, get, [{ node, parentId }]),
    applyNodeChanges: (changes) => nodeActions.applyNodeChangesAction(set, get, changes),
    updateNodes: (updates) => nodeActions.updateNodesAction(set, get, updates),
    updateNode: (id, data) => nodeActions.updateNodesAction(set, get, [{ id, data }]),
    // --- DELETE ---
    deleteNodes: (ids) => nodeActions.deleteNodesAction(set, get, ids),
    deleteNode: (id) => nodeActions.deleteNodesAction(set, get, [id]),
    // --- COLLECTIONS ---
    createCollection: (name, nodeIds = []) => {
        if (get().readOnly)
            return '';
        const id = generateCollectionId();
        const collection = { id, name, nodeIds };
        set((state) => {
            const nextCollections = { ...state.collections, [id]: collection };
            // Denormalize: stamp collectionId onto each node
            const nextNodes = { ...state.nodes };
            for (const nodeId of nodeIds) {
                const node = nextNodes[nodeId];
                if (!node)
                    continue;
                const existing = ('collectionIds' in node ? node.collectionIds : undefined) ?? [];
                nextNodes[nodeId] = { ...node, collectionIds: [...existing, id] };
            }
            return { collections: nextCollections, nodes: nextNodes };
        });
        return id;
    },
    deleteCollection: (id) => {
        if (get().readOnly)
            return;
        set((state) => {
            const col = state.collections[id];
            const nextCollections = { ...state.collections };
            delete nextCollections[id];
            // Remove collectionId from all member nodes
            const nextNodes = { ...state.nodes };
            for (const nodeId of col?.nodeIds ?? []) {
                const node = nextNodes[nodeId];
                if (!(node && 'collectionIds' in node))
                    continue;
                nextNodes[nodeId] = {
                    ...node,
                    collectionIds: node.collectionIds.filter((cid) => cid !== id),
                };
            }
            return { collections: nextCollections, nodes: nextNodes };
        });
    },
    updateCollection: (id, data) => {
        if (get().readOnly)
            return;
        set((state) => {
            const col = state.collections[id];
            if (!col)
                return state;
            return { collections: { ...state.collections, [id]: { ...col, ...data } } };
        });
    },
    addToCollection: (id, nodeId) => {
        if (get().readOnly)
            return;
        set((state) => {
            const col = state.collections[id];
            if (!col || col.nodeIds.includes(nodeId))
                return state;
            const nextCollections = {
                ...state.collections,
                [id]: { ...col, nodeIds: [...col.nodeIds, nodeId] },
            };
            const node = state.nodes[nodeId];
            if (!node)
                return { collections: nextCollections };
            const existing = ('collectionIds' in node ? node.collectionIds : undefined) ?? [];
            const nextNodes = {
                ...state.nodes,
                [nodeId]: { ...node, collectionIds: [...existing, id] },
            };
            return { collections: nextCollections, nodes: nextNodes };
        });
    },
    removeFromCollection: (id, nodeId) => {
        if (get().readOnly)
            return;
        set((state) => {
            const col = state.collections[id];
            if (!col)
                return state;
            const nextCollections = {
                ...state.collections,
                [id]: { ...col, nodeIds: col.nodeIds.filter((n) => n !== nodeId) },
            };
            const node = state.nodes[nodeId];
            if (!(node && 'collectionIds' in node))
                return { collections: nextCollections };
            const nextNodes = {
                ...state.nodes,
                [nodeId]: {
                    ...node,
                    collectionIds: node.collectionIds.filter((cid) => cid !== id),
                },
            };
            return { collections: nextCollections, nodes: nextNodes };
        });
    },
}), {
    partialize: (state) => {
        const { nodes, rootNodeIds, collections } = state;
        return { nodes, rootNodeIds, collections };
    },
    limit: 50, // Limit to last 50 actions
}));
export default useScene;
// Track previous temporal state lengths and node snapshot for diffing
let prevPastLength = 0;
let prevFutureLength = 0;
let prevNodesSnapshot = null;
export function clearSceneHistory() {
    resetSceneHistoryPauseDepth();
    useScene.temporal.getState().clear();
    prevPastLength = 0;
    prevFutureLength = 0;
    prevNodesSnapshot = null;
}
// Subscribe to the temporal store (Undo/Redo events)
useScene.temporal.subscribe((state) => {
    const currentPastLength = state.pastStates.length;
    const currentFutureLength = state.futureStates.length;
    // Undo: futureStates increases (state moved from past to future)
    // Redo: pastStates increases while futureStates decreases (state moved from future to past)
    const didUndo = currentFutureLength > prevFutureLength;
    const didRedo = currentPastLength > prevPastLength && currentFutureLength < prevFutureLength;
    if (didUndo || didRedo) {
        // Capture the previous snapshot before RAF fires
        const snapshotBefore = prevNodesSnapshot;
        // Defer to a microtask so the scene store has settled before we diff,
        // but still mark walls/items dirty before the next paint.
        queueMicrotask(() => {
            const currentNodes = useScene.getState().nodes;
            const { markDirty } = useScene.getState();
            if (snapshotBefore) {
                // Diff: only mark nodes that actually changed
                for (const [id, node] of Object.entries(currentNodes)) {
                    if (snapshotBefore[id] !== node) {
                        markDirty(id);
                        // Also mark parent so merged geometries update
                        if (node.parentId)
                            markDirty(node.parentId);
                    }
                }
                // Nodes that were deleted (exist in prev but not current)
                for (const [id, node] of Object.entries(snapshotBefore)) {
                    if (!currentNodes[id]) {
                        const parentId = node.parentId;
                        if (parentId) {
                            markDirty(parentId);
                            // Mark sibling nodes dirty so they can update their geometry
                            // (e.g. adjacent walls need to recalculate miter/junction geometry)
                            const parent = currentNodes[parentId];
                            if (parent && 'children' in parent && Array.isArray(parent.children)) {
                                for (const childId of parent.children) {
                                    markDirty(childId);
                                }
                            }
                        }
                    }
                }
            }
            else {
                // No snapshot to diff against — fall back to marking all
                for (const node of Object.values(currentNodes)) {
                    markDirty(node.id);
                }
            }
        });
    }
    // Update tracked lengths and snapshot
    prevPastLength = currentPastLength;
    prevFutureLength = currentFutureLength;
    prevNodesSnapshot = useScene.getState().nodes;
});
