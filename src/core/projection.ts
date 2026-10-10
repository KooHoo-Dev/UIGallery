import { PerspectiveCamera, Vector3 } from 'three'

/**
 * 월드 → 화면 투영 + 화면 밖 가장자리 고정 (Unity 의 Camera.WorldToScreenPoint + 클램프에 해당).
 * 좌표는 무대 논리 해상도(px), y 는 아래로 +.
 */

export interface Projection {
  /** 여백 경계 안쪽에 보이는가 */
  onScreen: boolean
  /** 화면 좌표 — 화면 밖이면 경계에 고정된 위치 */
  x: number
  y: number
  /** 화면 밖 화살표 방향 (라디안, 0 = 오른쪽, π/2 = 아래) */
  angle: number
  /** 카메라와의 수평 거리 */
  distance: number
  /** 카메라 앞에 있는가 */
  inFront: boolean
  /** 클램프 없이 그대로 투영한 좌표 — 뒤쪽 목표는 '거울상'으로 나타난다 (흔한 버그 재현용) */
  rawX: number
  rawY: number
  rawVisible: boolean
}

const tmp = new Vector3()
const tmp2 = new Vector3()

export function project(
  cam: PerspectiveCamera,
  world: readonly [number, number, number],
  W: number,
  H: number,
  margin: number,
  shape: 'rect' | 'ellipse' = 'rect',
): Projection {
  tmp.set(world[0], world[1], world[2])
  const distance = Math.hypot(world[0] - cam.position.x, world[2] - cam.position.z)
  const camSpace = tmp2.copy(tmp).applyMatrix4(cam.matrixWorldInverse) // 카메라는 -Z 를 본다
  const inFront = camSpace.z < -0.01
  const ndc = tmp.project(cam)
  const halfW = W / 2
  const halfH = H / 2
  const a = halfW - margin
  const b = halfH - margin
  const raw = { rawX: halfW + ndc.x * halfW, rawY: halfH - ndc.y * halfH, rawVisible: Math.abs(ndc.x) <= 1 && Math.abs(ndc.y) <= 1 }

  if (inFront) {
    const sx = ndc.x * halfW
    const sy = -ndc.y * halfH
    const inside = shape === 'rect' ? Math.abs(sx) <= a && Math.abs(sy) <= b : (sx / a) ** 2 + (sy / b) ** 2 <= 1
    if (inside) return { onScreen: true, x: halfW + sx, y: halfH + sy, angle: 0, distance, inFront, ...raw }
  }

  // 화면 밖: 카메라 공간의 x·y 로 방향을 정한다 (뒤쪽이어도 좌우가 뒤집히지 않음)
  let dx = camSpace.x
  let dy = -camSpace.y
  if (!inFront && Math.hypot(dx, dy) < 1e-3) dy = 1
  if (!inFront) dy = Math.max(dy, Math.abs(dx) * 0.15) // 바로 뒤면 아래쪽으로 기울여 '뒤'임을 암시
  const len = Math.hypot(dx, dy) || 1
  dx /= len
  dy /= len
  const t = shape === 'rect' ? Math.min(a / Math.max(1e-6, Math.abs(dx)), b / Math.max(1e-6, Math.abs(dy))) : 1 / Math.sqrt((dx / a) ** 2 + (dy / b) ** 2)
  return { onScreen: false, x: halfW + dx * t, y: halfH + dy * t, angle: Math.atan2(dy, dx), distance, inFront, ...raw }
}

/** 단순 1인칭 카메라 상태 (yaw = Y축 회전, 0 이면 -Z 를 봄) */
export interface FpsCam {
  yaw: number
  pitch: number
  x: number
  y: number
  z: number
}

export function syncFpsCamera(cam: PerspectiveCamera, c: FpsCam) {
  cam.position.set(c.x, c.y, c.z)
  cam.rotation.set(c.pitch, c.yaw, 0, 'YXZ')
  cam.updateMatrixWorld(true)
}

/** 카메라 정면 기준 수평 상대 방위 (라디안, + 면 왼쪽) */
export function relativeBearing(c: { yaw: number; x: number; z: number }, world: readonly [number, number, number]) {
  const bearing = Math.atan2(-(world[0] - c.x), -(world[2] - c.z))
  return wrapAngle(bearing - c.yaw)
}

export const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
