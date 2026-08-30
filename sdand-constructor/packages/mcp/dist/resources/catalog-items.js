import { MCP_CATALOG_ITEMS } from '../tools/asset-catalog';
/**
 * `pascal://catalog/items` — small built-in item catalog for standalone MCP.
 *
 * The editor UI owns the full catalog. MCP intentionally keeps a dependency-free
 * subset so headless agents can still place realistic furniture and fixtures.
 */
export function registerCatalogItems(server, _bridge) {
    server.registerResource('catalog-items', 'pascal://catalog/items', {
        title: 'Item catalog',
        description: 'Dependency-free catalog subset of placeable items available in standalone MCP mode.',
        mimeType: 'application/json',
    }, async (uri) => {
        const payload = {
            status: 'ok',
            items: MCP_CATALOG_ITEMS,
            note: 'Standalone MCP catalog subset; host applications can still expose a larger catalog separately.',
        };
        return {
            contents: [
                {
                    uri: uri.href,
                    mimeType: 'application/json',
                    text: JSON.stringify(payload),
                },
            ],
        };
    });
}
