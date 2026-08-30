import { z } from 'zod';
export const exportJsonInput = {
    pretty: z.boolean().optional(),
};
export const exportJsonOutput = {
    json: z.string(),
};
export function registerExportJson(server, bridge) {
    server.registerTool('export_json', {
        title: 'Export JSON',
        description: 'Return the scene as a serialized JSON string. Pass `pretty: true` to indent with 2 spaces.',
        inputSchema: exportJsonInput,
        outputSchema: exportJsonOutput,
    }, async ({ pretty }) => {
        const scene = bridge.exportJSON();
        const json = JSON.stringify(scene, null, pretty ? 2 : 0);
        const payload = { json };
        return {
            content: [{ type: 'text', text: JSON.stringify(payload) }],
            structuredContent: payload,
        };
    });
}
