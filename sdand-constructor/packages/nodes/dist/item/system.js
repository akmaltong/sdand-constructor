'use client';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { ItemLightSystem, ItemSystem } from '@pascal-app/viewer';
/**
 * Registry-driven item system bundle.
 *
 *  - **`ItemSystem`** — applies attachTo-driven transforms each frame
 *    (wall-side z-offset, slab elevation, ceiling mounting).
 *  - **`ItemLightSystem`** — manages light sources attached to items
 *    (lamps, ceiling lights, etc.).
 */
const ItemSystems = () => {
    return (_jsxs(_Fragment, { children: [_jsx(ItemSystem, {}), _jsx(ItemLightSystem, {})] }));
};
export default ItemSystems;
