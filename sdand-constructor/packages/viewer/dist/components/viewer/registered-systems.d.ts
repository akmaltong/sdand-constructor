/**
 * Mounts every registered node kind's system component, ordered by
 * `system.priority` (default {@link DEFAULT_PRIORITY}).
 *
 * Today the registry is empty so this component mounts nothing — coexists
 * with legacy `*-System` components in `<Viewer>`. Once kinds register via
 * `@pascal-app/nodes`, each kind's registry-driven system takes over and
 * its legacy counterpart short-circuits via the `nodeRegistry.has(kind)`
 * guard added to each legacy system.
 */
export declare function RegisteredSystems(): import("react").JSX.Element | null;
//# sourceMappingURL=registered-systems.d.ts.map