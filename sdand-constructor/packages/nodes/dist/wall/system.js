'use client';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { WallCutout, WallSystem } from '@pascal-app/viewer';
/**
 * Registry-driven wall system bundle.
 *
 *  - **`WallSystem`** — reads `dirtyNodes`, batches by level, runs
 *    `calculateLevelMiters(levelWalls)`, rebuilds geometry via
 *    `generateExtrudedWall(node, children, miterData, slabElevation)`,
 *    and cascades to adjacent walls that share a junction. This is the
 *    bulk of the wall runtime (~820 lines in viewer).
 *  - **`WallCutout`** — cutaway-mode hide/show logic based on camera
 *    direction and `frontSide` / `backSide` interior/exterior tags.
 */
const WallSystems = () => {
    return (_jsxs(_Fragment, { children: [_jsx(WallSystem, {}), _jsx(WallCutout, {})] }));
};
export default WallSystems;
