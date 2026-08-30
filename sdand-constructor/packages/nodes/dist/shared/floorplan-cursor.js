import { isFreshPlacementMetadata, resolvePlanarCursorPosition, } from '@pascal-app/editor';
export function createFloorplanCursorResolver(args) {
    const original = [args.original[0], args.original[1]];
    const mode = args.mode ?? (isFreshPlacementMetadata(args.metadata) ? 'absolute' : 'relative');
    let anchor = null;
    return (planPoint, options = {}) => {
        const resolved = resolvePlanarCursorPosition({
            cursor: [planPoint[0], planPoint[1]],
            original,
            anchor,
            mode,
            ...(options.snap ? { snap: options.snap } : {}),
        });
        anchor = resolved.anchor;
        return resolved.point;
    };
}
