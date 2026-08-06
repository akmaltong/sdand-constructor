'use client'

import { type ScanNode, useRegistry } from '@pascal-app/core'
import { useAssetUrl, useGLTFKTX2, useViewer } from '@pascal-app/viewer'
import { Suspense, useMemo, useRef } from 'react'
import { Color, type Group, type Material, type Mesh, type Object3D, type Texture } from 'three'

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
    // очень тёмный, подменяем на светло-серый — иначе всё здание чёрное.
    const LIGHT_FALLBACK = new Color('#d1d5db')
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

    scene.traverse((child: any) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh

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
