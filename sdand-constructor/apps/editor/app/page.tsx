'use client'

import type { AssetInput } from '@pascal-app/core'
import {
  applySceneGraphToEditor,
  CATALOG_ITEMS,
  Editor,
  ItemsPanel,
  SettingsPanel,
  useEditor,
  useScene,
} from '@pascal-app/editor'
import { emitter } from '@pascal-app/core'
import { Check, ChevronDown, Hammer, Settings, Undo2, Upload } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { BuildTab } from '@/components/build-tab'
import { DefaultVenueSeeder, type VenueId } from '@/components/default-venue-seeder'
import {
  CommunityViewerToolbarLeft,
  CommunityViewerToolbarRight,
} from '@/components/viewer-toolbar'

// Импорт пользовательской модели/текстуры:
//   .glb/.gltf → обычный item (useGLTF грузит по object-URL)
//   .png/.jpg/.jpeg/.webp → баннер-плейн с текстурой (primitive:tex:<url>)
const MODEL_EXT = /\.(glb|gltf)$/i
const TEX_EXT = /\.(png|jpe?g|webp)$/i

function makeThumb(color: string, label: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 90 90'>
    <rect width='90' height='90' fill='#1f2937'/>
    <rect x='15' y='15' width='60' height='60' rx='8' fill='#${color}'/>
    <text x='45' y='52' text-anchor='middle' font-family='sans-serif' font-size='14' font-weight='700' fill='white'>${label}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function texThumb(url: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 90 90'>
    <defs><clipPath id='c'><rect x='0' y='0' width='90' height='90' rx='6'/></clipPath></defs>
    <image href='${url}' x='0' y='0' width='90' height='90' clip-path='url(#c)' preserveAspectRatio='xMidYMid slice'/>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function fileToAsset(file: File): AssetInput | null {
  const url = URL.createObjectURL(file)
  const baseName = file.name.replace(/\.[^.]+$/, '')
  if (MODEL_EXT.test(file.name)) {
    return {
      id: `upload-${Date.now()}-${baseName}`,
      category: 'furniture',
      name: baseName,
      tags: ['floor', 'stand', 'upload'],
      thumbnail: makeThumb('64748b', 'MODEL'),
      src: url,
      dimensions: [1, 1, 1],
      offset: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      source: 'mine',
    }
  }
  if (TEX_EXT.test(file.name)) {
    return {
      id: `upload-tex-${Date.now()}-${baseName}`,
      category: 'furniture',
      name: `${baseName} (текстура)`,
      tags: ['floor', 'stand', 'upload', 'texture'],
      thumbnail: texThumb(url),
      src: `primitive:tex:${url}`,
      dimensions: [2, 2, 0.05],
      offset: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      source: 'mine',
    }
  }
  return null
}

function EditorItemsPanel() {
  const [uploaded, setUploaded] = useState<AssetInput[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    const added: AssetInput[] = []
    const rejected: string[] = []
    for (const file of Array.from(files)) {
      const asset = fileToAsset(file)
      if (asset) added.push(asset)
      else rejected.push(file.name)
    }
    if (added.length > 0) setUploaded((prev) => [...added, ...prev])
    if (rejected.length > 0) {
      alert(
        `Не поддерживаются: ${rejected.join(', ')}\nОжидается .glb, .gltf, .png, .jpg, .webp`,
      )
    }
  }, [])

  const items = [...uploaded, ...CATALOG_ITEMS]

  const leadingTile = (
    <>
      <input
        accept=".glb,.gltf,.png,.jpg,.jpeg,.webp"
        className="hidden"
        multiple
        onChange={(e) => {
          handleFiles(e.target.files)
          if (e.target) e.target.value = ''
        }}
        ref={inputRef}
        type="file"
      />
      <button
        className="group flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border/60 bg-muted/30 p-1.5 text-muted-foreground transition-colors hover:border-primary/60 hover:bg-primary/10 hover:text-foreground"
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        <Upload className="h-5 w-5" />
        <span className="px-1 text-center font-medium text-[10px] leading-tight">
          Импорт модели / текстуры
        </span>
      </button>
    </>
  )

  return (
    <ItemsPanel
      items={items}
      leadingTile={leadingTile}
      showSourceFilter={false}
      showTagFilters={false}
    />
  )
}

const SIDEBAR_TABS = [
  {
    id: 'build',
    label: 'Стройка',
    component: BuildTab,
    mobileDefaultSnap: 0,
    mobileIcon: <Hammer className="h-5 w-5" />,
    icon: (
      <Image
        alt=""
        className="h-8 w-8 object-contain"
        height={32}
        src="/icons/build.png"
        width={32}
      />
    ),
  },
  {
    id: 'settings',
    label: 'Настройки',
    component: SettingsPanel,
    mobileDefaultSnap: 0,
    mobileIcon: <Settings className="h-5 w-5" />,
    icon: <Settings className="h-8 w-8" />,
  },
]

const PROJECT_ID = 'local-editor'

const VENUE_LABELS: Record<VenueId, string> = { gostinka: 'Гостинка', manezh: 'Манеж' }

/** Полностью очищает сцену: удаляет все ноды, сбрасывает историю и площадку. */
function fullClearScene() {
  localStorage.removeItem('pascal-editor-ui-preferences')
  localStorage.removeItem('pascal-editor-scene')
  localStorage.removeItem('pascal-editor-selection')
  const ed = useEditor.getState()
  ed.setPhase('site')
  ed.setMode('select')
  ed.setTool(null)
  ed.setCatalogCategory(null)
  ed.setSelectedItem(null as never)
  applySceneGraphToEditor(null)
  useScene.temporal.getState().clear()
}

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true)
  const [selectedVenue, setSelectedVenue] = useState<VenueId | null>(null)
  const [venueDropdownOpen, setVenueDropdownOpen] = useState(false)

  // Clear persisted scene + tool state before anything loads
  useEffect(() => {
    localStorage.removeItem('pascal-editor-scene')
    localStorage.removeItem('pascal-editor-selection')
    localStorage.removeItem('pascal-editor-ui-preferences')
    // Force clean editor state
    const ed = useEditor.getState()
    ed.setPhase('site')
    ed.setMode('select')
    ed.setTool(null)
    ed.setCatalogCategory(null)
  }, [])

  const handleVenueSelect = useCallback((venue: VenueId) => {
    setSelectedVenue(venue)
    setVenueDropdownOpen(false)
    // Сбрасываем инструмент редактора
    const ed = useEditor.getState()
    ed.setPhase('site')
    ed.setMode('select')
    ed.setTool(null)
    ed.setCatalogCategory(null)
  }, [])

  /** Выбрать «Пустой проект»: очистить всё и убрать площадку */
  const handleSelectEmpty = useCallback(() => {
    fullClearScene()
    setSelectedVenue(null)
    setVenueDropdownOpen(false)
  }, [])

  // Работает как Esc: снимает активный инструмент, возвращает нейтральный
  // курсор. Особенно важно на планшете/телефоне где нет физической клавиши.
  const activeTool = useEditor((s) => s.tool)
  const activeMode = useEditor((s) => s.mode)
  const handleClearTool = useCallback(() => {
    const ed = useEditor.getState()
    // Если рисуем подиум — DONE замыкает контур (SlabTool обработает slab:commit)
    if (ed.tool === 'slab') {
      emitter.emit('slab:commit' as never)
      return
    }
    ed.setTool(null)
    ed.setMode('select')
    ed.setSelectedItem(null as never)
    ed.setCatalogCategory(null)
  }, [])

  // Undo через Zundo temporal store
  const pastStatesLength = useSyncExternalStore(
    (cb) => useScene.temporal.subscribe(cb),
    () => useScene.temporal.getState().pastStates.length,
    () => 0,
  )
  const canUndo = pastStatesLength > 0
  const handleUndo = useCallback(() => {
    useScene.temporal.getState().undo()
    // После отката проверяем, осталась ли venue-нода в сцене.
    // Если нет — убираем selectedVenue, чтобы DefaultVenueSeeder не пересеял.
    requestAnimationFrame(() => {
      const nodes = useScene.getState().nodes
      const hasVenueNode = Object.values(nodes).some(
        (n) =>
          (n as { type?: string; metadata?: { tag?: string } }).type === 'scan' &&
          (n as { metadata?: { tag?: string } }).metadata?.tag === 'sdand:default-venue',
      )
      if (!hasVenueNode) {
        setSelectedVenue(null)
      }
    })
  }, [])

  const handleReset = useCallback(() => {
    fullClearScene()
    setSelectedVenue(null)
    setVenueDropdownOpen(false)
  }, [])

  return (
    <div
      className="relative w-screen"
      style={{
        height: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {selectedVenue && <DefaultVenueSeeder venue={selectedVenue} />}
      <div className="pointer-events-none absolute top-3 right-2 z-40 flex items-center gap-1 sm:top-4 sm:right-4 sm:gap-2">
        <button
          aria-label="Отменить"
          className="pointer-events-auto inline-flex h-8 min-w-8 touch-manipulation items-center justify-center gap-1 rounded-md border border-border bg-background/90 px-2 font-medium text-xs shadow-sm backdrop-blur hover:bg-accent/40 active:bg-accent/60 disabled:cursor-not-allowed disabled:opacity-40 sm:h-auto sm:px-3 sm:py-1.5"
          disabled={!canUndo}
          onClick={handleUndo}
          type="button"
        >
          <Undo2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Undo</span>
        </button>
      </div>
      {(activeTool || activeMode === 'build' || activeMode === 'material-paint') && (
        <div className="pointer-events-none absolute top-16 right-3 z-40 sm:top-20 sm:right-8">
          <button
            aria-label="Готово"
            className="pointer-events-auto inline-flex h-16 w-16 touch-manipulation items-center justify-center rounded-full bg-emerald-500 text-white shadow-2xl transition hover:bg-emerald-600 active:scale-95 sm:h-20 sm:w-20"
            onClick={handleClearTool}
            type="button"
          >
            <Check className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={3} />
          </button>
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 top-3 z-40 flex justify-center">
        <div className="pointer-events-auto relative">
          <button
            className="inline-flex h-8 touch-manipulation items-center gap-1 rounded-full border border-border bg-background/90 px-2.5 font-medium text-xs shadow-sm backdrop-blur transition hover:bg-accent/40 sm:h-auto sm:gap-1.5 sm:px-3 sm:py-1.5"
            onClick={() => setVenueDropdownOpen((v) => !v)}
            type="button"
          >
            <span className="hidden text-muted-foreground sm:inline">Площадка:</span>
            <span>{selectedVenue ? VENUE_LABELS[selectedVenue] : 'Площадка'}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {venueDropdownOpen ? (
            <div className="absolute top-full left-1/2 mt-1.5 flex flex-col -translate-x-1/2 min-w-[120px] rounded-xl border border-border bg-background/95 p-1 shadow-2xl backdrop-blur">
              <button
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs whitespace-nowrap hover:bg-accent/40"
                onClick={handleSelectEmpty}
                type="button"
              >
                <span>Пустой проект</span>
                {selectedVenue === null ? <span className="text-primary">●</span> : null}
              </button>
              {(['manezh', 'gostinka'] as const).map((v) => (
                <button
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs whitespace-nowrap hover:bg-accent/40"
                  key={v}
                  onClick={() => handleVenueSelect(v)}
                  type="button"
                >
                  <span>{VENUE_LABELS[v]}</span>
                  {selectedVenue === v ? <span className="text-primary">●</span> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {showWelcome ? (
        <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex w-[min(400px,calc(100%-2rem))] flex-col gap-4 rounded-2xl border border-border bg-background/95 p-6 shadow-2xl">
            <div>
              <p className="font-semibold text-base">Конфигуратор выставочных стендов</p>
              <p className="mt-1 text-muted-foreground text-sm">Выберите площадку для начала работы</p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-left transition hover:bg-muted/60"
                onClick={() => {
                  setSelectedVenue(null)
                  setShowWelcome(false)
                }}
                type="button"
              >
                <p className="font-medium text-sm">Пустой проект</p>
                <p className="mt-0.5 text-muted-foreground text-xs">Начать с чистого листа без площадки</p>
              </button>
              <button
                className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-left transition hover:bg-muted/60"
                onClick={() => {
                  handleVenueSelect('manezh')
                  setShowWelcome(false)
                }}
                type="button"
              >
                <p className="font-medium text-sm">Манеж</p>
                <p className="mt-0.5 text-muted-foreground text-xs">Загрузить площадку «Манеж»</p>
              </button>
              <button
                className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-left transition hover:bg-muted/60"
                onClick={() => {
                  handleVenueSelect('gostinka')
                  setShowWelcome(false)
                }}
                type="button"
              >
                <p className="font-medium text-sm">Гостинка</p>
                <p className="mt-0.5 text-muted-foreground text-xs">Загрузить площадку «Гостиный двор»</p>
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <Editor
        layoutVersion="v2"
        projectId={PROJECT_ID}
        sidebarTabs={SIDEBAR_TABS}
        settingsPanelProps={{ onReset: handleReset }}
        viewerToolbarLeft={<CommunityViewerToolbarLeft />}
        viewerToolbarRight={<CommunityViewerToolbarRight />}
        hideLevelSelector
      />
    </div>
  )
}
