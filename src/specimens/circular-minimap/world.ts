/* ──────────────────────────────────────────────────────────────
 * 원형 미니맵 표본의 '월드' — 2D 절차 생성 지형 (비트맵 0).
 * 좌표: 미터, x = 동쪽 +, y = 북쪽 +.  방위(yaw) = 라디안, 0 = 북, 시계 방향 +.
 * 같은 데이터로 ① 게임 화면(3/4 내려다보기, 카메라 방향 = 화면 위)과 ② 미니맵(북쪽 고정 그림)을 그린다.
 * ────────────────────────────────────────────────────────────── */

export const HALF = 340

export interface Blob {
  x: number
  y: number
  r: number
  pts: number[]
}
export interface Tree {
  x: number
  y: number
  s: number
  v: number
}
export interface Building {
  x: number
  y: number
  w: number
  d: number
  rot: number
  h: number
  mast?: boolean
}
export type PoiKind = 'kit' | 'cell' | 'chip' | 'o2'
export interface Poi {
  x: number
  y: number
  kind: PoiKind
}
export interface Objective {
  id: string
  label: string
  x: number
  y: number
}

/* ───── 결정론적 난수 ───── */
function mulberry(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rnd = mulberry(20261011)
const R = (a: number, b: number) => a + rnd() * (b - a)

function blob(x: number, y: number, r: number, n = 11, jag = 0.32): Blob {
  const pts: number[] = []
  const ph = R(0, Math.PI * 2)
  for (let i = 0; i < n; i++) {
    const a = ph + (i / n) * Math.PI * 2
    const k = 1 - jag / 2 + rnd() * jag
    pts.push(x + Math.cos(a) * r * k, y + Math.sin(a) * r * k)
  }
  return { x, y, r, pts }
}

/* ───── 랜드마크 ───── */
export const LANDMARKS = {
  base: { x: 0, y: 0 },
  tower: { x: 30, y: 270 },
  depot: { x: 255, y: 35 },
  mine: { x: -250, y: 110 },
  pad: { x: -55, y: -255 },
}

export const OBJECTIVES: Objective[] = [
  { id: 'cell', label: '냉각 셀 3개 회수', x: 150, y: 95 },
  { id: 'tower', label: '북쪽 통신탑 복구', x: 30, y: 262 },
  { id: 'depot', label: '보급 창고 점검', x: 246, y: 30 },
  { id: 'mine', label: '채굴장 회로 조각 수거', x: -240, y: 104 },
  { id: 'pad', label: '착륙장 신호기 설치', x: -48, y: -246 },
]

export const LAKE = blob(115, -120, 52, 14, 0.25)
export const PONDS = [blob(-150, -60, 22, 10, 0.3), blob(-40, 170, 16, 9, 0.3)]
export const RIVER = [158, -150, 205, -190, 250, -205, 300, -240, 360, -270]

function road(a: { x: number; y: number }, b: { x: number; y: number }, j: number) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy)
  const nx = -dy / len
  const ny = dx / len
  const pts = [a.x, a.y]
  for (const t of [0.25, 0.5, 0.75]) {
    const o = R(-j, j)
    pts.push(a.x + dx * t + nx * o, a.y + dy * t + ny * o)
  }
  pts.push(b.x, b.y)
  return pts
}
const L = LANDMARKS
export const ROADS: number[][] = [
  road(L.base, L.tower, 30),
  road(L.base, L.depot, 26),
  road(L.base, L.mine, 30),
  road(L.base, L.pad, 22),
  road(L.depot, L.tower, 40),
]

function distToPolyline(x: number, y: number, pts: number[]) {
  let best = Infinity
  for (let i = 0; i + 3 < pts.length; i += 2) {
    const ax = pts[i]
    const ay = pts[i + 1]
    const bx = pts[i + 2]
    const by = pts[i + 3]
    const vx = bx - ax
    const vy = by - ay
    const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy)))
    best = Math.min(best, Math.hypot(x - ax - vx * t, y - ay - vy * t))
  }
  return best
}

const waterAt = (x: number, y: number, pad: number) =>
  Math.hypot(x - LAKE.x, y - LAKE.y) < LAKE.r + pad || PONDS.some(p => Math.hypot(x - p.x, y - p.y) < p.r + pad) || distToPolyline(x, y, RIVER) < 7 + pad
