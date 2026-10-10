import { Canvas } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { getEnv } from '../core/env'
import type { Aspect, Hotspot, ParamValues, SpecimenModule, StageTrigger } from '../core/types'
import { Backdrop } from './Backdrop'
import { ErrorBoundary } from './ErrorBoundary'
import { Rich } from './Rich'

export interface StageProps {
  mod: SpecimenModule
  params: ParamValues
  juice: boolean
  playing: boolean
  timeScale: number
  trigger: StageTrigger | null
  autoplay: boolean
  aspect: Aspect
  thumbnail?: boolean
  hotspots?: {
    list: Hotspot[]
    active: number | null
    visible: boolean
    onSelect: (n: number | null) => void
  }
  presenter?: boolean
  showBadges?: boolean
}

const LOGICAL: Record<Aspect, [number, number]> = { '16:9': [1920, 1080], '9:16': [1080, 1920] }

/** 최신 Chromium 은 길이÷길이 = 숫자 계산을 지원 → 레이아웃 즉시 반영, JS 측정 불필요 */
const CSS_SCALE = typeof CSS !== 'undefined' && CSS.supports('scale', 'calc(100cqw / 1920px)')

/**
 * 무대 — 논리 해상도(1920×1080)로 그린 HUD 를 실제 크기에 맞춰 축소해 보여준다.
 * Unity 의 Canvas Scaler(Scale With Screen Size, Reference Resolution 1920×1080) 와 같은 방식.
 *
 * 레이어: [three Canvas 또는 2D 배경] → [HUD (논리 좌표)] → [해설 번호 오버레이]
 */
export function Stage(props: StageProps) {
  const { mod, aspect, thumbnail = false } = props
  const [W, H] = LOGICAL[aspect]
  const viewportRef = useRef<HTMLDivElement>(null)
  const hudRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  const [visible, setVisible] = useState(true)
  const [pageVisible, setPageVisible] = useState(!document.hidden)

  // 크기 맞춤: CSS 만으로 가능하면(container 단위 나눗셈) CSS 로, 아니면 ResizeObserver 로 계산
  useLayoutEffect(() => {
    if (CSS_SCALE) return
    const el = viewportRef.current!
    const measure = () => setScale(el.getBoundingClientRect().width / W)
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    measure()
    addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      removeEventListener('resize', measure)
    }
  }, [W])

  // 화면 밖이면 정지 (저사양 PC 배려)
  useEffect(() => {
    const el = viewportRef.current!
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.01 })
    io.observe(el)
    const onVis = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  // 표본이 바뀌거나 화면비가 바뀌면 HUD ↔ Scene 공유 객체를 새로 만든다
  const bus = useMemo(() => ({}) as Record<string, unknown>, [mod, aspect])
  const env = getEnv()
  const webgl = Boolean(mod.meta.stage.three && mod.Scene && env.webgl && !thumbnail)
  const playing = props.playing && visible && pageVisible

  const specimenProps = {
    params: props.params,
    juice: props.juice,
    playing,
    timeScale: props.timeScale,
    trigger: props.trigger,
    autoplay: props.autoplay,
    aspect,
    width: W,
    height: H,
    thumbnail,
    webgl,
    bus,
  }
  const Hud = mod.default
  const Scene = mod.Scene

  return (
    <div
      ref={viewportRef}
      className="stage"
      data-aspect={aspect}
      data-thumbnail={thumbnail || undefined}
      data-presenter={props.presenter || undefined}
    >
      {webgl && Scene && (
        <div className="stage-3d" aria-hidden>
          <ErrorBoundary label="3D 장면">
            <Canvas
              dpr={[1, 2]}
              frameloop={playing ? 'always' : 'demand'}
              resize={{ scroll: false, debounce: 0 }}
              gl={{ antialias: true, powerPreference: 'high-performance' }}
            >
              <Scene {...specimenProps} />
            </Canvas>
          </ErrorBoundary>
        </div>
      )}
      <div
        ref={hudRef}
        className="stage-hud"
        style={
          CSS_SCALE
            ? { width: W, height: H, scale: `calc(100cqw / ${W}px)` }
            : { width: W, height: H, transform: `scale(${scale})`, visibility: scale ? 'visible' : 'hidden' }
        }
      >
        {!webgl && <Backdrop id={mod.meta.stage.backdrop ?? 'none'} width={W} height={H} />}
        <ErrorBoundary label={mod.meta.title}>
          <Hud {...specimenProps} />
        </ErrorBoundary>
      </div>
      {props.hotspots?.visible && <HotspotOverlay viewportRef={viewportRef} hudRef={hudRef} {...props.hotspots} presenter={props.presenter} />}
      {props.showBadges && (
        <div className="stage-badges" aria-live="polite">
          {!props.juice && <span className="badge badge-bad">효과 끔 · 나쁜 예</span>}
          {props.timeScale !== 1 && <span className="badge">{props.timeScale}× 슬로모션</span>}
          {!props.playing && <span className="badge">일시정지</span>}
          {mod.meta.stage.three && !webgl && !thumbnail && <span className="badge" title="이 PC에서 WebGL을 쓸 수 없어 2D 대체 배경으로 표시합니다">3D 꺼짐 · 2D 대체</span>}
        </div>
      )}
    </div>
  )
}

