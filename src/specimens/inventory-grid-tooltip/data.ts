/* ──────────────────────────────────────────────────────────────
 * 인벤토리 데이터 — 아이템·희귀도·능력치·정렬·비교(차이) 계산.
 * 화면과 무관한 순수 함수만 둔다 (Unity 의 InventoryModel 에 해당).
 * ────────────────────────────────────────────────────────────── */

export type EquipSlot = 'head' | 'body' | 'hand' | 'power'
export type Kind = EquipSlot | 'supply'
export type Rarity = 0 | 1 | 2 | 3 | 4
export type StatKey = 'power' | 'stability' | 'durability' | 'weight'
export type SortKey = 'none' | 'rarity' | 'power' | 'type'
export type IconId =
  | 'wrench'
  | 'cutter'
  | 'gravity'
  | 'clamp'
  | 'driver'
  | 'torch'
  | 'headset'
  | 'goggles'
  | 'helmet'
  | 'visor'
  | 'suit'
  | 'armor'
  | 'vest'
  | 'battery'
  | 'reactor'
  | 'cellpack'
  | 'solar'
  | 'shield'
  | 'repair'
  | 'coolcell'
  | 'circuit'
  | 'oxygen'
  | 'core'
  | 'flare'
  | 'tape'

export type Stats = Record<StatKey, number>

export interface Item {
  id: string
  name: string
  kind: Kind
  rarity: Rarity
  icon: IconId
  stats?: Stats
  qty?: number
  desc: string
}

/** 희귀도 — 이름(글자) · 색 · 모서리 도형(모양) 세 겹으로 같은 정보를 싣는다 */
export const RARITY: { name: string; color: string; shape: string }[] = [
  { name: '기본', color: '#a3acb8', shape: '빈 네모' },
  { name: '개량', color: '#5fd68f', shape: '원' },
  { name: '정예', color: '#4ea9ff', shape: '삼각' },
  { name: '명품', color: '#c68bff', shape: '마름모' },
  { name: '유일', color: '#ffc23d', shape: '별' },
]

export const SLOT_LABEL: Record<Kind, string> = { head: '머리', body: '몸', hand: '손', power: '동력', supply: '소모품' }
export const SLOT_ORDER: EquipSlot[] = ['head', 'body', 'hand', 'power']
const KIND_ORDER: Kind[] = ['head', 'body', 'hand', 'power', 'supply']

export interface StatDef {
  key: StatKey
  label: string
  max: number
  /** 높을수록 좋은가 (무게는 낮을수록 좋다 → 색·기호 의미가 반대) */
  higherIsBetter: boolean
  decimals: number
  unit?: string
}
export const STATS: StatDef[] = [
  { key: 'power', label: '출력', max: 100, higherIsBetter: true, decimals: 0 },
  { key: 'stability', label: '안정', max: 100, higherIsBetter: true, decimals: 0 },
  { key: 'durability', label: '내구', max: 100, higherIsBetter: true, decimals: 0 },
  { key: 'weight', label: '무게', max: 8, higherIsBetter: false, decimals: 1, unit: 'kg' },
]

/** 장비 점수 — 능력치를 한 숫자로 묶은 값 (정렬·요약 비교용) */
export const scoreOf = (it: Item | undefined) => {
  const s = it?.stats
  if (!s) return 0
  return Math.round(s.power * 1.5 + s.stability * 1.1 + s.durability * 0.9 + (12 - s.weight) * 5)
}

const st = (power: number, stability: number, durability: number, weight: number): Stats => ({ power, stability, durability, weight })

export const START_EQUIPPED: Record<EquipSlot, Item> = {
  head: { id: 'headset', name: '통신 헤드셋', kind: 'head', rarity: 1, icon: 'headset', stats: st(30, 64, 52, 0.8), desc: '세라의 주파수에 고정된 기본 헤드셋.' },
  body: { id: 'suit', name: '단열 작업복', kind: 'body', rarity: 2, icon: 'suit', stats: st(40, 64, 74, 5.5), desc: '궤도 정비 기지 표준 작업복.' },
  hand: { id: 'wrench', name: '정비 렌치', kind: 'hand', rarity: 2, icon: 'wrench', stats: st(54, 66, 70, 2.6), desc: '도윤이 손잡이를 감아 준 렌치.' },
  power: { id: 'battery', name: '보조 배터리', kind: 'power', rarity: 1, icon: 'battery', stats: st(44, 62, 58, 3.2), desc: '충전 한 번에 반나절 버틴다.' },
}

