/* ──────────────────────────────────────────────────────────────
 * 데미지 숫자 — 데이터 모델 (범주 스타일 표 · 표기 · 무대 배치)
 * 화면 그리기와 분리해 두면 Unity 의 ScriptableObject(DamageCategoryStyle)와 1:1 로 대응한다.
 * ────────────────────────────────────────────────────────────── */
import type { Aspect } from '../../core/types'
import type { Role } from '../../core/silhouettes'

export type Cat = 'normal' | 'crit' | 'break' | 'heal' | 'block'
export type StackMode = 'lane' | 'scatter' | 'merge' | 'overlap'
export type ColorMap = 'category' | 'redGreen' | 'mono'
export type NumberFormat = 'full' | 'grouped' | 'short'
export type UnitId = 'droneA' | 'boss' | 'droneB' | 'sera' | 'harin' | 'doyun'

/** 범주 스타일 표 — 크기 배율 · 배지 글자 · 기울기 · 수명 배율 (색은 damageColorMap 이 정한다) */
export const CAT_STYLE: Record<Cat, { size: number; badge: string; tiltDeg: number; lifeScale: number; popPeak: number; popFrom: number; popMs: number }> = {
  normal: { size: 1, badge: '', tiltDeg: 0, lifeScale: 1, popPeak: 1.15, popFrom: 0.6, popMs: 140 },
  // crit 의 size 는 critScale 파라미터로 덮어쓴다
  crit: { size: 1.5, badge: '치명', tiltDeg: -6, lifeScale: 1.15, popPeak: 1.3, popFrom: 0.5, popMs: 180 },
  break: { size: 1.22, badge: '파괴', tiltDeg: 0, lifeScale: 1.15, popPeak: 1.22, popFrom: 0.55, popMs: 180 },
  heal: { size: 0.95, badge: '', tiltDeg: 0, lifeScale: 1.25, popPeak: 1.06, popFrom: 0.8, popMs: 200 },
  block: { size: 0.68, badge: '막힘', tiltDeg: 0, lifeScale: 1, popPeak: 1.08, popFrom: 0.85, popMs: 120 },
}

const CATEGORY_COLORS: Record<Cat, string> = {
  normal: '#eef2f6', // 밝은 회백
  crit: '#ffb43c', // 호박
  break: '#c88cff', // 자주
  heal: '#3fe0bd', // 청록
  block: '#8f9bad', // 회색
}
/** 흔한 실수: 빨강=피해, 초록=회복 둘만 (흑백 미리보기에서 명도가 거의 같다) */
const RED = '#e2553f'
const GREEN = '#3f9c4a'

export function colorOf(cat: Cat, map: ColorMap): string {
  if (map === 'mono') return '#f2f4f7'
  if (map === 'redGreen') return cat === 'heal' ? GREEN : RED
  return CATEGORY_COLORS[cat]
}

/** 숫자 표기 — 전체 자릿수 · 천 단위 구분 · 축약(K/M) */
export function formatValue(v: number, f: NumberFormat): string {
  const n = Math.round(v)
  if (f === 'full') return String(n)
  if (f === 'short') {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return String(n)
  }
  return n.toLocaleString('ko-KR')
}

/* ───── 무대 배치 ───── */
export interface UnitDef {
  id: UnitId
  role: Role
  name: string
  level?: number
  x: number
  y: number
  h: number
  hpMax: number
  /** 가드 게이지 칸 수 (아군은 0) */
  guard: number
  plateW: number
}

export interface Layout {
  units: UnitDef[]
  /** 숫자 기본 글자 크기(px) */
  base: number
  /** 배지 글자 크기(px) */
  badge: number
  /** 화면 좌우 경계 (합계 표시를 뒤집는 기준) */
  W: number
  H: number
}

export function layoutFor(aspect: Aspect): Layout {
  if (aspect === '9:16') {
    return {
      W: 1080,
      H: 1920,
      base: 64,
      badge: 28,
      units: [
        { id: 'boss', role: 'enemy', name: '대형 잔해 드론', level: 40, x: 540, y: 790, h: 320, hpMax: 64000, guard: 6, plateW: 460 },
        { id: 'droneA', role: 'enemy', name: '잔해 드론', level: 31, x: 200, y: 1190, h: 160, hpMax: 18000, guard: 3, plateW: 300 },
        { id: 'droneB', role: 'enemy', name: '방어 드론', level: 33, x: 880, y: 1190, h: 160, hpMax: 18000, guard: 3, plateW: 300 },
        { id: 'sera', role: 'ally', name: '세라', x: 270, y: 1640, h: 200, hpMax: 4200, guard: 0, plateW: 220 },
        { id: 'harin', role: 'ally', name: '하린', x: 540, y: 1665, h: 220, hpMax: 5200, guard: 0, plateW: 220 },
        { id: 'doyun', role: 'ally', name: '도윤', x: 810, y: 1640, h: 210, hpMax: 4800, guard: 0, plateW: 220 },
      ],
    }
  }
  return {
    W: 1920,
    H: 1080,
    base: 50,
    badge: 23,
    units: [
      { id: 'droneA', role: 'enemy', name: '잔해 드론', level: 31, x: 800, y: 560, h: 150, hpMax: 18000, guard: 3, plateW: 250 },
      { id: 'boss', role: 'enemy', name: '대형 잔해 드론', level: 40, x: 1200, y: 640, h: 300, hpMax: 64000, guard: 6, plateW: 400 },
      { id: 'droneB', role: 'enemy', name: '방어 드론', level: 33, x: 1720, y: 560, h: 150, hpMax: 18000, guard: 3, plateW: 250 },
      { id: 'sera', role: 'ally', name: '세라', x: 170, y: 880, h: 180, hpMax: 4200, guard: 0, plateW: 170 },
      { id: 'harin', role: 'ally', name: '하린', x: 360, y: 905, h: 200, hpMax: 5200, guard: 0, plateW: 170 },
      { id: 'doyun', role: 'ally', name: '도윤', x: 550, y: 880, h: 190, hpMax: 4800, guard: 0, plateW: 170 },
    ],
  }
}

/** 숫자가 태어나는 앵커 (적 = 몸통 위쪽, 아군 = 머리 위) */
export const hitAnchor = (u: UnitDef) => (u.role === 'enemy' ? { x: u.x, y: u.y - u.h * 0.8 } : { x: u.x, y: u.y - u.h - 14 })

/** 결정론적 의사 난수 (같은 순서면 같은 값 — 스크린샷·수업 재현용) */
export function rng(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/* easeOutCubic 은 core/countup 의 것을 쓴다. 아래는 이 표본에만 필요한 이징 */
export const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)
export const easeOutSine = (t: number) => Math.sin((t * Math.PI) / 2)
export const easeInQuad = (t: number) => t * t
