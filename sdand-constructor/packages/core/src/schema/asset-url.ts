import { z } from 'zod'

/**
 * Scheme allowlist for asset-like URLs embedded in scene graphs.
 *
 * Phase 3 security audit: `scan.url`, `guide.url`, `material.texture.url`, and
 * `item.asset.src` were previously bare `z.string()`. That meant an
 * attacker-crafted scene loaded in the editor could beacon to arbitrary URLs
 * (e.g. `javascript:`, `file:///etc/passwd`, `http://169.254.169.254/...`).
 *
 * This validator rejects URLs that don't match the scheme allowlist below.
 */
const ALLOWED_SCHEMES = ['asset:', 'blob:', 'https:', 'data:image/', 'primitive:'] as const

// Sdand: `primitive:box:<hex>` / `primitive:tex:<url>` — маркеры для встроенных
// стенд-примитивов. Обрабатываются в `packages/nodes/item/renderer.tsx`. Для
// `tex:` вложенный URL проходит ту же проверку, чтобы `primitive:tex:javascript:…`
// не обошёл scheme-allowlist.
const HEX_RE = /^[0-9a-fA-F]{3,8}$/
function isAllowedPrimitiveUrl(url: string): boolean {
  if (url.startsWith('primitive:box:')) {
    return HEX_RE.test(url.slice('primitive:box:'.length))
  }
  if (url.startsWith('primitive:tex:')) {
    return isAllowedAssetUrl(url.slice('primitive:tex:'.length))
  }
  return false
}

/**
 * Optional environment variable that narrows which `https:` origins are
 * accepted. Set to a comma-separated list (e.g. `https://cdn.pascal.app`).
 * When unset, any `https:` origin is permitted.
 */
export const ALLOWED_ORIGINS_ENV = 'PASCAL_ALLOWED_ASSET_ORIGINS'

// Narrow access to the environment variable without requiring @types/node in
// this package. The core package ships to both browser and Node contexts.
function readAllowedOrigins(): readonly string[] | undefined {
  const g = globalThis as { process?: { env?: Record<string, string | undefined> } }
  const value = g.process?.env?.[ALLOWED_ORIGINS_ENV]
  if (!value) return undefined
  const list = value
    .split(',')
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0)
  return list.length > 0 ? list : undefined
}

function isAllowedAssetUrl(url: string): boolean {
  if (typeof url !== 'string' || url.length === 0) return false
  if (url.startsWith('asset://')) return true // internal handle
  if (url.startsWith('blob:')) return true // in-memory reference
  if (url.startsWith('data:image/')) return true // inline image only (never data:text/html)
  if (url.startsWith('/')) return true // app-relative path
  if (url.startsWith('primitive:')) return isAllowedPrimitiveUrl(url)
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false
    // http is only permitted for localhost development
    if (parsed.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(parsed.hostname)) {
      return false
    }
    // optional env-driven origin allowlist (only enforced for https URLs)
    if (parsed.protocol === 'https:') {
      const allowlist = readAllowedOrigins()
      if (allowlist) return allowlist.includes(parsed.origin)
    }
    return true
  } catch {
    return false
  }
}

/**
 * Zod validator for asset-style URL fields. Accepts:
 * - `asset://…` internal handles
 * - `blob:…` in-memory references
 * - `data:image/…` inline images (not `data:text/html` or other types)
 * - `/…` app-relative paths
 * - `https://…` public URLs (optionally narrowed to an env allowlist)
 * - `http://localhost[:port]/…` or `http://127.0.0.1/…` for local dev
 *
 * Rejects every other scheme, including `javascript:`, `file:`, `ftp:`,
 * and `data:text/html`, as well as empty strings and non-URL garbage.
 */
export const AssetUrl = z.string().refine(isAllowedAssetUrl, {
  message:
    'URL must be asset://, blob:, data:image/, primitive:box:<hex>, primitive:tex:<url>, /path, or https://. http://localhost allowed for dev.',
})

export type AssetUrl = z.infer<typeof AssetUrl>

// re-export the scheme allowlist for documentation / downstream validators
export { ALLOWED_SCHEMES }
