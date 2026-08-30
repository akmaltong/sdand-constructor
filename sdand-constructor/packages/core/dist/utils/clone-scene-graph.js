import { generateId } from '../schema/base';
/**
 * Extracts the type prefix from a node ID (e.g., "wall_abc123" -> "wall")
 */
function extractIdPrefix(id) {
    const underscoreIndex = id.indexOf('_');
    return underscoreIndex === -1 ? 'node' : id.slice(0, underscoreIndex);
}
/**
 * Deep clones a scene graph with all node IDs regenerated while preserving
 * parent-child relationships and other internal references.
 *
 * This is useful for:
 * - Duplicating a project (host app creates a new project record, then loads the cloned scene)
 * - Copying nodes between different projects
 * - Multi-scene in-memory scenarios
 */
export function cloneSceneGraph(sceneGraph) {
    const { nodes, rootNodeIds, collections } = sceneGraph;
    // Build ID mapping: old ID -> new ID
    const idMap = new Map();
    // Pass 1: Generate new IDs for all nodes
    for (const nodeId of Object.keys(nodes)) {
        const prefix = extractIdPrefix(nodeId);
        idMap.set(nodeId, generateId(prefix));
    }
    // Pass 2: Deep clone nodes with remapped references
    const clonedNodes = {};
    for (const [oldId, node] of Object.entries(nodes)) {
        const newId = idMap.get(oldId);
        const clonedNode = structuredClone({ ...node, id: newId });
        // Remap parentId
        if (clonedNode.parentId && typeof clonedNode.parentId === 'string') {
            clonedNode.parentId = (idMap.get(clonedNode.parentId) ?? null);
        }
        // Remap children array (buildings, levels, walls, items, etc.)
        // Children can be either string IDs or embedded node objects (with an `id` property).
        // Normalize both forms to remapped string IDs.
        if ('children' in clonedNode && Array.isArray(clonedNode.children)) {
            ;
            clonedNode.children = clonedNode.children
                .map((child) => {
                if (typeof child === 'string')
                    return idMap.get(child);
                if (child &&
                    typeof child === 'object' &&
                    'id' in child &&
                    typeof child.id === 'string') {
                    return idMap.get(child.id);
                }
                return undefined;
            })
                .filter((id) => id !== undefined);
        }
        // Remap wallId (items/doors/windows attached to walls)
        if ('wallId' in clonedNode && typeof clonedNode.wallId === 'string') {
            ;
            clonedNode.wallId = idMap.get(clonedNode.wallId);
        }
        clonedNodes[newId] = clonedNode;
    }
    // Remap root node IDs
    const clonedRootNodeIds = rootNodeIds
        .map((id) => idMap.get(id))
        .filter((id) => id !== undefined);
    // Clone and remap collections if present
    let clonedCollections;
    if (collections) {
        clonedCollections = {};
        const collectionIdMap = new Map();
        for (const collectionId of Object.keys(collections)) {
            collectionIdMap.set(collectionId, generateId('collection'));
        }
        for (const [oldCollectionId, collection] of Object.entries(collections)) {
            const newCollectionId = collectionIdMap.get(oldCollectionId);
            clonedCollections[newCollectionId] = {
                ...collection,
                id: newCollectionId,
                nodeIds: collection.nodeIds
                    .map((nodeId) => idMap.get(nodeId))
                    .filter((id) => id !== undefined),
                controlNodeId: collection.controlNodeId
                    ? idMap.get(collection.controlNodeId)
                    : undefined,
            };
            // Update collectionIds on nodes that reference this collection
            for (const oldNodeId of collection.nodeIds) {
                const newNodeId = idMap.get(oldNodeId);
                if (newNodeId && clonedNodes[newNodeId]) {
                    const node = clonedNodes[newNodeId];
                    if ('collectionIds' in node && Array.isArray(node.collectionIds)) {
                        const oldColIds = node.collectionIds;
                        node.collectionIds = oldColIds
                            .map((cid) => collectionIdMap.get(cid))
                            .filter((id) => id !== undefined);
                    }
                }
            }
        }
    }
    return {
        nodes: clonedNodes,
        rootNodeIds: clonedRootNodeIds,
        ...(clonedCollections && { collections: clonedCollections }),
    };
}
/**
 * Deep clones a level node and all its descendants with fresh IDs.
 * All internal references (parentId, children, wallId) are remapped to the new IDs.
 * The cloned level node's parentId is preserved (building ID) — not remapped.
 *
 * Unlike `cloneSceneGraph` (which operates on serialized data), this function works
 * on live runtime nodes that may have non-serializable properties (Three.js objects,
 * etc.). It uses JSON roundtrip to safely strip them.
 *
 * @returns clonedNodes - flat array of all cloned nodes (level + descendants)
 * @returns newLevelId - the ID of the cloned level node
 * @returns idMap - old ID → new ID mapping
 */
