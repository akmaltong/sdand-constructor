/**
 * Ridge vent placement tool. The cursor preview snaps to the ridge
 * (Z=0 in segment-local space) of whichever segment is under the
 * cursor, since the ridge vent's whole purpose is to sit on the peak.
 * Click anywhere on a segment commits the vent at the ridge directly
 * above that hit (X stays where the cursor was, Z snaps to 0).
 */
declare const RidgeVentTool: () => import("react").JSX.Element | null;
export default RidgeVentTool;
//# sourceMappingURL=tool.d.ts.map