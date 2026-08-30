const HOST_API_VERSION = 1;
// True in dev / test builds, false in production. Tries Vite's
// `import.meta.env.DEV` first (the editor app's bundler) and falls back
// to `process.env.NODE_ENV !== 'production'` for Node test runners.
function isDevMode() {
    try {
        const meta = import.meta;
        if (typeof meta?.env?.DEV === 'boolean')
            return meta.env.DEV;
    }
    catch {
        // import.meta unavailable in some CJS contexts — fall through.
    }
    if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
        return process.env.NODE_ENV !== 'production';
    }
    // No environment signal — be safe and treat as production.
    return false;
}
class NodeRegistryImpl {
    defs = new Map();
    has(kind) {
        return this.defs.has(kind);
    }
    get(kind) {
        return this.defs.get(kind);
    }
    entries() {
        return this.defs.entries();
    }
    schemas() {
        return Array.from(this.defs.values(), (d) => d.schema);
    }
    get size() {
        return this.defs.size;
    }
    // Internal — exposed via registerNode below.
    _register(def) {
        if (typeof def.kind !== 'string' || def.kind.length === 0) {
            throw new Error('[registry] NodeDefinition.kind must be a non-empty string');
        }
        if (typeof def.schemaVersion !== 'number' || def.schemaVersion < 1) {
            throw new Error(`[registry] NodeDefinition.schemaVersion must be a positive integer (kind: "${def.kind}")`);
        }
        // Duplicate-kind handling depends on environment:
        //   - **Production**: throw. The plugin-authoring contract
        //     (`wiki/architecture/plugin-authoring.md`) guarantees that two
        //     plugins shipping `kind: 'couch'` is a startup-time error, not
        //     a silent overwrite — collisions need to be visible.
        //   - **Dev (HMR)**: replace with a warning. Saving `def.ts` would
        //     otherwise either crash on re-execute or skip it entirely,
        //     leaving stale descriptors pinned in memory.
        if (this.defs.has(def.kind)) {
            if (isDevMode()) {
                console.warn(`[registry] re-registering node kind "${def.kind}" (HMR)`);
            }
            else {
                throw new Error(`[registry] duplicate node kind: "${def.kind}" already registered`);
            }
        }
        this.defs.set(def.kind, def);
    }
    // Test-only — clears the registry. Not exported from the package barrel.
    _reset() {
        this.defs.clear();
    }
}
export const nodeRegistry = new NodeRegistryImpl();
export function registerNode(def) {
    nodeRegistry._register(def);
}
/**
 * Returns the set of registered kinds whose definition declares the
 * `selectable` capability. Callers that maintain hardcoded "selectable kinds"
 * lists (SelectionManager, FloatingActionMenu) should concat this with their
 * legacy entries instead of editing the hardcoded list per migration.
 *
 * Phase 6 deletes the hardcoded lists entirely and uses this function as the
 * single source of truth. For now it's additive over the legacy lists so the
 * existing kinds keep working unchanged.
 */
export function getSelectableKinds() {
    const result = [];
    for (const [kind, def] of nodeRegistry.entries()) {
        if (def.capabilities.selectable !== undefined) {
            result.push(kind);
        }
    }
    return result;
}
/**
 * Returns true when the kind is declared selectable in the registry. Use
 * in expression chains like `if (node.type === 'wall' || isRegistrySelectable(node.type))`.
 */
export function isRegistrySelectable(kind) {
    return nodeRegistry.get(kind)?.capabilities.selectable !== undefined;
}
/**
 * Kinds whose `def.floorplanScope` matches the requested scope. Used by
 * `FloorplanRegistryLayer` to discover building-scoped kinds (e.g.
 * elevator) without hardcoding kind names in the editor layer. `'level'`
 * is the default, so `kindsWithFloorplanScope('level')` includes kinds
 * that didn't set the field at all.
 */
export function kindsWithFloorplanScope(scope) {
    const result = [];
    for (const [kind, def] of nodeRegistry.entries()) {
        const declared = def.floorplanScope ?? 'level';
        if (declared === scope)
            result.push(kind);
    }
    return result;
}
/**
 * Returns true when the kind is movable from a 2D floor-plan handle —
 * either via `capabilities.movable`, an explicit
 * `def.floorplanMoveTarget`, or an `affordanceTools.move` 3D mover that
 * the floating action menu can engage. Replaces the kind-name ternary
 * chain in `floating-action-menu.tsx`.
 */
export function isRegistryMovable(kind) {
    const def = nodeRegistry.get(kind);
    if (!def)
        return false;
    if (def.capabilities.movable !== undefined)
        return true;
    if (def.floorplanMoveTarget !== undefined)
        return true;
    if (def.affordanceTools?.move !== undefined)
        return true;
    return false;
}
/**
 * Whether the kind can be saved as a reusable preset. Default: an
 * explicit `capabilities.presettable` boolean wins; otherwise the kind
 * is presettable iff it declares `def.parametrics`. Read by host apps
 * (community shell) to gate "save as preset" UI on a selection.
 */
export function isPresettable(def) {
    if (typeof def.capabilities.presettable === 'boolean') {
        return def.capabilities.presettable;
    }
    return def.parametrics !== undefined;
}
export function isPresettableKind(kind) {
    const def = nodeRegistry.get(kind);
    return def ? isPresettable(def) : false;
}
/**
 * Names of schema fields on `def` that are host references (`wallId`,
 * `wallT`, etc.). Read by host apps at preset-save time to strip these
 * from the stored payload — see `def.capabilities.hostRefFields` docs.
 * Returns an empty array for kinds that don't declare any.
 */
export function getHostRefFields(def) {
    return def.capabilities.hostRefFields ?? [];
}
/**
 * Whether instances of this kind are created by drawing with a build tool
 * (tool id === node `type`) rather than dropping a finished instance. Read
 * by host apps to route preset placement of such kinds through
 * `setToolDefaults(type, params)` + `setTool(type)` — see
 * `def.capabilities.drawTool` docs.
 */
export function isDrawnViaTool(def) {
    return def.capabilities.drawTool === true;
}
export function isDrawnViaToolKind(kind) {
    const def = nodeRegistry.get(kind);
    return def ? isDrawnViaTool(def) : false;
}
export async function loadPlugin(plugin) {
    if (plugin.apiVersion !== HOST_API_VERSION) {
        throw new Error(`[registry] plugin "${plugin.id}" requires apiVersion ${plugin.apiVersion}; host supports ${HOST_API_VERSION}`);
    }
    for (const def of plugin.nodes ?? []) {
        registerNode(def);
    }
}
let pluginDiscovery = async () => [];
/**
 * Replace the plugin discovery implementation. Call once at app startup
 * before {@link discoverPlugins} is invoked (bootstrap order matters).
 *
 * The contract is intentionally minimal — just "return a list of
 * plugins to load." The loader can be a static `import.meta.glob`, a
 * `fetch` against a registry endpoint, a worker IPC, etc. Each returned
 * plugin still goes through {@link loadPlugin} so the same API-version
 * gate + duplicate-kind protection applies.
 */
export function setPluginDiscovery(fn) {
    pluginDiscovery = fn;
}
/**
 * Run the active plugin discovery and return the discovered plugins.
 * Bootstrap code is expected to call this after `loadPlugin(builtinPlugin)`
 * and then `await loadPlugin(...)` each result in order.
 */
export function discoverPlugins() {
    return pluginDiscovery();
}
