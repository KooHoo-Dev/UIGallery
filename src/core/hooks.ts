import { useEffect, useRef } from 'react'
import type { StageTrigger } from './types'

/**
 * 게임 루프. playing 일 때만 매 프레임 cb(dt) 를 부른다.
 * dt 는 timeScale 이 곱해진 '게임 시간' 초 단위이며, 탭 전환 등으로 생긴 큰 공백은 0.1초로 자른다.
 */
export function useGameLoop(playing: boolean, timeScale: number, cb: (dt: number) => void) {
  const cbRef = useRef(cb)
  cbRef.current = cb
  const scaleRef = useRef(timeScale)
  scaleRef.current = timeScale
  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.max(0, Math.min(0.1, (now - last) / 1000)) * scaleRef.current
      last = now
      cbRef.current(dt)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])
}

/** 이벤트 버튼(트리거)이 눌릴 때마다 1회 handler(id) 실행 */
export function useTrigger(trigger: StageTrigger | null, handler: (id: string) => void) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler
  const seen = useRef(trigger?.seq ?? 0)
  useEffect(() => {
    if (!trigger || trigger.seq === seen.current) return
    seen.current = trigger.seq
    handlerRef.current(trigger.id)
  }, [trigger])
}

/**
 * 자동 데모: 게임 시간으로 interval 초마다 fn 실행.
 * 사용자가 이벤트를 누르면 resetKey 를 바꿔 다음 자동 이벤트를 미룬다.
 */
export function useAutoplay(
  enabled: boolean,
  playing: boolean,
  timeScale: number,
  interval: number,
  fn: () => void,
  resetKey?: unknown,
) {
  const acc = useRef(0)
  const fnRef = useRef(fn)
  fnRef.current = fn
  useEffect(() => {
    acc.current = 0
  }, [resetKey])
  useGameLoop(enabled && playing, timeScale, dt => {
    acc.current += dt
    if (acc.current >= interval) {
      acc.current = 0
      fnRef.current()
    }
  })
}

/** 실제 시간(ms) → 배속이 반영된 CSS transition 시간(ms) */
export const scaled = (ms: number, timeScale: number) => ms / Math.max(0.05, timeScale)

/** 지수 감쇠 보간 — 프레임레이트와 무관하게 부드럽게 따라간다 */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt))

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
