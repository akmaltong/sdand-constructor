import { ItemNode } from '@pascal-app/core/schema';
import { z } from 'zod';
import { findCatalogItem } from './asset-catalog';
import { ErrorCode, throwMcpError } from './errors';
import { projectWorldPointToWallLocalX, wallLength } from './geometry';
import { publishLiveSceneSnapshot } from './live-sync';
import { NodeIdSchema, Vec3Schema } from './schemas';
export const placeItemInput = {
    catalogItemId: z.string().min(1),
    targetNodeId: NodeIdSchema,
    position: Vec3Schema,
    rotation: z.number().optional(),
};
export const placeItemOutput = {
    itemId: z.string(),
    status: z.string().optional(),
};
export function registerPlaceItem(server, bridge) {
    server.registerTool('place_item', {
        title: 'Place item',
        description: 'Place a catalog item into the scene. Target a level/slab/zone for floor items, a wall for wall-attached items, or a ceiling for ceiling-attached items. Do not target the site node directly.',
        inputSchema: placeItemInput,
        outputSchema: placeItemOutput,
    }, async ({ catalogItemId, targetNodeId, position, rotation }) => {
        const target = bridge.getNode(targetNodeId);
        if (!target) {
            throwMcpError(ErrorCode.InvalidParams, `Target node not found: ${targetNodeId}`);
        }
        const targetType = target.type;
        if (targetType !== 'level' &&
            targetType !== 'slab' &&
            targetType !== 'zone' &&
            targetType !== 'wall' &&
            targetType !== 'ceiling') {
            throwMcpError(ErrorCode.InvalidRequest, `Cannot place item on ${targetType}; target must be a level, slab, zone, wall, or ceiling. Site-level placement is not supported yet because site.children is reserved for buildings.`);
        }
        const catalogAsset = findCatalogItem(catalogItemId);
        const baseAsset = catalogAsset ?? {
            id: catalogItemId,
            name: catalogItemId,
            category: 'unknown',
            thumbnail: '',
            src: 'asset://placeholder',
            dimensions: [0.5, 0.5, 0.5],
            offset: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
        };
        const requestedPosition = position;
        const parentId = targetType === 'slab' || targetType === 'zone'
            ? bridge.resolveLevelId(targetNodeId)
            : targetNodeId;
        if (!parentId) {
            throwMcpError(ErrorCode.InvalidParams, `Could not resolve a level parent for target ${targetNodeId}`);
        }
        const wallExtras = {};
        let itemPosition = requestedPosition;
        if (targetType === 'wall') {
            const localX = projectWorldPointToWallLocalX(target, requestedPosition);
            const length = wallLength(target);
            itemPosition = [localX, requestedPosition[1], 0];
            Object.assign(wallExtras, {
                wallId: targetNodeId,
                wallT: length === 0 ? 0 : localX / length,
            });
        }
        const item = ItemNode.parse({
            position: itemPosition,
            rotation: [0, rotation ?? 0, 0],
            asset: baseAsset,
            ...wallExtras,
        });
        const id = bridge.createNode(item, parentId);
        await publishLiveSceneSnapshot(bridge, 'place_item');
        const payload = {
            itemId: id,
            status: catalogAsset ? 'ok' : 'catalog_unavailable',
        };
        return {
            content: [{ type: 'text', text: JSON.stringify(payload) }],
            structuredContent: payload,
        };
    });
}
