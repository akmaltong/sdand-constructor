import { type AnyNode, type AnyNodeId, type AssetInput, ScanNode } from '@pascal-app/core'

export const VENUE_TAG = 'sdand:default-venue'

export type VenueFootprint = { x: number; z: number; width: number; depth: number }

export type VenueConfig = {
  url: string
  footprint: VenueFootprint
}

/**
 * Minimal slice of the scene store used by the seeder — structurally identical
 * to `useScene.getState()`, so the real store passes straight in.
 */
export type VenueSceneApi = {
  nodes: Record<AnyNodeId, AnyNode>
  createNode: (node: AnyNode, parentId?: AnyNodeId) => void
  updateNode: (id: AnyNodeId, data: Partial<AnyNode>) => void
  deleteNode: (id: AnyNodeId) => void
}

type VenueNode = {
  type?: string
  parentId?: string | null
  position?: number[]
  url?: unknown
  asset?: { src?: string; dimensions?: unknown; offset?: unknown; name?: unknown }
  metadata?: { tag?: string; footprint?: unknown; [key: string]: unknown }
}

function nodeHasDeadBlobUrl(n: unknown): boolean {
  const rec = n as { url?: unknown; asset?: { src?: unknown } }
  const url = typeof rec.url === 'string' ? rec.url : null
  const src = typeof rec.asset?.src === 'string' ? rec.asset.src : null
  return (
    (url?.startsWith('blob:') ?? false) ||
    (src?.startsWith('blob:') ?? false) ||
    (src?.startsWith('primitive:tex:blob:') ?? false)
  )
}

function getNodeUrl(n: VenueNode): string | null {
  if (typeof n.url === 'string') return n.url
  if (typeof n.asset?.src === 'string') return n.asset.src
  return null
}

export type SyncDefaultVenueResult = {
  created: boolean
  nodeId: string | null
  levelId: string | null
}

/**
 * Keeps exactly one default-venue scan node in the scene, parented to the
 * first level at the origin. Self-heals legacy persisted scenes: any scan
 * node whose URL matches the venue URL is re-parented to the level,
 * repositioned to `[0, 0, 0]` and tagged, while tagged scans pointing at
 * another model are dropped. The renderer normalises the model's floor to
 * the scan node's origin, so the floor always lands on the level's y=0.
 */
export function syncDefaultVenue(
  state: VenueSceneApi,
  venue: VenueConfig,
  catalog: AssetInput[] = [],
): SyncDefaultVenueResult {
  const nodesRecord = state.nodes as unknown as Record<string, VenueNode>

  // 1) Sweeper: чистим ноды с мёртвыми blob:-URL, пережившие reload.
  const dead = Object.entries(nodesRecord)
    .filter(([, n]) => nodeHasDeadBlobUrl(n))
    .map(([id]) => id)
  for (const id of dead) state.deleteNode(id as AnyNodeId)

  // 1b) Миграция asset.
  for (const [id, n] of Object.entries(nodesRecord)) {
    const rec = n as {
      type?: string
      asset?: { src?: string; dimensions?: unknown; offset?: unknown }
    }
    if (rec.type !== 'item' || typeof rec.asset?.src !== 'string') continue
    const fresh = catalog.find((c) => c.src === rec.asset!.src)
    if (!fresh) continue
    const staleDims = JSON.stringify(rec.asset.dimensions)
    const freshDims = JSON.stringify(fresh.dimensions)
    const staleOffset = JSON.stringify(rec.asset.offset)
    const freshOffset = JSON.stringify(fresh.offset)
    if (staleDims === freshDims && staleOffset === freshOffset) continue
    state.updateNode(
      id as AnyNodeId,
      {
        asset: { ...(rec.asset as object), ...fresh },
      } as Partial<AnyNode>,
    )
  }

  const level = Object.entries(nodesRecord).find(([, n]) => n.type === 'level')
  if (!level) {
    return { created: false, nodeId: null, levelId: null }
  }
  const levelId = level[0]

  // 2) Все scan-ноды, которые являются дефолтным venue: с тегом VENUE_TAG
  //    или с URL, совпадающим с venue.
  const venueScans = Object.entries(nodesRecord).filter(
    ([, n]) => n.type === 'scan' && (n.metadata?.tag === VENUE_TAG || getNodeUrl(n) === venue.url),
  )

  for (const [id, n] of venueScans) {
    if (getNodeUrl(n) !== venue.url) {
      state.deleteNode(id as AnyNodeId)
      continue
    }
    const pos = n.position
    const needsPosition = pos?.[1] !== 0 || n.parentId !== levelId
    const meta = n.metadata ?? {}
    const needsMeta = meta.tag !== VENUE_TAG || !meta.footprint
    if (needsPosition || needsMeta) {
      state.updateNode(
        id as AnyNodeId,
        {
          position: [0, 0, 0],
          parentId: levelId as AnyNodeId,
          metadata: { ...meta, tag: VENUE_TAG, footprint: venue.footprint },
        } as Partial<AnyNode>,
      )
    }
  }

  const valid = venueScans.find(([, n]) => getNodeUrl(n) === venue.url)
  if (valid) {
    return { created: false, nodeId: valid[0], levelId }
  }

  try {
    const stub = ScanNode.parse({
      id: 'scan_default_venue' as never,
      type: 'scan',
      url: venue.url,
      position: [0, 0, 0],
      opacity: 100,
      scale: 1,
      metadata: {
        tag: VENUE_TAG,
        isDefaultVenue: true,
        footprint: venue.footprint,
      },
    })
    state.createNode(stub as never, levelId as never)
    return { created: true, nodeId: stub.id as unknown as string, levelId }
  } catch (err) {
    console.error('[sdand] failed to seed default venue', err)
    return { created: false, nodeId: null, levelId }
  }
}
