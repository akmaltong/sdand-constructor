'use client'

import type { AssetInput } from '@pascal-app/core'
import { GuideNode, useScene } from '@pascal-app/core'
import { CATALOG_ITEMS, ItemCatalog, MaterialPaintPanel, getDefaultCatalogItem, triggerSFX, useEditor } from '@pascal-app/editor'
import { useViewer } from '@pascal-app/viewer'
import { Boxes, ChevronDown, Layers, Loader2, Map, Package, PencilRuler, Square, Upload, Wand2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/toolbar-tooltip'
import { cn } from '@/lib/utils'
import { importStandModel } from '@/lib/stand-import'

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
  mode?: 'material-paint' | 'load-stand'
}

const BUILD_TYPES: BuildType[] = [
  { id: 'wall', label: 'Нарисовать стены', iconSrc: '/icons/wall.png', kind: 'wall' },
  { id: 'floor', label: 'Нарисовать подиум', iconSrc: '/icons/floor.png', kind: 'slab' },
  { id: 'podium', label: 'Подиум', iconSrc: '/icons/floor.png', kind: 'item' },
  { id: 'equipment', label: 'Оборудование', iconSrc: '/icons/couch.png', kind: 'item' },
  { id: 'screens', label: 'Экраны', iconSrc: '/icons/bathroom.png', kind: 'item' },
  { id: 'paint', label: 'Покраска', iconSrc: '/icons/paint.png', mode: 'material-paint' },
  { id: 'load-stand', label: 'Загрузить стенд', iconSrc: '/icons/paint.png', mode: 'load-stand' },
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
 * Open a file picker for GLB/GLTF and resolve the selected File (null on cancel).
 * Sdand: раньше был setTimeout(300)-fallback, но пользователь выбирает файл
 * дольше — таймер срабатывал первым и резолвил null, а последующий real change
 * терялся (input уже удалён). Слушаем `cancel` (Chromium 113+) и `focus` окна
 * как эвристику для case «диалог закрыт без файла».
 */
function pickStandFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.glb,.gltf'
    input.style.display = 'none'
    document.body.appendChild(input)

    let settled = false
    const cleanup = () => {
      if (document.body.contains(input)) document.body.removeChild(input)
      window.removeEventListener('focus', onFocus)
    }
    const finish = (file: File | null) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(file)
    }
    const onChange = () => finish(input.files?.[0] ?? null)
    const onCancel = () => finish(null)
    const onFocus = () => {
      // Диалог мог быть закрыт без выбора; ждём микротик, чтобы change успел
      // сработать первым, если файл выбран.
      setTimeout(() => {
        if (!input.files?.length) finish(null)
      }, 500)
    }
    input.addEventListener('change', onChange, { once: true })
    input.addEventListener('cancel', onCancel, { once: true })
    window.addEventListener('focus', onFocus)
    input.click()
  })
}

/**
 * Кнопка «Загрузить план» — точная копия функции из панели иерархии.
 * image (png/jpg/webp) → GuideNode: подложка-планировка на полу (2D + 3D)
 */
