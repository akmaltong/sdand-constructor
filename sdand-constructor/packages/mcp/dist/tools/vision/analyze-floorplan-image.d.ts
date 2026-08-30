import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../../operations';
/**
 * Input shape for `analyze_floorplan_image`.
 *
 * `image` is either a base64-encoded payload (optionally prefixed with a
 * `data:image/<mime>;base64,` URL) or an `http(s)` URL which we fetch and
 * inline as base64 before forwarding to the MCP host via sampling.
 */
export declare const analyzeFloorplanImageInput: {
    image: z.ZodString;
    scaleHint: z.ZodOptional<z.ZodString>;
};
export declare const analyzeFloorplanImageOutput: {
    walls: z.ZodArray<z.ZodObject<{
        start: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
        end: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
        thickness: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    rooms: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        polygon: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
        approximateAreaSqM: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    approximateDimensions: z.ZodObject<{
        widthM: z.ZodNumber;
        depthM: z.ZodNumber;
    }, z.core.$strip>;
    confidence: z.ZodNumber;
};
export declare function registerAnalyzeFloorplanImage(server: McpServer, _bridge: SceneOperations): void;
//# sourceMappingURL=analyze-floorplan-image.d.ts.map