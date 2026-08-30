'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ActionButton, ActionGroup, PanelSection } from '@pascal-app/editor';
import { Copy, Move, Trash2 } from 'lucide-react';
/**
 * Move / Duplicate / Delete buttons at the bottom of the dormer
 * inspector. Pure presentation — owners pass the three handlers.
 */
export function DormerActionsSection({ onMove, onDuplicate, onDelete, }) {
    return (_jsx(PanelSection, { title: "Actions", children: _jsxs(ActionGroup, { children: [_jsx(ActionButton, { icon: _jsx(Move, { className: "h-3.5 w-3.5" }), label: "Move", onClick: onMove }), _jsx(ActionButton, { icon: _jsx(Copy, { className: "h-3.5 w-3.5" }), label: "Duplicate", onClick: onDuplicate }), _jsx(ActionButton, { className: "hover:bg-red-500/20", icon: _jsx(Trash2, { className: "h-3.5 w-3.5 text-red-400" }), label: "Delete", onClick: onDelete })] }) }));
}
