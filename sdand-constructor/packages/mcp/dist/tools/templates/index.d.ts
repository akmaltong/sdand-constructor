import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SceneOperations } from '../../operations';
/**
 * Register the template MCP tools (`list_templates`, `create_from_template`)
 * against the given server.
 *
 * When persistence operations are unavailable, `create_from_template` still
 * applies the template to the bridge but skips the save step.
 */
export declare function registerTemplateTools(server: McpServer, bridge: SceneOperations): void;
export { createFromTemplateInput, createFromTemplateOutput, registerCreateFromTemplate, } from './create-from-template';
export { createHouseFromBriefInput, createHouseFromBriefOutput, registerCreateHouseFromBrief, } from './create-house-from-brief';
export { listTemplatesInput, listTemplatesOutput, registerListTemplates, } from './list-templates';
//# sourceMappingURL=index.d.ts.map