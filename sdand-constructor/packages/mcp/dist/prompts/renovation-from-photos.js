import { z } from 'zod';
const PREAMBLE = [
    'You are renovating an existing room based on photos of the current space and reference photos of the target aesthetic.',
    '',
    'Follow this procedure:',
    '  1. Call `analyze_floorplan_image` and/or `analyze_room_photo` on EACH current photo to extract walls, rooms, fixtures, and approximate dimensions. Do the same for reference photos.',
    '  2. Compare the current-state analyses to the reference-state analyses. Identify concrete deltas (materials, fixtures, layout changes) that align with the renovation goals.',
    '  3. Emit a single `apply_patch` call containing the minimum set of patches needed to converge the current scene toward the goals.',
    '',
    'Rules:',
    '  - Do not invent dimensions. Pull them from the analysis tool results.',
    '  - Do not modify nodes that are unrelated to the goals.',
    '  - Respond ONLY with tool calls. No prose.',
].join('\n');
function isDataUrl(s) {
    return s.startsWith('data:');
}
function isHttpUrl(s) {
    return s.startsWith('http://') || s.startsWith('https://');
}
/**
 * Rough base64 detector: length multiple of 4, only base64 chars, at least 32 chars long.
 * Deliberately conservative — when in doubt we fall back to text `URL: ...`.
 */
function looksLikeBase64(s) {
    if (s.length < 32)
        return false;
    if (s.length % 4 !== 0)
        return false;
    return /^[A-Za-z0-9+/=]+$/.test(s);
}
/** Extract a base64 payload from a data-URL, or return the raw string. */
function toImageContent(source) {
    if (isDataUrl(source)) {
        const match = /^data:([^;,]+)?(?:;base64)?,(.*)$/.exec(source);
        if (match) {
            const mimeType = match[1] && match[1].length > 0 ? match[1] : 'image/jpeg';
            const data = match[2] ?? '';
            return { type: 'image', data, mimeType };
        }
        return { type: 'text', text: `URL: ${source}` };
    }
    if (isHttpUrl(source)) {
        return { type: 'text', text: `URL: ${source}` };
    }
    if (looksLikeBase64(source)) {
        return { type: 'image', data: source, mimeType: 'image/jpeg' };
    }
    return { type: 'text', text: `URL: ${source}` };
}
/** Parse the stringified list argument (JSON array or comma-separated fallback). */
function parsePhotoList(raw) {
    if (Array.isArray(raw)) {
        return raw.map((s) => String(s)).filter((s) => s.length > 0);
    }
    const str = (raw ?? '').trim();
    if (str.length === 0)
        return [];
    if (str.startsWith('[')) {
        try {
            const parsed = JSON.parse(str);
            if (Array.isArray(parsed)) {
                return parsed.map((s) => String(s)).filter((s) => s.length > 0);
            }
        }
        catch {
            /* fall through to comma-split */
        }
    }
    return str
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}
/**
 * Build the full messages array. Pure function for testability.
 */
export function buildRenovationMessages(args) {
    const current = parsePhotoList(args.currentPhotos);
    const reference = parsePhotoList(args.referencePhotos);
    const intro = [
        PREAMBLE,
        '',
        '## Goals',
        args.goals.trim(),
        '',
        '## Inputs',
        `Current photos: ${current.length} item(s)`,
        `Reference photos: ${reference.length} item(s)`,
    ].join('\n');
    const messages = [
        { role: 'user', content: { type: 'text', text: intro } },
    ];
    if (current.length > 0) {
        messages.push({
            role: 'user',
            content: { type: 'text', text: '## Current photos' },
        });
        for (const src of current) {
            messages.push({ role: 'user', content: toImageContent(src) });
        }
    }
    if (reference.length > 0) {
        messages.push({
            role: 'user',
            content: { type: 'text', text: '## Reference photos' },
        });
        for (const src of reference) {
            messages.push({ role: 'user', content: toImageContent(src) });
        }
    }
    messages.push({
        role: 'user',
        content: {
            type: 'text',
            text: '## Task\nProduce `apply_patch` operations that drive the current scene toward the goals, using only dimensions and fixtures you derived from the analysis tools.',
        },
    });
    return messages;
}
export function registerRenovationFromPhotos(server, _bridge) {
    server.registerPrompt('renovation_from_photos', {
        title: 'Plan a renovation from photos',
        description: 'Plan a minimal-patch renovation given current-state photos, reference-state photos, and free-form goals.',
        argsSchema: {
            // MCP prompt arguments are stringly-typed; accept a JSON array or a
            // comma-separated list of base64 payloads / data URLs / http(s) URLs.
            currentPhotos: z.string(),
            referencePhotos: z.string(),
            goals: z.string(),
        },
    }, async ({ currentPhotos, referencePhotos, goals }) => ({
        messages: buildRenovationMessages({ currentPhotos, referencePhotos, goals }),
    }));
}
