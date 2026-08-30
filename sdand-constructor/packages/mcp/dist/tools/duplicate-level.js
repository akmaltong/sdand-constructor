import { cloneLevelSubtree } from '@pascal-app/core/clone-scene-graph';
import { z } from 'zod';
import { ErrorCode, throwMcpError } from './errors';
import { publishLiveSceneSnapshot } from './live-sync';
import { NodeIdSchema } from './schemas';
export const duplicateLevelInput = {
    levelId: NodeIdSchema,
};
export const duplicateLevelOutput = {
    newLevelId: z.string(),
    newNodeIds: z.array(z.string()),
};
export function registerDuplicateLevel(server, bridge) {
    server.registerTool('duplicate_level', {
        title: 'Duplicate level',
        description: 'Clone a level and all its descendants into a new subtree attached to the same building.',
        inputSchema: duplicateLevelInput,
        outputSchema: duplicateLevelOutput,
    }, async ({ levelId }) => {
        const node = bridge.getNode(levelId);
        if (!node) {
            throwMcpError(ErrorCode.InvalidParams, `Level not found: ${levelId}`);
        }
        if (node.type !== 'level') {
            throwMcpError(ErrorCode.InvalidParams, `Node ${levelId} is a ${node.type}, expected level`);
        }
        // cloneLevelSubtree(nodes, levelId) — returns { clonedNodes, newLevelId, idMap }.
        const { clonedNodes, newLevelId } = cloneLevelSubtree(bridge.getNodes(), levelId);
        const buildingId = node.parentId ?? undefined;
        // Flatten cloned subtree into create patches. The level node itself
        // attaches to the original building; descendants attach to their
        // already-remapped parent (encoded in `parentId`).
        const patches = clonedNodes.map((n) => {
            const isRoot = n.id === newLevelId;
            const parentIdForBridge = isRoot
                ? buildingId
                : (n.parentId ?? undefined);
            const createOp = {
                op: 'create',
                node: n,
                ...(parentIdForBridge !== undefined ? { parentId: parentIdForBridge } : {}),
            };
            return createOp;
        });
        const result = bridge.applyPatch(patches);
        await publishLiveSceneSnapshot(bridge, 'duplicate_level');
        const payload = {
            newLevelId: newLevelId,
            newNodeIds: result.createdIds,
        };
        return {
            content: [{ type: 'text', text: JSON.stringify(payload) }],
            structuredContent: payload,
        };
    });
}