function LoadPlanButton() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const levelId = useViewer((s) => s.selection.levelId)
  const setShowGuides = useViewer((s) => s.setShowGuides)
  const createNode = useScene((s) => s.createNode)
  const setSelectedReferenceId = useEditor((s) => s.setSelectedReferenceId)
  const [error, setError] = useState<string | null>(null)
  const [isLoading] = useState(false)

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!(file && levelId)) return
      e.target.value = ''
      setError(null)

      const isImage = file.type.startsWith('image/')

      if (!isImage) {
        setError('Нужен файл: .png, .jpg, .jpeg, .webp или .gif')
        return
      }

      // Используем blob URL напрямую — saveAsset (IndexedDB) вешает UI на больших файлах
      const assetUrl = URL.createObjectURL(file)
      const name = file.name.replace(/\.[^.]+$/, '')

      const guide = GuideNode.parse({
        name,
        url: assetUrl,
        position: [0, 0, 0] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number],
        scale: 1,
        opacity: 50,
        scaleReference: null,
      })
      createNode(guide, levelId as never)
      setShowGuides(true)
      setSelectedReferenceId(guide.id)
    },
    [createNode, levelId, setSelectedReferenceId, setShowGuides],
  )

  return (
    <div className="flex flex-col gap-1">
      <button
        className={cn(
          'flex w-full items-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/30 px-3 py-2 text-sm transition-colors hover:border-primary/60 hover:bg-primary/5',
          isLoading && 'cursor-wait opacity-60',
          !levelId && 'cursor-not-allowed opacity-40',
        )}
        disabled={isLoading || !levelId}
        onClick={() => {
          triggerSFX('sfx:menu-click')
          fileInputRef.current?.click()
        }}
        title={!levelId ? 'Сначала выберите площадку' : 'Загрузить план (jpg/png/webp)'}
        type="button"
      >
        <Map className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="text-foreground/80">
          {isLoading ? 'Загрузка…' : 'Загрузить план'}
        </span>
      </button>
      {error && <p className="px-1 text-destructive text-xs">{error}</p>}
      <input
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
        ref={fileInputRef}
        type="file"
      />
    </div>
  )
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
  const [standLoading, setStandLoading] = useState(false)
  const [standError, setStandError] = useState<string | null>(null)

  const isTypeActive = (type: BuildType) =>
    type.mode === 'material-paint'
      ? mode === 'material-paint'
      : mode === 'build' && activeTool === type.kind

  /**
   * Import a GLB/GLTF from the user's PC: parse in a worker, build the stand
   * group, cache it, then activate item placement. The editor stays responsive
   * while large files are being parsed.
   */
  // История импортированных стендов на время сессии. Blob-URL мертвеют
  // после reload, поэтому не персистим.
  const [importedStands, setImportedStands] = useState<AssetInput[]>([])
  const [standListOpen, setStandListOpen] = useState(false)

  const activateImportedStand = useCallback(async (asset: AssetInput) => {
    const ed = useEditor.getState()
    ed.setPhase('structure')
    ed.setStructureLayer('elements')
    ed.setMode('build')
    ed.setSelectedItem(asset as never)
    ed.setCatalogCategory(null)
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    ed.setTool('item')
    setStandListOpen(false)
  }, [])

  const handleLoadStandClick = useCallback(async () => {
    const file = await pickStandFile()
    if (!file) return

    // Sdand: guard-rail от гигантских моделей — сотни МБ душат main thread
    // на этапе <Clone> в placement preview и виглядит как «зависло».
    const MAX_MB = 200
    if (file.size > MAX_MB * 1024 * 1024) {
      setStandError(
        `Файл слишком большой (${Math.round(file.size / 1024 / 1024)} MB). Максимум ${MAX_MB} MB. Сожми через gltfpack -cc.`,
      )
      return
    }

    setStandLoading(true)
    setStandError(null)
    try {
      const { url, dimensions } = await importStandModel(file)
      const baseName = file.name.replace(/\.[^.]+$/, '')

      const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 90 90'>
        <rect width='90' height='90' fill='#1f2937'/>
        <rect x='15' y='15' width='60' height='60' rx='8' fill='#64748b'/>
        <text x='45' y='52' text-anchor='middle' font-family='sans-serif' font-size='14' font-weight='700' fill='white'>GLB</text>
      </svg>`
      const thumbnail = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`

      const asset: AssetInput = {
        id: `import-${Date.now()}-${baseName}`,
        category: 'furniture',
        name: baseName,
        thumbnail,
        tags: ['import'],
        src: url,
        dimensions,
        offset: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        source: 'mine',
      }

      // Добавляем в историю (уникально по asset.id), сразу активируем.
      setImportedStands((prev) => [asset, ...prev.filter((a) => a.id !== asset.id)])
      await activateImportedStand(asset)
    } catch (error) {
      console.error('[stand-import]', error)
      setStandError(
        'Не удалось загрузить модель. Файл может быть повреждён или имеет неподдерживаемый формат.',
      )
    } finally {
      setStandLoading(false)
    }
  }, [])

  const handleTypeClick = useCallback((type: BuildType) => {
    if (type.mode === 'material-paint') {
      activatePaintMode()
    } else if (type.mode === 'load-stand') {
      triggerSFX('sfx:menu-click')
      void handleLoadStandClick()
    } else if (type.id === 'podium') {
      activateQuickPlacement('podium')
    } else if (type.id === 'equipment') {
      activateQuickPlacement('equipment')
    } else if (type.id === 'screens') {
      activateQuickPlacement('screens')
    } else if (type.kind) {
      activateBuildTool(type.kind)
    }
  }, [handleLoadStandClick])

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
                    : type.id === 'load-stand'
                      ? Upload
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
                      type.mode === 'load-stand' && standLoading && 'cursor-wait opacity-60',
                    )}
                    disabled={type.mode === 'load-stand' && standLoading}
                    onClick={() => {
                      triggerSFX('sfx:menu-click')
                      handleTypeClick(type)
                    }}
                    onMouseEnter={() => triggerSFX('sfx:menu-hover')}
                    type="button"
                  >
                    {type.mode === 'load-stand' && standLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                    <span className="leading-none">
                      {type.mode === 'load-stand' && standLoading ? 'Загрузка…' : type.label}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="pointer-events-none" side="top">
                  {type.mode === 'load-stand' && standLoading ? 'Загрузка…' : type.label}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>

      {standError && <p className="px-1 text-destructive text-xs">{standError}</p>}

      {/* История импортированных стендов на время сессии. Клик по превью
          повторно активирует placement того же asset — файл заново не
          парсится, THREE.Group уже в stand-model-cache. */}
      {importedStands.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-background/70">
          <button
            className="flex w-full items-center justify-between rounded-t-xl px-3 py-1.5 text-foreground/80 text-xs hover:bg-muted/60"
            onClick={() => setStandListOpen((v) => !v)}
            type="button"
          >
            <span>Мои стенды ({importedStands.length})</span>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform',
                standListOpen && 'rotate-180',
              )}
            />
          </button>
          {standListOpen && (
            <div
              className="grid gap-1.5 border-t border-border/40 p-2"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))' }}
            >
              {importedStands.map((asset) => (
                <button
                  className="group flex flex-col items-center gap-1 rounded-lg p-1 hover:bg-muted/60"
                  key={asset.id}
                  onClick={() => {
                    triggerSFX('sfx:menu-click')
                    void activateImportedStand(asset)
                  }}
                  title={asset.name}
                  type="button"
                >
                  <img
                    alt={asset.name}
                    className="h-12 w-12 rounded-md object-cover"
                    src={asset.thumbnail}
                  />
                  <span className="w-full truncate text-[10px] text-muted-foreground group-hover:text-foreground">
                    {asset.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Загрузка плана — отдельная кнопка, создаёт GuideNode (подложка на полу) */}
      {editorMode !== 'material-paint' && !(editorTool === 'item' && catalogCategory) && (
        <LoadPlanButton />
      )}

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
