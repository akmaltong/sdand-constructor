import { z } from 'zod';
import { publishLiveSceneSnapshot } from './live-sync';
export const redoInput = {
    steps: z.number().int().positive().optional(),
};
export const redoOutput = {
    redone: z.number(),
};
export function registerRedo(server, bridge) {
    server.registerTool('redo', {
        title: 'Redo',
        description: 'Redo the next N previously-undone steps (default 1). Returns the number of steps actually redone.',
        inputSchema: redoInput,
        outputSchema: redoOutput,
    }, async ({ steps }) => {
        const redone = bridge.redo(steps ?? 1);
        if (redone > 0)
            await publishLiveSceneSnapshot(bridge, 'redo');
        const payload = { redone };
        return {
            content: [{ type: 'text', text: JSON.stringify(payload) }],
            structuredContent: payload,
        };
    });
}
