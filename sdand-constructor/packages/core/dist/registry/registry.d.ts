import type { AnyNodeDefinition, NodeRegistry, Plugin } from './types';
export declare const nodeRegistry: NodeRegistry & {
    _register: (def: AnyNodeDefinition) => void;
    _reset: () => void;
};
export declare function registerNode(def: AnyNodeDefinition): void;
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
export declare function getSelectableKinds(): string[];
/**
 * Returns true when the kind is declared selectable in the registry. Use
 * in expression chains like `if (node.type === 'wall' || isRegistrySelectable(node.type))`.
 */
export declare function isRegistrySelectable(kind: string): boolean;
/**
 * Kinds whose `def.floorplanScope` matches the requested scope. Used by
 * `FloorplanRegistryLayer` to discover building-scoped kinds (e.g.
 * elevator) without hardcoding kind names in the editor layer. `'level'`
 * is the default, so `kindsWithFloorplanScope('level')` includes kinds
 * that didn't set the field at all.
 */
export declare function kindsWithFloorplanScope(scope: 'level' | 'building'): string[];
/**
 * Returns true when the kind is movable from a 2D floor-plan handle —
 * either via `capabilities.movable`, an explicit
 * `def.floorplanMoveTarget`, or an `affordanceTools.move` 3D mover that
 * the floating action menu can engage. Replaces the kind-name ternary
 * chain in `floating-action-menu.tsx`.
 */
export declare function isRegistryMovable(kind: string): boolean;
/**
 * Whether the kind can be saved as a reusable preset. Default: an
 * explicit `capabilities.presettable` boolean wins; otherwise the kind
 * is presettable iff it declares `def.parametrics`. Read by host apps
 * (community shell) to gate "save as preset" UI on a selection.
 */
export declare function isPresettable(def: AnyNodeDefinition): boolean;
export declare function isPresettableKind(kind: string): boolean;
/**
 * Names of schema fields on `def` that are host references (`wallId`,
 * `wallT`, etc.). Read by host apps at preset-save time to strip these
 * from the stored payload — see `def.capabilities.hostRefFields` docs.
 * Returns an empty array for kinds that don't declare any.
 */
export declare function getHostRefFields(def: AnyNodeDefinition): ReadonlyArray<string>;
/**
 * Whether instances of this kind are created by drawing with a build tool
 * (tool id === node `type`) rather than dropping a finished instance. Read
 * by host apps to route preset placement of such kinds through
 * `setToolDefaults(type, params)` + `setTool(type)` — see
 * `def.capabilities.drawTool` docs.
 */
export declare function isDrawnViaTool(def: AnyNodeDefinition): boolean;
export declare function isDrawnViaToolKind(kind: string): boolean;
export declare function loadPlugin(plugin: Plugin): Promise<void>;
/**
 * App-level plugin discovery hook. The bootstrap loads `builtinPlugin`
 * unconditionally and then awaits this to pick up any extra plugins
 * (third-party node packs, AI-authored bundles, user-installed kinds).
 * Defaults to returning `[]` — apps that want external plugins call
 * {@link setPluginDiscovery} before the bootstrap module runs.
 *
 * Kept async so a future loader can fetch over the network without
 * changing the contract. See `wiki/editor-plugin-authoring.md` for the
 * plugin author surface this enables.
 */
export type PluginDiscovery = () => Promise<Plugin[]>;
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
export declare function setPluginDiscovery(fn: PluginDiscovery): void;
/**
 * Run the active plugin discovery and return the discovered plugins.
 * Bootstrap code is expected to call this after `loadPlugin(builtinPlugin)`
 * and then `await loadPlugin(...)` each result in order.
 */
export declare function discoverPlugins(): Promise<Plugin[]>;
//# sourceMappingURL=registry.d.ts.map