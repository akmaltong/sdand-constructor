'use client';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { WindowAnimationSystem, WindowSystem } from '@pascal-app/viewer';
/**
 * Registry-driven window system bundle.
 *
 *  - **`WindowSystem`** — rebuilds frame / sash / divider / sill /
 *    muntin geometry. Cascades dirty to parent wall for the cutout.
 *  - **`WindowAnimationSystem`** — advances sash/panel open state at
 *    frame priority 2, then marks the window dirty for the geometry
 *    rebuild at priority 3.
 */
const WindowSystems = () => {
    return (_jsxs(_Fragment, { children: [_jsx(WindowAnimationSystem, {}), _jsx(WindowSystem, {})] }));
};
export default WindowSystems;
