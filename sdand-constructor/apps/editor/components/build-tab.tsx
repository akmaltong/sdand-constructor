'use client'

import { CATALOG_ITEMS, ItemCatalog, MaterialPaintPanel, getDefaultCatalogItem, triggerSFX, useEditor } from '@pascal-app/editor'
import { Boxes, Layers, Package, PencilRuler, Square, Wand2 } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useRef } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/toolbar-tooltip'
import { cn } from '@/lib/utils'

/**
 * Raw structure-tool kinds the Build tab can activate. These map 1:1 to the
 * editor's `StructureTool` ids.
 */
type BuildToolKind =
  | 'wall'
  | 'slab'
  | 'item'
  | 'door'
  | 'window'

type BuildType = {
  /** Selection id — equals `kind` for tool types, `'painting'` for paint mode. */
  id: string
  label: string
  iconSrc: string
  /** Present for structure-tool types (absent for the paint mode). */
  kind?: BuildToolKind
  /** Non-placement special mode. */
  mode?: 'material-paint'
}

const BUILD_TYPES: BuildType[] = [
  { id: 'wall', label: 'Нарисовать стены', iconSrc: '/icons/wall.png', kind: 'wall' },
  { id: 'floor', label: 'Нарисовать подиум', iconSrc: '/icons/floor.png', kind: 'slab' },
  { id: 'podium', label: 'Подиум', iconSrc: '/icons/floor.png', kind: 'item' },
  { id: 'equipment', label: 'Оборудование', iconSrc: '/icons/couch.png', kind: 'item' },
  { id: 'screens', label: 'Экраны', iconSrc: '/icons/bathroom.png', kind: 'item' },
  { id: 'paint', label: 'Покраска', iconSrc: '/icons/paint.png', mode: 'material-paint' },
]

/**
 * Activate a raw structure draw/cursor tool. Mirrors the editor's own
 * structure-tool activation (`setPhase`/`setStructureLayer`/`setMode`/`setTool`).
 */
function activateBuildTool(kind: BuildToolKind): void {
  const ed = useEditor.getState()
  ed.setPhase('structure')
  ed.setStructureLayer('elements')
  ed.setCatalogCategory(null)
  ed.setToolDefaults(kind, null)
  ed.setMode('build')
  ed.setTool(kind)
}

function activateQuickPlacement(kind: 'podium' | 'equipment' | 'screens'): void {
  const ed = useEditor.getState()
  ed.setPhase('structure')
  ed.setStructureLayer('elements')
  ed.setMode('build')
  ed.setTool('item')
  ed.setCatalogCategory(kind === 'equipment' ? 'kitchen' : kind === 'screens' ? 'bathroom' : 'furniture')
  const defaultItem = getDefaultCatalogItem(kind === 'equipment' ? 'kitchen' : kind === 'screens' ? 'bathroom' : 'furniture')
  if (defaultItem) ed.setSelectedItem(defaultItem)
}

/** Enter material-paint mode — the Build tab's "Painting" category. */
function activatePaintMode(): void {
  const ed = useEditor.getState()
  ed.setPhase('structure')
  ed.setStructureLayer('elements')
  ed.setMode('material-paint')
}

/**
 * Build tab for the open-source standalone editor — a preset-less replica of
 * the community Build sidebar. Clicking a type activates its raw tool, drawn
 * with the kind's own `def.defaults()`. The "Painting" type swaps in the
 * material-paint panel.
 */
export function BuildTab() {
  const activeTool = useEditor((s) => s.tool)
  const mode = useEditor((s) => s.mode)

  const isTypeActive = (type: BuildType) =>
    type.mode === 'material-paint'
      ? mode === 'material-paint'
      : mode === 'build' && activeTool === type.kind

  const handleTypeClick = useCallback((type: BuildType) => {
    if (type.mode === 'material-paint') {
      activatePaintMode()
    } else if (type.id === 'podium') {
      activateQuickPlacement('podium')
    } else if (type.id === 'equipment') {
      activateQuickPlacement('equipment')
    } else if (type.id === 'screens') {
      activateQuickPlacement('screens')
    } else if (type.kind) {
      activateBuildTool(type.kind)
    }
  }, [])

  const catalogCategory = useEditor((s) => s.catalogCategory)
  const editorMode = useEditor((s) => s.mode)
  const editorTool = useEditor((s) => s.tool)

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <div className="rounded-xl border border-border/60 bg-background/70 p-2">
        <div className="flex items-center gap-2 text-foreground/80 text-sm">
          <PencilRuler className="h-4 w-4" />
          <span>Быстрый сценарий: стены → подиумы → оборудование</span>
        </div>
      </div>

      <TooltipProvider delayDuration={0} disableHoverableContent>
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))' }}
        >
          {BUILD_TYPES.map((type) => {
            const active = isTypeActive(type)
            const Icon =
              type.id === 'podium'
                ? Boxes
                : type.id === 'equipment'
                  ? Layers
                  : type.id === 'screens'
                    ? Package
                    : type.id === 'floor'
                      ? Square
                      : Wand2
            return (
              <Tooltip key={type.id}>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      'group relative flex aspect-square flex-col items-center justify-center gap-1 rounded-xl p-1.5 text-[10px] transition-all duration-200',
                      active
                        ? 'bg-primary/10 ring-1 ring-primary/50 text-foreground'
                        : 'bg-muted/40 opacity-80 hover:bg-muted hover:opacity-100',
                    )}
                    onClick={() => {
                      triggerSFX('sfx:menu-click')
                      handleTypeClick(type)
                    }}
                    onMouseEnter={() => triggerSFX('sfx:menu-hover')}
                    type="button"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="leading-none">{type.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="pointer-events-none" side="top">
                  {type.label}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>

      {editorMode === 'material-paint' ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <MaterialPaintPanel />
        </div>
      ) : editorTool === 'item' && catalogCategory ? (
        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-border/60 bg-background/80 p-2">
          <ItemCatalog
            activePlacementTag={null}
            activeFunctionalTag={null}
            category={catalogCategory}
            items={CATALOG_ITEMS}
            leadingTile={null}
            search=""
          />
        </div>
      ) : null}
    </div>
  )
}
