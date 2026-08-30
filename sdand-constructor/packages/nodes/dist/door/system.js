'use client';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { DoorAnimationSystem, DoorSystem } from '@pascal-app/viewer';
/**
 * Registry-driven door system bundle.
 *
 *  - **`DoorSystem`** — rebuilds frame / leaf / glass / hardware
 *    geometry from `dirtyNodes`. Cascades dirty to the parent wall so
 *    the wall cutout reflects the new door footprint.
 *  - **`DoorAnimationSystem`** — advances `operationState` (open/close
 *    angle for hinged, slide offset for sliding/pocket, fold angle for
 *    folding) at frame priority 2, then marks the door dirty so the
 *    geometry system rebuilds at priority 3.
 *
 * Future: extract the geometry into a pure `buildDoorGeometry(node, ctx)`
 * and migrate to `def.geometry`. The animation system stays as
 * `def.system` (it's a real per-frame concern, not a geometry build).
 */
const DoorSystems = () => {
    return (_jsxs(_Fragment, { children: [_jsx(DoorAnimationSystem, {}), _jsx(DoorSystem, {})] }));
};
export default DoorSystems;
