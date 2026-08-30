import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../../operations';
/**
 * Input shape for the `photo_to_scene` orchestrator. `image` matches the
 * contract documented on `analyze_floorplan_image` — base64 or http(s) URL.
 */
export declare const photoToSceneInput: {
    image: z.ZodString;
    scaleHint: z.ZodOptional<z.ZodString>;
    name: z.ZodDefault<z.ZodString>;
    save: z.ZodDefault<z.ZodBoolean>;
    defaultWallThickness: z.ZodDefault<z.ZodNumber>;
    defaultWallHeight: z.ZodDefault<z.ZodNumber>;
};
export declare const photoToSceneOutput: {
    sceneId: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    walls: z.ZodNumber;
    rooms: z.ZodNumber;
    confidence: z.ZodNumber;
    notes: z.ZodOptional<z.ZodString>;
    graph: z.ZodOptional<z.ZodAny>;
};
export declare function registerPhotoToScene(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=photo-to-scene.d.ts.map