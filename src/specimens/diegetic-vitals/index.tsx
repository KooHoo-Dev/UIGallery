import { useId, useLayoutEffect, useMemo, useRef } from 'react'
import { Matrix4, PerspectiveCamera, Vector3 } from 'three'
import { prefersReducedMotion, requestFlash } from '../../core/flash'
import { clamp, damp, useAutoplay, useGameLoop, useTrigger } from '../../core/hooks'
import { bool, num, str } from '../../core/params'
import type { SpecimenProps } from '../../core/types'
import { emptyPanelRefs, HatchPattern, O2Glyph, Panel2D, type PanelRefs } from './Panel2D'
import s from './style.module.css'
import {
  css,
  DEG,
  ENERGY,
  FOV,
  hexPoints,
  layout,
  LINE_Z,
  MAX_CELLS,
  MINT,
  panelMatrix,
  PANEL_Y,
  PANEL_Z,
  poseCamera,
  RED,
  tierColor,
  tierOf,
  VAC_STOP,
  type Box,
  type Mount,
  type RGB,
  type Scheme,
  type View,
} from './world'

export { meta } from './meta'
export { VitalsScene as Scene } from './Scene'

const MAX = 100
/** 자동 데모 순서 — 맞고, 능력 쓰고, 진공에 들어가 위험해지고, 카메라가 돌고, 회복해 돌아온다 */
const AUTO = ['hit', 'ability', 'vacuum', 'heavy', 'orbit', 'heal', 'heal', 'vacuum', 'ability']

interface Cell {
  on: boolean
  /** 0~1 진행값 (켜짐: 차오름, 꺼짐: 흰 번쩍임 뒤 사그라듦) */
  lit: number
  delay: number
  flashT: number
}

const onCount = (hp: number, n: number) => (hp <= 0 ? 0 : Math.ceil((hp / MAX) * n - 1e-6))
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
const wrap180 = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180

function makeView(): View {
  return {
    pose: { mode: 'spine', yawDeg: 0, charZ: 0 },
    n: 10,
    scheme: 'gradient',
    cells: Array.from({ length: MAX_CELLS }, () => ({ on: false, level: 0, flash: 0, color: MINT, hatch: false })),
    gain: 1.6,
    juice: true,
    hp: 70,
    arc: 0.8,
    arcEmpty: false,
    arcDeny: 0,
    o2: 100,
    o2Text: '100',
    o2Alpha: 0,
    o2Low: false,
    o2Blink: 1,
    rim: 0,
    hit: 0,
    dust: 1,
    vacuum: false,
  }
}

/**
 * 세계 안 체력 표시 — 체력·동력·산소를 정비사의 등판(또는 바이저·손목)에 붙인다.
 * 시뮬레이션과 카메라 계산은 HUD 가 소유하고 bus.view 로 3D Scene 에 넘긴다 (WebGL 이 없으면 같은 값으로 2D 대체 화면을 그린다).
 * 매 프레임 바뀌는 값은 ref 로 DOM 을 직접 갱신한다.
 */
