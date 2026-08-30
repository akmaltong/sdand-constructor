import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SceneOperations } from '../../operations';
/**
 * Register the variant-generation MCP tools against shared scene operations.
 */
export declare function registerVariantTools(server: McpServer, bridge: SceneOperations): void;
export { generateVariantsInput, generateVariantsOutput, registerGenerateVariants, } from './generate-variants';
export { applyMutation, describeVariant, type MutationKind, mulberry32, type Rng, } from './mutations';
//# sourceMappingURL=index.d.ts.map