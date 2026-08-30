import { OUTLET_WALL_THICKNESS, outletDims, outletShapeForProfile, profileFloorMidZ, } from './profile-geometry';
function placeOutlet(gutter, outlet, len, size, t) {
    const shape = outletShapeForProfile(gutter.profile);
    const inner = outletDims(shape, outlet.diameter ?? 0.07);
    const outerHalfX = inner.halfX + OUTLET_WALL_THICKNESS;
    // Default-cap reservation — no mitre awareness here; see header note.
    const capLeftLen = (gutter.endCapLeft ?? true) ? t : 0;
    const capRightLen = (gutter.endCapRight ?? true) ? t : 0;
    const minX = -len / 2 + capLeftLen + outerHalfX;
    const maxX = len / 2 - capRightLen - outerHalfX;
    if (maxX <= minX)
        return null;
    const x = Math.max(minX, Math.min(maxX, outlet.offset ?? 0));
    return {
        x,
        y: -size,
        z: profileFloorMidZ(gutter.profile ?? 'k-style', size),
        bore: inner.halfX,
        shape,
        innerHalfX: inner.halfX,
        innerHalfZ: inner.halfZ,
    };
}
function gutterDims(gutter) {
    const len = Math.max(0.05, gutter.length);
    const size = Math.max(0.04, gutter.size);
    const t = Math.min(Math.max(0.001, gutter.thickness), size * 0.4);
    return { len, size, t };
}
/** Placement of the gutter's outlet with the given id, or null if absent / doesn't fit. */
export function resolveGutterOutletById(gutter, outletId) {
    if (!outletId)
        return null;
    const outlet = (gutter.outlets ?? []).find((o) => o.id === outletId);
    if (!outlet)
        return null;
    const { len, size, t } = gutterDims(gutter);
    return placeOutlet(gutter, outlet, len, size, t);
}
/** Placements for every fitting outlet, tagged with its id. */
export function resolveGutterOutlets(gutter) {
    const { len, size, t } = gutterDims(gutter);
    const out = [];
    for (const outlet of gutter.outlets ?? []) {
        const p = placeOutlet(gutter, outlet, len, size, t);
        if (p)
            out.push({ ...p, id: outlet.id });
    }
    return out;
}