export default function DiegeticVitals(p: SpecimenProps) {
  const mode = str(p.params, 'mountMode', 'spine') as Mount
  const yawParam = num(p.params, 'cameraYawDeg', 0)
  const n = clamp(Math.round(num(p.params, 'segmentCount', 10)), 3, MAX_CELLS)
  const scheme = str(p.params, 'hpColorScheme', 'gradient') as Scheme
  const condO2 = bool(p.params, 'conditionalO2', true)
  const gain = num(p.params, 'emissiveScale', 1.6)
  const fallback = bool(p.params, 'angleFallback', false)
  const hz = Math.min(3, Math.max(0, num(p.params, 'pulseHz', 1.5)))
  const juice = p.juice
  const W = p.width
  const H = p.height
  const reduced = useMemo(() => prefersReducedMotion(), [])
  const uid = useId().replace(/:/g, '')
  const hatchId = `dvh-${uid}`

  const cam = useMemo(() => new PerspectiveCamera(FOV, W / H, 0.05, 200), [W, H])
  const lay = useMemo(() => layout(n, mode === 'wrist' ? 'h' : 'v'), [n, mode])

  const st = useRef({
    t: 0,
    hp: 70,
    energy: 80,
    o2: 100,
    vacuum: false,
    charZ: 0,
    walkTo: 0,
    drag: 0,
    dragging: false,
    yaw: yawParam,
    orbit: -1,
    cells: Array.from({ length: MAX_CELLS }, (_, i): Cell => ({ on: i < 7, lit: i < 7 ? 1 : 0, delay: 0, flashT: 1 })),
    color: [...tierColor(0.7, scheme)] as RGB,
    arc: 0.8,
    recharge: 0,
    deny: 0,
    o2Alpha: condO2 ? 0 : 1,
    dust: 1,
    hidden: false,
    hold: 0,
    cue: 0,
    hit: 0,
    step: 0,
    dot: 1,
    ang: 0,
  })
  const view = useRef<View>(makeView())
  p.bus.view = view.current

  /* ───── DOM refs ───── */
  const rootRef = useRef<HTMLDivElement>(null)
  const proxSpine = useRef<HTMLDivElement>(null)
  const proxArc = useRef<HTMLDivElement>(null)
  const proxO2 = useRef<HTMLDivElement>(null)
  const p2d = useRef<PanelRefs>(emptyPanelRefs())
  const bodyRef = useRef<SVGGElement>(null)
  const backRef = useRef<SVGGElement>(null)
  const frontRef = useRef<SVGGElement>(null)
  const panelWrap = useRef<SVGGElement>(null)
  const vCells = useRef<(SVGPolygonElement | null)[]>([])
  const vHatch = useRef<(SVGPolygonElement | null)[]>([])
  const vHpNum = useRef<HTMLElement>(null)
  const vArc = useRef<SVGPathElement>(null)
  const vArcDash = useRef<SVGPathElement>(null)
  const vEnNum = useRef<HTMLElement>(null)
  const vO2 = useRef<HTMLDivElement>(null)
  const vO2Num = useRef<HTMLElement>(null)
  const vO2Glyph = useRef<SVGSVGElement>(null)
  const vFlash = useRef<HTMLDivElement>(null)
  const fHp = useRef<HTMLDivElement>(null)
  const fEn = useRef<HTMLDivElement>(null)
  const fHpNum = useRef<HTMLElement>(null)
  const fEnNum = useRef<HTMLElement>(null)
  const fO2Num = useRef<HTMLElement>(null)
  const cueRef = useRef<HTMLDivElement>(null)
  const cueCells = useRef<(SVGPolygonElement | null)[]>([])
  const cueEn = useRef<HTMLDivElement>(null)
  const cueO2 = useRef<HTMLElement>(null)
  const insetCam = useRef<SVGGElement>(null)
  const insetYaw = useRef<HTMLElement>(null)
  const insetDot = useRef<HTMLElement>(null)
  const insetState = useRef<HTMLElement>(null)

  /* ───── 상태 변경 ───── */
  const setCellsInstant = () => {
    const x = st.current
    const on = onCount(x.hp, n)
    x.cells.forEach((c, i) => {
      c.on = i < on
      c.lit = c.on ? 1 : 0
      c.delay = 0
      c.flashT = 1
    })
  }

  const applyHp = (next: number) => {
    const x = st.current
    const before = onCount(x.hp, n)
    x.hp = clamp(next, 0, MAX)
    const after = onCount(x.hp, n)
    if (!juice) return setCellsInstant()
    if (after < before) {
      // 꺼질 칸은 위에서부터 40ms 간격으로: 흰색 60ms → 220ms 동안 사그라듦
      for (let i = before - 1, k = 0; i >= after; i--, k++) Object.assign(x.cells[i], { on: false, delay: k * 0.04, flashT: 0, lit: Math.max(x.cells[i].lit, 1) })
    } else if (after > before) {
      // 회복은 아래 칸부터 차례로, 잃을 때보다 천천히 (전체 약 600ms)
      const added = after - before
      for (let i = before, k = 0; i < after; i++, k++) Object.assign(x.cells[i], { on: true, delay: (k * 0.45) / added, flashT: 1 })
    }
  }

  const hitFlash = () => {
    if (juice && requestFlash()) st.current.hit = 1
  }

  const handle = (id: string) => {
    const x = st.current
    if (id === 'hit') {
      applyHp(x.hp - 15)
      hitFlash()
    } else if (id === 'heavy') {
      applyHp(x.hp - 40)
      hitFlash()
    } else if (id === 'heal') applyHp(x.hp + 30)
    else if (id === 'ability') {
      if (x.energy >= 25) {
        x.energy -= 25
        x.recharge = 2
      } else x.deny = 1
    } else if (id === 'vacuum') x.walkTo = x.walkTo === 0 ? VAC_STOP : 0
    else if (id === 'orbit') {
      if (x.orbit < 0) x.orbit = 0
    }
  }
  useTrigger(p.trigger, handle)

  useAutoplay(
    p.autoplay,
    p.playing,
    p.timeScale,
    2.4,
    () => {
      const x = st.current
      if (x.orbit >= 0 || x.dragging) return
      const id = AUTO[x.step++ % AUTO.length]
      const dmg = id === 'hit' ? 15 : id === 'heavy' ? 40 : 0
      handle(dmg && x.hp - dmg < 5 ? 'heal' : id)
    },
    p.trigger?.seq,
  )

  // 칸 수가 바뀌면 즉시 다시 맞춘다.
  // useLayoutEffect 이고 아래 paint 의 useLayoutEffect 보다 먼저 선언돼 있어야 정지 상태에서도 새 값으로 그려진다
  useLayoutEffect(() => {
    setCellsInstant()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n])
  // 카메라 각도 값이나 부착 위치가 바뀌면 드래그로 돌린 양을 버리고 그 각도로 바로 간다
  useLayoutEffect(() => {
    st.current.drag = 0
    st.current.yaw = yawParam + (st.current.orbit >= 0 ? 360 * easeInOut(st.current.orbit) : 0)
  }, [yawParam, mode])

  /* ───── 시뮬레이션 ───── */
  const step = (dt: number) => {
    const x = st.current
    x.t += dt
    for (let i = 0; i < n; i++) {
      const c = x.cells[i]
      if (c.delay > 0) {
        c.delay -= dt
        continue
      }
      if (c.on) c.lit = Math.min(1, c.lit + dt / 0.15)
      else if (c.flashT < 0.06) c.flashT += dt
      else c.lit = Math.max(0, c.lit - dt / 0.22)
    }
    const target = tierColor(x.hp / MAX, scheme)
    for (let k = 0; k < 3; k++) x.color[k] = juice ? damp(x.color[k], target[k], 10, dt) : target[k]

    if (x.recharge > 0) x.recharge -= dt
    else x.energy = Math.min(MAX, x.energy + 9 * dt)
    x.arc = juice ? damp(x.arc, x.energy / MAX, 9, dt) : x.energy / MAX
    x.deny = Math.max(0, x.deny - dt * 3)

    const dz = x.walkTo - x.charZ
    x.charZ += Math.sign(dz) * Math.min(Math.abs(dz), 2.4 * dt)
    x.vacuum = x.charZ < LINE_Z
    x.o2 = x.vacuum ? Math.max(0, x.o2 - 2.4 * dt) : Math.min(MAX, x.o2 + 30 * dt)
    // 조건부: 진공에 있거나 다시 차오르는 동안만 보인다. 등장 300ms, 퇴장 200ms
    const want = !juice || !condO2 || x.vacuum || x.o2 < 99.5
    x.o2Alpha = want ? Math.min(1, x.o2Alpha + dt / 0.3) : Math.max(0, x.o2Alpha - dt / 0.2)
    if (!juice) x.o2Alpha = 1
    x.dust = damp(x.dust, x.vacuum ? 0 : 1, 3, dt)

    if (x.orbit >= 0) {
      x.orbit += dt / 5
      if (x.orbit >= 1) {
        x.orbit = -1
        x.yaw -= 360
      }
    }
    const yawTarget = yawParam + x.drag + (x.orbit >= 0 ? 360 * easeInOut(x.orbit) : 0)
    x.yaw = juice && !x.dragging ? damp(x.yaw, yawTarget, 6, dt) : yawTarget
    x.hit = Math.max(0, x.hit - dt / 0.12)

    derive()
    // 각도 보조 신호: 켜짐 80° / 꺼짐 65° 히스테리시스 + 최소 유지 1초
    x.hold = Math.max(0, x.hold - dt)
    if (mode === 'spine' && !x.hidden && x.ang > 80) {
      x.hidden = true
      x.hold = 1
    } else if (x.hidden && (mode !== 'spine' || (x.ang < 65 && x.hold <= 0))) x.hidden = false
    const cueOn = fallback && juice && mode === 'spine' && x.hidden
    x.cue = cueOn ? Math.min(1, x.cue + dt / 0.25) : Math.max(0, x.cue - dt / 0.25)
  }

  /** 시뮬레이션 상태 → 그리기 상태 (시간을 진행하지 않음: 정지 중에도 호출 가능) */
  const derive = () => {
    const x = st.current
    const v = view.current
    v.pose.mode = mode
    v.pose.yawDeg = x.yaw
    v.pose.charZ = x.charZ
    v.n = n
    v.scheme = scheme
    v.gain = gain
    v.juice = juice
    v.hp = x.hp
    const f = x.hp / MAX
    const danger = tierOf(f) === 'danger'
    const pulse = hz > 0 && !reduced ? 0.5 + 0.5 * Math.cos(Math.PI * 2 * hz * x.t) : 1
    // 넓은 영역(몸 둘레 림·바이저 비네트)의 반복 맥동은 2Hz 로 묶는다 — 칸 밝기만 pulseHz 를 그대로 따른다
    const wideHz = Math.min(hz, 2)
    const widePulse = wideHz > 0 && !reduced ? 0.5 + 0.5 * Math.cos(Math.PI * 2 * wideHz * x.t) : 1
    // 치명: 밝기 100% ↔ 35% (완전히 꺼지지 않게)
    const crit = danger && juice ? 0.35 + 0.65 * pulse : 1
    const on = onCount(x.hp, n)
    const frac = clamp(f * n - (on - 1), 0, 1)
    for (let i = 0; i < MAX_CELLS; i++) {
      const c = x.cells[i]
      const cv = v.cells[i]
      cv.on = c.on
      let level = c.on ? c.lit : c.lit * c.lit
      if (c.on && i === on - 1) level *= 0.45 + 0.55 * frac // 맨 위 칸은 남은 비율만큼 흐리게
      if (c.on) level *= crit
      cv.level = level
      cv.flash = !c.on && c.delay <= 0 && c.flashT < 0.06 && c.lit > 0 ? 1 : 0
      cv.color = x.color
      cv.hatch = scheme === 'pattern' && danger
    }
    v.arc = x.arc
    v.arcEmpty = x.energy < 1
    v.arcDeny = x.deny
    v.o2 = x.o2
    v.o2Text = String(Math.ceil(x.o2 - 1e-6))
    v.o2Alpha = x.o2Alpha
    v.o2Low = x.o2 < 20
    v.o2Blink = juice && hz > 0 && !reduced ? pulse : 1
    v.rim = danger && juice ? (reduced ? 0.6 : 0.45 + 0.55 * widePulse) : 0
    v.hit = x.hit
    v.dust = x.dust
    v.vacuum = x.vacuum

    poseCamera(cam, v.pose)
    // 등판 가시성: 등판 법선(+Z)과 등판→카메라 방향의 내적 (수평 성분만)
    const dx = cam.position.x
    const dzc = cam.position.z - (x.charZ + PANEL_Z)
    x.dot = dzc / (Math.hypot(dx, dzc) || 1)
    x.ang = Math.acos(clamp(x.dot, -1, 1)) / DEG
  }

  useGameLoop(p.playing, p.timeScale, dt => {
    step(dt)
    paint()
  })

  /* ───── 그리기 ───── */
  const M = useMemo(() => new Matrix4(), [])
  const V = useMemo(() => new Vector3(), [])
  const placeProxy = (b: Box, el: HTMLDivElement | null) => {
    if (!el) return
    let x0 = Infinity
    let y0 = Infinity
    let x1 = -Infinity
    let y1 = -Infinity
    for (const [bx, by] of [
      [b.x0, b.y0],
      [b.x1, b.y0],
      [b.x0, b.y1],
      [b.x1, b.y1],
    ]) {
      V.set(bx, by, 0).applyMatrix4(M).project(cam)
      const sx = ((V.x + 1) / 2) * W
      const sy = ((1 - V.y) / 2) * H
      x0 = Math.min(x0, sx)
      x1 = Math.max(x1, sx)
      y0 = Math.min(y0, sy)
      y1 = Math.max(y1, sy)
    }
    el.style.transform = `translate(${x0.toFixed(1)}px, ${y0.toFixed(1)}px)`
    el.style.width = `${Math.max(2, x1 - x0).toFixed(1)}px`
    el.style.height = `${Math.max(2, y1 - y0).toFixed(1)}px`
    el.removeAttribute('data-away')
  }
  /**
   * 등판이 카메라에서 돌아가 안 보이면, 대리 영역을 '등판이 있는 쪽' 몸 가장자리로 물려 크기 0 으로 접는다.
   * (보이지 않는 칸 위치를 그대로 투영하면 번호가 가슴·팔 위에 떠서 없는 것을 가리키게 된다)
   */
  const parkProxy = (yLocal: number, el: HTMLDivElement | null) => {
    if (!el) return
    const x = st.current
    const th = x.yaw * DEG
    // 카메라 오른쪽 벡터(수평) 중 등판(+Z) 쪽을 향하는 방향으로 몸 바깥 0.5m
    const rx = Math.cos(th)
    const rz = -Math.sin(th)
    const sg = rz >= 0 ? 1 : -1
    V.set(rx * sg * 0.5, PANEL_Y + yLocal, x.charZ + rz * sg * 0.5).project(cam)
    el.style.transform = `translate(${(((V.x + 1) / 2) * W).toFixed(1)}px, ${(((1 - V.y) / 2) * H).toFixed(1)}px)`
    el.style.width = '0px'
    el.style.height = '0px'
    el.setAttribute('data-away', '')
  }

  const bright = gain <= 0.01 ? 0.3 : Math.min(1, 0.5 + 0.5 * gain)
  const paintCells = (cores: (SVGPolygonElement | null)[], hatches: (SVGPolygonElement | null)[] | null) => {
    const v = view.current
    for (let i = 0; i < n; i++) {
      const el = cores[i]
      const cv = v.cells[i]
      if (!el) continue
      el.style.color = cv.flash ? '#ffffff' : css(cv.color, bright)
      el.style.opacity = cv.level.toFixed(3)
      const h = hatches?.[i]
      if (h) h.style.opacity = cv.hatch && cv.level > 0.05 ? '1' : '0'
    }
  }
  const energyColor = () => {
    const d = view.current.arcDeny
    return css([ENERGY[0] + (RED[0] - ENERGY[0]) * d, ENERGY[1] + (RED[1] - ENERGY[1]) * d, ENERGY[2] + (RED[2] - ENERGY[2]) * d], bright)
  }
  const o2Color = () => (view.current.o2Low ? css(RED) : css(MINT, bright))

  const paint = () => {
    derive()
    const x = st.current
    const v = view.current
    const root = rootRef.current
    if (root) {
      root.toggleAttribute('data-vac', x.vacuum)
      root.toggleAttribute('data-hidden', x.hidden)
    }

    // 3D: 해설 번호용 대리 영역을 실제 패널 위치에 맞춘다
    if (p.webgl && mode !== 'visor') {
      panelMatrix(v.pose, cam, M)
      if (mode === 'spine' && (x.dot < 0.2 || x.hidden)) {
        parkProxy((lay.spineBox.y0 + lay.spineBox.y1) / 2, proxSpine.current)
        parkProxy(lay.arc.cy - lay.arc.R, proxArc.current)
        parkProxy(lay.o2.y, proxO2.current)
      } else {
        placeProxy(lay.spineBox, proxSpine.current)
        placeProxy(lay.arcBox, proxArc.current)
        placeProxy(lay.o2Box, proxO2.current)
      }
    }
    // 정지 중(frameloop=demand)에는 3D 가 스스로 다시 그리지 않으므로 직접 한 프레임 요청한다
    if (!p.playing) (p.bus.invalidate as (() => void) | undefined)?.()

    // 2D 대체 화면
    if (!p.webgl) {
      const r = p2d.current
      paintCells(r.cores, r.hatches)
      if (r.arcFill) {
        r.arcFill.style.strokeDasharray = `${(v.arc * 100).toFixed(2)} 100`
        r.arcFill.style.color = energyColor()
      }
      if (r.arcDash) r.arcDash.style.opacity = v.arcEmpty ? '0.95' : '0.28'
      if (r.o2) {
        r.o2.style.opacity = v.o2Alpha.toFixed(3)
        r.o2.style.transform = `scale(${0.9 + 0.1 * v.o2Alpha})`
      }
      if (r.o2Num) {
        if (r.o2Num.textContent !== v.o2Text) r.o2Num.textContent = v.o2Text
        r.o2Num.style.color = v.o2Low ? css(RED) : '#e9f6ff'
      }
      if (r.o2Glyph) {
        r.o2Glyph.style.color = o2Color()
        r.o2Glyph.style.opacity = (v.o2Low ? 0.3 + 0.7 * v.o2Blink : 1).toFixed(3)
      }
      if (r.bad) r.bad.style.transform = mode === 'wrist' ? `scaleX(${v.hp / MAX})` : `scaleY(${v.hp / MAX})`
      if (r.badO2 && r.badO2.textContent !== v.o2Text) r.badO2.textContent = v.o2Text

      if (mode === 'spine' && bodyRef.current) {
        // 몸을 수직축으로 돌린 것처럼: 몸통 폭은 cos·sin 혼합, 등판 게이지는 cos 로 납작해진다
        const c = Math.cos(x.yaw * DEG)
        const sn = Math.sin(x.yaw * DEG)
        const body = Math.abs(c) + Math.abs(sn) * 0.62
        bodyRef.current.style.transform = `scaleX(${body.toFixed(3)})`
        const rim = v.rim
        bodyRef.current.style.filter = rim > 0.01 || v.hit > 0.01 ? `drop-shadow(0 0 ${(30 * rim + 20 * v.hit).toFixed(1)}px rgba(255,50,50,${Math.min(1, rim * 0.8 + v.hit).toFixed(2)}))` : ''
        backRef.current?.toggleAttribute('data-off', c < 0)
        frontRef.current?.toggleAttribute('data-off', c >= 0)
        if (panelWrap.current) panelWrap.current.style.transform = `translateX(${(-sn * 70).toFixed(1)}px) scaleX(${(Math.max(0, c) / body).toFixed(3)})`
      }
    }

    // 바이저
    if (mode === 'visor') {
      if (juice) {
        paintCells(vCells.current, vHatch.current)
        if (vArc.current) {
          vArc.current.style.strokeDasharray = `${(v.arc * 100).toFixed(2)} 100`
          vArc.current.style.color = energyColor()
        }
        if (vArcDash.current) vArcDash.current.style.opacity = v.arcEmpty ? '0.95' : '0.3'
        if (vO2.current) {
          vO2.current.style.opacity = v.o2Alpha.toFixed(3)
          vO2.current.style.transform = `scale(${0.9 + 0.1 * v.o2Alpha})`
          vO2.current.toggleAttribute('data-low', v.o2Low)
        }
        if (vO2Glyph.current) vO2Glyph.current.style.opacity = (v.o2Low ? 0.3 + 0.7 * v.o2Blink : 1).toFixed(3)
        if (vHpNum.current) {
          vHpNum.current.style.color = css(x.color, Math.max(bright, 0.7))
        }
      } else {
        if (fHp.current) fHp.current.style.width = `${x.hp}%`
        if (fEn.current) fEn.current.style.width = `${x.energy}%`
      }
      const hpT = String(Math.round(x.hp))
      const enT = String(Math.round(x.energy))
      for (const [el, t] of [
        [vHpNum.current, hpT],
        [fHpNum.current, hpT],
        [vEnNum.current, enT],
        [fEnNum.current, enT],
        [vO2Num.current, v.o2Text],
        [fO2Num.current, v.o2Text],
      ] as const)
        if (el && el.textContent !== t) el.textContent = t
      if (vFlash.current) vFlash.current.style.opacity = (v.hit * 0.8 + v.rim * 0.35).toFixed(3)
    }

    // 각도 보조 신호 (화면 가장자리 미니 게이지)
    if (cueRef.current) {
      // 꺼져 있을 때도 옅은 점선 자리는 남는다 (--cue 0 → 1 로 내용이 페이드 인)
      cueRef.current.style.setProperty('--cue', x.cue.toFixed(3))
      paintCells(cueCells.current, null)
      if (cueEn.current) {
        cueEn.current.style.width = `${x.energy}%`
      }
      if (cueO2.current) {
        if (cueO2.current.textContent !== v.o2Text) cueO2.current.textContent = v.o2Text
        cueO2.current.parentElement?.toggleAttribute('data-show', x.vacuum || x.o2 < 99.5 || !condO2)
        cueO2.current.style.color = o2Color()
      }
    }

    // 수업용 디버그 인셋
    const yawN = wrap180(x.yaw)
    if (insetCam.current) insetCam.current.style.transform = `rotate(${(-yawN).toFixed(1)}deg)`
    if (insetYaw.current) {
      const t = `${Math.round(yawN)}°`
      if (insetYaw.current.textContent !== t) insetYaw.current.textContent = t
    }
    if (insetDot.current) {
      const t = mode === 'spine' ? x.dot.toFixed(2) : '1.00'
      if (insetDot.current.textContent !== t) insetDot.current.textContent = t
    }
    if (insetState.current) {
      const state = mode !== 'spine' ? 'follow' : x.hidden ? 'hidden' : x.ang > 45 ? 'oblique' : 'visible'
      if (insetState.current.dataset.state !== state) {
        insetState.current.dataset.state = state
        insetState.current.textContent = { follow: '시선 따라옴', hidden: '가려짐', oblique: '비스듬', visible: '잘 보임' }[state]
      }
    }
  }

  useLayoutEffect(() => paint())

  /* ───── 드래그로 카메라 돌리기 ───── */
  const onPointerDown = (e: React.PointerEvent) => {
    st.current.dragging = true
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const x = st.current
    if (!x.dragging) return
    x.drag -= e.movementX * 0.3
    x.yaw -= e.movementX * 0.3
    paint()
  }
  const onPointerUp = () => {
    st.current.dragging = false
  }

  /* ───── 정적 도형 ───── */
  const vR = 17
  const vPitch = 42
  const vRow = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => {
        const u = n > 1 ? i / (n - 1) - 0.5 : 0
        return { x: 24 + i * vPitch, y: 30 + u * u * 40 }
      }),
    [n],
  )
  const hexStr = (cx: number, cy: number, r: number, rot: number) =>
    hexPoints(rot)
      .map(([a, b]) => `${(cx + a * r).toFixed(1)},${(cy - b * r).toFixed(1)}`)
      .join(' ')
  const cueR = 11
  const glow = gain <= 0.01 ? 0 : gain * 5

  return (
    <div
      ref={rootRef}
      className={s.root}
      data-juice={juice || undefined}
      data-mode={mode}
      data-webgl={p.webgl || undefined}
      data-thumb={p.thumbnail || undefined}
      style={{ '--glow': `${glow}px`, '--bright': bright } as React.CSSProperties}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <svg width="0" height="0" className={s.defs} aria-hidden>
        <defs>
          <HatchPattern id={hatchId} size={9} />
        </defs>
      </svg>

      {/* ── WebGL 없음 / 썸네일: 2D 대체 화면 ── */}
      {!p.webgl && (
        <svg className={s.fallback} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
          <Corridor />
          {mode === 'spine' && (
            <g ref={bodyRef} className={s.body} style={{ transformOrigin: '640px 600px' }}>
              <g ref={backRef} className={s.bodySide}>
                <SuitBack />
                <g ref={panelWrap} style={{ transformOrigin: '640px 560px' }}>
                  <Panel2D lay={lay} k={520} cx={640} cy={560} refs={p2d.current} hatchId={hatchId} parts />
                </g>
              </g>
              <g ref={frontRef} className={s.bodySide} data-off>
                <SuitFront />
              </g>
            </g>
          )}
          {mode === 'wrist' && (
            <g transform="translate(1400 830) rotate(-9)">
              <path d="M520,420 L-90,40" stroke="#6f7a87" strokeWidth={150} strokeLinecap="round" />
              <path d="M520,420 L-90,40" stroke="#8a95a2" strokeWidth={110} strokeLinecap="round" />
              <rect x={36 - 297} y={9 - 153} width={594} height={306} rx={26} fill="#121922" stroke="#2c3846" strokeWidth={4} />
              <Panel2D lay={lay} k={900} cx={0} cy={0} refs={p2d.current} hatchId={hatchId} parts />
            </g>
          )}
        </svg>
      )}

      {/* ── 3D: 해설 번호가 가리킬 대리 영역 (패널 투영 위치를 따라다님) ── */}
      {p.webgl && mode !== 'visor' && (
        <>
          <div ref={proxSpine} className={s.proxy} data-part="spine-gauge" />
          <div ref={proxArc} className={s.proxy} data-part="energy-arc" />
          <div ref={proxO2} className={s.proxy} data-part="o2-readout" />
        </>
      )}

      {/* ── 바이저(헬멧 투영) 모드 ── */}
      {mode === 'visor' && (
        <div className={s.visor}>
          <svg className={s.visorFrame} viewBox="0 0 1920 1080" aria-hidden>
            <path className={s.visorMask} fillRule="evenodd" d="M0,0H1920V1080H0Z M-80,540 A1040,640 0 1 0 2000,540 A1040,640 0 1 0 -80,540Z" />
            <ellipse cx={960} cy={540} rx={1000} ry={612} className={s.visorRim} />
            <path className={s.visorBracket} d="M300,150 L250,150 L210,196 M1620,150 L1670,150 L1710,196 M300,930 L250,930 L210,884 M1620,930 L1670,930 L1710,884" />
            <path className={s.visorTicks} d="M760,1010 v-16 M860,1018 v-20 M960,1020 v-26 M1060,1018 v-20 M1160,1010 v-16" />
            <path className={s.visorGlare} d="M1360,110 C1520,170 1640,260 1720,380 L1700,392 C1610,282 1500,200 1350,128 Z" />
          </svg>
          <div ref={vFlash} className={s.visorFlash} />
          {juice ? (
            <>
              <div className={s.vHp}>
                <div className={s.vLabel}>
                  <svg viewBox="0 0 24 24" className={s.vIcon} aria-hidden>
                    <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" />
                  </svg>
                  <span>체력</span>
                  <b ref={vHpNum} className={s.vNum}>
                    70
                  </b>
                </div>
                <svg className={s.vCells} width={n * vPitch + 8} height={70} data-part="spine-gauge">
                  {vRow.map((c, i) => (
                    <polygon key={`s${i}`} className={s.socket} points={hexStr(c.x, c.y, vR, Math.PI / 2)} />
                  ))}
                  {vRow.map((c, i) => (
                    <polygon
                      key={`c${i}`}
                      ref={el => {
                        vCells.current[i] = el
                      }}
                      className={s.cellCore}
                      points={hexStr(c.x, c.y, vR * 0.8, Math.PI / 2)}
                    />
                  ))}
                  {vRow.map((c, i) => (
                    <polygon
                      key={`h${i}`}
                      ref={el => {
                        vHatch.current[i] = el
                      }}
                      className={s.cellHatch}
                      points={hexStr(c.x, c.y, vR * 0.8, Math.PI / 2)}
                      fill={`url(#${hatchId})`}
                    />
                  ))}
                </svg>
              </div>
              <div className={s.vEn} data-part="energy-arc">
                <svg width={220} height={124} viewBox="-110 -112 220 124" aria-hidden>
                  <path d="M-88,0 A88,88 0 0 1 88,0" className={s.arcTrack} strokeWidth={22} />
                  <path ref={vArcDash} d="M-88,0 A88,88 0 0 1 88,0" className={s.arcDash} strokeWidth={8} pathLength={100} />
                  <path ref={vArc} d="M-88,0 A88,88 0 0 1 88,0" className={s.arcFill} strokeWidth={15} pathLength={100} />
                </svg>
                <div className={s.vEnText}>
                  <span>동력</span>
                  <b ref={vEnNum} className={s.vNum}>
                    80
                  </b>
                </div>
              </div>
              {/* 산소 자리: 숨어 있어도 옅은 테두리로 '나타날 곳'을 남긴다 */}
              <div className={s.vO2Slot} data-part="o2-readout">
                <div ref={vO2} className={s.vO2}>
                  <svg ref={vO2Glyph} viewBox="-1 -1 2 2" className={s.vO2Glyph} aria-hidden>
                    <O2Glyph size={1.9} />
                  </svg>
                  <div>
                    <span>산소</span>
                    <b>
                      <i ref={vO2Num}>100</i>%
                    </b>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className={s.flat}>
              <div className={s.flatRow} data-part="spine-gauge">
                <span>체력</span>
                <div className={s.flatBar}>
                  <div ref={fHp} />
                </div>
                <b ref={fHpNum}>70</b>
              </div>
              <div className={s.flatRow} data-part="energy-arc">
                <span>동력</span>
                <div className={s.flatBar}>
                  <div ref={fEn} />
                </div>
                <b ref={fEnNum}>80</b>
              </div>
              <div className={s.flatRow} data-part="o2-readout">
                <span>산소</span>
                <b ref={fO2Num}>100</b>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 각도 보조 신호: 등판이 가려졌을 때만 화면 가장자리에 ── */}
      <div ref={cueRef} className={s.cue} data-part="fallback-cue">
        <span className={s.cueGhost}>{mode !== 'spine' ? '시선 고정형 · 보조 신호 불필요' : fallback ? '보조 신호 대기 · 80° 넘으면 켜짐' : '각도 보조 신호 꺼짐'}</span>
        <div className={s.cueInner}>
          <svg viewBox="-12 -16 24 32" className={s.cueIcon} aria-hidden>
            <rect x={-8} y={-12} width={16} height={22} rx={3} />
            <path d="M0,-8 v14" />
          </svg>
          <svg width={n * 25 + 6} height={30} className={s.cueCells} aria-hidden>
            {Array.from({ length: n }, (_, i) => (
              <g key={i}>
                <polygon className={s.socket} points={hexStr(14 + i * 25, 15, cueR, Math.PI / 2)} />
                <polygon
                  ref={el => {
                    cueCells.current[i] = el
                  }}
                  className={s.cellCore}
                  points={hexStr(14 + i * 25, 15, cueR * 0.78, Math.PI / 2)}
                />
              </g>
            ))}
          </svg>
          <div className={s.cueEn}>
            <div ref={cueEn} />
          </div>
          <span className={s.cueO2}>
            <svg viewBox="-1 -1 2 2" aria-hidden>
              <O2Glyph size={1.8} />
            </svg>
            <b ref={cueO2}>100</b>
          </span>
        </div>
      </div>

      {/* ── 수업용 디버그: 카메라 각도와 등판 가시성(내적) ── */}
      <div className={s.inset} data-part="visibility-inset">
        <div className={s.insetHead}>수업용 · 등판 가시성</div>
        <div className={s.insetBody}>
          <svg viewBox="-80 -80 160 160" className={s.insetSvg} aria-hidden>
            <path className={s.zoneOk} d={sector(65)} />
            <path className={s.zoneWarn} d={ring(65, 80)} />
            <circle r={70} className={s.insetOrbit} />
            <g ref={insetCam}>
              <line x1={0} y1={0} x2={0} y2={66} className={s.insetRay} />
              <path d="M0,66 l-11,10 h22 z" className={s.insetCamIcon} transform="rotate(180 0 70)" />
            </g>
            <circle r={13} className={s.insetChar} />
            <path d="M0,4 v22 m-6,-7 l6,7 l6,-7" className={s.insetNormal} />
            <path d="M-6,-10 l6,-8 l6,8" className={s.insetFace} />
          </svg>
          <dl className={s.insetText}>
            <dt>카메라</dt>
            <dd>
              <b ref={insetYaw}>0°</b>
            </dd>
            <dt>내적</dt>
            <dd>
              <b ref={insetDot}>1.00</b>
            </dd>
            <dd>
              <b ref={insetState} className={s.insetState} data-state="visible">
                잘 보임
              </b>
            </dd>
          </dl>
        </div>
      </div>

      {!p.thumbnail && <div className={s.hint}>드래그: {mode === 'spine' ? '카메라 궤도 돌리기' : '고개 돌리기'}</div>}
    </div>
  )
}

/* 디버그 인셋의 부채꼴: 등판 법선(아래쪽, +Z) 기준 ±a° */
function sector(a: number, R = 70) {
  const t = a * DEG
  return `M0,0 L${(-Math.sin(t) * R).toFixed(1)},${(Math.cos(t) * R).toFixed(1)} A${R},${R} 0 0 0 ${(Math.sin(t) * R).toFixed(1)},${(Math.cos(t) * R).toFixed(1)} Z`
}
function ring(a0: number, a1: number, R = 70) {
  const p = (a: number) => [(Math.sin(a * DEG) * R).toFixed(1), (Math.cos(a * DEG) * R).toFixed(1)]
  const [x0, y0] = p(a0)
  const [x1, y1] = p(a1)
  return `M0,0 L${x0},${y0} A${R},${R} 0 0 1 ${x1},${y1} Z M0,0 L${-x0},${y0} A${R},${R} 0 0 0 ${-x1},${y1} Z`
}

/* ───── 2D 대체 화면 그림 ───── */
function Corridor() {
  const out = [
    [0, 0],
    [1920, 0],
    [1920, 1080],
    [0, 1080],
  ]
  const inn = [
    [1060, 330],
    [1400, 330],
    [1400, 610],
    [1060, 610],
  ]
  const at = (t: number) => out.map((o, i) => [o[0] + (inn[i][0] - o[0]) * t, o[1] + (inn[i][1] - o[1]) * t])
  const frames = [0.22, 0.42, 0.6, 0.76, 0.88]
  return (
    <g>
      <rect width={1920} height={1080} className={s.fbWall} />
      <polygon points="0,1080 1920,1080 1400,610 1060,610" className={s.fbFloor} />
      <polygon points="0,0 1920,0 1400,330 1060,330" className={s.fbCeil} />
      {frames.map(t => {
        const q = at(t)
        return <polygon key={t} points={q.map(v => v.join(',')).join(' ')} className={s.fbRib} style={{ strokeWidth: 26 * (1 - t) + 3 }} />
      })}
      {frames.map(t => {
        const q = at(t)
        const cx = (q[0][0] + q[1][0]) / 2
        const w = (q[1][0] - q[0][0]) * 0.14
        return <rect key={`l${t}`} x={cx - w / 2} y={q[0][1] + 8 * (1 - t) + 4} width={w} height={8 * (1 - t) + 3} className={s.fbLamp} data-vac-lamp={t > 0.6 || undefined} />
      })}
      {/* 진공 구역 경계 줄무늬 */}
      <polygon points={(() => {
        const a = at(0.6)
        const b = at(0.64)
        return [a[3], a[2], b[2], b[3]].map(v => v.join(',')).join(' ')
      })()} className={s.fbHazard} />
      {/* 먼 끝: 가압 = 닫힌 격벽, 진공 = 열린 문 너머 별 */}
      <rect x={1060} y={330} width={340} height={280} className={s.fbFar} />
      <g className={s.fbStars}>
        {Array.from({ length: 40 }, (_, i) => (
          <circle key={i} cx={1066 + ((i * 97) % 330)} cy={336 + ((i * 53) % 268)} r={i % 5 === 0 ? 2.4 : 1.4} />
        ))}
        <path d="M1060,560 Q1230,478 1400,540 L1400,610 L1060,610 Z" className={s.fbPlanet} />
      </g>
      <g className={s.fbDust}>
        {Array.from({ length: 36 }, (_, i) => (
          <circle key={i} cx={140 + ((i * 433) % 1700)} cy={160 + ((i * 271) % 760)} r={i % 3 === 0 ? 3 : 2} />
        ))}
      </g>
    </g>
  )
}

function SuitBack() {
  return (
    <g>
      <rect x={548} y={790} width={72} height={320} rx={34} className={s.suit} />
      <rect x={660} y={790} width={72} height={320} rx={34} className={s.suit} />
      <rect x={520} y={740} width={240} height={86} rx={20} className={s.suitDark} />
      <rect x={414} y={370} width={64} height={400} rx={32} className={s.suit} transform="rotate(4 446 370)" />
      <rect x={802} y={370} width={64} height={400} rx={32} className={s.suit} transform="rotate(-4 834 370)" />
      <path d="M470,430 Q470,330 560,322 L720,322 Q810,330 810,430 L792,770 Q640,806 488,770 Z" className={s.suit} />
      <circle cx={470} cy={392} r={62} className={s.suit} />
      <circle cx={810} cy={392} r={62} className={s.suit} />
      <ellipse cx={640} cy={335} rx={84} ry={24} className={s.suitDark} />
      <circle cx={640} cy={240} r={100} className={s.suit} />
      <rect x={484} y={410} width={30} height={300} rx={14} className={s.suitDark} />
      <rect x={766} y={410} width={30} height={300} rx={14} className={s.suitDark} />
      <rect x={512} y={372} width={256} height={376} rx={22} className={s.pack} />
      <rect x={552} y={346} width={176} height={34} rx={8} className={s.suitDark} />
    </g>
  )
}

function SuitFront() {
  return (
    <g>
      <rect x={548} y={790} width={72} height={320} rx={34} className={s.suit} />
      <rect x={660} y={790} width={72} height={320} rx={34} className={s.suit} />
      <rect x={520} y={740} width={240} height={86} rx={20} className={s.suitDark} />
      <rect x={414} y={370} width={64} height={400} rx={32} className={s.suit} />
      <rect x={802} y={370} width={64} height={400} rx={32} className={s.suit} />
      <path d="M470,430 Q470,330 560,322 L720,322 Q810,330 810,430 L792,770 Q640,806 488,770 Z" className={s.suit} />
      <circle cx={470} cy={392} r={62} className={s.suit} />
      <circle cx={810} cy={392} r={62} className={s.suit} />
      <rect x={560} y={430} width={160} height={190} rx={18} className={s.suitDark} />
      <circle cx={640} cy={240} r={100} className={s.suit} />
      <ellipse cx={640} cy={250} rx={74} ry={56} className={s.visorGlass} />
      <path d="M592,222 Q620,204 660,206" className={s.visorShine} />
    </g>
  )
}
