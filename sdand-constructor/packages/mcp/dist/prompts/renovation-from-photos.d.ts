import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SceneOperations } from '../operations';
type PromptContent = {
    type: 'text';
    text: string;
} | {
    type: 'image';
    data: string;
    mimeType: string;
};
/**
 * Build the full messages array. Pure function for testability.
 */
export declare function buildRenovationMessages(args: {
    currentPhotos: string[] | string | undefined;
    referencePhotos: string[] | string | undefined;
    goals: string;
}): Array<{
    role: 'user';
    content: PromptContent;
}>;
export declare function registerRenovationFromPhotos(server: McpServer, _bridge: SceneOperations): void;
export {};
//# sourceMappingURL=renovation-from-photos.d.ts.map