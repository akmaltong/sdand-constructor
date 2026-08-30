import { z } from 'zod';
export const exportGlbInput = {};
export const exportGlbOutput = {
    status: z.literal('not_implemented'),
    reason: z.string(),
};
export function registerExportGlb(server, _bridge) {
    server.registerTool('export_glb', {
        title: 'Export GLB',
        description: 'GLB export is not available in headless mode — it requires the Three.js renderer, which is browser-only. Returns a structured `not_implemented` response.',
        inputSchema: exportGlbInput,
        outputSchema: exportGlbOutput,
    }, async () => {
        const payload = {
            status: 'not_implemented',
            reason: 'GLB export requires the Three.js renderer, which is browser-only',
        };
        return {
            content: [{ type: 'text', text: JSON.stringify(payload) }],
            structuredContent: payload,
            isError: false,
        };
    });
}