/* ───────── 해설 번호 오버레이 ───────── */

const PIN = 28

/** 번호 핀 위치: 대상의 위쪽 가운데. 공간이 없으면 안쪽. 서로 겹치면 오른쪽으로 민다 */
function placePins(boxes: Box[], vp: { w: number; h: number }) {
  const placed: { b: Box; x: number; y: number }[] = []
  for (const b of [...boxes].sort((a, c) => a.y - c.y || a.x - c.x)) {
    let x = b.x + b.w / 2 - PIN / 2
    let y = b.y - PIN - 6 >= 4 ? b.y - PIN - 6 : b.y + 4
    x = Math.max(4, Math.min(vp.w - PIN - 4, x))
    y = Math.max(4, Math.min(vp.h - PIN - 4, y))
    for (let guard = 0; guard < 20 && placed.some(p => Math.abs(p.x - x) < PIN + 4 && Math.abs(p.y - y) < PIN + 4); guard++) {
      x += PIN + 6
      if (x > vp.w - PIN - 4) {
        x = 4
        y += PIN + 6
      }
    }
    placed.push({ b, x, y })
  }
  return placed.sort((a, c) => a.b.n - c.b.n)
}

interface Box {
  n: number
  x: number
  y: number
  w: number
  h: number
  found: boolean
}

function HotspotOverlay({
  viewportRef,
  hudRef,
  list,
  active,
  onSelect,
  presenter,
}: {
  viewportRef: React.RefObject<HTMLDivElement | null>
  hudRef: React.RefObject<HTMLDivElement | null>
  list: Hotspot[]
  active: number | null
  onSelect: (n: number | null) => void
  presenter?: boolean
}) {
  const [boxes, setBoxes] = useState<Box[]>([])
  const [vp, setVp] = useState({ w: 0, h: 0 })

  // 표시 대상이 움직일 수 있으므로 매 프레임 위치를 다시 잰다 (값이 같으면 렌더하지 않음)
  useEffect(() => {
    let raf = 0
    let prev = ''
    const tick = () => {
      const vpEl = viewportRef.current
      const hud = hudRef.current
      if (vpEl && hud) {
        const base = vpEl.getBoundingClientRect()
        const next = list.map(h => {
          const el = hud.querySelector<HTMLElement | SVGElement>(`[data-part="${h.part}"]`)
          if (!el) return { n: h.n, x: base.width / 2, y: 24, w: 0, h: 0, found: false }
          const r = el.getBoundingClientRect()
          return { n: h.n, x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height, found: true }
        })
        const key = JSON.stringify(next.map(b => [Math.round(b.x), Math.round(b.y), Math.round(b.w), Math.round(b.h)])) + base.width + 'x' + base.height
        if (key !== prev) {
          prev = key
          setBoxes(next)
          setVp({ w: base.width, h: base.height })
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [list, viewportRef, hudRef])

  const activeBox = boxes.find(b => b.n === active)
  const activeSpot = list.find(h => h.n === active)
  const calloutW = Math.min(presenter ? 520 : 380, vp.w - 24)

  let callout: React.CSSProperties | undefined
  if (activeBox && activeSpot) {
    const below = activeBox.y + activeBox.h + 16
    const spaceBelow = vp.h - below
    const placeBelow = spaceBelow > 150 || activeBox.y < vp.h / 2
    const left = Math.max(12, Math.min(vp.w - calloutW - 12, activeBox.x + activeBox.w / 2 - calloutW / 2))
    callout = placeBelow
      ? { left, top: Math.min(below, vp.h - 60), width: calloutW }
      : { left, bottom: vp.h - activeBox.y + 16, width: calloutW }
  }

  return (
    <div className="hotspots" data-presenter={presenter || undefined}>
      {activeBox?.found && (
        <div className="hotspot-frame" style={{ left: activeBox.x - 6, top: activeBox.y - 6, width: activeBox.w + 12, height: activeBox.h + 12 }} />
      )}
      {placePins(boxes, vp).map(({ b, x, y }) => {
        return (
          <button
            key={b.n}
            className="hotspot-pin"
            data-active={b.n === active || undefined}
            style={{ left: x, top: y }}
            onClick={() => onSelect(b.n === active ? null : b.n)}
            aria-label={`해설 ${b.n}: ${list.find(h => h.n === b.n)?.title ?? ''}`}
          >
            {b.n}
          </button>
        )
      })}
      {callout && activeSpot && (
        <div className="hotspot-callout" style={callout} role="note">
          <div className="hotspot-callout-head">
            <span className="hotspot-num">{activeSpot.n}</span>
            <b>{activeSpot.title}</b>
            <span className="chip chip-sm">{activeSpot.principle}</span>
          </div>
          <p>
            <Rich text={activeSpot.body} />
          </p>
        </div>
      )}
    </div>
  )
}
