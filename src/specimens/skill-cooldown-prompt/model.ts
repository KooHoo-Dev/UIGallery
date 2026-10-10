/* 스킬 슬롯 데이터 · 배치 계산 · 숫자 서식 — 화면과 무관한 순수 함수만 둔다 */

export type SlotId = 'primary' | 'dash' | 'utility' | 'ult'
export type Status = 'ready' | 'cooling' | 'energy' | 'empty'
export type Reason = 'cooldown' | 'energy' | 'empty'
export type Dev = 'keyboard' | 'gamepad' | 'touch'

export interface SlotDef {
  id: SlotId
  name: string
  key: string
  pad: { kind: 'face'; face: 'left' | 'right' | 'top' | 'bottom' } | { kind: 'shoulder'; side: 'L' | 'R' }
}

export const SLOTS: SlotDef[] = [
  { id: 'primary', name: '파동', key: 'Q', pad: { kind: 'face', face: 'left' } },
  { id: 'dash', name: '도약', key: 'Shift', pad: { kind: 'face', face: 'right' } },
  { id: 'utility', name: '보호막', key: 'E', pad: { kind: 'face', face: 'top' } },
  { id: 'ult', name: '폭주', key: 'R', pad: { kind: 'shoulder', side: 'R' } },
]
export const SLOT_IDS = SLOTS.map(s => s.id)

/** 도약 1회 충전 시간 — 짧은 쿨다운의 예 (기본값에서 숫자 없이 덮개만) */
export const DASH_RECHARGE_MS = 2500
export const ULT_COOLDOWN_MS = 5000
export const HASTE_MS = 6000
export const ENERGY_REGEN_PER_S = 2.5
export const ENERGY_GAIN = 25

/** 슬롯별 기본 총 시간(ms). 가속 버프는 여기에 배율만 곱한다 — 진행도는 '남은 비율'로 저장하므로 비율이 유지된다 */
export function baseDuration(id: SlotId, cooldownMs: number) {
  if (id === 'primary') return cooldownMs
  if (id === 'utility') return cooldownMs * 1.5
  if (id === 'dash') return DASH_RECHARGE_MS
  return ULT_COOLDOWN_MS
}

/**
 * 남은 시간 숫자.
 * - smart: 3초 이상 올림 정수, 3초 미만 0.1초 단위 올림 (0.0 이 보이는 순간은 없다)
 * - **기본** 총 쿨다운(baseTotalMs)이 minTotalMs 보다 짧으면 숫자를 숨긴다.
 *   가속이 적용된 총 시간으로 판정하면 버프를 받는 순간 쿨다운 도중에 숫자가 사라진다
 * - 나쁜 예(juice=false): 내림 정수 → 남은 0.7초에 "0"
 */
export function timerText(remainMs: number, baseTotalMs: number, mode: string, minTotalMs: number, juice: boolean): { text: string; final: boolean } {
  if (remainMs <= 0) return { text: '', final: false }
  if (!juice) return { text: String(Math.floor(remainMs / 1000)), final: false }
  if (mode === 'none' || baseTotalMs < minTotalMs) return { text: '', final: false }
  if (mode === 'smart' && remainMs < 3000) return { text: (Math.ceil(remainMs / 100) / 10).toFixed(1), final: true }
  return { text: String(Math.ceil(remainMs / 1000)), final: false }
}

export const fmtSec = (ms: number) => (ms / 1000).toFixed(1).replace(/\.0$/, '')

/* ───── 배치 ───── */

export interface SlotBox {
  x: number
  y: number
  size: number
  round: boolean
}
export interface Layout {
  mode: 'bar' | 'fan'
  slots: Record<SlotId, SlotBox>
  energy: { x: number; y: number; w: number }
  toast: { x: number; y: number }
  /** 엄지 도달 범위 안내 (우하단 모서리 기준 반지름) */
  thumb: { cx: number; cy: number; r1: number; r2: number } | null
  stick: { x: number; y: number; r: number } | null
  hero: { x: number; y: number; h: number }
  drones: { x: number; y: number; h: number }[]
}