export const START_ITEMS: Item[] = [
  { id: 'cutter', name: '플라즈마 절단기', kind: 'hand', rarity: 3, icon: 'cutter', stats: st(82, 58, 64, 4.2), desc: '잔해 드론 외피를 한 번에 가른다. 무겁다.' },
  { id: 'repair', name: '수리 키트', kind: 'supply', rarity: 1, icon: 'repair', qty: 3, desc: '장비 내구를 30 회복한다.' },
  { id: 'goggles', name: '열화상 고글', kind: 'head', rarity: 2, icon: 'goggles', stats: st(46, 60, 48, 0.9), desc: '벽 너머 열원을 흐릿하게 보여 준다.' },
  { id: 'reactor', name: '소형 반응로', kind: 'power', rarity: 4, icon: 'reactor', stats: st(92, 76, 70, 6.5), desc: '북쪽 통신탑 지하에서 회수한 시제품.' },
  { id: 'coolcell', name: '냉각 셀', kind: 'supply', rarity: 0, icon: 'coolcell', qty: 6, desc: '과열된 장비에 꽂아 식힌다.' },
  { id: 'armor', name: '경량 장갑복', kind: 'body', rarity: 3, icon: 'armor', stats: st(52, 70, 88, 4.0), desc: '충격을 판 사이로 흘려보낸다.' },
  { id: 'clamp', name: '자기 집게', kind: 'hand', rarity: 1, icon: 'clamp', stats: st(40, 75, 60, 1.8), desc: '작은 부품을 놓치지 않는다.' },
  { id: 'circuit', name: '회로 조각', kind: 'supply', rarity: 0, icon: 'circuit', qty: 12, desc: '제작 재료. 정비 작업대에서 쓴다.' },
  { id: 'gravity', name: '중력 렌치', kind: 'hand', rarity: 4, icon: 'gravity', stats: st(90, 80, 85, 3.0), desc: '볼트를 손대지 않고 돌린다.' },
  { id: 'vest', name: '산소 순환 조끼', kind: 'body', rarity: 1, icon: 'vest', stats: st(34, 60, 56, 2.2), desc: '산소 캔 소모를 조금 줄인다.' },
  { id: 'cellpack', name: '냉각 셀 팩', kind: 'power', rarity: 2, icon: 'cellpack', stats: st(60, 72, 60, 3.8), desc: '냉각 셀 네 개를 묶은 동력원.' },
  { id: 'oxygen', name: '산소 캔', kind: 'supply', rarity: 1, icon: 'oxygen', qty: 4, desc: '지표 탐사 구역에서 10분 버틴다.' },
  { id: 'visor', name: '탐사 바이저', kind: 'head', rarity: 3, icon: 'visor', stats: st(58, 72, 62, 1.2), desc: '지형 윤곽선을 겹쳐 보여 준다.' },
  { id: 'driver', name: '정밀 드라이버', kind: 'hand', rarity: 0, icon: 'driver', stats: st(30, 62, 50, 0.6), desc: '가볍고 정확하다. 힘은 약하다.' },
  { id: 'core', name: '잔해 드론 코어', kind: 'supply', rarity: 3, icon: 'core', qty: 1, desc: '분해하면 회로 조각 8개가 나온다.' },
  { id: 'solar', name: '태양 전지판', kind: 'power', rarity: 0, icon: 'solar', stats: st(32, 50, 66, 2.0), desc: '낮에만 충전된다.' },
  { id: 'helmet', name: '강화 헬멧', kind: 'head', rarity: 0, icon: 'helmet', stats: st(28, 58, 80, 2.8), desc: '튼튼하지만 시야가 좁다.' },
  { id: 'pcircuit', name: '정밀 회로', kind: 'supply', rarity: 2, icon: 'circuit', qty: 2, desc: '상위 장비 제작 재료.' },
  { id: 'torch', name: '용접 토치', kind: 'hand', rarity: 2, icon: 'torch', stats: st(66, 52, 58, 3.4), desc: '갈라진 외벽을 이어 붙인다.' },
  { id: 'worksuit', name: '보수용 작업복', kind: 'body', rarity: 0, icon: 'suit', stats: st(30, 52, 60, 4.8), desc: '여기저기 기운 자국이 있다.' },
  { id: 'flare', name: '신호탄', kind: 'supply', rarity: 0, icon: 'flare', qty: 2, desc: '하린이 위치를 알릴 때 쓴다.' },
  { id: 'hdbattery', name: '고밀도 배터리', kind: 'power', rarity: 3, icon: 'battery', stats: st(70, 66, 64, 2.9), desc: '작고 오래간다.' },
  { id: 'coated', name: '반사 코팅 슈트', kind: 'body', rarity: 2, icon: 'armor', stats: st(44, 68, 70, 4.6), desc: '햇빛을 튕겨 내 덜 덥다.' },
  { id: 'tape', name: '밀폐 테이프', kind: 'supply', rarity: 0, icon: 'tape', qty: 5, desc: '새는 곳을 임시로 막는다.' },
]

