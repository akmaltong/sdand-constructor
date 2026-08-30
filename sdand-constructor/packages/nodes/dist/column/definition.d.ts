import { type NodeDefinition } from '@pascal-app/core';
import { ColumnNode } from './schema';
/**
 * Column — Stage A registration. Wrap-export of the legacy
 * `ColumnRenderer` (no system — column geometry is computed inline in
 * the renderer). Inspector / move / floorplan still go through legacy
 * paths via panel-manager.tsx / item-move-tool.tsx / floorplan-panel.tsx
 * (their hardcoded `case 'column':` entries fire before the registry
 * fallback).
 *
 * Capabilities: column doesn't declare `movable` because its move is
 * bespoke (legacy MoveColumnTool snaps to slab + free placement on
 * the X/Z plane with rotation).
 *
 * Defaults computed via stub-parse so we leverage every zod
 * `.default()` annotation on the schema (~60 fields).
 */
export declare const columnDefinition: NodeDefinition<typeof ColumnNode>;
//# sourceMappingURL=definition.d.ts.map