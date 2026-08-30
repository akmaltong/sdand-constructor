import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
export declare const listTemplatesInput: {};
export declare const listTemplatesOutput: {
    templates: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        nodeCount: z.ZodNumber;
    }, z.core.$strip>>;
};
/**
 * `list_templates` — enumerate the seed templates shipped with the MCP server.
 * Stateless; used by the `from_brief` prompt and by the UI to populate a
 * "start from a template" picker.
 */
export declare function registerListTemplates(server: McpServer): void;
//# sourceMappingURL=list-templates.d.ts.map