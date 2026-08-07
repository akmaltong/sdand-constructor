'use client'

import { type ScanNode, useRegistry } from '@pascal-app/core'
import { useAssetUrl, useGLTFKTX2, useViewer } from '@pascal-app/viewer'
import { Suspense, useMemo, useRef } from 'react'
import { Box3, Color, type Group, type Material, type Mesh, type Object3D, type Texture } from 'three'

// Sdand: имена узлов gltf, которые надо скрыть в скан-модели.
// В SM_GOSTINKA `Potolok001` — контейнер с балками крыши и потолочной
// решёткой (Plane013…Plane023). Убираем его целиком, чтобы вид сверху
// показывал пустой зал.
const HIDDEN_NODE_NAMES = new Set(['Potolok001'])

export const ScanRenderer = ({ node }: { node: ScanNode }) => {
  const showScans = useViewer((s) => s.showScans)
  const ref = useRef<Group>(null!)
  useRegistry(node.id, 'scan', ref)

  const resolvedUrl = useAssetUrl(node.url)

  return (
    <group
      position={node.position}
      ref={ref}
      rotation={node.rotation}
      scale={[node.scale, node.scale, node.scale]}
      visible={showScans}
    >
      {resolvedUrl && (
        <Suspense>
          <ScanModel opacity={node.opacity} url={resolvedUrl} />
        </Suspense>
      )}
    </group>
  )
}

const ScanModel = ({ url, opacity }: { url: string; opacity: number }) => {
  const gltf = useGLTFKTX2(url) as any
  const scene = gltf.scene

  useMemo(() => {
    const normalizedOpacity = opacity / 100
    const isTransparent = normalizedOpacity < 1

    // Sdand: скан-модели, экспортированные из Unreal, часто имеют baseColor≈0
    // в расчёте на PBR-текстуру. Если текстуры отсутствуют (404) или base color
    // очень тёмный, подменяем на тёплый оттенок гипсокартона / кремового мрамора
    // (Marble Crema Marfil из оригинальных материалов SM_GOSTINKA).
    const LIGHT_FALLBACK = new Color('#ede4d3')
    const brightenMaterial = (material: Material) => {
      const m = material as Material & { color?: Color; map?: Texture | null }
      if (!m.color) return
      const hasMap = Boolean(m.map)
      const luminance = m.color.r * 0.299 + m.color.g * 0.587 + m.color.b * 0.114
      if (!hasMap && luminance < 0.2) {
        m.color.copy(LIGHT_FALLBACK)
      }
    }

    const updateMaterial = (material: Material) => {
      brightenMaterial(material)
      if (isTransparent) {
        material.transparent = true
        material.opacity = normalizedOpacity
        material.depthWrite = false
      } else {
        material.transparent = false
        material.opacity = 1
        material.depthWrite = true
      }
      material.needsUpdate = true
    }

    // Скрыть контейнеры по имени (балки/решётка потолка). Прячем сам узел —
    // всё дерево под ним не рендерится, включая Plane013…Plane023.
    scene.traverse((child: Object3D) => {
      if (HIDDEN_NODE_NAMES.has(child.name)) child.visible = false
    })

    // Sdand: пол выставочного зала подкрашиваем в чистый белый. Детект:
    // большой, тонкий mesh у самого низа модели. Убираем map, чтобы фон
    // текстуры плитки не проступал.
    scene.updateMatrixWorld(true)
    const modelBb = new Box3().setFromObject(scene)
    const floorY = Number.isFinite(modelBb.min.y) ? modelBb.min.y : 0
    // Порог с запасом на основной пол, но чтобы не задеть панели стен.
    // Реальный пол зала — тонкий (<0.3 м) и очень большой (>200 м²);
    // стены-сегменты редко превышают это в горизонтальной проекции.
    const FLOOR_MAX_THICKNESS = 0.3 // м
    const FLOOR_MIN_AREA = 200 // м²
    const WHITE = new Color('#ffffff')
    const whitenFloor = (material: Material) => {
      const m = material as Material & { color?: Color; map?: Texture | null }
      if (m.color) m.color.copy(WHITE)
      if (m.map) m.map = null
      material.needsUpdate = true
    }

    scene.traverse((child: any) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh
        if (!mesh.visible) return

        // Определяем пол по world-bbox: у пола min.y близка к floorY,
        // толщина мала, площадь горизонтальной проекции велика.
        const bb = new Box3().setFromObject(mesh)
        const thickness = bb.max.y - bb.min.y
        const area = (bb.max.x - bb.min.x) * (bb.max.z - bb.min.z)
        const isFloor =
          Number.isFinite(bb.min.y) &&
          bb.min.y - floorY < 0.3 &&
          thickness < FLOOR_MAX_THICKNESS &&
          area > FLOOR_MIN_AREA
        if (isFloor) {
          if (Array.isArray(mesh.material)) mesh.material.forEach(whitenFloor)
          else if (mesh.material) whitenFloor(mesh.material)
        }

        // Disable raycasting
        mesh.raycast = () => {}

        // Exclude from bounding box calculations
        mesh.geometry.boundingBox = null
        mesh.geometry.boundingSphere = null
        mesh.frustumCulled = false

        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((material) => {
            updateMaterial(material)
          })
        } else {
          updateMaterial(mesh.material)
        }
      }
    })
  }, [scene, opacity])

  return <primitive object={scene} />
}

export default ScanRenderer
