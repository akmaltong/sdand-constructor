import { z } from 'zod';
export const getSceneInput = {};
export const getSceneOutput = {
    nodes: z.record(z.string(), z.unknown()),
    rootNodeIds: z.array(z.string()),
    collections: z.record(z.string(), z.unknown()).optional(),
};
export function registerGetScene(server, bridge) {
    server.registerTool('get_scene', {
        title: 'Get scene',
        description: 'Returns the full scene graph: flat node dictionary, root node IDs, and collections.',
        inputSchema: getSceneInput,
        outputSchema: getSceneOutput,
    }, async () => {
        const scene = bridge.exportJSON();
        const payload = {
            nodes: scene.nodes,
            rootNodeIds: scene.rootNodeIds,
            collections: (scene.collections ?? {}),
        };
        return {
            content: [{ type: 'text', text: JSON.stringify(payload) }],
            structuredContent: payload,
        };
    });
}