export function cloneLevelSubtree(nodes, levelId) {
    const levelNode = nodes[levelId];
    if (!levelNode || levelNode.type !== 'level') {
        throw new Error(`Node "${levelId}" is not a level`);
    }
    // Recursively collect the level node + all descendants via children arrays
    const subtreeIds = new Set();
    const collect = (id) => {
        if (subtreeIds.has(id))
            return;
        const node = nodes[id];
        if (!node)
            return;
        subtreeIds.add(id);
        if ('children' in node && Array.isArray(node.children)) {
            for (const childId of node.children) {
                collect(childId);
            }
        }
    };
    collect(levelId);
    // Build ID mapping: old → new
    const idMap = new Map();
    for (const oldId of subtreeIds) {
        const prefix = extractIdPrefix(oldId);
        idMap.set(oldId, generateId(prefix));
    }
    const newLevelId = idMap.get(levelId);
    // Clone each node with remapped references.
    // Use JSON roundtrip instead of structuredClone because live runtime nodes may
    // carry non-serializable properties (Three.js Object3D refs, functions, etc.)
    // that structuredClone would throw on.
    const clonedNodes = [];
    for (const oldId of subtreeIds) {
        const node = nodes[oldId];
        if (!node)
            continue;
        const newId = idMap.get(oldId);
        // JSON roundtrip: safely strips functions, Object3D, circular refs, etc.
        const cloned = JSON.parse(JSON.stringify(node));
        cloned.id = newId;
        // Remap parentId — but only for descendants, not the level node itself
        // (the level's parentId points to the building, which is outside the subtree)
        if (oldId !== levelId && cloned.parentId && typeof cloned.parentId === 'string') {
            cloned.parentId = (idMap.get(cloned.parentId) ?? cloned.parentId);
        }
        // Remap children array
        if ('children' in cloned && Array.isArray(cloned.children)) {
            ;
            cloned.children = cloned.children
                .map((child) => {
                if (typeof child === 'string')
                    return idMap.get(child) ?? child;
                if (child &&
                    typeof child === 'object' &&
                    'id' in child &&
                    typeof child.id === 'string') {
                    return idMap.get(child.id) ?? child.id;
                }
                return child;
            })
                .filter((id) => typeof id === 'string');
        }
        // Remap wallId (doors/windows attached to walls)
        if ('wallId' in cloned && typeof cloned.wallId === 'string') {
            ;
            cloned.wallId = idMap.get(cloned.wallId) ?? cloned.wallId;
        }
        clonedNodes.push(cloned);
    }
    return { clonedNodes, newLevelId, idMap };
}
/**
 * Forks a scene graph for use as a new project: clones with new IDs and, by
 * default, strips scan and guide nodes since they contain user-uploaded imagery.
 */
export function forkSceneGraph(sceneGraph, options = {}) {
    if (options.preserveScans) {
        return cloneSceneGraph(sceneGraph);
    }
    const { nodes, rootNodeIds, collections } = sceneGraph;
    // First, identify scan and guide node IDs to exclude (user-uploaded imagery)
    const excludedNodeIds = new Set();
    for (const [nodeId, node] of Object.entries(nodes)) {
        if (node.type === 'scan' || node.type === 'guide') {
            excludedNodeIds.add(nodeId);
        }
    }
    // Build a filtered scene graph without scan nodes
    const filteredNodes = {};
    for (const [nodeId, node] of Object.entries(nodes)) {
        if (excludedNodeIds.has(nodeId))
            continue;
        const clonedNode = structuredClone(node);
        // Remove scan children from any parent that references them.
        // Children can be string IDs or embedded node objects.
        if ('children' in clonedNode && Array.isArray(clonedNode.children)) {
            ;
            clonedNode.children = clonedNode.children.filter((child) => {
                const childId = typeof child === 'string'
                    ? child
                    : child && typeof child === 'object' && 'id' in child
                        ? child.id
                        : null;
                return childId ? !excludedNodeIds.has(childId) : true;
            });
        }
        filteredNodes[nodeId] = clonedNode;
    }
    const filteredRootNodeIds = rootNodeIds.filter((id) => !excludedNodeIds.has(id));
    // Filter collections to remove references to scan nodes
    let filteredCollections;
    if (collections) {
        filteredCollections = {};
        for (const [collectionId, collection] of Object.entries(collections)) {
            const filteredNodeIds = collection.nodeIds.filter((id) => !excludedNodeIds.has(id));
            if (filteredNodeIds.length > 0) {
                filteredCollections[collectionId] = {
                    ...collection,
                    nodeIds: filteredNodeIds,
                    controlNodeId: collection.controlNodeId && excludedNodeIds.has(collection.controlNodeId)
                        ? undefined
                        : collection.controlNodeId,
                };
            }
        }
    }
    // Now clone the filtered graph with new IDs
    return cloneSceneGraph({
        nodes: filteredNodes,
        rootNodeIds: filteredRootNodeIds,
        ...(filteredCollections && { collections: filteredCollections }),
    });
}
