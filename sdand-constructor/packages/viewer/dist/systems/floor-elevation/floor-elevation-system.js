import { getEffectiveNode, getFloorStackedPosition, nodeRegistry, sceneRegistry, useLiveTransforms, useScene, } from '@pascal-app/core';
import { useFrame } from '@react-three/fiber';
function withLiveTransform(node, id) {
    const liveTransform = useLiveTransforms.getState().get(id);
    if (!liveTransform)
        return node;
    const currentRotation = node.rotation;
    const rotation = Array.isArray(currentRotation)
        ? [currentRotation[0] ?? 0, liveTransform.rotation, currentRotation[2] ?? 0]
        : typeof currentRotation === 'number'
            ? liveTransform.rotation
            : currentRotation;
    return {
        ...node,
        position: liveTransform.position,
        ...(rotation !== undefined ? { rotation } : {}),
    };
}
/**
 * Generic floor-elevation system.
 *
 * Walks `dirtyNodes` and, for any kind that declares
 * `capabilities.floorPlaced`, lifts the registered mesh's Y by whatever
 * slab the footprint overlaps. Items / shelves / etc. that sit directly
 * on a level pick this up automatically — no per-kind elevation logic.
 *
 * Skips nodes whose parent is not a level (items hosted on shelves /
 * tables inherit Y from the parent group), and respects
 * `floorPlaced.applies` so items with `asset.attachTo` (wall / ceiling
 * mounted) are left alone.
 *
 * Runs at priority 1 — before the priority-2 systems (`GeometrySystem`,
 * `ItemSystem`) so the dirty mark survives long enough for those to do
 * their own work. Kinds with no geometry/system have no downstream dirty
 * consumer, so this system clears their dirty mark after applying the lift.
 */
export const FloorElevationSystem = () => {
    const dirtyNodes = useScene((s) => s.dirtyNodes);
    const clearDirty = useScene((s) => s.clearDirty);
    useFrame(() => {
        if (dirtyNodes.size === 0)
            return;
        const nodes = useScene.getState().nodes;
        dirtyNodes.forEach((id) => {
            const node = nodes[id];
            if (!node)
                return;
            const def = nodeRegistry.get(node.type);
            const floorPlaced = def?.capabilities?.floorPlaced;
            if (!floorPlaced)
                return;
            const mesh = sceneRegistry.nodes.get(id);
            if (!mesh)
                return;
            const effectiveNode = withLiveTransform(getEffectiveNode(node), id);
            const position = effectiveNode.position;
            if (!position)
                return;
            // This system is the single drag-time authority for floor-stack mesh Y:
            // tools publish base positions to live stores, renderers may
            // reconcile that base Y onto the group, then this presentation system
            // reapplies the resolver-derived visual Y before render. Because the
            // override/store position remains base-height, the slab lift is never
            // committed or applied twice.
            const resolverNodes = effectiveNode === node ? nodes : { ...nodes, [effectiveNode.id]: effectiveNode };
            const visualPosition = getFloorStackedPosition({
                node: effectiveNode,
                nodes: resolverNodes,
                position,
            });
            mesh.position.y = visualPosition[1];
            if (!(def.geometry || def.system)) {
                clearDirty(id);
            }
        });
    }, 1);
    return null;
};
