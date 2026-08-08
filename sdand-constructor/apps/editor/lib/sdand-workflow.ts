import type { AssetInput } from '@pascal-app/core'

export type SdandPlacementKind = 'podium' | 'equipment'

export function resolveSdandPlacementAsset(
  catalog: AssetInput[],
  kind: SdandPlacementKind,
): AssetInput | null {
  if (kind === 'podium') {
    return catalog.find((item) => item.tags?.includes('stand') && item.src.startsWith('primitive:box:')) ?? null
  }

  return catalog.find((item) => item.tags?.includes('equipment')) ?? null
}
