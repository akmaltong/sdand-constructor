import { DEFAULT_WALL_HEIGHT, getMaterialPresetByRef, resolveMaterial, useScene, WallNode as WallSchema, } from '@pascal-app/core';
import { isSegmentLongEnough } from '@pascal-app/editor';
/**
 * Pure helpers shared by the 3D `MoveWallTool` and the 2D
 * `wallFloorplanMoveTarget`. Lives in `packages/nodes` because the
 * bridge / ghost helpers depend on `WallSchema.parse` and material
 * preset resolution; kept React-free so both call sites can import
 * cleanly.
 */
const POINT_EPSILON = 1e-6;
export function samePoint(a, b) {
    return Math.abs(a[0] - b[0]) <= POINT_EPSILON && Math.abs(a[1] - b[1]) <= POINT_EPSILON;
}
function pointKey(point) {
    return `${point[0]}:${point[1]}`;
}
export function stripWallIsNewMetadata(meta) {
    if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
        return meta;
    }
    const nextMeta = { ...meta };
    delete nextMeta.isNew;
    return nextMeta;
}
/**
 * Walls in the same level that share an endpoint with the moving wall,
 * plus walls one hop further out that share an endpoint with a
 * directly-linked wall — needed so the junction planner can resolve
 * pivot-point context when a same-direction wall is consumed.
 */
export function getLinkedWallSnapshots(args) {
    const { wallId, wallParentId, originalStart, originalEnd } = args;
    const { nodes } = useScene.getState();
    const walls = Object.values(nodes).filter((node) => node?.type === 'wall' && node.id !== wallId && (node.parentId ?? null) === wallParentId);
    const directlyLinkedWalls = walls.filter((wall) => samePoint(wall.start, originalStart) ||
        samePoint(wall.start, originalEnd) ||
        samePoint(wall.end, originalStart) ||
        samePoint(wall.end, originalEnd));
    const contextPoints = new Set([pointKey(originalStart), pointKey(originalEnd)]);
    for (const wall of directlyLinkedWalls) {
        contextPoints.add(pointKey(wall.start));
        contextPoints.add(pointKey(wall.end));
    }
    const snapshots = [];
    const seenWallIds = new Set();
    for (const node of walls) {
        if (!contextPoints.has(pointKey(node.start)) && !contextPoints.has(pointKey(node.end))) {
            continue;
        }
        if (seenWallIds.has(node.id)) {
            continue;
        }
        seenWallIds.add(node.id);
        snapshots.push({
            ...node,
            start: [...node.start],
            end: [...node.end],
            children: [...(node.children ?? [])],
        });
    }
    return snapshots;
}
function wallSegmentExists(walls, start, end) {
    return walls.some((wall) => (samePoint(wall.start, start) && samePoint(wall.end, end)) ||
        (samePoint(wall.start, end) && samePoint(wall.end, start)));
}
export function getWallGhostColor(wall) {
    const presetColor = getMaterialPresetByRef(wall.materialPreset)?.mapProperties.color ??
        getMaterialPresetByRef(wall.interiorMaterialPreset)?.mapProperties.color ??
        getMaterialPresetByRef(wall.exteriorMaterialPreset)?.mapProperties.color;
    if (presetColor) {
        return presetColor;
    }
    return resolveMaterial(wall.material ?? wall.interiorMaterial ?? wall.exteriorMaterial).color;
}
export function getWallsAfterUpdates(nodes, updates) {
    const updateById = new Map(updates.map((update) => [update.id, update.data]));
    return Object.values(nodes)
        .filter((node) => node?.type === 'wall')
        .map((wall) => {
        const update = updateById.get(wall.id);
        return update ? { ...wall, ...update } : wall;
    });
}
export function buildBridgeWallCreates(args) {
    const { bridgePlans, nextStart, nextEnd, existingWalls, wallCount } = args;
    const wallsForDuplicateCheck = [...existingWalls];
    const creates = [];
    for (const plan of bridgePlans) {
        const nextPoint = plan.movedEndpoint === 'start' ? nextStart : nextEnd;
        if (!isSegmentLongEnough(plan.originalPoint, nextPoint)) {
            continue;
        }
        if (wallSegmentExists(wallsForDuplicateCheck, plan.originalPoint, nextPoint)) {
            continue;
        }
        const { id: _id, parentId: _parentId, children: _children, ...sourceWall } = plan.wall;
        const bridgeWall = WallSchema.parse({
            ...sourceWall,
            name: `Wall ${wallCount + creates.length + 1}`,
            start: plan.originalPoint,
            end: nextPoint,
            children: [],
            metadata: stripWallIsNewMetadata(plan.wall.metadata),
        });
        creates.push({
            node: bridgeWall,
            parentId: (plan.wall.parentId ?? undefined),
        });
        wallsForDuplicateCheck.push(bridgeWall);
    }
    return creates;
}
export function buildBridgeWallPreviews(args) {
    const { bridgePlans, nextStart, nextEnd, existingWalls } = args;
    const wallsForDuplicateCheck = [...existingWalls];
    const previews = [];
    for (const plan of bridgePlans) {
        const nextPoint = plan.movedEndpoint === 'start' ? nextStart : nextEnd;
        if (!isSegmentLongEnough(plan.originalPoint, nextPoint)) {
            continue;
        }
        if (wallSegmentExists(wallsForDuplicateCheck, plan.originalPoint, nextPoint)) {
            continue;
        }
        const { id: _id, children: _children, ...sourceWall } = plan.wall;
        const wall = WallSchema.parse({
            ...sourceWall,
            name: 'Wall Preview',
            start: plan.originalPoint,
            end: nextPoint,
            children: [],
            metadata: stripWallIsNewMetadata(plan.wall.metadata),
        });
        const ghost = {
            id: `${plan.wall.id}:${plan.movedEndpoint}:${previews.length}`,
            start: [...plan.originalPoint],
            end: [...nextPoint],
            color: getWallGhostColor(plan.wall),
            height: plan.wall.height ?? DEFAULT_WALL_HEIGHT,
        };
        previews.push({ ghost, wall });
        wallsForDuplicateCheck.push(wall);
    }
    return previews;
}
