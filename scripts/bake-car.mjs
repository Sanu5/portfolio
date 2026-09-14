/**
 * One-off pipeline: Sketchfab glTF (skinned, rigged) → lean static GLB for the site.
 *  - bakes every skinned mesh to world-space static geometry (rest pose)
 *  - names the four wheels wheel_fl/fr/rl/rr with their pivot on the axle
 *  - splits the lamp mesh into lights_front / lights_rear (own materials)
 *  - repaints "Paint" Rosso Corsa, drops the door/hood animation + skeleton
 *  - dedup + prune + Draco
 *
 * usage: node scripts/bake-car.mjs <scene.gltf> <out.glb>
 */
import { NodeIO, Accessor, Primitive } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, draco, resample, weld } from '@gltf-transform/functions'
import draco3d from 'draco3d'
import { mat4, vec3, vec4 } from 'gl-matrix'

const [,, input, output] = process.argv
if (!input || !output) { console.error('usage: node scripts/bake-car.mjs <scene.gltf> <out.glb>'); process.exit(1) }

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
})
const doc = await io.read(input)
const root = doc.getRoot()
const scene = root.listScenes()[0]

// ---------- 0. pose the rig: the rest pose has the driver's door open; the animation is the close motion ----------
const poseAt = process.env.POSE === 'first' ? 'first' : 'last'
for (const anim of root.listAnimations()) {
  for (const ch of anim.listChannels()) {
    const node = ch.getTargetNode(); const path = ch.getTargetPath(); const s = ch.getSampler()
    if (!node || !s) continue
    const out = s.getOutput(); const interp = s.getInterpolation()
    const n = out.getCount(); const size = out.getElementSize()
    const stride = interp === 'CUBICSPLINE' ? 3 : 1
    const keys = n / stride
    const k = poseAt === 'first' ? 0 : keys - 1
    const idx = interp === 'CUBICSPLINE' ? k * 3 + 1 : k
    const v = new Array(size).fill(0); out.getElement(idx, v)
    if (path === 'translation') node.setTranslation(v)
    else if (path === 'rotation') node.setRotation(v)
    else if (path === 'scale') node.setScale(v)
  }
  console.log('posed rig from animation', JSON.stringify(anim.getName().slice(0, 40)), 'at', poseAt, 'keyframe')
}

// ---------- 1. bake skins ----------
const tmpP = vec4.create(), tmpN = vec3.create(), accP = vec3.create(), accN = vec3.create()
const normalMat = mat4.create()

const skinnedNodes = root.listNodes().filter((n) => n.getSkin() && n.getMesh())
console.log('skinned mesh nodes:', skinnedNodes.length)

for (const node of skinnedNodes) {
  const skin = node.getSkin()
  const joints = skin.listJoints()
  const ibm = skin.getInverseBindMatrices().getArray() // 16 floats per joint
  // G_i * IBM_i for every joint
  const skinMats = joints.map((j, i) => {
    const G = j.getWorldMatrix()
    const m = mat4.create()
    mat4.multiply(m, G, ibm.slice(i * 16, i * 16 + 16))
    return m
  })
  const mesh = node.getMesh()
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute('POSITION')
    const nor = prim.getAttribute('NORMAL')
    const jnt = prim.getAttribute('JOINTS_0')
    const wgt = prim.getAttribute('WEIGHTS_0')
    if (!pos || !jnt || !wgt) continue
    const n = pos.getCount()
    const outP = new Float32Array(n * 3)
    const outN = nor ? new Float32Array(n * 3) : null
    const j4 = [0, 0, 0, 0], w4 = [0, 0, 0, 0], p3 = [0, 0, 0], n3 = [0, 0, 0]
    for (let i = 0; i < n; i++) {
      pos.getElement(i, p3); jnt.getElement(i, j4); wgt.getElement(i, w4)
      if (nor) nor.getElement(i, n3)
      vec3.set(accP, 0, 0, 0); vec3.set(accN, 0, 0, 0)
      for (let k = 0; k < 4; k++) {
        const w = w4[k]
        if (w === 0) continue
        const M = skinMats[j4[k]]
        vec4.set(tmpP, p3[0], p3[1], p3[2], 1)
        vec4.transformMat4(tmpP, tmpP, M)
        vec3.scaleAndAdd(accP, accP, [tmpP[0], tmpP[1], tmpP[2]], w)
        if (nor) {
          mat4.invert(normalMat, M); mat4.transpose(normalMat, normalMat)
          vec3.set(tmpN, n3[0], n3[1], n3[2])
          vec3.transformMat4(tmpN, tmpN, normalMat) // w=0 semantics via mat3 would be cleaner; translation cancels after normalize
          vec3.scaleAndAdd(accN, accN, tmpN, w)
        }
      }
      outP.set(accP, i * 3)
      if (outN) { vec3.normalize(accN, accN); outN.set(accN, i * 3) }
    }
    const newPos = doc.createAccessor().setType(Accessor.Type.VEC3).setArray(outP)
    prim.setAttribute('POSITION', newPos)
    if (outN) prim.setAttribute('NORMAL', doc.createAccessor().setType(Accessor.Type.VEC3).setArray(outN))
    prim.setAttribute('JOINTS_0', null)
    prim.setAttribute('WEIGHTS_0', null)
  }
  // baked to world space → reparent under the scene root with identity transform
  node.setSkin(null)
  const parent = node.getParentNode()
  if (parent) parent.removeChild(node)
  node.setMatrix(mat4.create())
  scene.addChild(node)
}

