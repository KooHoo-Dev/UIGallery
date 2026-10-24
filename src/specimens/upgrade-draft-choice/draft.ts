/* ──────────────────────────────────────────────────────────────
 * 업그레이드 풀 · 추첨 (순수 로직)
 * 좋은 예: 중복 없음 · 최대 레벨 제외 · 슬롯이 가득 차면 새 것 제외 · 추방한 것 제외, 희귀도는 가중치
 * 나쁜 예: 그냥 무작위 — 같은 카드 두 장, 이미 최대 레벨, 슬롯이 없어 고를 수 없는 새 무기가 섞인다
 * ────────────────────────────────────────────────────────────── */

export type Kind = 'weapon' | 'passive'
export type Rarity = 'common' | 'rare' | 'epic'

export interface Upgrade {
  id: string
  name: string
  kind: Kind
  /** 레벨당 효과 — "피해" + "%" 처럼 수치를 붙여 쓴다 */
  stat: string
  unit: string
  /** 레벨당 기본 증가량 (희귀도가 곱해진다) */
  per: number
}

export const POOL: Upgrade[] = [
  { id: 'laser', name: '절단 레이저', kind: 'weapon', stat: '피해', unit: '', per: 6 },
  { id: 'orbit', name: '회전 드론', kind: 'weapon', stat: '드론 수', unit: '기', per: 1 },
  { id: 'shock', name: '충격파', kind: 'weapon', stat: '범위', unit: '%', per: 15 },
  { id: 'frost', name: '냉각 안개', kind: 'weapon', stat: '감속', unit: '%', per: 8 },
  { id: 'rail', name: '레일 볼트', kind: 'weapon', stat: '관통', unit: '회', per: 1 },
  { id: 'flare', name: '유도 신호탄', kind: 'weapon', stat: '발사 수', unit: '발', per: 1 },
  { id: 'armor', name: '강화 장갑', kind: 'passive', stat: '최대 체력', unit: '', per: 20 },
  { id: 'cool', name: '냉각 회로', kind: 'passive', stat: '재사용 대기', unit: '%', per: -6 },
  { id: 'magnet', name: '자력 장치', kind: 'passive', stat: '획득 범위', unit: '%', per: 25 },
  { id: 'thrust', name: '추진기', kind: 'passive', stat: '이동 속도', unit: '%', per: 8 },
  { id: 'aim', name: '정밀 조준', kind: 'passive', stat: '치명타', unit: '%', per: 5 },
  { id: 'oxygen', name: '산소 탱크', kind: 'passive', stat: '초당 회복', unit: '', per: 0.5 },
]

export const MAX_LEVEL = 5
export const RARITY_MULT: Record<Rarity, number> = { common: 1, rare: 1.6, epic: 2.5 }
export const RARITY_LABEL: Record<Rarity, string> = { common: '일반', rare: '희귀', epic: '영웅' }
const RARITY_WEIGHT: [Rarity, number][] = [
  ['common', 70],
  ['rare', 25],
  ['epic', 5],
]

export interface Offer {
  up: Upgrade
  rarity: Rarity
  /** 지금 레벨 (0 = 새로 얻음) */
  level: number
  /** 뽑을 때의 수치 — 고른 뒤 닫히는 동안에도 카드 숫자가 바뀌지 않게 */
  now: number
  /** 고를 수 없는 카드 (나쁜 예에서만 섞인다) — 이유 */
  blocked?: string
}

/** 결정적 의사 난수 (같은 시드면 같은 결과 — 시연이 매번 같게) */
export function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0 // 32비트 정수 곱 (그냥 * 는 큰 수에서 정밀도를 잃는다)
    return s / 4294967296
  }
}

function pickRarity(r: () => number): Rarity {
  let x = r() * 100
  for (const [k, w] of RARITY_WEIGHT) {
    if (x < w) return k
    x -= w
  }
  return 'common'
}

export interface Build {
  levels: Record<string, number>
  /** 지금까지 쌓인 수치 — 희귀도마다 오르는 양이 달라서 레벨 × 기본값으로 다시 계산할 수 없다 */
  values: Record<string, number>
  slotLimit: number
  banished: Set<string>
}

