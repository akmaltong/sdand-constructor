'use client'

import type { AssetInput } from '@pascal-app/core'
import {
  applySceneGraphToEditor,
  CATALOG_ITEMS,
  Editor,
  ItemsPanel,
  saveSceneToLocalStorage,
  useEditor,
  useScene,
} from '@pascal-app/editor'
import { Hammer, Layers, RotateCcw, Settings, Upload } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { BuildTab } from '@/components/build-tab'
import { DefaultVenueSeeder, type VenueId } from '@/components/default-venue-seeder'
import {
  CommunityViewerToolbarLeft,
  CommunityViewerToolbarRight,
} from '@/components/viewer-toolbar'
import { resolveSdandPlacementAsset } from '@/lib/sdand-workflow'

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
    id: 'site',
    label: 'Сцена',
    component: () => null,
    mobileDefaultSnap: 0.5,
    mobileIcon: <Layers className="h-5 w-5" />,
    icon: (
      <Image
        alt=""
        className="h-8 w-8 object-contain"
        height={32}
        src="/icons/scene.png"
        width={32}
      />
    ),
  },
  {
    id: 'build',
    label: 'Стройка',
    component: BuildTab,
    mobileDefaultSnap: 0.5,
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
    component: () => null,
    mobileDefaultSnap: 0.5,
    mobileIcon: <Settings className="h-5 w-5" />,
    icon: <Settings className="h-8 w-8" />,
  },
]

const PROJECT_ID = 'local-editor'

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState<VenueId | null>(null)
  const [showVenuePicker, setShowVenuePicker] = useState(true)

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
    setShowVenuePicker(false)
    // Clear persisted editor state so no tool is active from previous session
    const ed = useEditor.getState()
    ed.setPhase('site')
    ed.setMode('select')
    ed.setTool(null)
    ed.setCatalogCategory(null)
  }, [])

  const handlePresetSelect = useCallback((kind: 'podium' | 'equipment') => {
    const asset = resolveSdandPlacementAsset(CATALOG_ITEMS, kind)
    const ed = useEditor.getState()
    ed.setPhase('structure')
    ed.setStructureLayer('elements')
    ed.setMode('build')
    ed.setTool('item')
    ed.setCatalogCategory(kind === 'equipment' ? 'kitchen' : 'furniture')
    if (asset) ed.setSelectedItem(asset as never)
    setShowWelcome(false)
  }, [])

  const handleReset = useCallback(() => {
    // Clear persisted state FIRST so zustand persist does not restore old tool/mode
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
    // Показать меню выбора площадки
    setSelectedVenue(null)
    setShowVenuePicker(true)
  }, [])

  return (
    <div className="relative h-screen w-screen">
      {selectedVenue && <DefaultVenueSeeder venue={selectedVenue} />}
      <div className="pointer-events-none absolute top-4 right-4 z-40 flex items-center gap-2">
        <button
          className="pointer-events-auto inline-flex items-center gap-1 rounded-md border border-border bg-background/90 px-3 py-1.5 font-medium text-xs shadow-sm backdrop-blur hover:bg-accent/40"
          onClick={handleReset}
          type="button"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>
      {showVenuePicker ? (
        <div className="pointer-events-auto absolute inset-x-0 top-16 z-50 mx-auto flex w-[min(480px,calc(100%-2rem))] flex-col gap-3 rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-sm">Выберите площадку</p>
              <p className="mt-1 text-muted-foreground text-xs">Начните с выбора выставочной площадки.</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button className="rounded-xl border border-border bg-muted/30 p-3 text-left transition hover:bg-muted/60" onClick={() => handleVenueSelect('gostinka')} type="button">
              <p className="font-medium text-sm">Гостинка</p>
              <p className="mt-1 text-muted-foreground text-xs">Базовая выставочная площадка</p>
            </button>
            <button className="rounded-xl border border-border bg-muted/30 p-3 text-left transition hover:bg-muted/60" onClick={() => handleVenueSelect('manezh')} type="button">
              <p className="font-medium text-sm">Манеж</p>
              <p className="mt-1 text-muted-foreground text-xs">Компактная площадка</p>
            </button>
          </div>
        </div>
      ) : null}
      {showWelcome ? (
        <div className="pointer-events-auto absolute inset-x-0 top-16 z-50 mx-auto flex w-[min(560px,calc(100%-2rem))] flex-col gap-3 rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-sm">Конфигуратор выставочных стендов</p>
              <p className="mt-1 text-muted-foreground text-xs">Начните с выбора базового подиума или оборудования, затем уточните стены и сцену.</p>
            </div>
            <button className="text-muted-foreground text-xs" onClick={() => setShowWelcome(false)} type="button">
              Пропустить
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button className="rounded-xl border border-border bg-muted/30 p-3 text-left transition hover:bg-muted/60" onClick={() => handlePresetSelect('podium')} type="button">
              <p className="font-medium text-sm">Подиум</p>
              <p className="mt-1 text-muted-foreground text-xs">Быстро разместить готовый стенд</p>
            </button>
            <button className="rounded-xl border border-border bg-muted/30 p-3 text-left transition hover:bg-muted/60" onClick={() => handlePresetSelect('equipment')} type="button">
              <p className="font-medium text-sm">Оборудование</p>
              <p className="mt-1 text-muted-foreground text-xs">Добавить интерактивные панели и стойки</p>
            </button>
          </div>
        </div>
      ) : null}
      <Editor
        layoutVersion="v2"
        projectId={PROJECT_ID}
        sidebarTabs={SIDEBAR_TABS}
        viewerToolbarLeft={<CommunityViewerToolbarLeft />}
        viewerToolbarRight={<CommunityViewerToolbarRight />}
        hideLevelSelector
      />
    </div>
  )
}
