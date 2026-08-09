'use client'

import { useScene } from '@pascal-app/core'
import { CATALOG_ITEMS } from '@pascal-app/editor'
import { useEffect } from 'react'
import { syncDefaultVenue, type VenueConfig } from '@/lib/venue-seed'

export type VenueId = 'gostinka' | 'manezh'

const VENUES: Record<VenueId, VenueConfig & { label: string }> = {
  gostinka: {
    // Обновлено: SM_GostinnyDwor.glb (bbox из scratchpad/measure-glb.mjs)
    url: '/venues/SM_GostinnyDwor.glb',
    label: 'Гостинка',
    footprint: { x: -97.7, z: -50.3, width: 197.18, depth: 91.24 },
  },
  manezh: {
    url: '/venues/SM_Manezh.glb?v=2',
    label: 'Манеж',
    footprint: { x: -79.6, z: -22.68, width: 169.06, depth: 47.74 },
  },
}

export function DefaultVenueSeeder({ venue }: { venue?: VenueId | null }) {
  const nodes = useScene((s) => s.nodes)
  const venueConfig = venue ? VENUES[venue] : null

  ;(globalThis as { __sdandSeederRender?: number }).__sdandSeederRender =
    ((globalThis as { __sdandSeederRender?: number }).__sdandSeederRender ?? 0) + 1

  useEffect(() => {
    ;(globalThis as { __sdandSeederEffect?: number }).__sdandSeederEffect =
      ((globalThis as { __sdandSeederEffect?: number }).__sdandSeederEffect ?? 0) + 1

    // venue=null → удалить все venue-scan ноды и не создавать новую.
    if (!venueConfig) {
      const state = useScene.getState()
      const deadScans = Object.entries(state.nodes).filter(
        ([, n]) =>
          (n as { type?: string; metadata?: { tag?: string } }).type === 'scan' &&
          (n as { metadata?: { tag?: string } }).metadata?.tag === 'sdand:default-venue',
      )
      for (const [id] of deadScans) state.deleteNode(id as never)
      return
    }

    const result = syncDefaultVenue(useScene.getState(), venueConfig, CATALOG_ITEMS)

    ;(globalThis as { __sdandSeederNodeCount?: number }).__sdandSeederNodeCount =
      Object.keys(nodes).length
    ;(globalThis as { __sdandNodes?: unknown }).__sdandNodes = Object.entries(nodes).map(
      ([id, n]) => {
        const rec = n as {
          type?: string
          parentId?: string | null
          position?: unknown
          rotation?: unknown
          url?: unknown
          metadata?: unknown
          asset?: { src?: unknown; name?: unknown; dimensions?: unknown; offset?: unknown }
        }
        return {
          id,
          type: rec.type,
          parentId: rec.parentId,
          position: rec.position,
          rotation: rec.rotation,
          url: typeof rec.url === 'string' ? rec.url : undefined,
          src: typeof rec.asset?.src === 'string' ? rec.asset.src : undefined,
          assetName: rec.asset?.name,
          assetDims: rec.asset?.dimensions,
          assetOffset: rec.asset?.offset,
          tag: (rec.metadata as { tag?: string } | undefined)?.tag,
        }
      },
    )

    if (result.created) {
      console.log('[sdand] default venue seeded under level', result.levelId, venue)
    }
  }, [nodes, venue, venueConfig])

  return null
}
