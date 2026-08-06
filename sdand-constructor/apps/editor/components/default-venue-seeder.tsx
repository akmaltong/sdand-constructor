'use client'

import { ScanNode, useScene } from '@pascal-app/core'
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
        const rec = n as { type?: string; parentId?: string | null; url?: unknown; metadata?: unknown; asset?: { src?: unknown } }
        return {
          id,
          type: rec.type,
          parentId: rec.parentId,
          url: typeof rec.url === 'string' ? rec.url : undefined,
          src: typeof rec.asset?.src === 'string' ? rec.asset.src : undefined,
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
        metadata: { tag: VENUE_TAG, isDefaultVenue: true },
      })
      state.createNode(stub as never, levelId as never)
      console.log('[sdand] default venue seeded under level', levelId)
    } catch (err) {
      console.error('[sdand] failed to seed default venue', err)
    }
  }, [nodes])

  return null
}
