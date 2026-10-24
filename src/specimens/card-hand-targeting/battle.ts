/* ──────────────────────────────────────────────────────────────
 * 카드 전투 규칙 · 부채꼴 배치 계산 (순수 로직 — 화면과 상관없다)
 * ────────────────────────────────────────────────────────────── */

export type Target = 'enemy' | 'self' | 'all'

export interface CardDef {
  id: string
  name: string
  cost: number
  /** enemy = 적 하나를 고른다(화살표) · self = 자신 · all = 모든 적 */
  target: Target
  kind: 'attack' | 'skill'
  dmg?: number
  hits?: number
  block?: number
  heal?: number
  energy?: number
  weak?: number
  text: string
}

export const CARDS: Record<string, CardDef> = {
  shot: { id: 'shot', name: '절단 사격', cost: 1, target: 'enemy', kind: 'attack', dmg: 6, text: '피해 6' },
  hammer: { id: 'hammer', name: '중력 망치', cost: 2, target: 'enemy', kind: 'attack', dmg: 14, text: '피해 14' },
  burst: { id: 'burst', name: '연사', cost: 1, target: 'enemy', kind: 'attack', dmg: 3, hits: 3, text: '피해 3 × 3' },
  pulse: { id: 'pulse', name: '전자기 펄스', cost: 1, target: 'enemy', kind: 'attack', dmg: 3, weak: 2, text: '피해 3 · 약화 2턴' },
  overload: { id: 'overload', name: '과부하', cost: 2, target: 'all', kind: 'attack', dmg: 5, text: '모든 적 피해 5' },
  shield: { id: 'shield', name: '방어막', cost: 1, target: 'self', kind: 'skill', block: 7, text: '방어 7' },
  repair: { id: 'repair', name: '긴급 수리', cost: 1, target: 'self', kind: 'skill', heal: 6, text: '체력 6 회복' },
  cell: { id: 'cell', name: '냉각 셀', cost: 0, target: 'self', kind: 'skill', energy: 1, text: '에너지 +1' },
}

export const DECK = ['shot', 'hammer', 'shield', 'burst', 'shot', 'pulse', 'shield', 'overload', 'cell', 'shot', 'repair', 'shield']

export const MAX_HAND = 10
export const ENERGY = 3

export interface Card {
  uid: number
  def: CardDef
}

/* ───── 적 · 의도 ───── */

export type IntentKind = 'attack' | 'block' | 'buff'
export interface Intent {
  kind: IntentKind
  value: number
  hits?: number
}

export interface Enemy {
  id: string
  name: string
  x: number
  hp: number
  maxHp: number
  block: number
  /** 약화 남은 턴 — 공격이 25% 줄어든다 */
  weak: number
  /** 강화로 쌓인 공격력 */
  str: number
  pattern: Intent[]
  step: number
}

export const ENEMY_X = [1130, 1390, 1650]
export const ENEMY_FOOT = 600

export function makeEnemies(): Enemy[] {
  return [
    { id: 'scout', name: '정찰 드론', x: ENEMY_X[0], hp: 24, maxHp: 24, block: 0, weak: 0, str: 0, step: 0, pattern: [{ kind: 'attack', value: 6 }, { kind: 'attack', value: 3, hits: 2 }, { kind: 'block', value: 8 }] },
    { id: 'wreck', name: '잔해 드론', x: ENEMY_X[1], hp: 32, maxHp: 32, block: 0, weak: 0, str: 0, step: 0, pattern: [{ kind: 'attack', value: 9 }, { kind: 'buff', value: 3 }, { kind: 'attack', value: 9 }] },
    { id: 'gunner', name: '포격 드론', x: ENEMY_X[2], hp: 40, maxHp: 40, block: 0, weak: 0, str: 0, step: 0, pattern: [{ kind: 'block', value: 10 }, { kind: 'attack', value: 14 }, { kind: 'attack', value: 5, hits: 2 }] },
  ]
}

export const intentOf = (e: Enemy) => e.pattern[e.step % e.pattern.length]

/** 이번 의도의 한 번당 피해 (강화 · 약화 반영) — 적 머리 위 숫자 */
export function intentHit(e: Enemy, weak = e.weak): number {
  const it = intentOf(e)
  if (it.kind !== 'attack') return 0
  const base = it.value + e.str
  return weak > 0 ? Math.floor(base * 0.75) : base
}