// ---------- 2. classify meshes, find wheels & lamps ----------
const bbox = (prim) => {
  const pos = prim.getAttribute('POSITION')
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity], p = [0, 0, 0]
  for (let i = 0; i < pos.getCount(); i++) { pos.getElement(i, p); for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], p[k]); max[k] = Math.max(max[k], p[k]) } }
  return { min, max, center: min.map((v, k) => (v + max[k]) / 2), size: min.map((v, k) => max[k] - v) }
}
const matName = (prim) => prim.getMaterial()?.getName() ?? ''
const all = scene.listChildren().filter((n) => n.getMesh())
let carMin = [Infinity, Infinity, Infinity], carMax = [-Infinity, -Infinity, -Infinity]
for (const n of all) for (const p of n.getMesh().listPrimitives()) { const b = bbox(p); carMin = carMin.map((v, k) => Math.min(v, b.min[k])); carMax = carMax.map((v, k) => Math.max(v, b.max[k])) }
console.log('car bounds min', carMin.map((v) => v.toFixed(2)), 'max', carMax.map((v) => v.toFixed(2)))

// front direction: the front axle sits on the same side as the "Calliper Front" joints
const frontJoint = root.listNodes().find((n) => /Calliper Front L/i.test(n.getName()))
const fj = frontJoint ? mat4.getTranslation(vec3.create(), frontJoint.getWorldMatrix()) : [0, 0, 1]
const frontAxis = Math.abs(fj[2]) > Math.abs(fj[0]) ? 2 : 0
const frontSign = Math.sign(fj[frontAxis])
console.log('front joint world', Array.from(fj).map((v) => v.toFixed(2)), '→ front along', frontAxis === 2 ? 'Z' : 'X', frontSign > 0 ? '+' : '-')

// wheels
const wheels = all.filter((n) => n.getMesh().listPrimitives().some((p) => matName(p) === 'Wheel1A'))
console.log('wheel meshes:', wheels.length)
for (const n of wheels) {
  const prim = n.getMesh().listPrimitives()[0]
  const b = bbox(prim)
  const c = b.center
  // move pivot to the axle centre
  for (const p of n.getMesh().listPrimitives()) {
    const pos = p.getAttribute('POSITION'); const arr = pos.getArray().slice()
    for (let i = 0; i < arr.length; i += 3) { arr[i] -= c[0]; arr[i + 1] -= c[1]; arr[i + 2] -= c[2] }
    p.setAttribute('POSITION', doc.createAccessor().setType(Accessor.Type.VEC3).setArray(arr))
  }
  n.setTranslation(c)
  const isFront = Math.sign(c[frontAxis]) === frontSign
  const lateral = frontAxis === 2 ? 0 : 2
  // "left" is the driver's left when facing forward: for front=+Z, left = +X ... we just need consistent names
  const isLeft = c[lateral] > 0
  n.setName(`wheel_${isFront ? 'f' : 'r'}${isLeft ? 'l' : 'r'}`)
  console.log(' ', n.getName(), 'centre', c.map((v) => v.toFixed(2)), 'size', b.size.map((v) => v.toFixed(2)))
}

