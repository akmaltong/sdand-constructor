export declare const SSGI_PARAMS: {
    enabled: boolean;
    sliceCount: number;
    stepCount: number;
    radius: number;
    expFactor: number;
    thickness: number;
    backfaceLighting: number;
    aoIntensity: number;
    giIntensity: number;
    useLinearThickness: boolean;
    useScreenSpaceSampling: boolean;
    useTemporalFiltering: boolean;
};
export type HoverStyle = {
    visibleColor: number;
    hiddenColor: number;
    strength: number;
    pulse: boolean;
};
export type HoverStyles = {
    default: HoverStyle;
} & Record<string, HoverStyle>;
export declare const DEFAULT_HOVER_STYLES: HoverStyles;
declare const PostProcessingPasses: ({ hoverStyles, }: {
    hoverStyles?: HoverStyles;
}) => null;
export default PostProcessingPasses;
//# sourceMappingURL=post-processing.d.ts.map