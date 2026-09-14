import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, MeshReflectorMaterial, SpotLight as VolumetricSpot } from '@react-three/drei'
import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { PCFShadowMap, Vector3 } from 'three'
import { Car } from './Car'
import { isNarrow, rig } from './rig'

const WHEEL_RADIUS = 0.34
const CANVAS = '#181818'

/** Camera follows rig.view with a little pointer parallax. */
function CameraRig() {
  const tmp = useMemo(() => new Vector3(), [])
  const look = useMemo(() => new Vector3(rig.view.tx, rig.view.ty, rig.view.tz), [])
  useFrame(({ camera }, dt) => {
    const v = rig.view
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * 5)
    tmp.set(v.cx + rig.pointer.x * 0.35, v.cy + rig.pointer.y * 0.15, v.cz)
    camera.position.lerp(tmp, k)
    tmp.set(v.tx, v.ty, v.tz)
    look.lerp(tmp, k)
    camera.lookAt(look)
  })
  return null
}

/** Wheels roll from the car's actual displacement along its heading; lamps follow rig.lamp levels. */
function CarDriver() {
  const prev = useMemo(() => new Vector3(), [])
  const primed = useRef(false)
  useFrame(() => {
    const car = rig.car
    if (!car) return
    if (!primed.current) {
      prev.copy(car.position)
      primed.current = true
      return
    }
    const dx = car.position.x - prev.x
    const dz = car.position.z - prev.z
    prev.copy(car.position)
    const fx = -Math.sin(car.rotation.y)
    const fz = -Math.cos(car.rotation.y)
    const forward = dx * fx + dz * fz
    const a = Math.max(-1.2, Math.min(1.2, forward / WHEEL_RADIUS))
    for (const w of rig.wheels) w.rotation.x += a

    const { head, brake } = rig.lamp
    for (const m of rig.lampMats.head) m.emissiveIntensity = head * 9
    for (const m of rig.lampMats.brake) m.emissiveIntensity = brake * 6
    for (const s of rig.headSpots) s.intensity = head * 90
  })
  return null
}

/** Real HDRI for reflections plus a few strip lights and a faint red horizon, rendered once. */
function Studio() {
  return (
    <>
      <Environment files="/hdr/studio_small_09_1k.hdr" resolution={512} frames={1} environmentIntensity={0.55}>
        <Lightformer intensity={3} rotation-x={Math.PI / 2} position={[0, 4.5, -1.5]} scale={[16, 0.8, 1]} />
        <Lightformer intensity={3} rotation-x={Math.PI / 2} position={[0, 4.5, 2.5]} scale={[16, 0.8, 1]} />
        <Lightformer intensity={1.2} rotation-y={Math.PI / 2} position={[-8, 1.6, 0]} scale={[16, 1.2, 1]} />
        <Lightformer intensity={1.2} rotation-y={-Math.PI / 2} position={[8, 1.6, 0]} scale={[16, 1.2, 1]} />
        <Lightformer form="ring" intensity={0.5} color="#da291c" position={[0, -2, 6]} scale={[10, 1.2, 1]} />
      </Environment>
      <ambientLight intensity={0.06} />
      <spotLight
        position={[6, 9, 6]}
        angle={0.42}
        penumbra={1}
        intensity={260}
        decay={2}
        distance={40}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00015}
        shadow-normalBias={0.02}
      />
      <spotLight position={[-7, 6, -4]} angle={0.5} penumbra={1} intensity={80} decay={2} distance={40} color="#e9edf5" />
    </>
  )
}

/** Garage bay: a volumetric cone that fades in when a project bay opens. */
function Bay() {
  const ref = useRef<import('three').SpotLight>(null)
  const group = useRef<import('three').Group>(null)
  useFrame(() => {
    if (ref.current) ref.current.intensity = rig.bay * 60
    if (group.current) group.current.visible = rig.bay > 0.02
  })
  return (
    <group ref={group} visible={false}>
    <VolumetricSpot
      ref={ref}
      position={[-2.9, 6.5, -0.6]}
      target-position={[-2.9, 0, -1.4]}
      angle={0.5}
      penumbra={0.6}
      intensity={0}
      distance={12}
      attenuation={6}
      anglePower={5}
      opacity={0.35}
      color="#ffffff"
      castShadow={false}
    />
    </group>
  )
}

function Floor({ reflective }: { reflective: boolean }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={-0.001} receiveShadow>
      <planeGeometry args={[120, 120]} />
      {reflective ? (
        <MeshReflectorMaterial
          blur={[400, 120]}
          resolution={1024}
          mixBlur={1}
          mixStrength={1.6}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.35}
          maxDepthThreshold={1.2}
          color="#0b0b0b"
          metalness={0.4}
          mirror={0.4}
        />
      ) : (
        <meshStandardMaterial color="#0e0e0e" roughness={0.95} metalness={0.2} />
      )}
    </mesh>
  )
}

export function Scene() {
  const narrow = useMemo(() => isNarrow(), [])

  // R3F only creates its WebGL root after react-use-measure reports a size. In a background tab
  // ResizeObserver never fires, but the hook also measures on window resize — nudge it once.
  useEffect(() => {
    const t = window.setTimeout(() => window.dispatchEvent(new Event('resize')), 60)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      rig.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      rig.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <div className="scene" aria-hidden="true">
      <Canvas
        shadows={{ type: PCFShadowMap }}
        dpr={[1, narrow ? 1.5 : 1.75]}
        camera={{ fov: 32, near: 0.1, far: 140, position: [0, 1.05, 7.4] }}
        gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      >
        <color attach="background" args={[CANVAS]} />
        <fog attach="fog" args={[CANVAS, 9, 40]} />
        <Suspense fallback={null}>
          <Studio />
          <Car />
          <Floor reflective={!narrow} />
          <Bay />
        </Suspense>
        <CameraRig />
        <CarDriver />
        <EffectComposer multisampling={narrow ? 0 : 4} enableNormalPass={false}>
          <Bloom luminanceThreshold={1.05} luminanceSmoothing={0.2} mipmapBlur intensity={0.7} radius={0.6} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
