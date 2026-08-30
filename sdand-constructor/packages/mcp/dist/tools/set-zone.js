import { ZoneNode } from '@pascal-app/core/schema';
import { z } from 'zod';
import { ErrorCode, throwMcpError } from './errors';
import { publishLiveSceneSnapshot } from './live-sync';
import { NodeIdSchema, Vec2Schema } from './schemas';
export const setZoneInput = {
    levelId: NodeIdSchema,
    polygon: z.array(Vec2Schema).min(3),
    label: z.string().min(1),
    properties: z.record(z.string(), z.unknown()).optional(),
};
export const setZoneOutput = {
    zoneId: z.string(),
};
export function registerSetZone(server, bridge) {
    server.registerTool('set_zone', {
        title: 'Set zone',
        description: 'Create a polygonal zone on the given level. label is stored as the zone name and properties are merged into metadata.',
        inputSchema: setZoneInput,
        outputSchema: setZoneOutput,
    }, async ({ levelId, polygon, label, properties }) => {
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
            throwMcpError(ErrorCode.InvalidParams, `Roof support level ${levelId} is not an occupied story; create zones on an occupied level instead`);
        }
        const zone = ZoneNode.parse({
            name: label,
            polygon: polygon,
            metadata: properties ?? {},
        });
        const id = bridge.createNode(zone, levelId);
        await publishLiveSceneSnapshot(bridge, 'set_zone');
        const payload = { zoneId: id };
        return {
            content: [{ type: 'text', text: JSON.stringify(payload) }],
            structuredContent: payload,
        };
    });
}