const roadAt = (x: number, y: number, pad: number) => ROADS.some(r => distToPolyline(x, y, r) < 3 + pad)
const landmarkAt = (x: number, y: number, pad: number) => Object.values(L).some(l => Math.hypot(x - l.x, y - l.y) < pad)
const free = (x: number, y: number, pad: number) => !waterAt(x, y, pad) && !roadAt(x, y, pad) && !landmarkAt(x, y, 22 + pad)

/* ───── 지면 무늬 ───── */
export const MOSS: Blob[] = Array.from({ length: 70 }, () => blob(R(-HALF, HALF), R(-HALF, HALF), R(14, 46)))
export const DUST: Blob[] = Array.from({ length: 26 }, () => blob(R(-HALF, HALF), R(-HALF, HALF), R(10, 30), 9, 0.45))

/* ───── 나무 숲 ───── */
export const GROVES: Blob[] = []
export const TREES: Tree[] = []
for (let g = 0; g < 70; g++) {
  const x = R(-HALF + 20, HALF - 20)
  const y = R(-HALF + 20, HALF - 20)
  if (Math.hypot(x, y + 30) < 60 || !free(x, y, 8)) continue
  const r = R(16, 34)
  GROVES.push(blob(x, y, r * 1.05, 12, 0.3))
  const n = Math.round(r * 1.5)
  for (let i = 0; i < n; i++) {
    const a = R(0, Math.PI * 2)
    const d = Math.sqrt(rnd()) * r
    const tx = x + Math.cos(a) * d
    const ty = y + Math.sin(a) * d
    if (free(tx, ty, 2)) TREES.push({ x: tx, y: ty, s: R(0.8, 1.25), v: rnd() })
  }
}
for (let i = 0; i < 1400; i++) {
  const x = R(-HALF, HALF)
  const y = R(-HALF, HALF)
  if (Math.hypot(x, y + 10) < 30) continue
  if (free(x, y, 3)) TREES.push({ x, y, s: R(0.7, 1.1), v: rnd() })
}

/* ───── 덤불 (지면 질감) ───── */
export const BUSHES: Blob[] = []
for (let i = 0; i < 2600; i++) {
  const x = R(-HALF, HALF)
  const y = R(-HALF, HALF)
  if (waterAt(x, y, 1) || roadAt(x, y, 1) || landmarkAt(x, y, 20)) continue
  BUSHES.push(blob(x, y, R(0.5, 1.3), 8, 0.4))
}
export const MEADOW: Blob[] = Array.from({ length: 50 }, () => blob(R(-HALF, HALF), R(-HALF, HALF), R(8, 26), 10, 0.4))

/* ───── 바위 ───── */
export const ROCKS: Blob[] = []
for (let i = 0; i < 900; i++) {
  const x = R(-HALF, HALF)
  const y = R(-HALF, HALF)
  if (waterAt(x, y, 1) || roadAt(x, y, 0.5) || landmarkAt(x, y, 20)) continue
  ROCKS.push(blob(x, y, R(0.3, 1.4) * (rnd() < 0.08 ? 2.4 : 1), 7, 0.5))
}

/* ───── 건물 ───── */
export const BUILDINGS: Building[] = [
  { x: 4, y: 12, w: 26, d: 15, rot: 0.12, h: 8 },
  { x: -24, y: -6, w: 10, d: 10, rot: 0.12, h: 5 },
  { x: 24, y: -14, w: 12, d: 8, rot: 0.12, h: 4.5 },
  { x: -10, y: 34, w: 8, d: 14, rot: 0.12, h: 4 },
  { x: 30, y: 274, w: 5, d: 5, rot: 0.3, h: 26, mast: true },
  { x: 18, y: 262, w: 9, d: 7, rot: 0.3, h: 4 },
  { x: 258, y: 40, w: 30, d: 17, rot: -0.2, h: 8 },
  { x: 236, y: 58, w: 12, d: 12, rot: -0.2, h: 5 },
  { x: -252, y: 116, w: 16, d: 14, rot: 0.5, h: 6 },
  { x: -232, y: 132, w: 7, d: 7, rot: 0.5, h: 10, mast: true },
  { x: -36, y: -262, w: 10, d: 8, rot: 0, h: 4 },
]
export const PAD_DECAL = { x: -62, y: -250, r: 16 }