// lamps: split the big LightA mesh by front/rear
const lampNodes = all.filter((n) => n.getMesh().listPrimitives().some((p) => matName(p) === 'LightA'))
const lightMat = root.listMaterials().find((m) => m.getName() === 'LightA')
const frontLightMat = lightMat.clone().setName('LightFront')
const rearLightMat = lightMat.clone().setName('LightRear')
for (const n of lampNodes) {
  const prim = n.getMesh().listPrimitives()[0]
  const b = bbox(prim)
  const span = b.size[frontAxis]
  if (span < 2) { // small side marker → keep as-is, but tag by side
    const isFront = Math.sign(b.center[frontAxis]) === frontSign
    prim.setMaterial(isFront ? frontLightMat : rearLightMat)
    n.setName(isFront ? 'lamp_marker_front' : 'lamp_marker_rear')
    continue
  }
  // split triangles by centroid
  const pos = prim.getAttribute('POSITION'); const idx = prim.getIndices()
  const attrs = prim.listSemantics().map((s) => [s, prim.getAttribute(s)])
  const front = [], rear = []
  const p = [0, 0, 0]
  const ia = idx.getArray()
  for (let t = 0; t < ia.length; t += 3) {
    let z = 0
    for (let k = 0; k < 3; k++) { pos.getElement(ia[t + k], p); z += p[frontAxis] }
    ;(Math.sign(z / 3) === frontSign ? front : rear).push(ia[t], ia[t + 1], ia[t + 2])
  }
  const mk = (tris, mat, name) => {
    if (!tris.length) return
    const mesh = doc.createMesh(name)
    const np = doc.createPrimitive().setMode(Primitive.Mode.TRIANGLES).setMaterial(mat)
    for (const [s, a] of attrs) np.setAttribute(s, a)
    np.setIndices(doc.createAccessor().setType(Accessor.Type.SCALAR).setArray(new Uint32Array(tris)))
    mesh.addPrimitive(np)
    const node = doc.createNode(name).setMesh(mesh)
    scene.addChild(node)
    const bb = bbox(np); console.log(' ', name, tris.length / 3, 'tris; bounds', bb.min.map((v) => v.toFixed(2)), bb.max.map((v) => v.toFixed(2)))
  }
  mk(front, frontLightMat, 'lights_front')
  mk(rear, rearLightMat, 'lights_rear')
  scene.removeChild(n); n.dispose()
}
// tail-light glass
for (const n of all) for (const p of n.getMesh()?.listPrimitives() ?? []) if (matName(p) === 'GlassRed') n.setName('taillight_glass')
// body paint
for (const n of all) for (const p of n.getMesh()?.listPrimitives() ?? []) if (matName(p) === 'Paint') n.setName('body')

// ---------- 3. materials ----------
const paint = root.listMaterials().find((m) => m.getName() === 'Paint')
paint.setBaseColorFactor([0.73, 0.02, 0.01, 1]).setRoughnessFactor(0.25).setMetallicFactor(0.0)
const caliper = root.listMaterials().find((m) => m.getName() === 'CaliperAZonePaint')
if (caliper) caliper.setBaseColorTexture(null).setBaseColorFactor([0.93, 0.78, 0.0, 1]).setRoughnessFactor(0.4)

// ---------- 4. strip rig + animation, compress ----------
for (const a of root.listAnimations()) a.dispose()
for (const s of root.listSkins()) s.dispose()
// remove now-empty joint hierarchy
const dropEmpty = (node) => { for (const c of node.listChildren()) dropEmpty(c); if (!node.getMesh() && node.listChildren().length === 0) node.dispose() }
for (const c of scene.listChildren()) dropEmpty(c)

await doc.transform(dedup(), weld(), resample(), prune(), draco({ method: 'edgebreaker', quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 }))
await io.write(output, doc)
const { statSync } = await import('node:fs')
console.log('wrote', output, (statSync(output).size / 1e6).toFixed(2), 'MB; nodes', root.listNodes().length, 'materials', root.listMaterials().length)
