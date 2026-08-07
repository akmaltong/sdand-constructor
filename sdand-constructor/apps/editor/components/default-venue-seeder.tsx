'use client'

import { ScanNode, useScene } from '@pascal-app/core'
import { CATALOG_ITEMS } from '@pascal-app/editor'
import { useEffect } from 'react'

// «Гостинка» — дефолтная площадка. Кладём под первый Level один Scan-узел
// со ссылкой на локальный gltf. Scan игнорирует raycast и bbox-коллизии,
// так что коллизии стендов внутри работают корректно (см. packages/nodes/src/scan/renderer.tsx).
const VENUE_URL = '/venues/SM_GOSTINKA.glb'
const VENUE_TAG = 'sdand:default-venue'

function nodeHasDeadBlobUrl(n: unknown): boolean {
  const rec = n as { url?: unknown; asset?: { src?: unknown } }
  const url = typeof rec.url === 'string' ? rec.url : null
  const src = typeof rec.asset?.src === 'string' ? (rec.asset.src as string) : null
  return (
    (url?.startsWith('blob:') ?? false) ||
    (src?.startsWith('blob:') ?? false) ||
    (src?.startsWith('primitive:tex:blob:') ?? false)
  )
}

export function DefaultVenueSeeder() {
  // Подписка на nodes: persist подтягивает сцену асинхронно, а первый рендер
  // видит пустой store. Реагируем на каждый апдейт идемпотентно.
  const nodes = useScene((s) => s.nodes)

  ;(globalThis as { __sdandSeederRender?: number }).__sdandSeederRender =
    ((globalThis as { __sdandSeederRender?: number }).__sdandSeederRender ?? 0) + 1

  useEffect(() => {
    ;(globalThis as { __sdandSeederEffect?: number }).__sdandSeederEffect =
      ((globalThis as { __sdandSeederEffect?: number }).__sdandSeederEffect ?? 0) + 1
    const state = useScene.getState()
    ;(globalThis as { __sdandSeederNodeCount?: number }).__sdandSeederNodeCount = Object.keys(
      state.nodes,
    ).length
    ;(globalThis as { __sdandNodes?: unknown }).__sdandNodes = Object.entries(state.nodes).map(
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
    const nodesRecord = state.nodes as Record<
      string,
      { type: string; parentId?: string | null; metadata?: Record<string, unknown>; url?: unknown; asset?: { src?: unknown } }
    >

    // 1) Sweeper: чистим ноды с мёртвыми blob:-URL, пережившие reload.
    //    URL.createObjectURL валиден только в рамках одной страницы;
    //    persisted-нода тянет их и вешает useGLTF при следующем открытии.
    const dead = Object.entries(nodesRecord)
      .filter(([, n]) => nodeHasDeadBlobUrl(n))
      .map(([id]) => id)
    for (const id of dead) state.deleteNode(id as never)

    // 1b) Миграция asset. При обновлении CATALOG_ITEMS (например, поправили
    //     dimensions/offset модели) старые item-ноды хранят снапшот asset на
    //     момент создания. Находим их по src и обновляем asset in-place —
    //     иначе placement будет с устаревшими размерами и модель уедет от pivot.
    for (const [id, n] of Object.entries(nodesRecord)) {
      const rec = n as { type?: string; asset?: { src?: unknown; dimensions?: unknown; offset?: unknown } }
      if (rec.type !== 'item' || typeof rec.asset?.src !== 'string') continue
      const fresh = CATALOG_ITEMS.find((c) => c.src === rec.asset!.src)
      if (!fresh) continue
      const staleDims = JSON.stringify(rec.asset.dimensions)
      const freshDims = JSON.stringify(fresh.dimensions)
      const staleOffset = JSON.stringify(rec.asset.offset)
      const freshOffset = JSON.stringify(fresh.offset)
      if (staleDims === freshDims && staleOffset === freshOffset) continue
      state.updateNode(id as never, {
        asset: { ...(rec.asset as object), ...fresh },
      } as never)
    }

    // 1c) Миграция footprint. Старые persisted-scan-ноды создавались без
    //     metadata.footprint — 2D-контур не рисуется. Дописываем на месте.
    const VENUE_FOOTPRINT = { x: -97.7, z: -50.3, width: 201, depth: 91 }
    for (const [id, n] of Object.entries(nodesRecord)) {
      if (n.type !== 'scan') continue
      const meta = (n.metadata as { tag?: string; footprint?: unknown } | undefined) ?? {}
      if (meta.tag !== VENUE_TAG || meta.footprint) continue
      state.updateNode(id as never, {
        metadata: { ...meta, footprint: VENUE_FOOTPRINT },
      } as never)
    }

    // 2) Seed default venue: если её ещё нет или она старого формата — создаём Scan-ноду под Level.
    const defaultVenueScans = Object.entries(nodesRecord).filter(
      ([, n]) => n.type === 'scan' && (n.metadata as { tag?: string } | undefined)?.tag === VENUE_TAG,
    )

    const validDefaultVenueExists = defaultVenueScans.some(([, n]) => {
      const url = typeof n.url === 'string' ? n.url : typeof n.asset?.src === 'string' ? n.asset.src : null
      return url === VENUE_URL
    })

    const invalidDefaultVenueIds = defaultVenueScans
      .filter(([, n]) => {
        const url = typeof n.url === 'string' ? n.url : typeof n.asset?.src === 'string' ? n.asset.src : null
        return url !== VENUE_URL
      })
      .map(([id]) => id)

    for (const id of invalidDefaultVenueIds) {
      state.deleteNode(id as never)
    }

    if (validDefaultVenueExists) return

    const level = Object.entries(nodesRecord).find(([, n]) => n.type === 'level')
    if (!level) return
    const [levelId] = level

    try {
      const stub = ScanNode.parse({
        id: 'scan_default_venue' as never,
        type: 'scan',
        url: VENUE_URL,
        opacity: 100,
        scale: 1,
        metadata: {
          tag: VENUE_TAG,
          isDefaultVenue: true,
          // Bbox из scratchpad/measure-glb.mjs (SM_GOSTINKA.glb):
          //   X: -97.7 … 103.7  ->  width 201, offsetX +3.0
          //   Z: -50.3 … 40.9   ->  depth 91,  offsetZ -4.7
          // Используется scanDefinition.floorplan для 2D-контура площадки.
          footprint: { x: -97.7, z: -50.3, width: 201, depth: 91 },
        },
      })
      state.createNode(stub as never, levelId as never)
      console.log('[sdand] default venue seeded under level', levelId)
    } catch (err) {
      console.error('[sdand] failed to seed default venue', err)
    }
  }, [nodes])

  return null
}
