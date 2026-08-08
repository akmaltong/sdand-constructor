'use client'

import type { AssetInput } from '@pascal-app/core'
import { triggerSFX, useDraftNode, useEditor, usePlacementCoordinator } from '@pascal-app/editor'

/**
 * Registry-driven item placement tool. Mounted by `ToolManager` when
 * `useEditor.tool === 'item'` (the catalog picker is what selects which
 * asset; this tool handles the cursor follow + click-to-commit flow).
 *
 * Wraps the same `usePlacementCoordinator` + `useDraftNode` primitives
 * the move-tool uses. The placement coordinator runs surface strategies
 * (floor / wall / ceiling / item-surface) so the same cursor logic
 * handles wall-mounted artwork, floor furniture, ceiling fans, and
 * nested items on tables.
 *
 * Replaces the legacy `editor/src/components/tools/item/item-tool.tsx`.
 * The `tools` map in `tool-manager.tsx` no longer needs an `item:` entry
 * — `getRegistryTool('item')` finds this through `def.tool`.
 */
function ItemPlacementContent({ selectedItem }: { selectedItem: AssetInput }) {
  const draftNode = useDraftNode()

  const cursor = usePlacementCoordinator({
    asset: selectedItem,
    draftNode,
    initDraft: () => {
      // Floor items are created lazily by the placement coordinator on the
      // first pointer move (see onGridMove). Creating at mount would place
      // the draft at (0,0,0) before the cursor ray has hit the grid.
    },
    onCommitted: () => {
      triggerSFX('sfx:item-place')
      return false
    },
  })

  return <>{cursor}</>
}

function ItemTool() {
  const selectedItem = useEditor((state) => state.selectedItem)
  if (!selectedItem) return null
  return <ItemPlacementContent selectedItem={selectedItem} />
}

export default ItemTool