/** 시작 레벨만큼 일반 등급으로 올린 빌드 */
export function makeBuild(levels: Record<string, number>, slotLimit: number): Build {
  const values: Record<string, number> = {}
  for (const u of POOL) if (levels[u.id]) values[u.id] = stepOf(u, 'common') * levels[u.id]
  return { levels: { ...levels }, values, slotLimit, banished: new Set() }
}

export const ownedCount = (b: Build, kind: Kind) => POOL.filter(u => u.kind === kind && (b.levels[u.id] ?? 0) > 0).length

/** 지금 고를 수 있는 업그레이드 (좋은 예의 필터) */
export function eligible(b: Build): Upgrade[] {
  return POOL.filter(u => {
    const lv = b.levels[u.id] ?? 0
    if (b.banished.has(u.id)) return false
    if (lv >= MAX_LEVEL) return false
    if (lv === 0 && ownedCount(b, u.kind) >= b.slotLimit) return false // 슬롯이 가득 → 새 것은 빼고 강화만
    return true
  })
}

export const FILLERS: Upgrade[] = [
  { id: 'heal', name: '응급 수리', kind: 'passive', stat: '체력 회복', unit: '', per: 50 },
  { id: 'credit', name: '크레딧 상자', kind: 'passive', stat: '크레딧', unit: '', per: 100 },
]

/**
 * 고를 수 있는 것 중에서 중복 없이 n 장 (희귀도는 가중치). 고를 것이 모자라면 보상(체력 회복 · 크레딧)으로 채운다.
 * shown: 이미 화면에 있는 카드 id — 한 자리만 다시 뽑을 때 같은 보상이 두 장 되지 않게
 */
export function draft(b: Build, n: number, seed: number, good: boolean, shown: string[] = []): Offer[] {
  const r = rng(seed)
  if (!good) {
    // 흔한 실수: 전체 풀에서 그냥 n 번 뽑기 (중복 · 최대 레벨 · 슬롯 없는 새 무기 · 추방한 것까지)
    return Array.from({ length: n }, () => {
      const up = POOL[Math.floor(r() * POOL.length)]
      const lv = b.levels[up.id] ?? 0
      const blocked = lv >= MAX_LEVEL ? '이미 최대 레벨' : lv === 0 && ownedCount(b, up.kind) >= b.slotLimit ? '슬롯이 가득 참' : undefined
      return { up, rarity: 'common' as Rarity, level: lv, now: b.values[up.id] ?? 0, blocked }
    })
  }
  const bag = [...eligible(b)]
  const out: Offer[] = []
  while (out.length < n && bag.length) {
    const i = Math.floor(r() * bag.length)
    const up = bag.splice(i, 1)[0]
    out.push({ up, rarity: pickRarity(r), level: b.levels[up.id] ?? 0, now: b.values[up.id] ?? 0 })
  }
  // 다 배워서 고를 게 없으면 '빈 카드' 대신 언제나 쓸모 있는 보상으로 채운다 (화면에 없는 것부터)
  const used = new Set(shown)
  for (let f = 0; out.length < n; f++) {
    const up = FILLERS.find(x => !used.has(x.id)) ?? FILLERS[f % FILLERS.length]
    used.add(up.id)
    out.push({ up, rarity: 'common', level: -1, now: 0 })
  }
  return out
}

/** 이번 카드로 오르는 양 */
export function stepOf(up: Upgrade, rarity: Rarity) {
  const raw = up.per * RARITY_MULT[rarity]
  // 개수(기 · 회 · 발)는 정수로 — 희귀도가 높으면 한 번에 더 많이 (Unity 판과 같은 반올림: 2.5 → 3)
  if (['기', '회', '발'].includes(up.unit)) return Math.max(1, Math.round(raw))
  if (Number.isInteger(up.per)) return Math.round(raw) // 정수 수치는 정수로 (피해 +14.4 가 아니라 +14)
  return Math.round(raw * 10) / 10
}

/** 카드에 쓰는 수치: 지금 → 다음 (now = 지금까지 쌓인 값) */
export function valueAt(up: Upgrade, now: number, rarity: Rarity) {
  const next = Math.round((now + stepOf(up, rarity)) * 10) / 10
  const fmt = (x: number) => `${x > 0 ? '+' : ''}${Number.isInteger(x) ? x : x.toFixed(1)}${up.unit}`
  return { now: fmt(now), next: fmt(next) }
}
