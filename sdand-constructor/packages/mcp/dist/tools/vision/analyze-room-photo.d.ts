import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SceneOperations } from '../../operations';
/**
 * Input shape for `analyze_room_photo`.
 *
 * Same image resolution rules as `analyze_floorplan_image`.
 */
export declare const analyzeRoomPhotoInput: {
    image: z.ZodString;
};
export declare const analyzeRoomPhotoOutput: {
    approximateDimensions: z.ZodObject<{
        widthM: z.ZodNumber;
        lengthM: z.ZodNumber;
        heightM: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
    identifiedFixtures: z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        approximatePosition: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
    }, z.core.$strip>>;
    identifiedWindows: z.ZodArray<z.ZodObject<{
        wallLabel: z.ZodOptional<z.ZodString>;
        approximateWidthM: z.ZodOptional<z.ZodNumber>;
        approximateHeightM: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
};
export declare function registerAnalyzeRoomPhoto(server: McpServer, _bridge: SceneOperations): void;
//# sourceMappingURL=analyze-room-photo.d.ts.map