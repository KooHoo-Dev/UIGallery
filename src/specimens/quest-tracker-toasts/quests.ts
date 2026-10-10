/**
 * 퀘스트 트래커 데이터 + 알림 문구 (공통 세계관 '외곽 탐사대').
 * 뷰와 분리된 순수 데이터 — Unity 쪽 QuestTrackerView 의 Quest / Objective 와 같은 모양.
 */
import type { Rarity, ToastRequest } from './queue'

export interface Objective {
  id: string
  label: string
  cur: number
  max: number
  /** 이 목표를 올리는 게임 이벤트 */
  feed?: 'kill' | 'cell' | 'circuit' | 'oxygen'
  /** 진행 하이라이트 재생 번호 (바뀔 때마다 +1) */
  flashSeq: number
  /** 방금 오른 양 (+1 표시) */
  delta: number
}

export type QuestPhase = 'enter' | 'live' | 'done' | 'collapse'

export interface Quest {
  id: string
  kind: 'main' | 'repeat'
  title: string
  objectives: Objective[]
  phase: QuestPhase
  /** 현재 phase 에 들어온 뒤 흐른 게임 시간(ms) */
  phaseMs: number
  /** 완료 보상 (우선 배너 · 토스트) */
  reward?: { label: string; credit: number }
}

const obj = (id: string, label: string, cur: number, max: number, feed?: Objective['feed']): Objective => ({ id, label, cur, max, feed, flashSeq: 0, delta: 0 })

/** 주 임무 사슬 — 하나를 끝내면 다음 것을 자동으로 추적한다 */
export const MAIN_CHAIN: (() => Quest)[] = [
  () => ({
    id: 'tower',
    kind: 'main',
    title: '북쪽 통신탑 복구',
    phase: 'live',
    phaseMs: 0,
    reward: { label: '크레딧 +350 · 수리 키트 ×2', credit: 350 },
    objectives: [obj('drone', '잔해 드론 처치', 3, 5, 'kill'), obj('cell', '냉각 셀 3개 회수', 1, 3, 'cell'), obj('power', '통신탑 전원 연결', 0, 1)],
  }),
  () => ({
    id: 'signal',
    kind: 'main',
    title: '세라의 신호 추적',
    phase: 'enter',
    phaseMs: 0,
    reward: { label: '크레딧 +280 · 정밀 렌즈 ×1', credit: 280 },
    objectives: [obj('drone', '신호를 막는 드론 처치', 0, 4, 'kill'), obj('relay', '신호 중계기 조사', 0, 3)],
  }),
  () => ({
    id: 'base',
    kind: 'main',
    title: '남쪽 정비 기지 재가동',
    phase: 'enter',
    phaseMs: 0,
    reward: { label: '크레딧 +420 · 산소 캔 ×3', credit: 420 },
    objectives: [obj('drone', '기지 주변 드론 소탕', 0, 6, 'kill'), obj('cell', '냉각 셀 교체', 0, 2, 'cell')],
  }),
]

export const makeRepeat = (): Quest => ({
  id: 'supply',
  kind: 'repeat',
  title: '정비 기지 보급',
  phase: 'live',
  phaseMs: 0,
  objectives: [obj('circuit', '회로 조각 수집', 4, 10, 'circuit'), obj('oxygen', '산소 캔 확보', 2, 4, 'oxygen')],
})

/* ───────── 알림 문구 ───────── */

export const RARITY_NAME = ['일반', '고급', '희귀', '전설'] as const
export const RARITY_NUMERAL = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ'] as const

const item = (key: string, label: string, rarity: Rarity, amount = 1, unit: ToastRequest['unit'] = 'count'): ToastRequest => ({ key, label, rarity, amount, unit, icon: key })

export const ITEMS = {
  circuit: (n = 1) => item('circuit', '회로 조각', 0, n),
  cell: (n = 1) => item('cell', '냉각 셀', 0, n),
  oxygen: (n = 1) => item('oxygen', '산소 캔', 0, n),
  credit: (n: number) => item('credit', '크레딧', 0, n, 'plus'),
  repair: (n = 1) => item('repair', '수리 키트', 1, n),
  lens: (n = 1) => item('lens', '정밀 렌즈', 2, n),
  core: () => item('core', '항성 코어 파편', 3, 1),
}

/** 상자 하나를 열었을 때 한 프레임에 몰려드는 10건 */
export const LOOT_BURST: ToastRequest[] = [
  ITEMS.circuit(),
  ITEMS.credit(120),
  ITEMS.oxygen(),
  ITEMS.circuit(),
  ITEMS.repair(),
  ITEMS.cell(),
  ITEMS.circuit(),
  ITEMS.lens(),
  ITEMS.credit(80),
  ITEMS.oxygen(),
]
