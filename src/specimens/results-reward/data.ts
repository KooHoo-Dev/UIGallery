import { easeOutCubic } from '../../core/countup'

/* ──────────────────────────────────────────────────────────────
 * 결과·보상 정산 — 데이터와 단계(스텝) 정의
 * 화면은 "단계 목록 + 현재 단계 + 단계 안의 시간 t" 하나로 결정된다.
 * 그래서 스킵(현재 단계 완료)은 t 를 끝으로 옮기고 카운트업을 skip() 하는 것만으로 정확히 맞는다.
 * ────────────────────────────────────────────────────────────── */

export type RunId = 'normal' | 'levelup' | 'big'
export type MemberId = 'harin' | 'doyun' | 'sera'
export type ItemId = 'repair' | 'coolant' | 'circuit' | 'oxygen'

export interface Line {
  label: string
  sub: string
  value: number
}
export interface Item {
  id: ItemId
  name: string
  count: number
  isNew?: boolean
}
export interface Member {
  id: MemberId
  name: string
  role: string
  hp: number
  pow: number
  skill: string
}
export interface Run {
  id: RunId
  mission: string
  meta: string
  expLines: Line[]
  creditLines: Line[]
  items: Item[]
  rank: 'S' | 'A' | 'B'
  rankNote: string
  /** 전투 전 레벨·경험치 */
  start: Record<MemberId, { lv: number; exp: number }>
}

export const MEMBERS: Member[] = [
  { id: 'harin', name: '하린', role: '탐사대장', hp: 412, pow: 58, skill: '신호탄 연사' },
  { id: 'doyun', name: '도윤', role: '정비사', hp: 380, pow: 44, skill: '응급 용접' },
  { id: 'sera', name: '세라', role: '통신 담당', hp: 340, pow: 52, skill: '광역 교란파' },
]

const START = { harin: { lv: 11, exp: 1200 }, doyun: { lv: 9, exp: 0 }, sera: { lv: 10, exp: 100 } }

export const RUNS: Record<RunId, Run> = {
  normal: {
    id: 'normal',
    mission: '북쪽 통신탑 복구',
    meta: '전투 시간 01:52 · 잔해 드론 4기',
    expLines: [
      { label: '잔해 드론 처치', sub: '×4 · 기당 80', value: 320 },
      { label: '목표 달성', sub: '통신탑 전원 연결', value: 240 },
      { label: '무피해 보너스', sub: '피격 0회', value: 80 },
    ],
    creditLines: [
      { label: '기본 보상', sub: '작전 완료', value: 600 },
      { label: '처치 보너스', sub: '×4 · 기당 40', value: 160 },
      { label: '남은 시간 보너스', sub: '남은 시간 1:30', value: 90 },
      { label: '저축 이자', sub: '보유 1,240의 5%', value: 62 },
    ],
    items: [
      { id: 'circuit', name: '회로 조각', count: 3 },
      { id: 'repair', name: '수리 키트', count: 1 },
      { id: 'coolant', name: '냉각 셀', count: 1 },
    ],
    rank: 'B',
    rankNote: '보통',
    start: START,
  },
  levelup: {
    id: 'levelup',
    mission: '정비 기지 동력 복구',
    meta: '전투 시간 02:41 · 잔해 드론 7기',
    expLines: [
      { label: '잔해 드론 처치', sub: '×7 · 기당 120', value: 840 },
      { label: '목표 달성', sub: '동력로 재가동', value: 600 },
      { label: '무피해 보너스', sub: '피격 0회', value: 210 },
    ],
    creditLines: [
      { label: '기본 보상', sub: '작전 완료', value: 1200 },
      { label: '처치 보너스', sub: '×7 · 기당 40', value: 280 },
      { label: '남은 시간 보너스', sub: '남은 시간 2:30', value: 150 },
      { label: '저축 이자', sub: '보유 2,480의 5%', value: 124 },
    ],
    items: [
      { id: 'repair', name: '수리 키트', count: 2 },
      { id: 'coolant', name: '냉각 셀', count: 3 },
      { id: 'circuit', name: '회로 조각', count: 5 },
      { id: 'oxygen', name: '산소 캔', count: 1, isNew: true },
    ],
    rank: 'A',
    rankNote: '우수',
    start: START,
  },
  big: {
    id: 'big',
    mission: '궤도 정비 기지 방어',
    meta: '전투 시간 05:18 · 대형 드론 2기 포함 12기',
    expLines: [
      { label: '대형 잔해 드론 격파', sub: '×2 · 기당 1,200', value: 2400 },
      { label: '목표 달성', sub: '방어선 유지', value: 1600 },
      { label: '연속 처치 보너스', sub: '최대 12연속', value: 800 },
    ],
    creditLines: [
      { label: '기본 보상', sub: '대형 작전 완료', value: 8000 },
      { label: '처치 보너스', sub: '×12 · 기당 200', value: 2400 },
      { label: '남은 시간 보너스', sub: '남은 시간 4:10', value: 1250 },
      { label: '저축 이자', sub: '보유 20,000의 5%', value: 1000 },
    ],
    items: [
      { id: 'circuit', name: '회로 조각', count: 12 },
      { id: 'coolant', name: '냉각 셀', count: 6 },
      { id: 'repair', name: '수리 키트', count: 4 },
      { id: 'oxygen', name: '산소 캔', count: 3 },
    ],
    rank: 'S',
    rankNote: '최상',
    start: START,
  },
}

