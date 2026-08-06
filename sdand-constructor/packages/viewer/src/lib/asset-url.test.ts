// @ts-expect-error — bun:test is provided by the Bun runtime; viewer does not depend on @types/bun so the import type is unresolved at compile time.
import { describe, expect, test } from 'bun:test'
import { resolveCdnUrl } from './asset-url'

describe('resolveCdnUrl', () => {
  test('preserves local absolute paths when no CDN is configured', () => {
    const originalCdn = process.env.NEXT_PUBLIC_ASSETS_CDN_URL
    try {
      delete process.env.NEXT_PUBLIC_ASSETS_CDN_URL
      expect(resolveCdnUrl('/equipment/furniture.glb')).toBe('/equipment/furniture.glb')
    } finally {
      process.env.NEXT_PUBLIC_ASSETS_CDN_URL = originalCdn
    }
  })

  test('prepends configured CDN URL for absolute paths when CDN is configured', () => {
    const originalCdn = process.env.NEXT_PUBLIC_ASSETS_CDN_URL
    try {
      process.env.NEXT_PUBLIC_ASSETS_CDN_URL = 'https://cdn.example.com'
      expect(resolveCdnUrl('/items/chair/model.glb')).toBe('https://cdn.example.com/items/chair/model.glb')
    } finally {
      process.env.NEXT_PUBLIC_ASSETS_CDN_URL = originalCdn
    }
  })

  test('preserves local /equipment paths even when CDN is configured', () => {
    const originalCdn = process.env.NEXT_PUBLIC_ASSETS_CDN_URL
    try {
      process.env.NEXT_PUBLIC_ASSETS_CDN_URL = 'https://cdn.example.com'
      expect(resolveCdnUrl('/equipment/lcd_65.glb')).toBe('/equipment/lcd_65.glb')
    } finally {
      process.env.NEXT_PUBLIC_ASSETS_CDN_URL = originalCdn
    }
  })
})
