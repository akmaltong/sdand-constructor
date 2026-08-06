'use client'

import type { AssetInput } from '@pascal-app/core'
import { CATALOG_ITEMS, Editor, ItemsPanel } from '@pascal-app/editor'
import { Hammer, Layers, Package, Settings, Upload } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useRef, useState } from 'react'
import { BuildTab } from '@/components/build-tab'
import { DefaultVenueSeeder } from '@/components/default-venue-seeder'
import {
  CommunityViewerToolbarLeft,
  CommunityViewerToolbarRight,
} from '@/components/viewer-toolbar'

// Импорт пользовательской модели или текстуры:
//   .glb/.gltf → обычный item с src=objectURL, useGLTF грузит напрямую
//   .png/.jpg/.jpeg/.webp → баннер (тонкий куб 2×2×0.05) с натянутой текстурой,
//     src="primitive:tex:<url>" — обрабатывается в packages/nodes/item/renderer
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
    label: 'Scene',
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
    label: 'Build',
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
    id: 'items',
    label: 'Items',
    component: EditorItemsPanel,
    mobileDefaultSnap: 0.5,
    mobileIcon: <Package className="h-5 w-5" />,
    icon: (
      <Image
        alt=""
        className="h-8 w-8 object-contain"
        height={32}
        src="/icons/couch.png"
        width={32}
      />
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    component: () => null,
    mobileDefaultSnap: 0.5,
    mobileIcon: <Settings className="h-5 w-5" />,
    icon: (
      <Image
        alt=""
        className="h-8 w-8 object-contain"
        height={32}
        src="/icons/settings.png"
        width={32}
      />
    ),
  },
]

const PROJECT_ID = 'local-editor'

export default function Home() {
  return (
    <div className="relative h-screen w-screen">
      {PROJECT_ID === 'local-editor' && (
        <div className="pointer-events-none absolute top-3 left-1/2 z-40 -translate-x-1/2">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-border/60 bg-background/90 px-4 py-1.5 text-xs shadow-sm backdrop-blur">
            <span className="text-muted-foreground">Local editor — scenes are not saved.</span>
            <Link className="font-medium text-foreground hover:underline" href="/scenes">
              Open recent scenes
            </Link>
            <span aria-hidden className="text-muted-foreground">
              ·
            </span>
            <Link className="font-medium text-foreground hover:underline" href="/scenes">
              Create new
            </Link>
          </div>
        </div>
      )}
      <DefaultVenueSeeder />
      <Editor
        layoutVersion="v2"
        projectId={PROJECT_ID}
        sidebarTabs={SIDEBAR_TABS}
        viewerToolbarLeft={<CommunityViewerToolbarLeft />}
        viewerToolbarRight={<CommunityViewerToolbarRight />}
      />
    </div>
  )
}
