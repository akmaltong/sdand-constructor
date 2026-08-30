import { registerGenerateVariants } from './generate-variants';
/**
 * Register the variant-generation MCP tools against shared scene operations.
 */
export function registerVariantTools(server, bridge) {
    registerGenerateVariants(server, bridge);
}
export { generateVariantsInput, generateVariantsOutput, registerGenerateVariants, } from './generate-variants';
export { applyMutation, describeVariant, mulberry32, } from './mutations';
