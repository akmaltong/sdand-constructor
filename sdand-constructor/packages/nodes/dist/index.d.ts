import type { Plugin } from '@pascal-app/core';
/**
 * Built-in plugin bundling every node kind shipped with the Pascal editor.
 *
 * Apps load this once at bootstrap (`loadPlugin(builtinPlugin)`) before
 * mounting the viewer. New built-in nodes are added by creating a folder
 * here under `src/<kind>/` and appending its `NodeDefinition` below.
 *
 * External plugins follow the exact same shape — same `Plugin` type, same
 * `loadPlugin` call path. This is intentional: the API is stress-tested
 * by built-ins before any third-party plugin lands.
 *
 * All kinds are registered unconditionally. Parity is verified by
 * comparing against deployed production rather than an in-app env-var
 * flag toggle. As of Phase 6 the legacy mount points in `viewer/` are
 * gone — every kind dispatches through the registry.
 */
export declare const builtinPlugin: Plugin;
export { boxVentDefinition } from './box-vent';
export { buildingDefinition } from './building';
export { ceilingDefinition } from './ceiling';
export { chimneyDefinition } from './chimney';
export { columnDefinition } from './column';
export { cupolaDefinition } from './cupola';
export { doorDefinition } from './door';
export { dormerDefinition } from './dormer';
export { downspoutDefinition } from './downspout';
export { elevatorDefinition } from './elevator';
export { eyebrowVentDefinition } from './eyebrow-vent';
export { fenceDefinition } from './fence';
export { guideDefinition } from './guide';
export { gutterDefinition } from './gutter';
export { itemDefinition } from './item';
export { levelDefinition } from './level';
export { ridgeVentDefinition } from './ridge-vent';
export { roofDefinition } from './roof';
export { roofSegmentDefinition } from './roof-segment';
export { scanDefinition } from './scan';
export { shelfDefinition } from './shelf';
export { siteDefinition } from './site';
export { skylightDefinition } from './skylight';
export { slabDefinition } from './slab';
export { solarPanelDefinition } from './solar-panel';
export { spawnDefinition } from './spawn';
export { stairDefinition } from './stair';
export { stairSegmentDefinition } from './stair-segment';
export { turbineVentDefinition } from './turbine-vent';
export { wallDefinition } from './wall';
export { windowDefinition } from './window';
export { zoneDefinition } from './zone';
export { getStandModel, hasStandModel, setStandModel } from './item/stand-model-cache';
//# sourceMappingURL=index.d.ts.map