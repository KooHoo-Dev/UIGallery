// 표본별 용량 측정 도구 — 표본 하나가 결과 HTML 을 얼마나 키우는지 잰다.
//
//   node tools/size.mjs                    # 모든 표본
//   node tools/size.mjs card-hand-targeting results-reward   # 지정한 표본만
//
// 방법: 표본 0개 빌드(셸만)와 그 표본만 넣은 빌드(UIG_ONLY)를 비교한다. 결과는 _shots/size/ 에 빌드된다 (dist 를 건드리지 않음).
// 증분 합은 전체 빌드 증분보다 조금 크다 — 여러 표본이 함께 쓰는 공통 코드가 표본마다 한 번씩 세어지기 때문.
// 예산은 tools/check.py 와 같다 (원본 5MB · gzip 1.5MB).

import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, '_shots', 'size')
const BUDGET = 5 * 1024 * 1024
const BUDGET_GZIP = 1.5 * 1024 * 1024
const VITE = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')

const all = readdirSync(join(ROOT, 'src', 'specimens')).filter(d => existsSync(join(ROOT, 'src', 'specimens', d, 'index.tsx')))
const ids = process.argv.slice(2).length ? process.argv.slice(2) : all
for (const id of ids) if (!all.includes(id)) throw new Error(`표본 폴더가 없습니다: ${id}`)

function build(only) {
  const outDir = join(OUT, only)
  const r = spawnSync(process.execPath, [VITE, 'build', '--outDir', outDir, '--emptyOutDir', '--logLevel', 'error'], {
    cwd: ROOT,
    env: { ...process.env, UIG_ONLY: only },
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  if (r.status !== 0) throw new Error(`빌드 실패: ${only}`)
  const html = readFileSync(join(outDir, 'index.html'))
  return { raw: html.length, gzip: gzipSync(html, { level: 6 }).length }
}
const dirBytes = p => (existsSync(p) ? readdirSync(p, { recursive: true }).reduce((n, f) => n + (statSync(join(p, f)).isFile() ? statSync(join(p, f)).size : 0), 0) : 0)
const kb = n => `${(n / 1024).toFixed(0)}`.padStart(6)

console.log('표본 0개(셸만) 빌드 중…')
const base = build('__none__')
const rows = ids.map(id => {
  process.stdout.write(`\r  ${id} 빌드 중…`.padEnd(60))
  const s = build(id)
  return { id, raw: s.raw - base.raw, gzip: s.gzip - base.gzip, unity: dirBytes(join(ROOT, 'src', 'unity', id)) }
})
rows.sort((a, b) => b.raw - a.raw)

process.stdout.write('\r'.padEnd(61) + '\r')
console.log(`셸(표본 0개): 원본 ${kb(base.raw)} KB · gzip ${kb(base.gzip)} KB\n`)
console.log('표본                           증분KB  gzipKB  (Unity 원문 KB)')
for (const r of rows) console.log(`${r.id.padEnd(30)} ${kb(r.raw)}  ${kb(r.gzip)}  (${kb(r.unity).trim()})`)
const avg = k => rows.reduce((n, r) => n + r[k], 0) / rows.length
console.log(`\n평균 증분: 원본 ${kb(avg('raw')).trim()} KB · gzip ${kb(avg('gzip')).trim()} KB`)

const dist = join(ROOT, 'dist', 'index.html')
if (existsSync(dist) && ids.length === all.length) {
  const html = readFileSync(dist)
  const cur = { raw: html.length, gzip: gzipSync(html, { level: 6 }).length }
  const room = Math.floor(Math.min((BUDGET - cur.raw) / avg('raw'), (BUDGET_GZIP - cur.gzip) / avg('gzip')))
  console.log(`현재 dist: 원본 ${kb(cur.raw).trim()} / ${kb(BUDGET).trim()} KB · gzip ${kb(cur.gzip).trim()} / ${kb(BUDGET_GZIP).trim()} KB`)
  console.log(`평균 크기 표본 기준으로 약 ${Math.max(0, room)}개 더 들어갑니다.`)
}
