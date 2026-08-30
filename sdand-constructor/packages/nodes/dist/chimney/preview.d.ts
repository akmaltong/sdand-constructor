import type { ChimneyNode, RoofSegmentNode } from '@pascal-app/core';
/**
 * The preview needs a segment fixture to build the body height. The
 * placement tool passes the segment under the cursor; before any
 * segment is hit, the preview isn't shown at all (the tool guards on
 * `previewPos`).
 */
declare const ChimneyPreview: ({ node, segment }: {
    node: ChimneyNode;
    segment: RoofSegmentNode;
}) => import("react").JSX.Element;
export default ChimneyPreview;
//# sourceMappingURL=preview.d.ts.map