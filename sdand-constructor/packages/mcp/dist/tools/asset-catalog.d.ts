import type { AssetInput } from '@pascal-app/core/schema';
/**
 * Small built-in catalog for standalone/headless MCP use.
 *
 * The editor has a much larger UI catalog, but depending on `@pascal-app/editor`
 * from the MCP package would pull browser/React code into the headless server.
 * These entries mirror the stable IDs and asset paths used by the editor for
 * common AI-generated residential layouts.
 */
export declare const MCP_CATALOG_ITEMS: AssetInput[];
export declare function findCatalogItem(id: string): AssetInput | undefined;
export declare function searchCatalogItems(args: {
    query: string;
    category?: string | undefined;
}): AssetInput[];
//# sourceMappingURL=asset-catalog.d.ts.map