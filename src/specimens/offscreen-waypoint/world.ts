import { PerspectiveCamera } from 'three'
import { syncFpsCamera } from '../../core/projection'

export { project, relativeBearing, wrapAngle as wrap } from '../../core/projection'

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
  syncFpsCamera(cam, { ...c, y: EYE })
}
