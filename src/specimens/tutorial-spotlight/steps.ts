import type { Side } from '../../core/placement'

/* 튜토리얼 단계 데이터 — Unity 에서는 ScriptableObject 배열에 해당한다 (대상 · 문구 · 말풍선 선호 방향 · 완료 조건) */

export type TargetId = 'tab-mail' | 'mail-claim' | 'tab-shop' | 'item-cell' | 'sortie'

export interface Step {
  target: TargetId
  title: string
  /** `**굵게**` 가능 */
  text: string
  prefer: Side
  /** 완료 조건 — 이 대상을 누르면 다음 단계 */
  done: string
}

export const STEPS: Step[] = [
  { target: 'tab-mail', title: '우편함 열기', text: '먼저 **우편함**에서 정비 지원금을 받아 보세요', prefer: 'top', done: '우편함 탭을 누른다' },
  { target: 'mail-claim', title: '보상 받기', text: '**모두 받기**를 누르면 우편이 한 번에 들어옵니다', prefer: 'left', done: '모두 받기를 누른다' },
  { target: 'tab-shop', title: '상점 열기', text: '이번엔 **상점**에서 출격 준비물을 삽니다', prefer: 'top', done: '상점 탭을 누른다' },
  { target: 'item-cell', title: '준비물 사기', text: '첫 출격에는 **냉각 셀**이 꼭 필요합니다', prefer: 'left', done: '냉각 셀을 누른다' },
  { target: 'sortie', title: '첫 출격', text: '준비 끝! **출격**을 눌러 첫 탐사를 시작하세요', prefer: 'top', done: '출격을 누른다' },
]

export const SHOP_ITEMS = [
  { id: 'kit', name: '수리 키트', price: 1200 },
  { id: 'oxy', name: '산소 캔 ×10', price: 800 },
  { id: 'chip', name: '회로 조각 ×20', price: 2000 },
  { id: 'scope', name: '탐사 조명', price: 1500 },
  { id: 'rope', name: '견인 케이블', price: 600 },
  { id: 'map', name: '지형 스캔 칩', price: 900 },
  { id: 'cell', name: '냉각 셀 ×5', price: 500 },
  { id: 'paint', name: '도장 키트', price: 300 },
] as const

export type HoleShape = 'auto' | 'circle' | 'rect'

/** 구멍 모양: 정사각형에 가까운 대상은 원, 넓은 대상은 둥근 사각형 */
export function resolveShape(shape: HoleShape, w: number, h: number): 'circle' | 'rect' {
  if (shape !== 'auto') return shape
  const r = w / Math.max(1, h)
  return r > 0.7 && r < 1.45 ? 'circle' : 'rect'
}
