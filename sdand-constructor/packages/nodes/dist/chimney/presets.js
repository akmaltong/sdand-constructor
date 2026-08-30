export const CHIMNEY_PRESET_KEYS = ['brick', 'modern', 'round'];
export const CHIMNEY_PRESET_LABELS = {
    brick: 'Brick',
    modern: 'Modern',
    round: 'Round',
};
export const chimneyPresets = {
    brick: {
        bodyShape: 'square',
        shoulderStyle: 'none',
        cap: true,
        capShape: 'flat',
        capOverhang: 0.04,
        capThickness: 0.06,
        bandStyle: 'double',
        bandHeight: 0.05,
        bandExtent: 0.025,
        bandOffset: 0.4,
        cricketStyle: 'none',
        cornerBevel: 0,
        panelStyle: 'none',
        flueCount: 1,
        flueShape: 'round',
        flueDiameter: 0.2,
        flueHeight: 0.25,
        flueSpacing: 1,
    },
    modern: {
        bodyShape: 'square',
        shoulderStyle: 'none',
        cap: true,
        capShape: 'flat',
        capOverhang: 0.02,
        capThickness: 0.04,
        bandStyle: 'none',
        cricketStyle: 'none',
        cornerBevel: 0,
        panelStyle: 'rectangular',
        panelDepth: 0.015,
        panelHeight: 1.0,
        panelOffsetTop: 0.2,
        panelMargin: 0.12,
        flueCount: 1,
        flueShape: 'round',
        flueDiameter: 0.16,
        flueHeight: 0.18,
        flueSpacing: 1,
    },
    round: {
        bodyShape: 'round',
        shoulderStyle: 'none',
        cap: true,
        capShape: 'flat',
        capOverhang: 0.05,
        capThickness: 0.05,
        bandStyle: 'single',
        bandHeight: 0.04,
        bandExtent: 0.02,
        bandOffset: 0.4,
        cricketStyle: 'none',
        cornerBevel: 0,
        panelStyle: 'none',
        flueCount: 1,
        flueShape: 'round',
        flueDiameter: 0.16,
        flueHeight: 0.2,
        flueSpacing: 1,
    },
};
/**
 * Returns the preset key whose every field matches the supplied node,
 * or `null` if no preset is an exact match (i.e. the user has tweaked
 * fields after applying a preset). Used by the panel to highlight the
 * current preset in the segmented control.
 */
export function detectActiveChimneyPreset(node) {
    if (!node)
        return null;
    for (const key of CHIMNEY_PRESET_KEYS) {
        const preset = chimneyPresets[key];
        const n = node;
        let matches = true;
        for (const k of Object.keys(preset)) {
            if (n[k] !== preset[k]) {
                matches = false;
                break;
            }
        }
        if (matches)
            return key;
    }
    return null;
}
