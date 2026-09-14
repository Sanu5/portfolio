import { useLayoutEffect, useMemo, useRef } from 'react'
import { ContactShadows, useGLTF } from '@react-three/drei'
import {
  Color,
  DataTexture,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  RepeatWrapping,
  SpotLight,
  type Material,
} from 'three'
import { pose, rig } from './rig'
import { asset } from '../lib/asset'
import { useSite } from '../store'

/** Baked from "2026 Ferrari 296 Speciale A" by OUTPISTON (Sketchfab, CC BY-NC-SA 4.0) — see scripts/bake-car.mjs. */
const MODEL = asset('models/ferrari-296.glb')
const DRACO = asset('draco/')

const ROSSO_CORSA = '#da291c'

/** Tiny random-normal texture tiled over the paint: metallic flake sparkle under the studio lights. */
function makeFlakeTexture() {
  const size = 128
  const data = new Uint8Array(size * size * 4)
  for (let i = 0; i < size * size; i++) {
    const nx = (Math.random() - 0.5) * 0.35
    const ny = (Math.random() - 0.5) * 0.35
    const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))
    data[i * 4] = Math.round((nx * 0.5 + 0.5) * 255)
    data[i * 4 + 1] = Math.round((ny * 0.5 + 0.5) * 255)
    data[i * 4 + 2] = Math.round((nz * 0.5 + 0.5) * 255)
    data[i * 4 + 3] = 255
  }
  const tex = new DataTexture(data, size, size)
  tex.wrapS = tex.wrapT = RepeatWrapping
  tex.repeat.set(60, 60)
  tex.needsUpdate = true
  return tex
}

export function Car() {
  const { scene } = useGLTF(MODEL, DRACO)
  const car = useRef<Group>(null)
  const body = useRef<Group>(null)
  const spotL = useRef<SpotLight>(null)
  const spotR = useRef<SpotLight>(null)
  const targetL = useMemo(() => new Object3D(), [])
  const targetR = useMemo(() => new Object3D(), [])
  const reduced = useSite((s) => s.reducedMotion)
  const setCarReady = useSite((s) => s.setCarReady)
  const start = pose(reduced ? 'hero' : 'intro')

  useLayoutEffect(() => {
    const flakes = makeFlakeTexture()
    // Base sits darker than the token: the clearcoat highlights and studio reflections bring it up to Rosso Corsa on screen.
    const paint = new MeshPhysicalMaterial({
      color: new Color(ROSSO_CORSA).multiplyScalar(0.72),
      metalness: 0.25,
      roughness: 0.24,
      clearcoat: 1,
      clearcoatRoughness: 0.025,
      envMapIntensity: 1.1,
      normalMap: flakes,
    })
    paint.normalScale.set(0.06, 0.06)

    const head: MeshStandardMaterial[] = []
    const brake: MeshStandardMaterial[] = []
    const wheels: Object3D[] = []

    scene.traverse((o) => {
      if (!(o instanceof Mesh)) return
      o.castShadow = true
      o.receiveShadow = true
      const m = o.material as Material & Partial<MeshStandardMaterial> & { name: string }
      const name = m.name
      const node = o.name
      if (/^lights_front|^lamp_marker_front/.test(node) && m instanceof MeshStandardMaterial) {
        // headlights: emissive follows the lamp texture so only the lenses glow
        const mat = m.clone()
        mat.emissive = new Color('#dfe8ff')
        mat.emissiveMap = m.map
        mat.emissiveIntensity = 0
        o.material = mat
        head.push(mat)
      } else if (/^lights_rear|^lamp_marker_rear/.test(node) && m instanceof MeshStandardMaterial) {
        const mat = m.clone()
        mat.emissive = new Color('#ff1a0a')
        mat.emissiveMap = m.map
        mat.emissiveIntensity = 0
        o.material = mat
        brake.push(mat)
      } else if (name === 'Paint') {
        o.material = paint
      } else if (name === 'GlassMtl' && m instanceof MeshPhysicalMaterial) {
        m.transmission = 0.9
        m.roughness = 0.02
        m.metalness = 0
        m.ior = 1.5
        m.thickness = 0.02
        m.color.set('#e8eef5')
        m.envMapIntensity = 1.4
      } else if (name === 'GlassRed' && m instanceof MeshStandardMaterial) {
        const mat = m.clone()
        mat.emissive = new Color('#ff1a0a')
        mat.emissiveIntensity = 0
        mat.transparent = true
        mat.opacity = 0.92
        o.material = mat
        brake.push(mat)
      } else if (name === 'Wheel1A' && m instanceof MeshStandardMaterial) {
        m.metalness = 0.85
        m.roughness = 0.32
        m.envMapIntensity = 1.2
      } else if (name === 'Coloured' && m instanceof MeshStandardMaterial) {
        m.metalness = 0.2
        m.roughness = 0.12
        m.envMapIntensity = 1
      } else if (name === 'CaliperAZonePaint' && m instanceof MeshStandardMaterial) {
        m.color.set('#f2c400')
        m.roughness = 0.35
      } else if (m instanceof MeshStandardMaterial && /Carbon/.test(name)) {
        m.roughness = 0.25
        m.metalness = 0.1
        m.envMapIntensity = 1
      }
    })
    for (const n of ['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr']) {
      const w = scene.getObjectByName(n)
      if (w) wheels.push(w)
    }

    rig.car = car.current
    rig.body = body.current
    rig.wheels = wheels
    rig.lampMats = { head, brake }
    rig.headSpots = [spotL.current, spotR.current].filter((s): s is SpotLight => !!s)
    setCarReady(true)
    return () => {
      setCarReady(false)
      rig.car = null
      rig.body = null
      rig.wheels = []
      rig.lampMats = { head: [], brake: [] }
      rig.headSpots = []
    }
  }, [scene, setCarReady])

  return (
    <group ref={car} position={[start.x, start.y, start.z]} rotation-y={start.ry}>
      <group ref={body}>
        {/* the baked model faces +Z; the choreography assumes −Z */}
        <group rotation-y={Math.PI}>
          <primitive object={scene} />
          {/* headlight beams (model space: front = +Z) */}
          <spotLight ref={spotL} position={[0.72, 0.68, 2.05]} angle={0.42} penumbra={0.7} intensity={0} decay={1.6} distance={16} color="#dfe8ff" target={targetL} />
          <spotLight ref={spotR} position={[-0.72, 0.68, 2.05]} angle={0.42} penumbra={0.7} intensity={0} decay={1.6} distance={16} color="#dfe8ff" target={targetR} />
          <primitive object={targetL} position={[1.1, -0.2, 9]} />
          <primitive object={targetR} position={[-1.1, -0.2, 9]} />
        </group>
      </group>
      <ContactShadows position={[0, 0.004, 0]} opacity={0.9} scale={12} blur={2.2} far={1.6} resolution={512} color="#000000" />
    </group>
  )
}

useGLTF.preload(MODEL, DRACO)