/* ───── 주변 정보(채집·보급) ───── */
const POI_KINDS: PoiKind[] = ['kit', 'cell', 'chip', 'o2']
export const POIS: Poi[] = [
  { x: -26, y: -14, kind: 'kit' },
  { x: 32, y: -64, kind: 'o2' },
  { x: -58, y: -78, kind: 'chip' },
  { x: 44, y: 28, kind: 'cell' },
  { x: -36, y: 52, kind: 'kit' },
  { x: 70, y: -20, kind: 'chip' },
  { x: 12, y: -100, kind: 'o2' },
  { x: -84, y: -24, kind: 'cell' },
]
for (let i = 0; POIS.length < 26 && i < 400; i++) {
  const x = R(-HALF + 30, HALF - 30)
  const y = R(-HALF + 30, HALF - 30)
  if (free(x, y, 2)) POIS.push({ x, y, kind: POI_KINDS[POIS.length % 4] })
}

/* ───── 잔해 드론 순찰 경로 ───── */
export const DRONE_PATROLS = [
  { cx: 78, cy: 46, r: 26, spd: 0.22 },
  { cx: -130, cy: 140, r: 34, spd: -0.18 },
  { cx: 190, cy: -50, r: 22, spd: 0.26 },
]

/* ──────────────────────────────────────────────────────────────
 * 그리기
 * ────────────────────────────────────────────────────────────── */

export const COLORS = {
  objective: '#ffb52e',
  danger: '#ff6a5c',
  minor: '#9fb4c7',
  player: '#5ad1ff',
}

function pathBlob(ctx: CanvasRenderingContext2D, pts: number[]) {
  const n = pts.length / 2
  const mx = (i: number) => (pts[(i % n) * 2] + pts[((i + 1) % n) * 2]) / 2
  const my = (i: number) => (pts[(i % n) * 2 + 1] + pts[((i + 1) % n) * 2 + 1]) / 2
  ctx.moveTo(mx(n - 1), my(n - 1))
  for (let i = 0; i < n; i++) ctx.quadraticCurveTo(pts[i * 2], pts[i * 2 + 1], mx(i), my(i))
  ctx.closePath()
}
function pathLine(ctx: CanvasRenderingContext2D, pts: number[]) {
  ctx.moveTo(pts[0], pts[1])
  const n = pts.length / 2
  for (let i = 1; i < n - 1; i++) {
    const cx = pts[i * 2]
    const cy = pts[i * 2 + 1]
    ctx.quadraticCurveTo(cx, cy, (cx + pts[i * 2 + 2]) / 2, (cy + pts[i * 2 + 3]) / 2)
  }
  ctx.lineTo(pts[n * 2 - 2], pts[n * 2 - 1])
}

let speckle: CanvasPattern | null | undefined
function groundPattern(ctx: CanvasRenderingContext2D) {
  if (speckle !== undefined) return speckle
  speckle = null
  if (typeof document === 'undefined') return speckle
  const c = document.createElement('canvas')
  c.width = c.height = 160
  const g = c.getContext('2d')
  if (!g) return speckle
  const r = mulberry(7)
  for (let i = 0; i < 900; i++) {
    const light = r() < 0.5
    g.fillStyle = light ? `rgba(160,190,110,${0.08 + r() * 0.12})` : `rgba(20,30,15,${0.1 + r() * 0.14})`
    const x = r() * 160
    const y = r() * 160
    if (r() < 0.55) {
      // 풀 줄기
      g.strokeStyle = g.fillStyle
      g.lineWidth = 1.2
      g.beginPath()
      g.moveTo(x, y)
      g.lineTo(x + (r() - 0.5) * 4, y - 3 - r() * 4)
      g.stroke()
    } else g.fillRect(x, y, 1.5 + r() * 2, 1.5 + r() * 2)
  }
  speckle = ctx.createPattern(c, 'repeat')
  speckle?.setTransform(new DOMMatrix([0.08, 0, 0, 0.08, 0, 0]))
  return speckle
}

export interface View {
  W: number
  H: number
  /** 플레이어 발 위치 (화면 px) */
  cx: number
  cy: number
  /** 가로 1m 당 px */
  S: number
  /** 지면 세로 압축 (3/4 내려다보기) */
  q: number
  /** 높이 1m 당 px 배율 (S 기준) */
  hv: number
  /** 카메라 방위 — 이 방향이 화면 위 */
  yaw: number
  px: number
  py: number
}

/** 월드(m) → 화면(px) */
export function toScreen(v: View, x: number, y: number): [number, number] {
  const dx = x - v.px
  const dy = y - v.py
  const c = Math.cos(v.yaw)
  const s = Math.sin(v.yaw)
  return [v.cx + v.S * (c * dx - s * dy), v.cy - v.S * v.q * (s * dx + c * dy)]
}