export const intentTotal = (e: Enemy) => (e.hp > 0 && intentOf(e).kind === 'attack' ? intentHit(e) * (intentOf(e).hits ?? 1) : 0)

/** 적에게 피해 — 방어가 먼저 깎인다. 실제로 깎인 체력을 돌려준다 */
export function damageEnemy(e: Enemy, dmg: number): number {
  const absorbed = Math.min(e.block, dmg)
  e.block -= absorbed
  const lost = Math.min(e.hp, dmg - absorbed)
  e.hp -= lost
  return lost
}

/** 미리보기: 카드를 이 적에게 쓰면 깎일 체력 (방어 반영, 실제로는 바꾸지 않는다) */
export function previewLoss(e: Enemy, card: CardDef): number {
  if (!card.dmg) return 0
  let block = e.block
  let hp = e.hp
  for (let i = 0; i < (card.hits ?? 1); i++) {
    const a = Math.min(block, card.dmg)
    block -= a
    hp -= Math.min(hp, card.dmg - a)
  }
  return e.hp - hp
}

/* ───── 덱 ───── */

export function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

export function shuffle<T>(arr: T[], r: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ───── 부채꼴 배치 ───── */

export interface Pose {
  x: number
  y: number
  /** 도(°) */
  rot: number
  scale: number
}

/** 카드 사이 최대 각도 — 장수가 적을 때 너무 벌어지지 않게 */
export const MAX_STEP_DEG = 7

/**
 * 부채꼴: 원 중심을 화면 아래(baseY + R)에 두고, 카드 i 를 각도 a_i 의 원호 위 점에 놓는다.
 *   a_i = lerp(-spread/2, +spread/2, i/(n-1)),   spread = min(fanDeg, MAX_STEP_DEG × (n-1))
 *   x = cx + R·sin(a)   y = baseY + R·(1 − cos(a))   회전 = a
 */
export function fanPoses(n: number, cx: number, baseY: number, fanDeg: number, radius: number): Pose[] {
  const spread = n > 1 ? Math.min(fanDeg, MAX_STEP_DEG * (n - 1)) : 0
  return Array.from({ length: n }, (_, i) => {
    const deg = n > 1 ? -spread / 2 + (spread * i) / (n - 1) : 0
    const a = (deg * Math.PI) / 180
    return { x: cx + radius * Math.sin(a), y: baseY + radius * (1 - Math.cos(a)), rot: deg, scale: 1 }
  })
}

/** 흔한 실수: 고정 간격 한 줄 (LayoutGroup) — 장수가 늘면 겹치기만 하고 넘친다 */
export function rowPoses(n: number, cx: number, baseY: number, gap: number): Pose[] {
  return Array.from({ length: n }, (_, i) => ({ x: cx + (i - (n - 1) / 2) * gap, y: baseY, rot: 0, scale: 1 }))
}

/** 회전한 카드 사각형 안에 점이 있는가 (호버 · 집기 판정) */
export function hitCard(p: Pose, w: number, h: number, x: number, y: number): boolean {
  const a = (-p.rot * Math.PI) / 180
  const dx = x - p.x
  const dy = y - p.y
  const lx = dx * Math.cos(a) - dy * Math.sin(a)
  const ly = dx * Math.sin(a) + dy * Math.cos(a)
  return Math.abs(lx) <= (w * p.scale) / 2 && Math.abs(ly) <= (h * p.scale) / 2
}

/** 2차 베지어 위의 점과 접선 각도 — 타겟 화살표 */
export function bezier(p0: { x: number; y: number }, c: { x: number; y: number }, p1: { x: number; y: number }, t: number) {
  const u = 1 - t
  const x = u * u * p0.x + 2 * u * t * c.x + t * t * p1.x
  const y = u * u * p0.y + 2 * u * t * c.y + t * t * p1.y
  const dx = 2 * u * (c.x - p0.x) + 2 * t * (p1.x - c.x)
  const dy = 2 * u * (c.y - p0.y) + 2 * t * (p1.y - c.y)
  return { x, y, deg: (Math.atan2(dy, dx) * 180) / Math.PI }
}