/**
 * 16:9 · 키보드/패드 → 하단 중앙 단축바.
 * 16:9 · 터치 → 태블릿 가로: 우하단 부채꼴 (큰 기본 버튼 + 호 위의 세 버튼).
 * 9:16 → 휴대폰 세로: 우하단 부채꼴 + 엄지 영역 안내.
 * 나쁜 예(juice=false)는 장치를 무시하고 PC 단축바를 그대로 쓴다 (세로에서는 작은 버튼을 같은 자리에).
 */
export function computeLayout(portrait: boolean, touch: boolean, juice: boolean): Layout {
  if (!portrait && (!touch || !juice)) {
    // 슬롯 180px (궁극기 210px) — 프로젝터에서 무대가 1000px 폭으로 줄어도 약 95px 로 보인다
    const y = 885
    return {
      mode: 'bar',
      slots: {
        primary: { x: 600, y, size: 180, round: false },
        dash: { x: 820, y, size: 180, round: false },
        utility: { x: 1040, y, size: 180, round: false },
        ult: { x: 1285, y: y - 15, size: 210, round: false },
      },
      energy: { x: 520, y: 640, w: 860 },
      toast: { x: 960, y: 574 },
      thumb: null,
      stick: null,
      hero: { x: 960, y: 520, h: 190 },
      drones: [
        { x: 1340, y: 520, h: 100 },
        { x: 1540, y: 560, h: 124 },
        { x: 560, y: 550, h: 108 },
      ],
    }
  }
  if (!portrait) {
    // 태블릿 가로: 기본 · 도약 · 보호막은 엄지가 편한 원(r1) 안, 궁극기만 손을 뻗어야 닿는 띠(r1~r2)에
    const px = 1730
    const py = 900
    const R = 260
    return {
      mode: 'fan',
      slots: {
        primary: { x: px, y: py, size: 200, round: true },
        dash: { x: px - R, y: py, size: 140, round: true },
        utility: { x: px - R * 0.707, y: py - R * 0.707, size: 140, round: true },
        // 모서리에서 거리 약 730 (r1 610 < 730 < r2 860)
        ult: { x: 1640, y: 405, size: 150, round: true },
      },
      energy: { x: 520, y: 990, w: 640 },
      toast: { x: 960, y: 250 },
      thumb: { cx: 1920, cy: 1080, r1: 610, r2: 860 },
      stick: { x: 240, y: 850, r: 120 },
      hero: { x: 900, y: 640, h: 170 },
      drones: [
        { x: 1180, y: 560, h: 96 },
        { x: 560, y: 600, h: 110 },
      ],
    }
  }
  // 휴대폰 세로
  if (!juice) {
    // 나쁜 예: 작은 PC 슬롯을 그대로 옮김 (엄지 영역 고려 없음)
    const px = 860
    const py = 1700
    const R = 220
    return {
      mode: 'fan',
      slots: {
        primary: { x: px, y: py, size: 116, round: false },
        dash: { x: px - R, y: py, size: 116, round: false },
        utility: { x: px - R * 0.707, y: py - R * 0.707, size: 116, round: false },
        ult: { x: px, y: py - R, size: 116, round: false },
      },
      energy: { x: 420, y: 1090, w: 620 },
      toast: { x: 540, y: 740 },
      thumb: null,
      stick: { x: 230, y: 1640, r: 130 },
      hero: { x: 300, y: 1020, h: 200 },
      drones: [
        { x: 700, y: 950, h: 110 },
        { x: 930, y: 990, h: 130 },
      ],
    }
  }
  const px = 880
  const py = 1680
  const R = 280
  return {
    mode: 'fan',
    slots: {
      primary: { x: px, y: py, size: 220, round: true },
      dash: { x: px - R, y: py, size: 160, round: true },
      utility: { x: px - R * 0.707, y: py - R * 0.707, size: 160, round: true },
      // 모서리에서 거리 약 830 (r1 690 < 830 < r2 1000) — 손을 뻗어야 닿는 곳
      ult: { x: 790, y: 1140, size: 170, round: true },
    },
    energy: { x: 40, y: 1290, w: 520 },
    toast: { x: 540, y: 740 },
    thumb: { cx: 1080, cy: 1920, r1: 690, r2: 1000 },
    stick: { x: 230, y: 1640, r: 130 },
    hero: { x: 300, y: 1020, h: 200 },
    drones: [
      { x: 560, y: 960, h: 110 },
      { x: 940, y: 900, h: 120 },
    ],
  }
}
