import { useLayoutEffect, useMemo, useRef } from 'react'
import { clamp, useAutoplay, useGameLoop, useTrigger } from '../../core/hooks'
import { bool, num, str } from '../../core/params'
import type { SpecimenProps } from '../../core/types'
import s from './style.module.css'
import { makeCamera, OBJECTIVES, project, relativeBearing, syncCamera, wrap, type CamState } from './world'

export { meta } from './meta'
export { WaypointScene as Scene } from './Scene'

const DEG = Math.PI / 180

/**
 * 화면 밖 목표 표시 + 나침반 띠.
 * 카메라 상태는 HUD 가 소유하고 bus.cam 으로 3D Scene 에 넘긴다 → WebGL 이 없어도 HUD 계산은 그대로 동작.
 */
export default function OffscreenWaypoint(p: SpecimenProps) {
  const margin = num(p.params, 'edgeMargin', 80)
  const shape = str(p.params, 'clampShape', 'rect') as 'rect' | 'ellipse'
  const showDistance = bool(p.params, 'showDistance', true)
  const compassOn = bool(p.params, 'compass', true)
  const compassFov = num(p.params, 'compassFov', 180) * DEG
  const fadeNear = num(p.params, 'fadeNear', 8)
  const guide = bool(p.params, 'showGuide', false)
  const juice = p.juice

  const W = p.width
  const H = p.height
  const cam = useMemo(() => makeCamera(W / H), [W, H])
  const st = useRef({
    c: { yaw: 0.35, pitch: -0.04, x: 0, z: 0 } as CamState,
    targetYaw: 0.35,
    t: 0,
    active: 0,
    dragging: false,
    idle: 0,
    walk: 0,
  })
  p.bus.cam = st.current.c

  const markerRefs = useRef<(HTMLDivElement | null)[]>([])
  const distRefs = useRef<(HTMLSpanElement | null)[]>([])
  const compassRef = useRef<HTMLDivElement>(null)
  const compassIconRefs = useRef<(HTMLDivElement | null)[]>([])
  const headingRef = useRef<HTMLSpanElement>(null)

  const turn = (deg: number) => {
    st.current.targetYaw += deg * DEG
    st.current.idle = 0
  }
  useTrigger(p.trigger, id => {
    if (id === 'left') turn(60)
    else if (id === 'right') turn(-60)
    else if (id === 'next') st.current.active = (st.current.active + 1) % OBJECTIVES.length
    else if (id === 'walk') st.current.walk = 12
  })

  // 자동 데모: 천천히 둘러보기 — 목표가 화면 안팎을 오가게 한다
  useAutoplay(p.autoplay, p.playing, p.timeScale, 2.6, () => {
    const x = st.current
    if (x.dragging || x.idle < 1.5) return
    x.targetYaw += (Math.sin(x.t * 0.37) > 0 ? 1 : -1) * 55 * DEG
  })

  useGameLoop(p.playing, p.timeScale, dt => {
    const x = st.current
    x.t += dt
    x.idle += dt
    // 회전: 목표 각도로 부드럽게 (효과를 끄면 즉시)
    x.c.yaw = juice ? x.c.yaw + (x.targetYaw - x.c.yaw) * (1 - Math.exp(-5 * dt)) : x.targetYaw
    if (x.walk > 0) {
      const step = Math.min(x.walk, 8 * dt)
      x.walk -= step
      x.c.x = clamp(x.c.x - Math.sin(x.c.yaw) * step, -80, 80)
      x.c.z = clamp(x.c.z - Math.cos(x.c.yaw) * step, -80, 80)
    }
    paint()
  })

  const paint = () => {
    const x = st.current
    syncCamera(cam, x.c)
    OBJECTIVES.forEach((o, i) => {
      const el = markerRefs.current[i]
      if (!el) return
      const top: [number, number, number] = [o.pos[0], 3.2, o.pos[2]]
      const pr = project(cam, top, W, H, margin, shape)
      const isActive = i === x.active
      // 가까이 가면 마커를 흐리게 — 목표 자체를 가리지 않도록
      const near = juice && fadeNear > 0 ? clamp((pr.distance - fadeNear * 0.5) / (fadeNear * 0.5), 0.15, 1) : 1
      el.dataset.active = String(isActive)
      if (juice) {
        el.dataset.mode = pr.onScreen ? 'on' : 'off'
        el.style.transform = `translate(${pr.x}px, ${pr.y}px)`
        el.style.opacity = String(pr.onScreen ? near : 1)
      } else {
        // 나쁜 예: 클램프 없이 투영만 — 화면 밖 목표는 사라지고, 뒤쪽 목표는 거울상으로 잘못 나타난다
        el.dataset.mode = 'on'
        el.style.transform = `translate(${pr.rawX}px, ${pr.rawY}px)`
        el.style.opacity = pr.rawVisible ? '1' : '0'
      }
      el.style.setProperty('--angle', `${pr.angle}rad`)
      // 해설 번호용: 지금 화면 안/밖에 있는 첫 마커에 이름표를 붙인다
      el.removeAttribute('data-part')
      const dEl = distRefs.current[i]
      if (dEl) dEl.textContent = `${Math.round(pr.distance)}m`
    })
    const firstOn = OBJECTIVES.findIndex((_, i) => markerRefs.current[i]?.dataset.mode === 'on')
    const firstOff = OBJECTIVES.findIndex((_, i) => markerRefs.current[i]?.dataset.mode === 'off')
    if (firstOn >= 0) markerRefs.current[firstOn]?.setAttribute('data-part', 'marker-on')
    if (firstOff >= 0) markerRefs.current[firstOff]?.setAttribute('data-part', 'marker-off')

    // 나침반
    if (compassRef.current) {
      const cw = 960
      const half = compassFov / 2
      const ticks = compassRef.current.querySelectorAll<HTMLElement>('[data-tick]')
      ticks.forEach(t => {
        const a = Number(t.dataset.tick) * DEG
        const rel = wrap(-a - x.c.yaw)
        const visible = Math.abs(rel) <= half
        t.style.transform = `translateX(${cw / 2 - (rel / half) * (cw / 2)}px)`
        t.style.opacity = visible ? String(1 - Math.abs(rel) / half * 0.7) : '0'
      })
      OBJECTIVES.forEach((o, i) => {
        const el = compassIconRefs.current[i]
        if (!el) return
        const rel = relativeBearing(x.c, o.pos)
        const clamped = clamp(rel, -half, half)
        el.style.transform = `translateX(${cw / 2 - (clamped / half) * (cw / 2)}px)`
        el.dataset.edge = String(Math.abs(rel) > half)
        el.dataset.side = rel > 0 ? 'left' : 'right'
        el.dataset.active = String(i === x.active)
      })
      if (headingRef.current) {
        const deg = ((-x.c.yaw / DEG) % 360 + 360) % 360
        headingRef.current.textContent = String(Math.round(deg)).padStart(3, '0')
      }
    }
  }

  // 정지 상태(썸네일·일시정지)에서도 값이 바뀌면 한 번 그린다
  useLayoutEffect(() => paint())

  // 드래그로 둘러보기
  const onPointerDown = (e: React.PointerEvent) => {
    const x = st.current
    x.dragging = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const x = st.current
    if (!x.dragging) return
    x.targetYaw -= e.movementX * 0.006
    x.c.yaw = x.targetYaw
    x.idle = 0
    paint()
  }
  const onPointerUp = () => {
    st.current.dragging = false
  }

  const ticks = useMemo(() => Array.from({ length: 24 }, (_, i) => i * 15), [])
  const CARD: Record<number, string> = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' }

  return (
    <div
      className={s.root}
      data-juice={juice || undefined}
      data-thumb={p.thumbnail || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {!p.webgl && <div className={s.fallbackHorizon} aria-hidden />}

      <div
        className={s.guide}
        data-part="margin"
        data-shape={shape}
        data-visible={guide || undefined}
        style={{ inset: margin }}
      />

      {OBJECTIVES.map((o, i) => (
        <div
          key={o.id}
          ref={el => {
            markerRefs.current[i] = el
          }}
          className={s.marker}
          data-kind={o.kind}
          style={{ '--c': o.color } as React.CSSProperties}
        >
          <div className={s.arrow} aria-hidden />
          <div className={s.icon} />
          <div className={s.caption}>
            <b>{o.label}</b>
            {showDistance && (
              <span
                ref={el => {
                  distRefs.current[i] = el
                }}
                className={s.dist}
                data-part={i === 0 ? 'distance' : undefined}
              />
            )}
          </div>
        </div>
      ))}

      {compassOn && (
        <div className={s.compass} data-part="compass">
          <div ref={compassRef} className={s.compassTrack}>
            {ticks.map(a => (
              <div key={a} className={s.tick} data-tick={a} data-major={a % 90 === 0 || undefined} data-mid={a % 45 === 0 || undefined}>
                <span>{CARD[a] ?? (a % 45 === 0 ? a : '')}</span>
              </div>
            ))}
            {OBJECTIVES.map((o, i) => (
              <div
                key={o.id}
                ref={el => {
                  compassIconRefs.current[i] = el
                }}
                className={s.compassIcon}
                data-kind={o.kind}
                style={{ '--c': o.color } as React.CSSProperties}
              />
            ))}
          </div>
          <div className={s.heading}>
            <span ref={headingRef}>000</span>°
          </div>
        </div>
      )}

      {!p.thumbnail && <div className={s.hint}>드래그해서 둘러보기</div>}
    </div>
  )
}
