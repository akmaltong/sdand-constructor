import { LevelNode } from '@pascal-app/core/schema';
import { z } from 'zod';
import { ErrorCode, throwMcpError } from './errors';
import { publishLiveSceneSnapshot } from './live-sync';
import { NodeIdSchema } from './schemas';
export const createLevelInput = {
    buildingId: NodeIdSchema,
    elevation: z.number().optional(),
    height: z.number().optional(),
    label: z.string().optional(),
};
export const createLevelOutput = {
    levelId: z.string(),
};
export function registerCreateLevel(server, bridge) {
    server.registerTool('create_level', {
        title: 'Create level',
        description: 'Create a new level node attached to the given building. height and label are stored in metadata.',
        inputSchema: createLevelInput,
        outputSchema: createLevelOutput,
    }, async ({ buildingId, elevation, height, label }) => {
        const parent = bridge.getNode(buildingId);
        if (!parent) {
            throwMcpError(ErrorCode.InvalidParams, `Building not found: ${buildingId}`);
        }
        if (parent.type !== 'building') {
            throwMcpError(ErrorCode.InvalidParams, `Node ${buildingId} is a ${parent.type}, expected building`);
        }
        const metadata = {};
        if (height !== undefined)
            metadata.height = height;
        if (label !== undefined)
            metadata.label = label;
        const levelNode = LevelNode.parse({
            level: elevation ?? 0,
            children: [],
            ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
            ...(label !== undefined ? { name: label } : {}),
        });
        const id = bridge.createNode(levelNode, buildingId);
        await publishLiveSceneSnapshot(bridge, 'create_level');
        const payload = { levelId: id };
        return {
            content: [{ type: 'text', text: JSON.stringify(payload) }],
            structuredContent: payload,
        };
    });
}
