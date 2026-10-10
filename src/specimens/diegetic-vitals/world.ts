import { Euler, Matrix4, PerspectiveCamera, Quaternion, Vector3 } from 'three'

/* HUD 와 3D Scene 이 함께 쓰는 세계 정의 (단위: 미터).
 * 시뮬레이션은 HUD 가 소유하고(bus.view), Scene 은 그 값을 그리기만 한다 → WebGL 이 없어도 HUD 계산은 그대로 동작. */

export const DEG = Math.PI / 180
export const FOV = 50
/** 진공 구역 경계선 (이보다 -Z 쪽이 진공) */
export const LINE_Z = -1.7
/** 진공 구역 진입 시 걸어가 멈추는 곳 */
export const VAC_STOP = -4.4
/** 등판(생명 유지 장치) 앞면 중심 — 캐릭터 기준. 표면에서 1cm 띄워 겹침 깜빡임을 피한다 */
export const PANEL_Y = 1.24
export const PANEL_Z = 0.345
export const EYE_Y = 1.64
/** 체력 칸 최대 개수 (param 범위 상한) */
export const MAX_CELLS = 12

export type Mount = 'spine' | 'visor' | 'wrist'
export type Scheme = 'gradient' | 'pattern' | 'mono'
export type Orient = 'v' | 'h'

export interface Pose {
  mode: Mount
  yawDeg: number
  charZ: number
}

/** 카메라 배치. spine = 3인칭 어깨 뒤 궤도, visor/wrist = 1인칭 (yaw 는 시선 방향) */
export function poseCamera(cam: PerspectiveCamera, p: Pose) {
  const th = p.yawDeg * DEG
  if (p.mode === 'spine') {
    const R = 2.05
    const sh = 0.46 // 어깨 너머 오프셋 (카메라 오른쪽)
    const rx = Math.cos(th)
    const rz = -Math.sin(th)
    cam.position.set(Math.sin(th) * R + rx * sh, 1.56, p.charZ + Math.cos(th) * R + rz * sh)
    cam.lookAt(rx * sh, 1.24, p.charZ + rz * sh)
  } else {
    cam.position.set(0, EYE_Y, p.charZ - 0.08)
    cam.rotation.set(-0.07, th, 0, 'YXZ')
  }
  cam.updateMatrixWorld(true)
}

const WRIST_OFFSET = new Vector3(0.15, -0.15, -0.62)
const WRIST_ROT = new Quaternion().setFromEuler(new Euler(-0.45, -0.28, 0.05))
const WRIST_SCALE = new Vector3(0.5, 0.5, 0.5)
const tmpM = new Matrix4()

/** 게이지 판(패널)의 월드 행렬. 척추 = 등판, 손목 = 카메라에 붙은 팔 위 화면 */
export function panelMatrix(p: Pose, cam: PerspectiveCamera, out: Matrix4) {
  if (p.mode === 'wrist') {
    tmpM.compose(WRIST_OFFSET, WRIST_ROT, WRIST_SCALE)
    return out.multiplyMatrices(cam.matrixWorld, tmpM)
  }
  return out.makeTranslation(0, PANEL_Y, p.charZ + PANEL_Z)
}

export interface Box {
  x0: number
  y0: number
  x1: number
  y1: number
}
export interface Layout {
  orient: Orient
  cells: { x: number; y: number }[]
  /** 육각 칸 반지름 */
  r: number
  /** 육각형 회전 (세로 쌓기 = 평평한 위, 가로 = 뾰족한 위) */
  hexRot: number
  /** 쌓는 방향과 직각으로 늘린 배율 — 길쭉한 배터리 셀 모양 (멀리서도 칸이 읽히게) */
  cellScale: [number, number]
  arc: { cx: number; cy: number; R: number; w: number; start: number; len: number }
  o2: { x: number; y: number; w: number; h: number }
  spineBox: Box
  arcBox: Box
  o2Box: Box
}

const STRETCH = 2.1

