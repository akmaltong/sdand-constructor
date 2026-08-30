import { type WallNode } from '@pascal-app/core';
/**
 * Phase 5 Stage D — wall curve tool (kind-owned).
 *
 * 1:1 port of the legacy `CurveWallTool`. Same snap pipeline, Shift
 * override, history dance, activation grace. The wall variant uses
 * `useScene.temporal.getState().pause()` / `.resume()` directly rather
 * than the depth-counted `pauseSceneHistory` helpers — matches legacy.
 */
export declare const CurveWallTool: React.FC<{
    node: WallNode;
}>;
export default CurveWallTool;
//# sourceMappingURL=curve-tool.d.ts.map