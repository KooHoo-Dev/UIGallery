import { useLayoutEffect, useMemo, useRef } from 'react'
import { clamp, useAutoplay, useGameLoop, useTrigger } from '../../core/hooks'
import { bool, num, str } from '../../core/params'
import type { SpecimenProps } from '../../core/types'
import s from './style.module.css'
import { makeCamera, OBJECTIVES, POIS, project, relativeBearing, syncCamera, wrap, type CamState } from './world'

export { meta } from './meta'
export { WaypointScene as Scene } from './Scene'

const DEG = Math.PI / 180
const ZONE_RADIUS = 30
const STREAKS = 26

type Guidance = 'guided' | 'explorer' | 'ambient'

/**
 * 화면 밖 목표 표시 + 나침반 띠 + 안내 강도(풀 가이드 / 탐험 우선 / 환경 신호).
 * 카메라 상태는 HUD 가 소유하고 bus.cam 으로 3D Scene 에 넘긴다 → WebGL 이 없어도 HUD 계산은 그대로 동작.
 */
export default function OffscreenWaypoint(p: SpecimenProps) {
  const guidance = str(p.params, 'guidance', 'guided') as Guidance
  const margin = num(p.params, 'edgeMargin', 64)
  const shape = str(p.params, 'clampShape', 'rect') as 'rect' | 'ellipse'
  const showDistance = bool(p.params, 'showDistance', true)
  const compassFov = num(p.params, 'compassFov', 180) * DEG
  const compassObjective = bool(p.params, 'compassObjective', true)
  const backplate = bool(p.params, 'backplate', true)
  const markerScale = num(p.params, 'markerScale', 1)
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
    walkTo: null as null | { x: number; z: number },
    recall: 0,
    toast: 0,
    toastText: '',
    bright: false,
    streaks: Array.from({ length: STREAKS }, (_, i) => ({ x: (i * 397) % W, y: H * 0.25 + ((i * 211) % (H * 0.7)), life: (i * 0.137) % 1 })),
  })
  p.bus.cam = st.current.c
  p.bus.bright = st.current.bright

  const rootRef = useRef<HTMLDivElement>(null)
  const markerRefs = useRef<(HTMLDivElement | null)[]>([])
  const distRefs = useRef<(HTMLSpanElement | null)[]>([])
  const compassRef = useRef<HTMLDivElement>(null)
  const compassIconRefs = useRef<(HTMLDivElement | null)[]>([])
  const poiRefs = useRef<(HTMLDivElement | null)[]>([])
  const headingRef = useRef<HTMLSpanElement>(null)
  const streakRefs = useRef<(HTMLDivElement | null)[]>([])
  const toastRef = useRef<HTMLDivElement>(null)

  const active = () => OBJECTIVES[st.current.active]
  const distTo = (o: (typeof OBJECTIVES)[number]) => Math.hypot(o.pos[0] - st.current.c.x, o.pos[2] - st.current.c.z)

  /** 목표 쪽으로 걸어가기 — stopAt 미터 앞에서 멈춘다 */
  const walkToward = (stopAt: number) => {
    const o = active()
    const x = st.current
    const d = distTo(o)
    if (d <= stopAt) return
    const k = (d - stopAt) / d
    x.walkTo = { x: x.c.x + (o.pos[0] - x.c.x) * k, z: x.c.z + (o.pos[2] - x.c.z) * k }
    // 걸어가는 방향을 바라본다
    x.targetYaw = x.c.yaw + relativeBearing(x.c, o.pos)
    x.idle = 0
  }

  useTrigger(p.trigger, id => {
    const x = st.current
    x.idle = 0
    if (id === 'turn') x.targetYaw += Math.PI
    else if (id === 'next') {
      x.active = (x.active + 1) % OBJECTIVES.length
      showToast(`새 목표: ${active().label}`)
    } else if (id === 'zone') walkToward(ZONE_RADIUS - 6)
    else if (id === 'arrive') walkToward(3)
    else if (id === 'recall') x.recall = 3
    else if (id === 'bright') x.bright = !x.bright
    p.bus.bright = x.bright
  })

  const showToast = (text: string) => {
    st.current.toast = 1.8
    st.current.toastText = text
    if (toastRef.current) toastRef.current.textContent = text
  }

  // 자동 데모: 천천히 둘러보기 — 목표가 화면 안팎을 오가게 한다
  useAutoplay(p.autoplay, p.playing, p.timeScale, 2.6, () => {
    const x = st.current
    if (x.dragging || x.idle < 1.5 || x.walkTo) return
    x.targetYaw += (Math.sin(x.t * 0.37) > 0 ? 1 : -1) * 55 * DEG
  })

  useGameLoop(p.playing, p.timeScale, dt => {
    const x = st.current
    x.t += dt
    x.idle += dt
    x.recall = Math.max(0, x.recall - dt)
    x.toast = Math.max(0, x.toast - dt)
    // 회전: 목표 각도로 부드럽게 (효과를 끄면 즉시)
    x.c.yaw = juice ? x.c.yaw + (x.targetYaw - x.c.yaw) * (1 - Math.exp(-5 * dt)) : x.targetYaw
    if (x.walkTo) {
      const dx = x.walkTo.x - x.c.x
      const dz = x.walkTo.z - x.c.z
      const d = Math.hypot(dx, dz)
      const step = Math.min(d, 14 * dt)
      if (d < 0.05) {
        x.walkTo = null
        if (distTo(active()) < 4) {
          showToast(`목표 완료: ${active().label}`)
          x.active = (x.active + 1) % OBJECTIVES.length
        }
      } else {
        x.c.x += (dx / d) * step
        x.c.z += (dz / d) * step
      }
    }
    // 환경 신호: 바람 줄기가 목표 방향으로 '나란히' 흐른다
    if (guidance === 'ambient') {
      const d = windDir()
      x.streaks.forEach((k, i) => {
        k.life += dt * 0.5
        k.x += d.x * 520 * dt
        k.y += d.y * 520 * dt
        const out = k.x < -200 || k.x > W + 200 || k.y < H * 0.15 || k.y > H + 100
        if (k.life > 1 || out) {
          k.life = 0
          // 바람이 불어오는 쪽 절반에서 다시 시작 (결정론적 분산)
          const seed = i * 7919 + Math.floor(x.t * 13) * 104729
          k.x = W / 2 - d.x * W * 0.35 + ((seed % 1400) - 700)
          k.y = H * 0.35 + (Math.floor(seed / 8) % Math.floor(H * 0.6))
        }
      })
    }
    paint()
  })

  /** 바람 방향: 화면 중심 → 목표(화면 밖이면 가장자리 고정점). 정면이면 살짝 위로(지평선 쪽) */
  const windDir = () => {
    const t = targetScreenPoint()
    const dx = t.x - W / 2
    const dy = Math.min(t.y - H / 2, -H * 0.08)
    const len = Math.hypot(dx, dy) || 1
    return { x: dx / len, y: dy / len }
  }

  /** 활성 목표의 화면상 '향할 점' (화면 밖이면 가장자리) */
  const targetScreenPoint = () => {
    syncCamera(cam, st.current.c)
    const o = active()
    const pr = project(cam, [o.pos[0], 3.2, o.pos[2]], W, H, margin, shape)
    return { x: pr.x, y: pr.y }
  }

  const paint = () => {
    const x = st.current
    syncCamera(cam, x.c)
    const hudOn = guidance === 'guided' || x.recall > 0
    const compassOn = guidance !== 'ambient' || x.recall > 0
    const root = rootRef.current
    if (root) {
      root.dataset.hud = String(hudOn)
      root.dataset.compass = String(compassOn)
      root.dataset.bright = String(x.bright)
    }

    OBJECTIVES.forEach((o, i) => {
      const el = markerRefs.current[i]
      if (!el) return
      const pr = project(cam, [o.pos[0], 3.2, o.pos[2]], W, H, margin, shape)
      const isActive = i === x.active
      el.dataset.active = String(isActive)
      el.removeAttribute('data-part')
      const dEl = distRefs.current[i]
      if (juice) {
        // 가까이 가면 마커를 흐리게 — 목표 자체를 가리지 않도록
        const near = clamp((pr.distance - 4) / 6, 0.15, 1)
        el.dataset.mode = pr.onScreen ? 'on' : 'off'
        el.style.transform = `translate(${pr.x}px, ${pr.y}px)`
        el.style.opacity = String(pr.onScreen ? near : 1)
        el.style.setProperty('--angle', `${pr.angle}rad`)
        // 거리 숫자는 정수가 바뀔 때만 갱신 → 깜빡임 없음
        if (dEl) {
          const txt = `${Math.round(pr.distance)}m`
          if (dEl.textContent !== txt) dEl.textContent = txt
        }
      } else {
        // 나쁜 예: 클램프 없이 투영만 — 화면 밖 목표는 사라지고, 뒤쪽 목표는 거울상으로 잘못 나타난다
        el.dataset.mode = 'on'
        el.style.transform = `translate(${pr.rawX}px, ${pr.rawY}px)`
        el.style.opacity = pr.rawVisible ? '1' : '0'
        if (dEl) dEl.textContent = `${(pr.distance + Math.sin(x.t * 37 + i) * 0.04).toFixed(2)}m`
      }
    })
    // 해설 번호용 이름표: 화면 밖 첫 마커, 활성 마커의 배경판
    const firstOff = OBJECTIVES.findIndex((_, i) => markerRefs.current[i]?.dataset.mode === 'off')
    if (firstOff >= 0) markerRefs.current[firstOff]?.setAttribute('data-part', 'edge-arrow')

    // 나침반
    if (compassRef.current) {
      const cw = 960
      const half = compassFov / 2
      compassRef.current.querySelectorAll<HTMLElement>('[data-tick]').forEach(t => {
        const a = Number(t.dataset.tick) * DEG
        const rel = wrap(-a - x.c.yaw)
        t.style.transform = `translateX(${cw / 2 - (rel / half) * (cw / 2)}px)`
        t.style.opacity = Math.abs(rel) <= half ? String(1 - (Math.abs(rel) / half) * 0.7) : '0'
      })
      const place = (el: HTMLElement | null, pos: [number, number, number]) => {
        if (!el) return
        const rel = relativeBearing(x.c, pos)
        el.style.transform = `translateX(${cw / 2 - (clamp(rel, -half, half) / half) * (cw / 2)}px)`
        el.dataset.edge = String(Math.abs(rel) > half)
      }
      OBJECTIVES.forEach((o, i) => {
        const el = compassIconRefs.current[i]
        place(el, o.pos)
        if (el) {
          el.dataset.active = String(i === x.active)
          el.style.display = compassObjective ? '' : 'none'
        }
      })
      POIS.forEach((o, i) => place(poiRefs.current[i], o.pos))
      if (headingRef.current) {
        const deg = (((-x.c.yaw / DEG) % 360) + 360) % 360
        headingRef.current.textContent = String(Math.round(deg)).padStart(3, '0')
      }
      const inZone = juice && distTo(active()) < ZONE_RADIUS
      compassRef.current.parentElement?.toggleAttribute('data-zone', inZone)
    }

    // 바람 줄기
    const wd = guidance === 'ambient' ? windDir() : { x: 1, y: 0 }
    const ang = Math.atan2(wd.y, wd.x)
    x.streaks.forEach((k, i) => {
      const el = streakRefs.current[i]
      if (!el) return
      const fade = Math.sin(Math.PI * clamp(k.life, 0, 1))
      el.style.transform = `translate(${k.x}px, ${k.y}px) rotate(${ang}rad)`
      el.style.opacity = String(fade * 0.85)
    })

    if (toastRef.current) {
      toastRef.current.style.opacity = String(clamp(x.toast * 2, 0, 1))
      toastRef.current.style.transform = `translate(-50%, ${x.toast > 0 ? 0 : -16}px)`
    }
  }

  // 정지 상태(썸네일·일시정지)에서도 값이 바뀌면 한 번 그린다
  useLayoutEffect(() => paint())

  // 드래그로 둘러보기
  const onPointerDown = (e: React.PointerEvent) => {
    st.current.dragging = true
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
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
      ref={rootRef}
      className={s.root}
      data-juice={juice || undefined}
      data-plate={(backplate && juice) || undefined}
      data-guidance={guidance}
      style={{ '--ms': markerScale } as React.CSSProperties}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {!p.webgl && <div className={s.fallbackHorizon} aria-hidden />}

      <div className={s.guide} data-part="margin" data-shape={shape} data-visible={guide || undefined} style={{ inset: margin }} />

      {/* 환경 신호: 목표 쪽으로 흐르는 바람 줄기 */}
      <div className={s.wind} data-part="ambient-cue" aria-hidden>
        {st.current.streaks.map((_, i) => (
          <div
            key={i}
            ref={el => {
              streakRefs.current[i] = el
            }}
            className={s.streak}
          />
        ))}
      </div>

      <div className={s.markers}>
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
            <div className={s.plate} data-part={i === 0 ? 'marker-backplate' : undefined} />
            <div className={s.icon} />
            <div className={s.caption}>
              <b>{o.label}</b>
              {showDistance && (
                <span
                  ref={el => {
                    distRefs.current[i] = el
                  }}
                  className={s.dist}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={s.compass} data-part="compass-band">
        <div className={s.zoneGlow} data-part="compass-zone-glow">
          목표 구역
        </div>
        <div ref={compassRef} className={s.compassTrack}>
          {ticks.map(a => (
            <div key={a} className={s.tick} data-tick={a} data-major={a % 90 === 0 || undefined} data-mid={a % 45 === 0 || undefined}>
              <span>{CARD[a] ?? (a % 45 === 0 ? a : '')}</span>
            </div>
          ))}
          {POIS.map((o, i) => (
            <div
              key={o.id}
              ref={el => {
                poiRefs.current[i] = el
              }}
              className={s.poi}
              data-glyph={o.glyph}
              title={o.label}
            />
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

      <div ref={toastRef} className={s.toast} role="status" />

      {!p.thumbnail && <div className={s.hint}>드래그해서 둘러보기</div>}
    </div>
  )
}
