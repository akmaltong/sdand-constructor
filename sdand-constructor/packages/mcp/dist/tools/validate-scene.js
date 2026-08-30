import { z } from 'zod';
export const validateSceneInput = {};
export const validateSceneOutput = {
    valid: z.boolean(),
    errors: z.array(z.object({
        nodeId: z.string(),
        path: z.string(),
        message: z.string(),
    })),
};
export function registerValidateScene(server, bridge) {
    server.registerTool('validate_scene', {
        title: 'Validate scene',
        description: 'Run Zod validation against every node in the scene. Returns `{ valid, errors }` where each error has `{ nodeId, path, message }`.',
        inputSchema: validateSceneInput,
        outputSchema: validateSceneOutput,
    }, async () => {
        const result = bridge.validateScene();
        return {
            content: [{ type: 'text', text: JSON.stringify(result) }],
            structuredContent: result,
        };
    });
}
