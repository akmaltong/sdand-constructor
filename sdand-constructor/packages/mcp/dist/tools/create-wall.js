import { WallNode } from '@pascal-app/core/schema';
import { z } from 'zod';
import { ErrorCode, throwMcpError } from './errors';
import { publishLiveSceneSnapshot } from './live-sync';
import { NodeIdSchema, Vec2Schema } from './schemas';
export const createWallInput = {
    levelId: NodeIdSchema,
    start: Vec2Schema,
    end: Vec2Schema,
    thickness: z.number().positive().optional(),
    height: z.number().positive().optional(),
};
export const createWallOutput = {
    wallId: z.string(),
};
export function registerCreateWall(server, bridge) {
    server.registerTool('create_wall', {
        title: 'Create wall',
        description: 'Create a new wall on the given level between two 2D points. Thickness and height default to the core library defaults when omitted.',
        inputSchema: createWallInput,
        outputSchema: createWallOutput,
    }, async ({ levelId, start, end, thickness, height }) => {
        const parent = bridge.getNode(levelId);
        if (!parent) {
            throwMcpError(ErrorCode.InvalidParams, `Level not found: ${levelId}`);
        }
        if (parent.type !== 'level') {
            throwMcpError(ErrorCode.InvalidParams, `Node ${levelId} is a ${parent.type}, expected level`);
        }
        if (typeof parent.metadata === 'object' &&
            parent.metadata !== null &&
            'role' in parent.metadata &&
            parent.metadata.role === 'roof') {
            throwMcpError(ErrorCode.InvalidParams, `Roof support level ${levelId} is not an occupied story; create walls on an occupied level instead`);
        }
        const wall = WallNode.parse({
            start: start,
            end: end,
            ...(thickness !== undefined ? { thickness } : {}),
            ...(height !== undefined ? { height } : {}),
        });
        const id = bridge.createNode(wall, levelId);
        await publishLiveSceneSnapshot(bridge, 'create_wall');
        const payload = { wallId: id };
        return {
            content: [{ type: 'text', text: JSON.stringify(payload) }],
            structuredContent: payload,
        };
    });
}
