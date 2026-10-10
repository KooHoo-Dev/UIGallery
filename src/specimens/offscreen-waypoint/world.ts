import { PerspectiveCamera, Vector3 } from 'three'

/* HUD 와 3D Scene 이 함께 쓰는 세계 정의 (단위: 미터) */

export interface Objective {
  id: string
  label: string
  kind: 'main' | 'side' | 'ally'
  pos: [number, number, number]
  color: string
}

export const OBJECTIVES: Objective[] = [
  { id: 'main', label: '주 목표', kind: 'main', pos: [22, 0, -58], color: '#ffc443' },
  { id: 'side', label: '보조 목표', kind: 'side', pos: [-64, 0, 14], color: '#4fd8ff' },
  { id: 'ally', label: '동료', kind: 'ally', pos: [12, 0, 34], color: '#7dff9a' },
]

/** 주변 관심 지점(POI) — 나침반 띠에만 표시된다 */
export interface Poi {
  id: string
  label: string
  glyph: 'tent' | 'tower' | 'spring'
  pos: [number, number, number]
}
export const POIS: Poi[] = [
  { id: 'camp', label: '야영지', glyph: 'tent', pos: [-34, 0, -44] },
  { id: 'tower', label: '전망탑', glyph: 'tower', pos: [52, 0, 18] },
  { id: 'spring', label: '샘', glyph: 'spring', pos: [-12, 0, 72] },
]

/** 결정론적 지형 소품 (무작위 없음 → 매번 같은 장면) */
export const PROPS = Array.from({ length: 46 }, (_, i) => {
  const a = i * 2.39996
  const r = 14 + ((i * 37) % 90)
  return {
    pos: [Math.cos(a) * r, 0, Math.sin(a) * r] as [number, number, number],
    s: 0.8 + ((i * 13) % 10) / 6,
    kind: i % 3 === 0 ? 'pillar' : 'rock',
  }
})

export const EYE = 1.7
export const FOV = 60

export interface CamState {
  yaw: number
  pitch: number
  x: number
  z: number
}

export function makeCamera(aspect: number) {
  return new PerspectiveCamera(FOV, aspect, 0.1, 1000)
}

export function syncCamera(cam: PerspectiveCamera, c: CamState) {
  cam.position.set(c.x, EYE, c.z)
  cam.rotation.set(c.pitch, c.yaw, 0, 'YXZ')
  cam.updateMatrixWorld(true)
}

const tmp = new Vector3()
const tmp2 = new Vector3()

export interface Projection {
  /** 화면 안(여백 안쪽)에 보이는가 */
  onScreen: boolean
  /** 화면 좌표 (논리 해상도 px) — 화면 밖이면 가장자리에 고정된 위치 */
  x: number
  y: number
  /** 화면 밖 화살표 방향 (라디안, 화면 좌표계: 0 = 오른쪽, π/2 = 아래) */
  angle: number
  distance: number
  /** 클램프 없이 그대로 투영한 좌표 — 뒤쪽 목표는 화면에 '거울상'으로 나타난다 (흔한 버그 재현용) */
  rawX: number
  rawY: number
  rawVisible: boolean
}

/**
 * 월드 좌표 → 화면 좌표. 화면 밖이면 중심에서 그 방향으로 뻗은 직선이
 * 여백(margin)만큼 안쪽의 사각형/타원과 만나는 점에 고정한다.
 */
export function project(
  cam: PerspectiveCamera,
  world: [number, number, number],
  W: number,
  H: number,
  margin: number,
  shape: 'rect' | 'ellipse',
): Projection {
  tmp.set(world[0], world[1], world[2])
  const distance = tmp2.set(cam.position.x, 0, cam.position.z).distanceTo(tmp.clone().setY(0))
  const camSpace = tmp2.copy(tmp).applyMatrix4(cam.matrixWorldInverse) // 카메라는 -Z 를 본다
  const inFront = camSpace.z < -0.01
  const ndc = tmp.project(cam)
  const halfW = W / 2
  const halfH = H / 2
  const a = halfW - margin
  const b = halfH - margin

  const rawX = halfW + ndc.x * halfW
  const rawY = halfH - ndc.y * halfH
  const rawVisible = Math.abs(ndc.x) <= 1 && Math.abs(ndc.y) <= 1
  const raw = { rawX, rawY, rawVisible }

  if (inFront) {
    const sx = ndc.x * halfW
    const sy = -ndc.y * halfH
    const inside = shape === 'rect' ? Math.abs(sx) <= a && Math.abs(sy) <= b : (sx / a) ** 2 + (sy / b) ** 2 <= 1
    if (inside) return { onScreen: true, x: halfW + sx, y: halfH + sy, angle: 0, distance, ...raw }
  }

  // 화면 밖: 카메라 공간의 x·y 로 방향을 정한다 (뒤쪽이어도 좌우가 뒤집히지 않음)
  let dx = camSpace.x
  let dy = -camSpace.y
  if (!inFront && Math.hypot(dx, dy) < 1e-3) dy = 1
  if (!inFront) dy = Math.max(dy, Math.abs(dx) * 0.15) // 바로 뒤에 있으면 아래쪽으로 기울여 '뒤'임을 암시
  const len = Math.hypot(dx, dy) || 1
  dx /= len
  dy /= len
  const t = shape === 'rect' ? Math.min(a / Math.max(1e-6, Math.abs(dx)), b / Math.max(1e-6, Math.abs(dy))) : 1 / Math.sqrt((dx / a) ** 2 + (dy / b) ** 2)
  return { onScreen: false, x: halfW + dx * t, y: halfH + dy * t, angle: Math.atan2(dy, dx), distance, ...raw }
}

/** 카메라 정면 기준 상대 방위 (라디안, +면 왼쪽) */
export function relativeBearing(c: CamState, world: [number, number, number]) {
  const bearing = Math.atan2(-(world[0] - c.x), -(world[2] - c.z))
  return wrap(bearing - c.yaw)
}

export const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
