/**
 * 숫자 올라가기(카운트업) — 게임 루프의 dt 로 진행한다 (배속·일시정지 자동 반영).
 *
 *   const c = useRef(createCountUp(0, 1250, 900))
 *   useGameLoop(p.playing, p.timeScale, dt => { el.textContent = formatNumber(c.current.step(dt)) })
 *   c.current.skip()   // 스킵: 즉시 최종값
 *
 * 값이 클수록 길어지지 않게 duration 은 호출하는 쪽이 정한다 (권장: 600~1200ms).
 */
export interface CountUp {
  readonly from: number
  readonly to: number
  /** dt(초)만큼 진행하고 현재 값을 돌려준다 */
  step(dt: number): number
  /** 즉시 끝으로 */
  skip(): number
  readonly value: number
  readonly done: boolean
  /** 0~1 진행률 (이징 전) */
  readonly progress: number
}

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
export const easeOutBack = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2)
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2

export function createCountUp(from: number, to: number, durationMs: number, ease: (t: number) => number = easeOutCubic): CountUp {
  let elapsed = 0
  const dur = Math.max(1, durationMs) / 1000
  const value = () => from + (to - from) * ease(Math.min(1, elapsed / dur))
  return {
    from,
    to,
    step(dt: number) {
      elapsed = Math.min(dur, elapsed + dt)
      return value()
    },
    skip() {
      elapsed = dur
      return to
    },
    get value() {
      return value()
    },
    get done() {
      return elapsed >= dur
    },
    get progress() {
      return elapsed / dur
    },
  }
}

/** 1,250 처럼 천 단위 구분 (반올림) */
export const formatNumber = (v: number) => Math.round(v).toLocaleString('ko-KR')
