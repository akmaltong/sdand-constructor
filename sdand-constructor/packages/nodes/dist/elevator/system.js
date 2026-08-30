'use client';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { ElevatorOpeningSystem, ElevatorRuntimeSystem } from '@pascal-app/core';
import { ElevatorInteractionSystem } from '@pascal-app/viewer';
/**
 * Composite system for elevator — bundles three per-frame systems:
 * `ElevatorRuntimeSystem` (cab travel + door state machine),
 * `ElevatorInteractionSystem` (call buttons / cab UI), and
 * `ElevatorOpeningSystem` (wall + slab cutout cascade).
 */
export default function ElevatorSystem() {
    return (_jsxs(_Fragment, { children: [_jsx(ElevatorRuntimeSystem, {}), _jsx(ElevatorInteractionSystem, {}), _jsx(ElevatorOpeningSystem, {})] }));
}