export interface WorldExtras {
  t: number
  objective: { x: number; y: number; scale: number; alpha: number } | null
  drones: { x: number; y: number; alert: boolean }[]
  dots: { x: number; y: number; b: number }[]
  /** 플레이어 몸 방향 */
  heading: number
}

/** 게임 화면 — 3/4 내려다보기. 카메라 방위가 화면 위 */
export function drawWorld(ctx: CanvasRenderingContext2D, v: View, ex: WorldExtras) {
  const { W, H, S, q, px, py } = v
  const c = Math.cos(v.yaw)
  const s = Math.sin(v.yaw)
  const a = S * c
  const b = -S * q * s
  const cc = -S * s
  const d = -S * q * c
  const e = v.cx - a * px - cc * py
  const f = v.cy - b * px - d * py
  const reach = Math.hypot(W, H * 2) / S / q / 1.6 + 10
  const near = (x: number, y: number, r: number) => Math.abs(x - px) < reach + r && Math.abs(y - py) < reach + r

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = '#56693d'
  ctx.fillRect(0, 0, W, H)
  ctx.setTransform(a, b, cc, d, e, f)

  const pat = groundPattern(ctx)
  if (pat) {
    ctx.fillStyle = pat
    ctx.fillRect(px - reach, py - reach, reach * 2, reach * 2)
  }
  ctx.fillStyle = 'rgba(30,44,24,0.42)'
  ctx.beginPath()
  for (const m of MOSS) if (near(m.x, m.y, m.r)) pathBlob(ctx, m.pts)
  ctx.fill()
  ctx.fillStyle = 'rgba(150,170,84,0.28)'
  ctx.beginPath()
  for (const m of MEADOW) if (near(m.x, m.y, m.r)) pathBlob(ctx, m.pts)
  ctx.fill()
  ctx.fillStyle = 'rgba(30,48,26,0.5)'
  ctx.beginPath()
  for (const g of GROVES) if (near(g.x, g.y, g.r)) pathBlob(ctx, g.pts)
  ctx.fill()
  ctx.fillStyle = 'rgba(132,118,82,0.55)'
  ctx.beginPath()
  for (const m of DUST) if (near(m.x, m.y, m.r)) pathBlob(ctx, m.pts)
  ctx.fill()

  // 물: 젖은 둑 → 수면 → 하이라이트
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.strokeStyle = 'rgba(40,52,36,0.9)'
  ctx.lineWidth = 6
  ctx.beginPath()
  pathLine(ctx, RIVER)
  ctx.stroke()
  ctx.fillStyle = 'rgba(40,52,36,0.9)'
  ctx.beginPath()
  pathBlob(ctx, LAKE.pts)
  PONDS.forEach(p => pathBlob(ctx, p.pts))
  ctx.fill()
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.fillStyle = '#2d5a6a'
  ctx.strokeStyle = '#2d5a6a'
  ctx.lineWidth = 10
  ctx.beginPath()
  pathLine(ctx, RIVER)
  ctx.stroke()
  ctx.beginPath()
  pathBlob(ctx, LAKE.pts)
  PONDS.forEach(p => pathBlob(ctx, p.pts))
  ctx.fill()
  ctx.strokeStyle = 'rgba(150,210,225,0.35)'
  ctx.lineWidth = 0.35
  for (let i = 0; i < 6; i++) {
    const wy = LAKE.y - 30 + i * 11
    ctx.beginPath()
    ctx.moveTo(LAKE.x - 20 + ((i * 17) % 13), wy)
    ctx.lineTo(LAKE.x + 6 + ((i * 11) % 9), wy + 0.6)
    ctx.stroke()
  }

  // 길: 바깥 그림자 → 흙 → 바퀴 자국
  ctx.strokeStyle = 'rgba(52,44,30,0.55)'
  ctx.lineWidth = 5.4
  ctx.beginPath()
  ROADS.forEach(r => pathLine(ctx, r))
  ctx.stroke()
  ctx.strokeStyle = '#94845f'
  ctx.lineWidth = 4.2
  ctx.stroke()
  ctx.strokeStyle = 'rgba(70,58,38,0.45)'
  ctx.lineWidth = 0.5
  ctx.setLineDash([2.5, 1.5])
  ctx.stroke()
  ctx.setLineDash([])

  // 착륙장 바닥 표시
  ctx.fillStyle = '#7b7a72'
  ctx.strokeStyle = '#d7d6cc'
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.arc(PAD_DECAL.x, PAD_DECAL.y, PAD_DECAL.r, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(PAD_DECAL.x, PAD_DECAL.y, PAD_DECAL.r * 0.6, 0, Math.PI * 2)
  ctx.stroke()

  // 덤불
  ctx.fillStyle = '#34482a'
  ctx.beginPath()
  for (const b2 of BUSHES) if (near(b2.x, b2.y, 2)) pathBlob(ctx, b2.pts)
  ctx.fill()
  ctx.fillStyle = 'rgba(120,150,80,0.55)'
  ctx.beginPath()
  for (const b2 of BUSHES) if (near(b2.x, b2.y, 2)) {
    ctx.moveTo(b2.x - b2.r * 0.15 + b2.r * 0.45, b2.y + b2.r * 0.3)
    ctx.arc(b2.x - b2.r * 0.15, b2.y + b2.r * 0.3, b2.r * 0.45, 0, Math.PI * 2)
  }
  ctx.fill()

  // 바위 (지면에 붙은 다각형 + 밝은 면)
  ctx.fillStyle = '#6f7068'
  ctx.beginPath()
  for (const r of ROCKS) if (near(r.x, r.y, 2)) pathBlob(ctx, r.pts)
  ctx.fill()
  ctx.fillStyle = 'rgba(214,214,200,0.28)'
  ctx.beginPath()
  for (const r of ROCKS) if (r.r > 0.7 && near(r.x, r.y, 2)) {
    ctx.moveTo(r.x + r.r * 0.5, r.y + r.r * 0.1)
    ctx.arc(r.x, r.y + r.r * 0.1, r.r * 0.5, 0, Math.PI * 2)
  }
  ctx.fill()

  // 목표 지점 바닥 고리
  const o = ex.objective
  if (o) {
    ctx.globalAlpha = o.alpha
    ctx.strokeStyle = COLORS.objective
    ctx.lineWidth = 0.35
    for (const rr of [3.2, 4.6]) {
      ctx.beginPath()
      ctx.arc(o.x, o.y, rr * o.scale, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.fillStyle = 'rgba(255,181,46,0.18)'
    ctx.beginPath()
    ctx.arc(o.x, o.y, 3.2 * o.scale, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  // 미니맵 없음: 바닥 점열
  for (const dot of ex.dots) {
    ctx.fillStyle = `rgba(255,181,46,${0.18 + dot.b * 0.5})`
    ctx.beginPath()
    ctx.arc(dot.x, dot.y, 0.6 + dot.b * 0.3, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = `rgba(255,226,160,${0.35 + dot.b * 0.65})`
    ctx.beginPath()
    ctx.arc(dot.x, dot.y, 0.3, 0, Math.PI * 2)
    ctx.fill()
  }

  // 플레이어 발밑 고리
  ctx.strokeStyle = 'rgba(90,209,255,0.55)'
  ctx.lineWidth = 0.18
  ctx.beginPath()
  ctx.arc(px, py, 1.6, 0, Math.PI * 2)
  ctx.stroke()
  // 몸 방향 표시 (발밑 쐐기)
  const hx = Math.sin(ex.heading)
  const hy = Math.cos(ex.heading)
  ctx.fillStyle = 'rgba(90,209,255,0.8)'
  ctx.beginPath()
  ctx.moveTo(px + hx * 2.5, py + hy * 2.5)
  ctx.lineTo(px + hx * 1.75 - hy * 0.6, py + hy * 1.75 + hx * 0.6)
  ctx.lineTo(px + hx * 1.75 + hy * 0.6, py + hy * 1.75 - hx * 0.6)
  ctx.closePath()
  ctx.fill()

  /* ───── 세워 그리는 것들 (화면 y 순 정렬) ───── */
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  const items: { y: number; draw: () => void }[] = []
  const inView = (sx: number, sy: number, up: number) => sx > -220 && sx < W + 220 && sy > -40 && sy - up < H + 40
  const hpx = S * v.hv

  for (const t of TREES) {
    if (!near(t.x, t.y, 4)) continue
    const [sx, sy] = toScreen(v, t.x, t.y)
    if (!inView(sx, sy, 7 * hpx) || sy > H + 7 * hpx) continue
    // 플레이어 앞(화면 아래쪽)에서 캐릭터를 가리는 나무는 반투명하게 — 3인칭 게임의 가림 페이드
    const occ = sy > v.cy && sy - v.cy < hpx * 6 && Math.abs(sx - v.cx) < S * 2.6 * t.s
    items.push({ y: sy, draw: () => drawTree(ctx, sx, sy, S * t.s, hpx * t.s, q, t.v, occ ? 0.4 : 1) })
  }
  for (const bld of BUILDINGS) {
    if (!near(bld.x, bld.y, 30)) continue
    const corners = boxCorners(bld).map(([x, y]) => toScreen(v, x, y))
    const maxY = Math.max(...corners.map(p => p[1]))
    if (maxY < -40 || Math.min(...corners.map(p => p[1])) - bld.h * hpx > H + 40) continue
    items.push({ y: maxY, draw: () => drawBox(ctx, corners, bld.h * hpx, bld.mast) })
  }
  for (const poi of POIS) {
    if (!near(poi.x, poi.y, 2)) continue
    const [sx, sy] = toScreen(v, poi.x, poi.y)
    if (!inView(sx, sy, hpx * 2)) continue
    items.push({ y: sy, draw: () => drawCrate(ctx, sx, sy, S, hpx, q) })
  }
  ex.drones.forEach((dr, i) => {
    if (!near(dr.x, dr.y, 4)) return
    const [sx, sy] = toScreen(v, dr.x, dr.y)
    if (!inView(sx, sy, hpx * 6)) return
    items.push({ y: sy, draw: () => drawDrone(ctx, sx, sy, S, hpx, q, ex.t + i * 1.7, dr.alert) })
  })
  if (o && near(o.x, o.y, 4)) {
    const [sx, sy] = toScreen(v, o.x, o.y)
    if (inView(sx, sy, hpx * 18)) items.push({ y: sy, draw: () => drawBeacon(ctx, sx, sy, S, hpx, o.scale, o.alpha) })
  }
  items.push({ y: v.cy, draw: () => drawPlayer(ctx, v.cx, v.cy, S, hpx, q) })
  items.sort((m, n) => m.y - n.y)
  for (const it of items) it.draw()
}

function boxCorners(b: Building): [number, number][] {
  const c = Math.cos(b.rot)
  const s = Math.sin(b.rot)
  return [
    [-b.w / 2, -b.d / 2],
    [b.w / 2, -b.d / 2],
    [b.w / 2, b.d / 2],
    [-b.w / 2, b.d / 2],
  ].map(([x, y]) => [b.x + x * c - y * s, b.y + x * s + y * c])
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, m: number, hm: number, q: number, v: number, alpha: number) {
  ctx.globalAlpha = alpha
  ctx.fillStyle = 'rgba(10,18,8,0.32)'
  ctx.beginPath()
  ctx.ellipse(x + m * 0.7, y - m * q * 0.1, m * 2.3, m * 2.3 * q, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#3b2e22'
  ctx.fillRect(x - m * 0.22, y - hm * 2.4, m * 0.44, hm * 2.4)
  const g = Math.round(v * 14)
  const dark = `rgb(${34 + g},${58 + g},${36 + g})`
  const mid = `rgb(${48 + g},${82 + g},${46 + g})`
  const lite = `rgb(${74 + g},${112 + g},${62 + g})`
  ctx.fillStyle = dark
  ctx.beginPath()
  ctx.arc(x, y - hm * 3.6, m * 2.05, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = mid
  ctx.beginPath()
  ctx.arc(x - m * 0.45, y - hm * 4.15, m * 1.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = lite
  ctx.beginPath()
  ctx.arc(x - m * 0.7, y - hm * 4.55, m * 0.85, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
}

function drawBox(ctx: CanvasRenderingContext2D, base: [number, number][], h: number, mast?: boolean) {
  const top = base.map(([x, y]) => [x, y - h] as [number, number])
  // 그림자
  ctx.fillStyle = 'rgba(8,12,6,0.3)'
  ctx.beginPath()
  base.forEach(([x, y], i) => (i ? ctx.lineTo(x + h * 0.35, y) : ctx.moveTo(x + h * 0.35, y)))
  ctx.closePath()
  ctx.fill()
  const edges = [0, 1, 2, 3].map(i => {
    const j = (i + 1) % 4
    return { i, j, my: (base[i][1] + base[j][1]) / 2, nx: base[j][1] - base[i][1] }
  })
  edges.sort((m, n) => m.my - n.my)
  for (const ed of edges) {
    const [ax, ay] = base[ed.i]
    const [bx, by] = base[ed.j]
    const shade = ed.nx > 0 ? '#5f6870' : '#7c868f'
    ctx.fillStyle = shade
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(bx, by)
    ctx.lineTo(bx, by - h)
    ctx.lineTo(ax, ay - h)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = 'rgba(10,14,18,0.45)'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
  ctx.fillStyle = mast ? '#9aa3aa' : '#b9c1c7'
  ctx.beginPath()
  top.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = 'rgba(10,14,18,0.55)'
  ctx.lineWidth = 2
  ctx.stroke()
  if (mast) {
    const cx = (top[0][0] + top[2][0]) / 2
    const cy = (top[0][1] + top[2][1]) / 2
    ctx.strokeStyle = '#c9d0d5'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx, cy - h * 0.35)
    ctx.stroke()
  }
}

function drawCrate(ctx: CanvasRenderingContext2D, x: number, y: number, S: number, hm: number, q: number) {
  const w = S * 1.1
  const h = hm * 0.9
  const t = S * 0.5 * q
  ctx.fillStyle = 'rgba(8,12,6,0.35)'
  ctx.beginPath()
  ctx.ellipse(x + w * 0.2, y, w * 0.75, w * 0.75 * q, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#5f7284'
  ctx.fillRect(x - w / 2, y - h, w, h)
  ctx.fillStyle = '#9fb4c7'
  ctx.beginPath()
  ctx.moveTo(x - w / 2, y - h)
  ctx.lineTo(x - w / 2 + t * 0.6, y - h - t)
  ctx.lineTo(x + w / 2 + t * 0.6, y - h - t)
  ctx.lineTo(x + w / 2, y - h)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#d6e2ec'
  ctx.fillRect(x - w / 2, y - h * 0.55, w, h * 0.14)
  ctx.strokeStyle = 'rgba(8,12,18,0.6)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(x - w / 2, y - h, w, h)
}

function drawDrone(ctx: CanvasRenderingContext2D, x: number, y: number, S: number, hm: number, q: number, t: number, alert: boolean) {
  const lift = hm * (3.2 + Math.sin(t * 2.1) * 0.3)
  ctx.fillStyle = 'rgba(8,12,6,0.35)'
  ctx.beginPath()
  ctx.ellipse(x, y, S * 0.9, S * 0.9 * q, 0, 0, Math.PI * 2)
  ctx.fill()
  const cy = y - lift
  const w = S * 1.7
  const h = S * 1.5
  ctx.fillStyle = '#ff6a5c'
  ctx.strokeStyle = '#2a0e0c'
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(x, cy - h * 0.6)
  ctx.lineTo(x + w / 2, cy + h * 0.4)
  ctx.lineTo(x - w / 2, cy + h * 0.4)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#3a1210'
  ctx.beginPath()
  ctx.moveTo(x, cy - h * 0.12)
  ctx.lineTo(x + w * 0.2, cy + h * 0.26)
  ctx.lineTo(x - w * 0.2, cy + h * 0.26)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = alert ? '#fff1b8' : '#ffd0c8'
  ctx.beginPath()
  ctx.arc(x, cy + h * 0.1, S * 0.16, 0, Math.PI * 2)
  ctx.fill()
}

function drawBeacon(ctx: CanvasRenderingContext2D, x: number, y: number, S: number, hm: number, scale: number, alpha: number) {
  ctx.globalAlpha = alpha
  const top = y - hm * 16
  const g = ctx.createLinearGradient(0, y, 0, top)
  g.addColorStop(0, 'rgba(255,181,46,0.55)')
  g.addColorStop(1, 'rgba(255,181,46,0)')
  ctx.fillStyle = g
  const w = S * 0.9 * scale
  ctx.fillRect(x - w / 2, top, w, y - top)
  const cy = y - hm * 6.5
  ctx.strokeStyle = '#1d1405'
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.arc(x, cy, S * 1.05 * scale, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = COLORS.objective
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.fillStyle = COLORS.objective
  ctx.beginPath()
  ctx.arc(x, cy, S * 0.55 * scale, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
}

function drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number, S: number, hm: number, q: number) {
  ctx.fillStyle = 'rgba(8,12,6,0.4)'
  ctx.beginPath()
  ctx.ellipse(x, y, S * 0.75, S * 0.75 * q, 0, 0, Math.PI * 2)
  ctx.fill()
  const w = S * 1.2
  const h = hm * 3.3
  ctx.fillStyle = COLORS.player
  ctx.strokeStyle = '#06222e'
  ctx.lineWidth = 3.5
  ctx.beginPath()
  ctx.roundRect(x - w / 2, y - h, w, h, w / 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.beginPath()
  ctx.roundRect(x - w * 0.28, y - h * 0.9, w * 0.2, h * 0.5, w * 0.1)
  ctx.fill()
}

/** 미니맵 지도 — 북쪽이 위인 그림. k = px/m, R = 반지름(px) */
export function drawMinimapMap(ctx: CanvasRenderingContext2D, size: number, k: number, px: number, py: number) {
  const R = size / 2
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = '#304236'
  ctx.fillRect(0, 0, size, size)
  ctx.setTransform(k, 0, 0, -k, R - px * k, R + py * k)
  const reach = (R * 1.5) / k + 10
  const near = (x: number, y: number, r: number) => Math.abs(x - px) < reach + r && Math.abs(y - py) < reach + r
  const px1 = 1 / k

  // 50m 격자 — 회전을 눈으로 따라가게 돕는다
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth = px1
  ctx.beginPath()
  for (let gx = Math.floor((px - reach) / 50) * 50; gx < px + reach; gx += 50) {
    ctx.moveTo(gx, py - reach)
    ctx.lineTo(gx, py + reach)
  }
  for (let gy = Math.floor((py - reach) / 50) * 50; gy < py + reach; gy += 50) {
    ctx.moveTo(px - reach, gy)
    ctx.lineTo(px + reach, gy)
  }
  ctx.stroke()

  ctx.fillStyle = '#3a4d3a'
  ctx.beginPath()
  for (const m of MEADOW) if (near(m.x, m.y, m.r)) pathBlob(ctx, m.pts)
  ctx.fill()
  ctx.fillStyle = '#1c2a21'
  ctx.beginPath()
  for (const g of GROVES) if (near(g.x, g.y, g.r)) pathBlob(ctx, g.pts)
  ctx.fill()
  ctx.fillStyle = '#4e4c38'
  ctx.beginPath()
  for (const m of DUST) if (near(m.x, m.y, m.r)) pathBlob(ctx, m.pts)
  ctx.fill()

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.fillStyle = '#2b6a86'
  ctx.strokeStyle = '#2b6a86'
  ctx.lineWidth = Math.max(8, 5 * px1)
  ctx.beginPath()
  pathLine(ctx, RIVER)
  ctx.stroke()
  ctx.beginPath()
  pathBlob(ctx, LAKE.pts)
  PONDS.forEach(p => pathBlob(ctx, p.pts))
  ctx.fill()
  ctx.strokeStyle = '#69aac4'
  ctx.lineWidth = 1.5 * px1
  ctx.stroke()

  // 길은 축척과 상관없이 같은 굵기(px) — 확대해도 지도가 뭉개지지 않는다
  ctx.strokeStyle = '#141b16'
  ctx.lineWidth = 8 * px1
  ctx.beginPath()
  ROADS.forEach(r => pathLine(ctx, r))
  ctx.stroke()
  ctx.strokeStyle = '#b9aa83'
  ctx.lineWidth = 4.5 * px1
  ctx.stroke()

  ctx.strokeStyle = '#cfd4d8'
  ctx.lineWidth = 1.5 * px1
  ctx.beginPath()
  ctx.arc(PAD_DECAL.x, PAD_DECAL.y, PAD_DECAL.r, 0, Math.PI * 2)
  ctx.stroke()

  for (const b of BUILDINGS) {
    if (!near(b.x, b.y, 30)) continue
    const cs = boxCorners(b)
    ctx.fillStyle = '#d9dee2'
    ctx.strokeStyle = '#0b1014'
    ctx.lineWidth = 2 * px1
    ctx.beginPath()
    cs.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

const DIRS = ['북', '북동', '동', '남동', '남', '남서', '서', '북서']
/** 방위(라디안) → '북동' 같은 8방위 */
export const dirName = (bearing: number) => DIRS[((Math.round(bearing / (Math.PI / 4)) % 8) + 8) % 8]
/** 두 점 사이 방위 (0 = 북, 시계 +) */
export const bearingTo = (fx: number, fy: number, tx: number, ty: number) => Math.atan2(tx - fx, ty - fy)
export const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
