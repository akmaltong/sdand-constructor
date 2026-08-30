/**
 * Registry-driven spawn placement tool. Reads `activeLevelId` from useViewer
 * directly (no props), broadcasts placement via store updates + SFX, and
 * uses the shared CursorSphere from @pascal-app/editor for visual parity
 * with legacy placement tools.
 */
declare const SpawnTool: () => import("react").JSX.Element | null;
export default SpawnTool;
//# sourceMappingURL=tool.d.ts.map