/** '새 아이템 획득' 이벤트가 차례로 꺼내는 아이템 */
export const LOOT_POOL: Item[] = [
  { id: 'resonance', name: '공명 렌치', kind: 'hand', rarity: 3, icon: 'gravity', stats: st(75, 74, 72, 2.8), desc: '잔해 드론 둥지에서 찾았다.' },
  { id: 'phase', name: '위상 헬멧', kind: 'head', rarity: 4, icon: 'visor', stats: st(64, 80, 84, 1.6), desc: '통신 잡음을 걸러 낸다.' },
  { id: 'coolcell2', name: '냉각 셀', kind: 'supply', rarity: 0, icon: 'coolcell', qty: 3, desc: '과열된 장비에 꽂아 식힌다.' },
  { id: 'shieldgen', name: '보호막 발생기', kind: 'power', rarity: 2, icon: 'shield', stats: st(58, 70, 66, 3.0), desc: '짧은 시간 파편을 막는다.' },
  { id: 'oxygen2', name: '산소 캔', kind: 'supply', rarity: 1, icon: 'oxygen', qty: 2, desc: '지표 탐사 구역에서 10분 버틴다.' },
  { id: 'circuit2', name: '회로 조각', kind: 'supply', rarity: 0, icon: 'circuit', qty: 4, desc: '제작 재료. 정비 작업대에서 쓴다.' },
]

export const CAPACITY = 36

export const SORT_LABEL: Record<SortKey, string> = { none: '획득순', rarity: '희귀도', power: '장비 점수', type: '종류' }
export const SORT_CYCLE: SortKey[] = ['rarity', 'power', 'type', 'none']

export function sortItems(items: Item[], key: SortKey): Item[] {
  const idx = new Map(items.map((it, i) => [it.id, i]))
  const by = (a: Item, b: Item) => (idx.get(a.id) ?? 0) - (idx.get(b.id) ?? 0)
  const list = [...items]
  if (key === 'rarity') list.sort((a, b) => b.rarity - a.rarity || KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || scoreOf(b) - scoreOf(a) || by(a, b))
  else if (key === 'power') list.sort((a, b) => scoreOf(b) - scoreOf(a) || b.rarity - a.rarity || by(a, b))
  else if (key === 'type') list.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || b.rarity - a.rarity || scoreOf(b) - scoreOf(a) || by(a, b))
  return list
}

export interface Delta {
  def: StatDef
  value: number
  base: number
  diff: number
  /** 1 좋아짐 · -1 나빠짐 · 0 같음 (무게처럼 낮을수록 좋은 수치는 방향을 뒤집는다) */
  verdict: 1 | -1 | 0
}

export function deltasOf(item: Item, base: Item | undefined): Delta[] {
  return STATS.map(def => {
    const value = item.stats?.[def.key] ?? 0
    const b = base?.stats?.[def.key] ?? value
    const diff = Math.round((value - b) * 10) / 10
    const sign = diff === 0 ? 0 : diff > 0 ? 1 : -1
    return { def, value, base: b, diff, verdict: (def.higherIsBetter ? sign : -sign) as 1 | -1 | 0 }
  })
}

export const fmt = (v: number, decimals: number) => (decimals ? v.toFixed(decimals) : String(Math.round(v)))
export const signed = (v: number, decimals: number) => (v > 0 ? '+' : v < 0 ? '−' : '±') + fmt(Math.abs(v), decimals)
