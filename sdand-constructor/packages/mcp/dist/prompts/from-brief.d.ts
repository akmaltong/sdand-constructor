import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SceneOperations } from '../operations';
/**
 * Build the user-facing prompt text for `from_brief`. Pure function for testability.
 */
export declare function buildFromBriefPrompt(args: {
    brief: string;
    constraints?: string | undefined;
}): string;
export declare function registerFromBrief(server: McpServer, _bridge: SceneOperations): void;
//# sourceMappingURL=from-brief.d.ts.map