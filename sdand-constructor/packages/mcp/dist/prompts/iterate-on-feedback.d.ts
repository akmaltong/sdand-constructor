import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SceneOperations } from '../operations';
/**
 * Build the user-facing prompt text for `iterate_on_feedback`.
 * Pure function for testability.
 */
export declare function buildIterateOnFeedbackPrompt(args: {
    feedback: string;
}): string;
export declare function registerIterateOnFeedback(server: McpServer, _bridge: SceneOperations): void;
//# sourceMappingURL=iterate-on-feedback.d.ts.map