/** 패널 안 배치 (패널 로컬, y 위 +) — 등판은 세로, 손목은 가로 */
export function layout(n: number, orient: Orient): Layout {
  if (orient === 'v') {
    const y0 = -0.165
    const len = 0.47
    const pitch = len / n
    const r = Math.min(0.042, pitch / 1.92)
    const cells = Array.from({ length: n }, (_, i) => ({ x: 0, y: y0 + pitch * (i + 0.5) }))
    const arc = { cx: 0, cy: -0.205, R: 0.112, w: 0.032, start: Math.PI, len: Math.PI }
    const o2 = { x: 0.152, y: 0.235, w: 0.17, h: 0.095 }
    return {
      orient,
      cells,
      r,
      hexRot: 0,
      cellScale: [STRETCH, 1],
      arc,
      o2,
      spineBox: { x0: -r * STRETCH * 1.05, y0: y0, x1: r * STRETCH * 1.05, y1: y0 + len },
      arcBox: { x0: -arc.R - arc.w / 2, y0: arc.cy - arc.R - arc.w / 2, x1: arc.R + arc.w / 2, y1: arc.cy },
      o2Box: { x0: o2.x - o2.w / 2, y0: o2.y - o2.h / 2, x1: o2.x + o2.w / 2, y1: o2.y + o2.h / 2 },
    }
  }
  const x0 = -0.09
  const len = 0.4
  const pitch = len / n
  const r = Math.min(0.042, pitch / 1.92)
  const cells = Array.from({ length: n }, (_, i) => ({ x: x0 + pitch * (i + 0.5), y: 0.055 }))
  const arc = { cx: -0.19, cy: 0.0, R: 0.085, w: 0.03, start: Math.PI / 2, len: Math.PI }
  const o2 = { x: 0.2, y: -0.085, w: 0.17, h: 0.095 }
  return {
    orient,
    cells,
    r,
    hexRot: Math.PI / 2,
    cellScale: [1, STRETCH],
    arc,
    o2,
    spineBox: { x0, y0: 0.055 - r * STRETCH * 1.05, x1: x0 + len, y1: 0.055 + r * STRETCH * 1.05 },
    arcBox: { x0: arc.cx - arc.R - arc.w / 2, y0: arc.cy - arc.R - arc.w / 2, x1: arc.cx, y1: arc.cy + arc.R + arc.w / 2 },
    o2Box: { x0: o2.x - o2.w / 2, y0: o2.y - o2.h / 2, x1: o2.x + o2.w / 2, y1: o2.y + o2.h / 2 },
  }
}

/** 육각형 꼭짓점 (단위 반지름) */
export function hexPoints(rot = 0): [number, number][] {
  return Array.from({ length: 6 }, (_, i) => {
    const a = rot + (i * Math.PI) / 3
    return [Math.cos(a), Math.sin(a)] as [number, number]
  })
}

/* ───── 색 ───── */
export type RGB = [number, number, number]
export const MINT: RGB = [0.24, 0.96, 0.78]
export const AMBER: RGB = [1.0, 0.7, 0.22]
export const RED: RGB = [1.0, 0.27, 0.27]
export const MONO: RGB = [0.78, 0.93, 1.0]
export const ENERGY: RGB = [0.38, 0.62, 1.0]

const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

export type Tier = 'ok' | 'warn' | 'danger'
export const tierOf = (f: number): Tier => (f >= 0.6 ? 'ok' : f >= 0.25 ? 'warn' : 'danger')

/** 체력 비율 → 칸 색. gradient = 연속 보간, pattern = 3단계 고정색(+해칭), mono = 한 색(밝기·칸 수만) */
export function tierColor(f: number, scheme: Scheme): RGB {
  if (scheme === 'mono') return MONO
  if (scheme === 'pattern') {
    const t = tierOf(f)
    return t === 'ok' ? MINT : t === 'warn' ? AMBER : RED
  }
  return mix(mix(RED, AMBER, smooth(0.18, 0.3, f)), MINT, smooth(0.5, 0.66, f))
}

export const css = (c: RGB, k = 1) => `rgb(${Math.round(Math.min(1, c[0] * k) * 255)} ${Math.round(Math.min(1, c[1] * k) * 255)} ${Math.round(Math.min(1, c[2] * k) * 255)})`

/* ───── HUD → Scene 로 넘기는 그리기 상태 ───── */
export interface CellView {
  on: boolean
  /** 0~1 밝기 (꺼짐 연출·부분 칸·치명 맥동이 모두 반영된 값) */
  level: number
  /** 꺼지기 직전 흰 번쩍임 0~1 */
  flash: number
  color: RGB
  hatch: boolean
}

export interface View {
  pose: Pose
  n: number
  scheme: Scheme
  cells: CellView[]
  gain: number
  juice: boolean
  hp: number
  arc: number
  arcEmpty: boolean
  arcDeny: number
  o2: number
  o2Text: string
  o2Alpha: number
  o2Low: boolean
  /** 산소 부족 글리프 깜빡임 0~1 */
  o2Blink: number
  /** 치명 상태 적색 림 글로우 0~1 */
  rim: number
  /** 피격 순간 몸체 플래시 0~1 (제한기 통과 시에만) */
  hit: number
  /** 공기 입자 보임 0~1 (진공이면 0) */
  dust: number
  vacuum: boolean
}
