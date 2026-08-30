import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SceneOperations } from '../operations';
/** Build the markdown summary. Pure over the SceneGraph snapshot. */
export declare function buildSceneSummaryMarkdown(snapshot: ReturnType<SceneOperations['exportJSON']>): string;
/**
 * `pascal://scene/current/summary` — human-readable scene overview.
 * MIME `text/markdown`.
 */
export declare function registerSceneSummary(server: McpServer, bridge: SceneOperations): void;
//# sourceMappingURL=scene-summary.d.ts.map