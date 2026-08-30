import { loadAssetUrl } from '@pascal-app/core';
export const ASSETS_CDN_URL = process.env.NEXT_PUBLIC_ASSETS_CDN_URL || 'https://editor.pascal.app';
function getAssetsCdnUrl() {
    return process.env.NEXT_PUBLIC_ASSETS_CDN_URL || ASSETS_CDN_URL;
}
/**
 * Resolves an asset URL to the appropriate format:
 * - If URL starts with http:// or https://, return as-is (external URL)
 * - If URL starts with asset://, resolve from IndexedDB storage
 * - If URL starts with /, return as-is when no CDN is configured, otherwise prepend CDN URL
 * - Otherwise, prepend CDN URL (relative path)
 */
export async function resolveAssetUrl(url) {
    if (!url)
        return null;
    // External URL - use as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    // Blob / data URLs — уже готовы к загрузке загрузчиками three.js
    if (url.startsWith('blob:') || url.startsWith('data:')) {
        return url;
    }
    // IndexedDB asset - resolve from storage
    if (url.startsWith('asset://')) {
        return loadAssetUrl(url);
    }
    // Preserve local editor public assets referenced by absolute path.
    if (url.startsWith('/equipment/')) {
        return url;
    }
    // If there's no CDN configured, keep app-local absolute paths as-is
    if (url.startsWith('/') && !process.env.NEXT_PUBLIC_ASSETS_CDN_URL) {
        return url;
    }
    // Absolute or relative path - prepend CDN URL
    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    return `${getAssetsCdnUrl()}${normalizedPath}`;
}
/**
 * Synchronous version for URLs that don't need IndexedDB resolution
 * Only use this if you're sure the URL is not an asset:// URL
 */
export function resolveCdnUrl(url) {
    if (!url)
        return null;
    // External URL - use as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    // Blob / data URLs — импортированные пользователем модели через
    // URL.createObjectURL (blob:) или inline dataURI (data:). Отдаём как есть,
    // иначе резолвер приклеит CDN-префикс и useGLTF повиснет на мусорном URL,
    // оставляя серый плейсхолдер вместо реальной модели.
    if (url.startsWith('blob:') || url.startsWith('data:')) {
        return url;
    }
    // Don't use this for asset:// URLs - use resolveAssetUrl instead
    if (url.startsWith('asset://')) {
        console.warn('Use resolveAssetUrl() for asset:// URLs, not resolveCdnUrl()');
        return null;
    }
    // Preserve local editor public assets referenced by absolute path.
    if (url.startsWith('/equipment/')) {
        return url;
    }
    // If there's no CDN configured, keep app-local absolute paths as-is
    if (url.startsWith('/') && !process.env.NEXT_PUBLIC_ASSETS_CDN_URL) {
        return url;
    }
    // Absolute or relative path - prepend CDN URL
    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    return `${getAssetsCdnUrl()}${normalizedPath}`;
}
