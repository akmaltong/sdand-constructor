import type { DormerNode } from '@pascal-app/core';
/**
 * The Window tab of the dormer inspector: Hung Wall, Opening, Shape
 * (with rounded/arch sub-controls), Frame, Grid, Sill. Owns local UI
 * state for the "All vs Individual" corner-radius view mode — derived
 * from tuple uniformity by default.
 */
export declare function DormerWindowSection({ node, previewProp, commitProp, handleUpdate, }: {
    node: DormerNode;
    previewProp: (updates: Partial<DormerNode>) => void;
    commitProp: (updates: Partial<DormerNode>) => void;
    handleUpdate: (updates: Partial<DormerNode>) => void;
}): import("react").JSX.Element;
//# sourceMappingURL=panel-window-section.d.ts.map