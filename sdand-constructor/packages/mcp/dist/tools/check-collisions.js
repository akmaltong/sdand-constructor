import { getScaledDimensions } from '@pascal-app/core/schema';
import { z } from 'zod';
import { NodeIdSchema } from './schemas';
export const checkCollisionsInput = {
    levelId: NodeIdSchema.optional(),
};
export const checkCollisionsOutput = {
    collisions: z.array(z.object({
        aId: z.string(),
        bId: z.string(),
        kind: z.string(),
    })),
};
function itemAabb(item) {
    const [x, , z] = item.position;
    const [w, , d] = getScaledDimensions(item);
    const halfW = w / 2;
    const halfD = d / 2;
    return {
        minX: x - halfW,
        maxX: x + halfW,
        minZ: z - halfD,
        maxZ: z + halfD,
    };
}
function aabbOverlap(a, b) {
    return a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
}
export function registerCheckCollisions(server, bridge) {
    server.registerTool('check_collisions', {
        title: 'Check collisions',
        description: 'Detect overlapping item footprints via an axis-aligned 2D bounding-box test. Optionally scoped to a single level.',
        inputSchema: checkCollisionsInput,
        outputSchema: checkCollisionsOutput,
    }, async ({ levelId }) => {
        const filter = { type: 'item' };
        if (levelId)
            filter.levelId = levelId;
        const items = bridge.findNodes(filter);
        const boxes = items.map((i) => ({ item: i, aabb: itemAabb(i) }));
        const collisions = [];
        for (let i = 0; i < boxes.length; i++) {
            for (let j = i + 1; j < boxes.length; j++) {
                const a = boxes[i];
                const b = boxes[j];
                if (aabbOverlap(a.aabb, b.aabb)) {
                    collisions.push({
                        aId: a.item.id,
                        bId: b.item.id,
                        kind: 'item-aabb',
                    });
                }
            }
        }
        const payload = { collisions };
        return {
            content: [{ type: 'text', text: JSON.stringify(payload) }],
            structuredContent: payload,
        };
    });
}
