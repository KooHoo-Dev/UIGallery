import { useRef } from 'react'
import { requestFlash } from '../../core/flash'
import { clamp, damp, useAutoplay, useGameLoop, useTrigger } from '../../core/hooks'
import { bool, num, str } from '../../core/params'
import type { SpecimenProps } from '../../core/types'
import s from './style.module.css'

export { meta } from './meta'

const MAX = 100
/** 연타 중 잔상이 기다릴 수 있는 최대 시간(초) */
const MAX_HOLD = 1.2

/**
 * 체력 바 + 잔상(데미지 트레일) + 회복 미리보기 + 저체력 테두리.
 * 매 프레임 바뀌는 값은 React state 대신 ref 로 DOM 을 직접 갱신한다 (60fps 에서 리렌더 0).
 */
export default function HealthBarTrail(p: SpecimenProps) {
  const trailDelay = num(p.params, 'trailDelay', 450) / 1000
  const trailSpeed = num(p.params, 'trailSpeed', 55)
  const lowThreshold = num(p.params, 'lowThreshold', 30)
  const vignetteMax = num(p.params, 'vignette', 0.7)
  const segments = num(p.params, 'segments', 10)
  const shape = str(p.params, 'shape', 'slanted')
  const numberMode = str(p.params, 'numberMode', 'value')
  const colorShift = bool(p.params, 'colorShift', true)
  const healStyle = str(p.params, 'healStyle', 'preview')
  const juice = p.juice

  // 시뮬레이션 상태
  const st = useRef({
    hp: 72,
    fill: 72,
    trail: 72,
    heal: 72,
    hold: 0,
    /** 이번 잔상이 지금까지 기다린 시간 — 연타로 대기가 무한히 늘지 않게 상한(MAX_HOLD)을 둔다 */
    held: 0,
    shown: 72,
    shake: 0,
    flash: 0,
    t: 0,
    autoStep: 0,
    /** 연속 타격 예약: 남은 타수와 다음 타격까지 시간 */
    combo: 0,
    comboTimer: 0,
  })

  const rootRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const trailRef = useRef<HTMLDivElement>(null)
  const trailZoneRef = useRef<HTMLDivElement>(null)
  const healRef = useRef<HTMLDivElement>(null)
  const numRef = useRef<HTMLSpanElement>(null)
  const vigRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)

  const damage = (amount: number) => {
    const x = st.current
    const before = x.hp
    x.hp = clamp(x.hp - amount, 0, MAX)
    x.heal = x.hp
    if (juice) {
      // 잔상은 맞기 전 위치에 남겨 두고 잠시 기다린다. 연타 중에는 대기 시간을 다시 채우되 총 대기는 MAX_HOLD 까지만.
      if (x.trail <= x.fill + 0.01) x.held = 0
      x.trail = Math.max(x.trail, before)
      x.hold = Math.min(trailDelay, Math.max(0, MAX_HOLD - x.held))
      x.shake = Math.min(1, amount / 25)
      if (amount >= 20 && requestFlash()) x.flash = 1
    } else {
      x.trail = x.hp
      x.fill = x.hp
    }
  }
  const heal = (amount: number) => {
    const x = st.current
    x.hp = clamp(x.hp + amount, 0, MAX)
    x.heal = x.hp
    x.trail = Math.min(x.trail, x.fill)
    if (!juice || healStyle === 'instant') x.fill = x.hp
  }

  const handle = (id: string) => {
    const x = st.current
    if (id === 'hit') damage(9)
    else if (id === 'heavy') damage(28)
    else if (id === 'combo') {
      // 5 × 4 연타, 120ms 간격 — 메인 바는 계단식, 잔상은 합계를 한 덩어리로
      damage(5)
      x.combo = 3
      x.comboTimer = 0.12
    } else if (id === 'heal') heal(30)
  }
  useTrigger(p.trigger, handle)

  // 자동 데모: 맞고, 크게 맞고, 위험해지면 회복
  useAutoplay(p.autoplay, p.playing, p.timeScale, 1.4, () => {
    const x = st.current
    x.autoStep++
    if (x.hp <= 24) handle('heal')
    else handle(['hit', 'combo', 'hit', 'heavy'][x.autoStep % 4])
  }, p.trigger?.seq)

  useGameLoop(p.playing, p.timeScale, dt => {
    const x = st.current
    x.t += dt
    if (x.combo > 0) {
      x.comboTimer -= dt
      if (x.comboTimer <= 0) {
        damage(5)
        x.combo--
        x.comboTimer = 0.12
      }
    }
    if (juice) {
      // 체력이 줄 때 메인 바는 거의 즉시(약 60ms), 회복은 방식에 따라 미리보기 구간을 채우며 천천히
      const healRate = healStyle === 'slow' ? 25 : 60
      x.fill = x.hp < x.fill ? damp(x.fill, x.hp, 40, dt) : Math.min(x.hp, x.fill + healRate * dt)
      if (x.hold > 0) {
        x.hold -= dt
        x.held += dt
      } else if (x.trail > x.fill) x.trail = Math.max(x.fill, x.trail - trailSpeed * dt)
      x.shown = damp(x.shown, x.hp, 14, dt)
      x.shake = Math.max(0, x.shake - dt * 4)
      x.flash = Math.max(0, x.flash - dt * 5)
    } else {
      x.fill = x.hp
      x.trail = x.hp
      x.shown = x.hp
      x.shake = 0
      x.flash = 0
    }
    paint()
  })

  const paint = () => {
    const x = st.current
    const pct = (v: number) => `${(v / MAX) * 100}%`
    if (fillRef.current) {
      fillRef.current.style.width = pct(x.fill)
      const ratio = x.fill / MAX
      const low = ratio * 100 <= lowThreshold
      const hue = colorShift && juice ? 4 + 118 * clamp((ratio - 0.15) / 0.65, 0, 1) : 120
      fillRef.current.style.setProperty('--hue', String(hue))
      rootRef.current?.toggleAttribute('data-low', juice && low)
    }
    if (trailRef.current) trailRef.current.style.width = pct(x.trail)
    if (trailZoneRef.current) {
      // 해설 번호 위치용: 잔상이 실제로 보이는 구간
      trailZoneRef.current.style.left = pct(x.fill)
      trailZoneRef.current.style.width = pct(Math.max(0, x.trail - x.fill))
    }
    if (healRef.current) {
      healRef.current.style.left = pct(x.fill)
      healRef.current.style.width = healStyle === 'preview' ? pct(Math.max(0, x.heal - x.fill)) : '0%'
    }
    if (numRef.current) {
      const v = Math.round(x.shown)
      numRef.current.textContent = numberMode === 'percent' ? `${v}%` : `${v} / ${MAX}`
    }
    if (rootRef.current) {
      const k = x.shake * x.shake
      rootRef.current.style.transform = k > 0 ? `translate(${Math.sin(x.t * 90) * 10 * k}px, ${Math.cos(x.t * 70) * 5 * k}px)` : ''
    }
    if (vigRef.current) {
      const ratio = (x.fill / MAX) * 100
      const lowness = juice && lowThreshold > 0 ? clamp(1 - ratio / lowThreshold, 0, 1) : 0
      // 심장 박동: 체력이 낮을수록 빨라진다 (최대 2Hz — 번쩍임 기준 초당 3회 미만)
      const hz = 1 + lowness
      const beat = 0.75 + 0.25 * Math.sin(x.t * Math.PI * 2 * hz)
      vigRef.current.style.opacity = String(ratio <= lowThreshold ? vignetteMax * (0.35 + 0.65 * lowness) * beat : 0)
    }
    if (flashRef.current) flashRef.current.style.opacity = String(x.flash * 0.35 * vignetteMax)
  }

  const ticks = segments > 1 ? Array.from({ length: segments - 1 }, (_, i) => ((i + 1) / segments) * 100) : []

  return (
    <div
      className={s.root}
      data-juice={juice || undefined}
      data-paused={!p.playing || undefined}
      style={{ '--ts': p.timeScale } as React.CSSProperties}
    >
      <div ref={vigRef} className={s.vignette} data-part="vignette" />
      <div ref={flashRef} className={s.flash} />
      <div ref={rootRef} className={s.cluster} data-shape={shape}>
        <div className={s.label}>
          <svg className={s.icon} viewBox="0 0 24 24" aria-hidden>
            <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" />
          </svg>
          <span>VITAL</span>
          {numberMode !== 'none' && (
            <span ref={numRef} className={s.number} data-part="number">
              72 / 100
            </span>
          )}
        </div>
        <div className={s.bar} data-part="frame">
          <div className={s.track} />
          <div ref={trailRef} className={s.trail} style={{ width: '72%' }} />
          <div ref={trailZoneRef} className={s.zone} data-part="trail" />
          <div ref={healRef} className={s.healPreview} data-part="heal" />
          <div ref={fillRef} className={s.fill} data-part="fill" style={{ width: '72%' }} />
          {ticks.map(t => (
            <div key={t} className={s.tick} style={{ left: `${t}%` }} />
          ))}
          <div className={s.lowMark} style={{ left: `${lowThreshold}%` }} data-part="threshold" />
        </div>
      </div>
    </div>
  )
}
