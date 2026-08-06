'use client'

// Тонкая утилитарная страница для оффскрин-рендера thumbnail'а .glb.
// URL: /thumb-gen?src=/equipment/lcd_65.glb
// Рендерит модель в изолированную сцену, ставит камеру автоматически по
// bounding-box'у, экспортирует canvas в base64 PNG и кладёт его в
// window.__thumbResult — оттуда автоматизация забирает и сохраняет в файл.

import { OrbitControls } from '@react-three/drei/core/OrbitControls'
import { useGLTF } from '@react-three/drei/core/Gltf'
import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useRef, useState } from 'react'
import type { Group } from 'three'
import { Box3, Vector3 } from 'three'

function Model({ src, onReady }: { src: string; onReady: (bb: Box3) => void }) {
  const gltf = useGLTF(src) as { scene: Group }
  const ref = useRef<Group>(null)
  useEffect(() => {
    if (!ref.current) return
    const bb = new Box3().setFromObject(ref.current)
    onReady(bb)
  }, [onReady])
  return <primitive object={gltf.scene} ref={ref} />
}

function FrameCamera({ bb }: { bb: Box3 }) {
  const { camera, gl, scene } = useThree()
  useEffect(() => {
    const size = new Vector3()
    const center = new Vector3()
    bb.getSize(size)
    bb.getCenter(center)
    const maxDim = Math.max(size.x, size.y, size.z)
    const dist = maxDim * 1.7
    // camera at 30° azimuth, 20° elevation
    const az = Math.PI / 4
    const el = Math.PI / 8
    camera.position.set(
      center.x + dist * Math.cos(el) * Math.sin(az),
      center.y + dist * Math.sin(el),
      center.z + dist * Math.cos(el) * Math.cos(az),
    )
    camera.lookAt(center)
    if ('near' in camera) camera.near = dist / 100
    if ('far' in camera) camera.far = dist * 100
    ;(camera as { updateProjectionMatrix?: () => void }).updateProjectionMatrix?.()
    // Render one frame, capture pixels
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        gl.render(scene, camera)
        const canvas = gl.domElement as HTMLCanvasElement
        try {
          const data = canvas.toDataURL('image/png')
          ;(window as unknown as { __thumbResult?: string }).__thumbResult = data
        } catch (err) {
          ;(window as unknown as { __thumbError?: string }).__thumbError = String(err)
        }
      })
    })
  }, [bb, camera, gl, scene])
  return null
}

export default function ThumbGen() {
  const [src, setSrc] = useState<string | null>(null)
  const [bb, setBb] = useState<Box3 | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setSrc(params.get('src'))
  }, [])

  if (!src) return <div style={{ padding: 20, color: 'white' }}>Pass ?src=/equipment/x.glb</div>

  return (
    <div style={{ width: 256, height: 256, background: '#1f2937' }}>
      <Canvas
        camera={{ position: [2, 2, 2], fov: 35 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        style={{ width: 256, height: 256 }}
      >
        <color args={['#1f2937']} attach="background" />
        <ambientLight intensity={0.6} />
        <directionalLight intensity={1} position={[5, 10, 5]} />
        <directionalLight intensity={0.4} position={[-5, 3, -5]} />
        <Suspense fallback={null}>
          <Model onReady={setBb} src={src} />
        </Suspense>
        {bb && <FrameCamera bb={bb} />}
        <OrbitControls enabled={false} />
      </Canvas>
      <div id="ready" style={{ color: 'white', padding: 8, fontFamily: 'monospace', fontSize: 11 }}>
        {bb ? 'framed' : 'loading'}
      </div>
    </div>
  )
}
