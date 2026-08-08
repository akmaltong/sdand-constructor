'use client'

// Node registry bootstrap is loaded once at the root via
// `<ClientBootstrap>` in `app/layout.tsx` — no per-page side-effect
// import here.
import {
  applySceneGraphToEditor,
  Editor,
  type SceneGraph,
  type SidebarTab,
  saveSceneToLocalStorage,
  useEditor,
  useScene,
} from '@pascal-app/editor'
import { Hammer, Layers, RotateCcw, Save, SquareKanban } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { BuildTab } from './build-tab'
import { CommunityViewerToolbarLeft, CommunityViewerToolbarRight } from './viewer-toolbar'

export interface SceneMeta {
  id: string
  name: string
  projectId: string | null
  thumbnailUrl: string | null
  version: number
  createdAt: string
  updatedAt: string
  ownerId: string | null
  sizeBytes: number
  nodeCount: number
}

const SIDEBAR_TABS: (SidebarTab & { component: React.ComponentType })[] = [
  {
    id: 'site',
    label: 'Scene',
    component: () => null, // Built-in SitePanel handles this
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
]

interface SceneLoaderProps {
  initialScene: SceneGraph
  meta: SceneMeta
}

type SceneGraphWithCollections = SceneGraph & {
  collections?: Record<string, unknown>
}

interface LiveSceneEvent {
  eventId: number
  sceneId: string
  version: number
  kind: string
  createdAt: string
  graph: SceneGraphWithCollections
}

function sceneGraphSignature(graph: SceneGraphWithCollections): string {
  return JSON.stringify({
    nodes: graph.nodes,
    rootNodeIds: graph.rootNodeIds,
    collections: graph.collections,
  })
}

export function SceneLoader({ initialScene, meta }: SceneLoaderProps) {
  const router = useRouter()
  const versionRef = useRef(meta.version)
  const lastRemoteGraphJsonRef = useRef<string | null>(null)
  const suppressRemoteSaveUntilRef = useRef(0)
  const [conflict, setConflict] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showVenuePicker, setShowVenuePicker] = useState(true)

  const handleLoad = useCallback(async () => initialScene, [initialScene])

  const handleSceneSave = useCallback(
    async (graph: SceneGraph, options?: { keepalive?: boolean }) => {
      const graphJson = sceneGraphSignature(graph)
      const isRecentRemoteApply = Date.now() < suppressRemoteSaveUntilRef.current
      if (lastRemoteGraphJsonRef.current === graphJson) {
        lastRemoteGraphJsonRef.current = null
        suppressRemoteSaveUntilRef.current = 0
        return
      }
      if (isRecentRemoteApply) return

      try {
        const response = await fetch(`/api/scenes/${meta.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'If-Match': String(versionRef.current),
          },
          body: JSON.stringify({ name: meta.name, graph }),
          // `keepalive` lets the request outlive a page unload (the autosave
          // flush on refresh/close). Browsers cap keepalive bodies at 64KB, so
          // only the unload flush opts in — normal debounced saves omit it and
          // can carry arbitrarily large scenes.
          keepalive: options?.keepalive,
        })

        if (response.status === 409) {
          setConflict(true)
          return
        }

        if (!response.ok) {
          setSaveError(`Save failed (${response.status})`)
          return
        }

        const next = (await response.json()) as SceneMeta
        versionRef.current = next.version
        setSaveError(null)
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : 'Save failed')
      }
    },
    [meta.id, meta.name],
  )

  useEffect(() => {
    const source = new EventSource(`/api/scenes/${meta.id}/events`)

    source.addEventListener('scene', (event) => {
      let payload: LiveSceneEvent
      try {
        payload = JSON.parse((event as MessageEvent<string>).data) as LiveSceneEvent
      } catch {
        return
      }
      if (payload.sceneId !== meta.id) return
      if (payload.version <= versionRef.current) return

      versionRef.current = payload.version
      lastRemoteGraphJsonRef.current = sceneGraphSignature(payload.graph)
      suppressRemoteSaveUntilRef.current = Date.now() + 2500
      applySceneGraphToEditor(payload.graph)
      setConflict(false)
      setSaveError(null)
    })

    source.addEventListener('error', () => {
      if (source.readyState === EventSource.CLOSED) {
        setSaveError('Live scene connection closed')
      }
    })

    return () => source.close()
  }, [meta.id])

  const handleThumb = useCallback(
    async (_blob: Blob) => {
      // TODO(phase7): upload thumbnail via POST /api/scenes/[id]/thumbnail.
      // Stub endpoint is not yet implemented in v0.1 — skip upload for now.
      await fetch(`/api/scenes/${meta.id}/thumbnail`, {
        method: 'POST',
        // Intentionally no body — endpoint is a stub.
      }).catch(() => {
        // Swallow errors silently; thumbnail upload is best-effort.
      })
    },
    [meta.id],
  )

  const handleReset = useCallback(() => {
    const ed = useEditor.getState()
    ed.setPhase('site')
    ed.setMode('select')
    ed.setTool(null)
    ed.setCatalogCategory(null)
    ed.setSelectedItem(null as never)
    applySceneGraphToEditor(null)
  }, [])

  const handleQuickSave = useCallback(() => {
    const sceneState = useScene.getState()
    saveSceneToLocalStorage({
      nodes: sceneState.nodes as Record<string, unknown>,
      rootNodeIds: sceneState.rootNodeIds,
    })
  }, [])

  return (
    <div className="relative h-screen w-screen">
      {conflict && (
        <div className="pointer-events-auto absolute top-4 left-1/2 z-50 w-full max-w-md -translate-x-1/2 rounded-lg border border-border bg-background p-4 shadow-xl">
          <h2 className="font-semibold text-sm">Another session saved first — refresh?</h2>
          <p className="mt-1 text-muted-foreground text-xs">
            Your changes haven&apos;t been saved. Reload to pick up the latest version.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              className="rounded-md border border-border bg-accent px-3 py-1.5 font-medium text-xs hover:bg-accent/80"
              onClick={() => router.refresh()}
              type="button"
            >
              Reload
            </button>
            <button
              className="rounded-md border border-border bg-background px-3 py-1.5 font-medium text-xs hover:bg-accent/40"
              onClick={() => setConflict(false)}
              type="button"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      {saveError && !conflict && (
        <div className="pointer-events-auto absolute top-4 left-1/2 z-50 w-full max-w-md -translate-x-1/2 rounded-lg border border-destructive/50 bg-background p-3 shadow-xl">
          <p className="font-medium text-destructive text-xs">{saveError}</p>
        </div>
      )}
      <div className="pointer-events-none absolute top-4 right-4 z-40 flex items-center gap-2">
        <button
          className="pointer-events-auto inline-flex items-center gap-1 rounded-md border border-border bg-background/90 px-3 py-1.5 font-medium text-xs shadow-sm backdrop-blur hover:bg-accent/40"
          onClick={handleQuickSave}
          type="button"
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </button>
        <button
          className="pointer-events-auto inline-flex items-center gap-1 rounded-md border border-border bg-background/90 px-3 py-1.5 font-medium text-xs shadow-sm backdrop-blur hover:bg-accent/40"
          onClick={handleReset}
          type="button"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
        <button
          className="pointer-events-auto inline-flex items-center gap-1 rounded-md border border-border bg-background/90 px-3 py-1.5 font-medium text-xs shadow-sm backdrop-blur hover:bg-accent/40"
          onClick={() => setShowVenuePicker(true)}
          type="button"
        >
          <SquareKanban className="h-3.5 w-3.5" />
          Venue
        </button>
        <Link
          className="pointer-events-auto rounded-md border border-border bg-background/90 px-3 py-1.5 font-medium text-xs shadow-sm backdrop-blur hover:bg-accent/40"
          href="/scenes"
        >
          All scenes
        </Link>
      </div>
      {showVenuePicker ? (
        <div className="pointer-events-auto absolute inset-x-0 top-16 z-50 mx-auto flex w-[min(480px,calc(100%-2rem))] flex-col gap-3 rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-sm">Выберите площадку</p>
              <p className="mt-1 text-muted-foreground text-xs">Начните с готовой площадки или перейдите к созданию стенда с нуля.</p>
            </div>
            <button className="text-muted-foreground text-xs" onClick={() => setShowVenuePicker(false)} type="button">
              Закрыть
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button className="rounded-xl border border-border bg-muted/30 p-3 text-left transition hover:bg-muted/60" onClick={() => setShowVenuePicker(false)} type="button">
              <p className="font-medium text-sm">Гостинка</p>
              <p className="mt-1 text-muted-foreground text-xs">Базовая выставочная площадка</p>
            </button>
            <button className="rounded-xl border border-border bg-muted/30 p-3 text-left transition hover:bg-muted/60" onClick={() => setShowVenuePicker(false)} type="button">
              <p className="font-medium text-sm">Пустая сцена</p>
              <p className="mt-1 text-muted-foreground text-xs">Новый проект без привязки</p>
            </button>
          </div>
        </div>
      ) : null}
      <Editor
        layoutVersion="v2"
        onLoad={handleLoad}
        onSave={handleSceneSave}
        onThumbnailCapture={handleThumb}
        projectId={meta.projectId ?? 'default'}
        sidebarTabs={SIDEBAR_TABS}
        viewerToolbarLeft={<CommunityViewerToolbarLeft />}
        viewerToolbarRight={<CommunityViewerToolbarRight />}
      />
    </div>
  )
}
