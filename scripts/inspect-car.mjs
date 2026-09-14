import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3d'
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule() })
const doc = await io.read(process.argv[2])
const rows = []
for (const n of doc.getRoot().listNodes()) {
  const m = n.getMesh(); if (!m) continue
  for (const p of m.listPrimitives()) {
    const pos = p.getAttribute('POSITION'); const a = pos.getArray(); const t = n.getTranslation()
    let min = [1e9,1e9,1e9], max = [-1e9,-1e9,-1e9]
    for (let i = 0; i < a.length; i += 3) for (let k = 0; k < 3; k++) { const v = a[i+k] + t[k]; if (v < min[k]) min[k] = v; if (v > max[k]) max[k] = v }
    rows.push([n.getName(), p.getMaterial()?.getName(), pos.getCount(), min.map(v=>v.toFixed(2)).join(','), max.map(v=>v.toFixed(2)).join(',')])
  }
}
rows.sort((a,b) => parseFloat(b[4].split(',')[0]) - parseFloat(a[4].split(',')[0]))
for (const r of rows.slice(0, 12)) console.log(r.join('  |  '))