export const sum = (lines: Line[]) => lines.reduce((a, l) => a + l.value, 0)

/** 다음 레벨까지 필요한 경험치 */
export const needFor = (lv: number) => 600 + lv * 120

/** 경험치 gain 을 더한 뒤의 레벨 — 바가 가득 차면 0 으로 돌아가 다음 레벨을 채운다 */
export function levelAfter(lv: number, exp: number, gain: number) {
  let l = lv
  let e = exp + gain
  while (e >= needFor(l)) {
    e -= needFor(l)
    l++
  }
  return { lv: l, exp: e, need: needFor(l), ups: l - lv }
}

export const leveledMembers = (run: Run) =>
  MEMBERS.map(m => ({ m, ...levelAfter(run.start[m.id].lv, run.start[m.id].exp, sum(run.expLines)), from: run.start[m.id].lv })).filter(x => x.ups > 0)

/* ───────── 단계 ───────── */

export type StepKind = 'banner' | 'exp' | 'credit' | 'ledger' | 'items' | 'levelup' | 'rank' | 'complete'
export type TallyMode = 'category-pages' | 'ledger-lines'
export type SkipBehavior = 'finish-step' | 'skip-all' | 'disabled'

export const STEP_LABEL: Record<StepKind, string> = {
  banner: '승리',
  exp: '경험치',
  credit: '크레딧',
  ledger: '정산',
  items: '물자',
  levelup: '레벨 업',
  rank: '등급',
  complete: '완료',
}

export function buildSteps(run: Run, mode: TallyMode, spotlight: boolean, rank: boolean): StepKind[] {
  const ups = leveledMembers(run).length > 0
  const steps: StepKind[] = ['banner']
  if (mode === 'category-pages') {
    steps.push('exp')
    if (spotlight && ups) steps.push('levelup')
    steps.push('credit', 'items')
  } else {
    steps.push('ledger')
    if (spotlight && ups) steps.push('levelup')
    steps.push('items')
  }
  if (rank) steps.push('rank')
  steps.push('complete')
  return steps
}

export const BANNER_IN = 0.45
export const PANEL_IN = 0.3
export const ROW_IN = 0.2
export const TILE_IN = 0.28
export const DIM_IN = 0.2
export const CARD_IN = 0.4
export const STAMP_IN = 0.35
export const PULSE = 0.15
export const INPUT_LOCK = 0.3
export const CLOSE_OUT = 0.25

/** 단계 길이(초). 같은 파라미터면 값의 크기와 상관없이 같은 길이 — 고정 시간 카운트업 */
export function stepDuration(kind: StepKind, run: Run, stagger: number, countup: number): number {
  switch (kind) {
    case 'banner':
      return BANNER_IN + PANEL_IN
    case 'exp':
      return (run.expLines.length - 1) * stagger + countup + PULSE
    case 'credit':
    case 'ledger':
      return (run.creditLines.length - 1) * stagger + countup + PULSE
    case 'items':
      return (run.items.length - 1) * stagger + TILE_IN
    case 'levelup':
      return DIM_IN + CARD_IN
    case 'rank':
      return STAMP_IN + 0.2
    case 'complete':
      return 0
  }
}

/** 입력이 있어야만 넘어가는 단계 (자동 진행 대상이 아님) */
export const mustWait = (k: StepKind) => k === 'levelup' || k === 'complete'

/* ───────── 이징 ───────── */
export const linear = (t: number) => t
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))
export const easeInQuad = (t: number) => t * t
export const EASINGS: Record<string, (t: number) => number> = { linear, easeOutCubic, easeOutExpo }
