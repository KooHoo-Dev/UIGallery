import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { easeOutBack, easeOutCubic } from '../../core/countup'
import { prefersReducedMotion, requestFlash } from '../../core/flash'
import { clamp, damp, useGameLoop, useTrigger } from '../../core/hooks'
import { bool, num, str } from '../../core/params'
import { Silhouette } from '../../core/silhouettes'
import type { SpecimenProps } from '../../core/types'
import { BACK, Corridor, Weapon } from './Corridor'
import s from './style.module.css'

export { meta } from './meta'

/* ──────────────────────────────────────────────────────────────
 * 조준점 + 적중 표시.
 * - 퍼짐(spread)은 ref 값 하나. 탄착 계산과 조준점 팔 간격(CSS 변수 --sp)이 같은 값을 쓴다.
 * - 매 프레임 바뀌는 것(조준 위치 · 퍼짐 · 적중 표시 · 드론)은 ref + DOM 직접 갱신.
 *   React state 는 사건 단위(처치 수 · 처치 알림 · 이동 상태)에만 쓴다. 퍼짐 수치 표시도 10Hz 로 textContent 직접 갱신.
 * - prefers-reduced-motion 이면 시점 흔들림 · 드론 흔들림 · 가장자리 번쩍임을 끈다 (적중 X · 처치 원은 정보라 유지).
 * ────────────────────────────────────────────────────────────── */

const W = 1920
const H = 1080
const MAX_HP = 4
const MAG = 30
const GOAL = 12
const CRIT_COLOR = '#ffd23f'
const DRONE_COLOR = '#a9443c'
/** 총구(무기 로컬 원점)의 화면 위치와 무기 기울기 */
const MUZZLE = { x: 1192, y: 812, deg: 28.8 }
/** 적이 없는 빈 벽 (적 조준 끄기용) */
const EMPTY_AIM = { x: 470, y: 420 }
/** 밝은 격납문 앞 빈 곳 (외곽선 확인용) */
const BRIGHT_AIM = { x: 1080, y: 380 }

type Mode = 'cross' | 'circle' | 'laser'
type HmKind = 'hit' | 'crit' | 'critFlat' | 'plain'
type Plan = 'taps' | 'weak' | 'burst' | 'wander'
const PLANS: Plan[] = ['taps', 'weak', 'burst', 'wander']

interface Drone {
  x: number
  y: number
  h: number
  /** 좌우 흔들림 위상 · 진폭 */
  phase: number
  sway: number
  hp: number
  /** 쓰러진 뒤 지난 시간(초). 살아 있으면 -1 */
  dead: number
  /** 다시 나타난 뒤 지난 시간 (페이드 인) */
  spawn: number
  flinch: number
  /** 이번 프레임의 화면 위치(발) */
  sx: number
  sy: number
}

const makeDrones = (): Drone[] => [
  // 그리는 순서: 먼 것 → 가까운 것
  { x: 1005, y: 548, h: 118, phase: 2.1, sway: 22, hp: MAX_HP, dead: -1, spawn: 9, flinch: 0, sx: 1005, sy: 548 },
  { x: 1385, y: 650, h: 210, phase: 0.6, sway: 26, hp: MAX_HP, dead: -1, spawn: 9, flinch: 0, sx: 1385, sy: 650 },
  { x: 760, y: 860, h: 330, phase: 4.0, sway: 30, hp: 3, dead: -1, spawn: 9, flinch: 0, sx: 760, sy: 860 },
]
const FLOOR_GAP = [50, 85, 70]

const weakOf = (d: Drone) => ({ x: d.sx, y: d.sy - d.h * 0.62, r: d.h * 0.105 })
const bodyOf = (d: Drone) => ({ x: d.sx, y: d.sy - d.h * 0.28 })

interface World {
  t: number
  aimX: number
  aimY: number
  moveBlend: number
  /** 동작 감소 설정이면 이동 시점 흔들림(bob)을 끈다 */
  reduced: boolean
  offX: number
  offY: number
  drones: Drone[]
}
/** 시점 흔들림(이동 · 조준 시차)과 드론의 화면 위치를 계산한다. 드론 sx/sy 는 화면 좌표 */
function placeWorld(x: World) {
  const mb = x.reduced ? 0 : x.moveBlend
  x.offX = -(x.aimX - W / 2) * 0.025 + Math.cos(x.t * Math.PI * 1.6) * 5 * mb
  x.offY = -(x.aimY - H / 2) * 0.025 + Math.sin(x.t * Math.PI * 2 * 1.6) * 7 * mb
  x.drones.forEach(d => {
    d.sx = d.x + Math.sin(x.t * 0.55 + d.phase) * d.sway + x.offX
    d.sy = d.y + Math.sin(x.t * 1.3 + d.phase) * 5 + x.offY
  })
}

/** 점이 드론의 약점 · 몸통에 닿는가 */
function hitTest(drones: Drone[], px: number, py: number): { i: number; crit: boolean } | null {
  for (let i = drones.length - 1; i >= 0; i--) {
    const d = drones[i]
    if (d.dead >= 0) continue
    const wk = weakOf(d)
    if (Math.hypot(px - wk.x, py - wk.y) <= wk.r * 1.15) return { i, crit: true }
    const ly = py - d.sy
    if (ly < -d.h || ly > 0) continue
    const half = d.h * 0.315 * ((ly + d.h) / d.h)
    if (Math.abs(px - d.sx) <= half) return { i, crit: false }
  }
  return null
}


const IMPACTS = 16

/** 고정된 ref 콜백 배열 — 렌더마다 새 콜백이 생겨 null → el 로 다시 연결되는 일을 막는다 */
function useRefList<T>(n: number) {
  const list = useRef<(T | null)[]>([])
  const setters = useMemo(() => Array.from({ length: n }, (_, i) => (el: T | null) => void (list.current[i] = el)), [n])
  return [list, setters] as const
}

interface FeedItem {
  key: number
  crit: boolean
  until: number
}

export default function ReticleHitmarker(p: SpecimenProps) {
  const mode = str(p.params, 'reticleMode', 'cross') as Mode
  const baseSpread = num(p.params, 'baseSpread', 16)
  const moveScale = num(p.params, 'moveSpreadScale', 1.6)
  const shotBloom = num(p.params, 'shotBloom', 8)
  const recoveryMs = num(p.params, 'recoveryMs', 260)
  const hostileColor = str(p.params, 'hostileColor', '#ff5a4f')
  const holdMs = num(p.params, 'hitmarkerHoldMs', 120)
  const critShape = bool(p.params, 'critShapeDistinct', true)
  const outline = bool(p.params, 'reticleOutline', true)
  const juice = p.juice
  const reduced = useMemo(() => prefersReducedMotion(), [])
  const maxSpread = baseSpread * 4

  const st = useRef({
    t: 0,
    drones: makeDrones(),
    aimX: 1400,
    aimY: 600,
    offX: 0,
    offY: 0,
    /** 가상 커서 목표 (자동 데모 · 이벤트) */
    goalX: 1400,
    goalY: 600,
    glide: false,
    /** 사람이 마지막으로 마우스를 움직인 뒤 지난 시간 */
    human: 99,
    /** 이벤트 직후 자동 데모를 잠시 멈춤 */
    autoPause: 0,
    triggerHeld: false,
    fireCd: 0,
    spread: baseSpread * 2.2,
    shown: baseSpread * 2.2,
    moving: false,
    /** 지금의 이동이 자동 데모가 켠 것인가 (사람이 켠 이동은 자동 데모가 끄지 않는다) */
    autoMove: false,
    moveBlend: 0,
    reduced,
    hostile: false,
    hm: { age: 9, kind: 'hit' as HmKind, kill: false },
    ring: { age: 9, crit: false },
    flash: 0,
    burstLeft: 0,
    burstT: 0,
    ammo: 24,
    reserve: 120,
    reload: 0,
    recoil: 0,
    impacts: Array.from({ length: IMPACTS }, () => ({ x: 0, y: 0, age: 9, hit: false })),
    impactNext: 0,
    readoutT: 0,
    lastAmmo: '',
    feedSeq: 0,
    plan: { idx: -1, kind: 'wander' as Plan, target: 0, timer: 0, shots: 0, done: false, next: 0 },
  })

  // 썸네일 · 첫 화면: 약점 적중 표시가 막 뜬 순간을 보여 준다
  const firstInit = useRef(false)
  if (!firstInit.current) {
    firstInit.current = true
    const x = st.current
    // 첫 화면은 가운데 드론을 겨눈 상태 (조준 시차 때문에 두 번 맞춘다)
    for (let k = 0; k < 2; k++) {
      placeWorld(x)
      const pt = p.thumbnail ? weakOf(x.drones[1]) : bodyOf(x.drones[1])
      x.aimX = x.goalX = pt.x
      x.aimY = x.goalY = pt.y
    }
    if (p.thumbnail) {
      x.hm = { age: 0.09, kind: 'crit', kill: false }
      x.spread = x.shown = baseSpread + shotBloom
    }
  }

  const [moving, setMoving] = useState(false)
  const [kills, setKills] = useState(0)
  const [feed, setFeed] = useState<FeedItem[]>([])

  const rootRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<SVGGElement>(null)
  const weaponRef = useRef<SVGGElement>(null)
  const flashMuzzleRef = useRef<SVGPolygonElement>(null)
  const beamRef = useRef<SVGPolygonElement>(null)
  const beamGlowRef = useRef<SVGLineElement>(null)
  const laserDotRef = useRef<SVGGElement>(null)
  const aimRef = useRef<HTMLDivElement>(null)
  const reticleRef = useRef<HTMLDivElement>(null)
  const hmLinesRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)
  const meterRef = useRef<HTMLDivElement>(null)
  const ammoRef = useRef<HTMLSpanElement>(null)
  const reserveRef = useRef<HTMLSpanElement>(null)
  const ammoBoxRef = useRef<HTMLDivElement>(null)
  const readoutRef = useRef<HTMLSpanElement>(null)
  const nDrones = st.current.drones.length
  const [droneRefs, setDroneRef] = useRefList<SVGGElement>(nDrones)
  const [bodyRefs, setBodyRef] = useRefList<SVGGElement>(nDrones)
  const [flinchRefs, setFlinchRef] = useRefList<SVGPathElement>(nDrones)
  const [pipRefs, setPipRef] = useRefList<SVGRectElement>(nDrones * MAX_HP)
  const [impactRefs, setImpactRef] = useRefList<SVGGElement>(IMPACTS)

  /* ───────── 사격 · 적중 ───────── */

  const registerHit = (i: number, crit: boolean, forceKill = false) => {
    const x = st.current
    const d = x.drones[i]
    if (forceKill) d.hp = crit ? 2 : 1
    d.hp -= crit ? 2 : 1
    const kill = d.hp <= 0
    if (kill) {
      d.hp = 0
      d.dead = 0
      const key = ++x.feedSeq
      setKills(k => (k >= GOAL ? 1 : k + 1))
      setFeed(f => [{ key, crit, until: x.t + 4 }, ...f].slice(0, 4))
    }
    if (juice) {
      d.flinch = 1
      x.hm = { age: 0, kind: crit ? (critShape ? 'crit' : 'critFlat') : 'hit', kill }
      if (kill) {
        x.ring = { age: 0, crit }
        // 화면 가장자리 번쩍임은 넓은 영역 → 제한기를 거친다 (초당 3회 이하). 동작 감소 설정이면 생략
        if (!reduced && requestFlash()) x.flash = 1
      }
    } else {
      // 나쁜 예: 무엇이든 같은 가는 X, 튐·사라짐 없이 켜졌다 꺼짐
      x.hm = { age: 0, kind: 'plain', kill: false }
    }
  }

  /** 한 발 쏜다. forced 면 그 지점에 정확히 맞힌다 (이벤트 버튼용) */
  const fire = (forced?: { i: number; crit: boolean; kill?: boolean }) => {
    const x = st.current
    if (x.reload > 0) return
    if (x.ammo <= 0) {
      x.reload = 1.1
      return
    }
    x.ammo--
    let ix = x.aimX
    let iy = x.aimY
    if (!forced) {
      // 탄은 '지금의 퍼짐' 원 안에 떨어진다 — 조준점 팔 간격과 같은 값
      const r = x.spread * Math.sqrt(Math.random())
      const a = Math.random() * Math.PI * 2
      ix += Math.cos(a) * r
      iy += Math.sin(a) * r
    }
    x.spread = Math.min(maxSpread, x.spread + shotBloom)
    x.recoil = 1
    const res = forced ? { i: forced.i, crit: forced.crit } : hitTest(x.drones, ix, iy)
    // 탄착은 세계 좌표로 기억 (시점이 흔들려도 벽에 붙어 있게)
    const imp = x.impacts[x.impactNext++ % IMPACTS]
    imp.x = ix - x.offX
    imp.y = iy - x.offY
    imp.age = 0
    imp.hit = !!res
    if (res) registerHit(res.i, res.crit, forced?.kill)
    if (x.ammo <= 0) x.reload = 1.1
  }

  /** 이벤트용 표적: 지금 겨누는 드론 → 없으면 가장 가까운 살아 있는 드론 */
  const pickDrone = () => {
    const x = st.current
    const aimed = hitTest(x.drones, x.aimX, x.aimY)
    if (aimed) return aimed.i
    let best = -1
    let bestD = Infinity
    x.drones.forEach((d, i) => {
      if (d.dead >= 0) return
      const dist = Math.hypot(d.sx - x.aimX, d.sy - d.h * 0.4 - x.aimY)
      if (dist < bestD) {
        bestD = dist
        best = i
      }
    })
    if (best < 0) {
      best = 2
      reviveDrone(x.drones[2])
    }
    return best
  }
  const reviveDrone = (d: Drone) => {
    d.dead = -1
    d.hp = MAX_HP
    d.spawn = 0
  }
  const snapAim = (px: number, py: number) => {
    const x = st.current
    x.aimX = x.goalX = px
    x.aimY = x.goalY = py
    x.glide = false
  }

  /** auto = 자동 데모가 켠 이동. 자동 데모는 자기가 켠 이동만 끈다 */
  const setMove = (v: boolean, auto = false) => {
    const x = st.current
    x.moving = v
    x.autoMove = v && auto
    setMoving(v)
  }
  const stopAutoMove = () => {
    if (st.current.autoMove) setMove(false)
  }

  const handle = (id: string) => {
    const x = st.current
    x.autoPause = 2.5
    x.plan.idx = -1
    if ((x.reload > 0 || x.ammo <= 0) && (id === 'hit' || id === 'crit' || id === 'kill')) {
      x.reload = 0
      x.ammo = MAG
    }
    if (id === 'move') setMove(!x.moving)
    else if (id === 'aim') {
      const on = !!hitTest(x.drones, x.aimX, x.aimY)
      const i = pickDrone()
      const goal = on ? EMPTY_AIM : bodyOf(x.drones[i])
      x.goalX = goal.x
      x.goalY = goal.y
      x.glide = true
    } else if (id === 'burst') {
      x.burstLeft = 6
      x.burstT = 0
    } else if (id === 'hit' || id === 'crit' || id === 'kill') {
      const i = pickDrone()
      const d = x.drones[i]
      const crit = id === 'crit'
      if (!crit && id === 'hit' && d.hp <= 1) d.hp = MAX_HP
      if (crit && d.hp <= 2) d.hp = MAX_HP
      const pt = crit ? weakOf(d) : bodyOf(d)
      snapAim(pt.x, pt.y)
      fire({ i, crit, kill: id === 'kill' })
    }
  }
  useTrigger(p.trigger, handle)

  /* ───────── 자동 데모 (가상 커서) ───────── */

  const autoTick = (dt: number) => {
    const x = st.current
    const pl = x.plan
    const alive = x.drones.map((d, i) => (d.dead < 0 ? i : -1)).filter(i => i >= 0)
    if (pl.idx < 0 || pl.done) {
      pl.timer += dt
      if (pl.idx >= 0 && pl.timer < 0.8) return
      // 다음 계획
      pl.next = (pl.next + 1) % PLANS.length
      pl.idx = pl.next
      pl.kind = PLANS[pl.next]
      pl.timer = 0
      pl.shots = 0
      pl.done = false
      if (alive.length === 0) {
        pl.kind = 'wander'
      } else {
        // 돌아가며 다른 드론을 고른다 (가까운 드론 → 중간 → 먼 드론)
        const order = [2, 1, 0]
        const start = (order.indexOf(pl.target) + 1) % 3
        for (let k = 0; k < 3; k++) {
          const cand = order[(start + k) % 3]
          if (alive.includes(cand)) {
            pl.target = cand
            break
          }
        }
      }
      if (pl.kind === 'burst' && !x.moving) setMove(true, true)
      return
    }
    pl.timer += dt
    const d = x.drones[pl.target]
    if (pl.kind === 'wander') {
      const pt = pl.timer < 1.4 ? BRIGHT_AIM : EMPTY_AIM
      x.goalX = pt.x
      x.goalY = pt.y
      if (pl.timer > 2.6) {
        pl.done = true
        pl.timer = 0
      }
      return
    }
    if (d.dead >= 0) {
      // 처치 완료 → (자동 데모가 켠) 이동 끄고 쉬기
      stopAutoMove()
      pl.done = true
      pl.timer = 0
      return
    }
    const pt = pl.kind === 'weak' ? weakOf(d) : bodyOf(d)
    x.goalX = pt.x
    x.goalY = pt.y
    const near = Math.hypot(x.aimX - pt.x, x.aimY - pt.y) < 10
    if (!near || pl.timer < 0.5) return
    if (pl.kind === 'burst') {
      if (pl.shots === 0) {
        x.burstLeft = 6
        x.burstT = 0
        pl.shots = 6
        pl.timer = 0.5
      } else if (pl.timer > 1.8) {
        stopAutoMove()
        pl.kind = 'taps'
        pl.shots = 0
      }
      return
    }
    const interval = pl.kind === 'weak' ? 0.42 : 0.34
    if (pl.timer >= 0.5 + interval * (pl.shots + 1)) {
      fire()
      pl.shots++
      if (pl.shots >= 8) {
        pl.done = true
        pl.timer = 0
      }
    }
  }

  /* ───────── 매 프레임 ───────── */

  useGameLoop(p.playing, p.timeScale, dt => {
    const x = st.current
    x.t += dt
    x.human += dt
    x.autoPause = Math.max(0, x.autoPause - dt)

    // 드론 흔들림 · 쓰러짐 · 재등장
    x.drones.forEach(d => {
      d.flinch = Math.max(0, d.flinch - dt * 5)
      d.spawn += dt
      if (d.dead >= 0) {
        d.dead += dt
        if (d.dead > 2.6) reviveDrone(d)
      }
    })

    // 자동 데모: 사람이 3초 동안 마우스를 안 움직였고, 이벤트 직후가 아닐 때
    const autopilot = p.autoplay && !p.thumbnail && x.human > 3 && x.autoPause <= 0
    if (autopilot) {
      autoTick(dt)
      x.glide = true
    }
    if (x.glide) {
      x.aimX = damp(x.aimX, x.goalX, autopilot ? 6 : 12, dt)
      x.aimY = damp(x.aimY, x.goalY, autopilot ? 6 : 12, dt)
    }

    // 사격 입력 (누르고 있으면 연사) · 연사 이벤트
    x.fireCd -= dt
    if (x.triggerHeld && x.fireCd <= 0) {
      fire()
      x.fireCd = 0.11
    }
    if (x.burstLeft > 0) {
      x.burstT -= dt
      if (x.burstT <= 0) {
        fire()
        x.burstLeft--
        x.burstT = 0.09
      }
    }
    if (x.reload > 0) {
      x.reload -= dt
      if (x.reload <= 0) {
        x.reload = 0
        const need = MAG - x.ammo
        x.reserve -= need
        if (x.reserve < 0) x.reserve = 150
        x.ammo = MAG
      }
    }

    // 퍼짐: 이동 전환(150ms) → 목표 퍼짐, 사격 블룸은 회복 시간 동안 지수 감쇠
    x.moveBlend = damp(x.moveBlend, x.moving ? 1 : 0, 20, dt)
    const target = baseSpread * (1 + (moveScale - 1) * x.moveBlend)
    x.spread = damp(x.spread, target, 3 / Math.max(0.05, recoveryMs / 1000), dt)
    x.spread = clamp(x.spread, Math.min(target, baseSpread), maxSpread)
    // 화면 표시는 같은 값을 50ms 안에 따라간다 (블룸이 '튀어 나가는' 모양)
    x.shown = damp(x.shown, x.spread, 60, dt)

    x.recoil = Math.max(0, x.recoil - dt * 9)
    x.flash = Math.max(0, x.flash - dt * 4)
    x.hm.age += dt
    x.ring.age += dt
    x.impacts.forEach(m => (m.age += dt))

    // 화면 표시용 수치는 낮은 빈도로만 state 에
    x.readoutT -= dt
    if (x.readoutT <= 0) {
      x.readoutT = 0.1
      writeReadout()
      if (feed.some(f => f.until < x.t)) setFeed(f => f.filter(i => i.until >= x.t))
    }
    paint()
  })

  /* ───────── 그리기 (DOM 직접) ───────── */

  const paint = () => {
    const x = st.current
    placeWorld(x)
    const mb = reduced ? 0 : x.moveBlend
    const bob = Math.sin(x.t * Math.PI * 2 * 1.6) * 7 * mb
    const { offX, offY } = x

    worldRef.current?.setAttribute('transform', `translate(${offX.toFixed(1)} ${offY.toFixed(1)}) translate(960 540) scale(1.06) translate(-960 -540)`)

    // 드론
    x.drones.forEach((d, i) => {
      const g = droneRefs.current[i]
      if (g) g.setAttribute('transform', `translate(${d.sx.toFixed(1)} ${d.sy.toFixed(1)})`)
      const body = bodyRefs.current[i]
      if (body) {
        let rot = 0
        let alpha = clamp(d.spawn / 0.35, 0, 1)
        let shake = 0
        if (d.dead >= 0) {
          rot = -78 * easeOutCubic(clamp(d.dead / 0.4, 0, 1))
          alpha = 1 - clamp((d.dead - 1.5) / 0.7, 0, 1)
        } else if (juice && !reduced) shake = Math.sin(x.t * 80) * 9 * d.flinch * d.flinch
        body.setAttribute('transform', `translate(${shake.toFixed(1)} 0) rotate(${rot.toFixed(1)} ${(d.h * 0.25).toFixed(0)} 0)`)
        body.style.opacity = String(alpha)
        body.toggleAttribute('data-dead', d.dead >= 0)
      }
      const fl = flinchRefs.current[i]
      if (fl) fl.style.opacity = String(juice ? d.flinch * 0.55 : 0)
      for (let k = 0; k < MAX_HP; k++) {
        const pip = pipRefs.current[i * MAX_HP + k]
        if (pip) pip.toggleAttribute('data-off', k >= d.hp)
      }
    })

    // 실제 탄착 불꽃 (표시 퍼짐과 비교)
    x.impacts.forEach((m, i) => {
      const g = impactRefs.current[i]
      if (!g) return
      const life = m.hit ? 0.5 : 0.7
      if (m.age > life) {
        g.style.opacity = '0'
        return
      }
      const k = m.age / life
      g.setAttribute('transform', `translate(${(m.x + offX).toFixed(1)} ${(m.y + offY).toFixed(1)}) scale(${(0.7 + k * 0.6).toFixed(2)})`)
      g.style.opacity = String(1 - k * k)
      g.toggleAttribute('data-hit', m.hit)
    })

    // 무기 · 반동
    const kick = juice ? easeOutCubic(x.recoil) : 0
    const wx = 26 * kick + Math.cos(x.t * Math.PI * 1.6) * 8 * mb - (x.aimX - W / 2) * 0.04
    const wy = 18 * kick + Math.abs(bob) * 1.4 - (x.aimY - H / 2) * 0.03
    weaponRef.current?.setAttribute('transform', `translate(${(MUZZLE.x + wx).toFixed(1)} ${(MUZZLE.y + wy).toFixed(1)}) rotate(${MUZZLE.deg})`)
    if (flashMuzzleRef.current) flashMuzzleRef.current.style.opacity = String(x.recoil > 0.6 ? 1 : 0)

    // 레이저 (세계 안 조준)
    const mx = MUZZLE.x + wx
    const my = MUZZLE.y + wy
    const dx = x.aimX - mx
    const dy = x.aimY - my
    const len = Math.hypot(dx, dy) || 1
    const nx = -dy / len
    const ny = dx / len
    beamRef.current?.setAttribute(
      'points',
      `${mx + nx * 5},${my + ny * 5} ${x.aimX + nx * 1.2},${x.aimY + ny * 1.2} ${x.aimX - nx * 1.2},${x.aimY - ny * 1.2} ${mx - nx * 5},${my - ny * 5}`,
    )
    if (beamGlowRef.current) {
      beamGlowRef.current.setAttribute('x1', mx.toFixed(1))
      beamGlowRef.current.setAttribute('y1', my.toFixed(1))
      beamGlowRef.current.setAttribute('x2', x.aimX.toFixed(1))
      beamGlowRef.current.setAttribute('y2', x.aimY.toFixed(1))
    }
    laserDotRef.current?.setAttribute('transform', `translate(${x.aimX.toFixed(1)} ${x.aimY.toFixed(1)})`)

    // 적 조준 판정 (조준 지점 아래에 살아 있는 드론이 있는가)
    x.hostile = !!hitTest(x.drones, x.aimX, x.aimY)
    rootRef.current?.toggleAttribute('data-hostile', juice && x.hostile)

    // 조준점: 위치는 transform, 퍼짐은 CSS 변수 --sp 하나
    if (aimRef.current) aimRef.current.style.transform = `translate(${x.aimX.toFixed(1)}px, ${x.aimY.toFixed(1)}px)`
    reticleRef.current?.style.setProperty('--sp', (juice ? x.shown : baseSpread).toFixed(2))

    // 적중 표시: 등장(튐) → 유지 → 사라짐
    if (hmLinesRef.current) {
      const hm = x.hm
      const el = hmLinesRef.current
      if (el.dataset.kind !== hm.kind) el.dataset.kind = hm.kind
      let scale = 1
      let alpha = 0
      if (hm.kind === 'plain') {
        alpha = hm.age < holdMs / 1000 ? 1 : 0
      } else {
        const crit = hm.kind !== 'hit'
        const pop = crit ? 0.06 : 0.04
        const from = crit ? 1.5 : 1.3
        const hold = (holdMs / 1000) * (hm.kill ? 1.8 : crit ? 1.4 : 1)
        const fade = crit || hm.kill ? 0.16 : 0.12
        if (hm.age < pop) {
          scale = from + (1 - from) * easeOutBack(hm.age / pop)
          alpha = 1
        } else if (hm.age < pop + hold) alpha = 1
        else {
          const k = clamp((hm.age - pop - hold) / fade, 0, 1)
          alpha = 1 - k * k
        }
      }
      el.style.transform = `scale(${scale.toFixed(3)})`
      el.style.opacity = String(alpha)
    }
    if (ringRef.current) {
      const r = x.ring
      const k = clamp(r.age / 0.32, 0, 1)
      ringRef.current.style.transform = `scale(${(1 + easeOutCubic(k)).toFixed(3)})`
      ringRef.current.style.opacity = String(juice && r.age < 0.32 ? 1 - easeOutCubic(k) : 0)
      ringRef.current.toggleAttribute('data-crit', r.crit)
    }
    if (flashRef.current) flashRef.current.style.opacity = String(x.flash * 0.6)

    // 퍼짐 계기
    if (meterRef.current) meterRef.current.style.width = `${clamp((x.spread / Math.max(1, maxSpread)) * 100, 0, 100).toFixed(1)}%`
    const ammoText = x.reload > 0 ? '--' : String(x.ammo)
    if (ammoRef.current && ammoText !== x.lastAmmo) {
      x.lastAmmo = ammoText
      ammoRef.current.textContent = ammoText
      if (reserveRef.current) reserveRef.current.textContent = String(x.reserve)
    }
    ammoBoxRef.current?.toggleAttribute('data-reload', x.reload > 0)
  }

  /** 퍼짐 수치 표시 — React state 대신 textContent 직접 (탄약 수치와 같은 방식) */
  const writeReadout = () => {
    const el = readoutRef.current
    if (!el) return
    const r = String(Math.round(st.current.spread))
    if (el.textContent !== r) el.textContent = r
  }

  // 값이 바뀌거나 정지 상태일 때도 한 번은 그린다
  useLayoutEffect(() => {
    paint()
    writeReadout()
  })

  /* ───────── 입력: 마우스 조준 · 클릭 사격 ───────── */

  const toLogical = (e: React.PointerEvent) => {
    const r = rootRef.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (p.thumbnail) return
    const pt = toLogical(e)
    const x = st.current
    x.aimX = x.goalX = clamp(pt.x, 0, W)
    x.aimY = x.goalY = clamp(pt.y, 0, H)
    x.glide = false
    x.human = 0
    if (x.autoMove) setMove(false)
    x.plan.idx = -1
    if (!p.playing) paint()
  }
  const onPointerDown = (e: React.PointerEvent) => {
    if (p.thumbnail || e.button !== 0) return
    onPointerMove(e)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const x = st.current
    x.triggerHeld = true
    if (x.fireCd <= 0) {
      fire()
      x.fireCd = 0.11
    }
    if (!p.playing) paint()
  }
  const onPointerUp = () => {
    st.current.triggerHeld = false
  }

  const drones = st.current.drones

  return (
    <div
      ref={rootRef}
      className={s.root}
      data-juice={juice || undefined}
      data-mode={mode}
      data-outline={(outline && juice) || undefined}
      data-thumb={p.thumbnail || undefined}
      data-paused={!p.playing || undefined}
      style={{ '--ts': p.timeScale, '--hostile': hostileColor, '--crit': CRIT_COLOR } as React.CSSProperties}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <svg className={s.world} viewBox={`0 0 ${W} ${H}`} aria-hidden>
        <g ref={worldRef}>
          <Corridor />
          {/* 해설 번호 자리: 밝은 격납문 (외곽선이 필요한 배경) */}
          <rect data-part="outline" x={BACK.l} y={BACK.t} width={BACK.r - BACK.l} height={BACK.b - BACK.t} fill="transparent" />
        </g>
        <g>
          {drones.map((d, i) => (
            <g key={i} ref={setDroneRef[i]}>
              {/* 바닥 그림자 */}
              <ellipse cx={0} cy={FLOOR_GAP[i]} rx={d.h * 0.32} ry={d.h * 0.05} fill="rgba(0,0,0,0.45)" />
              <g ref={setBodyRef[i]} className={s.drone}>
                <Silhouette role="enemy" x={0} y={0} height={d.h} color={DRONE_COLOR} />
                {/* 회전 날개 팔 */}
                <path d={`M${-d.h * 0.44} ${-d.h * 0.5} L${d.h * 0.44} ${-d.h * 0.5}`} stroke="#241a19" strokeWidth={Math.max(3, d.h * 0.028)} strokeLinecap="round" />
                {[-1, 1].map(sgn => (
                  <ellipse key={sgn} cx={sgn * d.h * 0.44} cy={-d.h * 0.52} rx={d.h * 0.13} ry={d.h * 0.026} fill="rgba(210,225,240,0.32)" stroke="rgba(235,245,255,0.6)" strokeWidth={2} />
                ))}
                {/* 추진 불빛 */}
                <ellipse cx={-d.h * 0.17} cy={2} rx={d.h * 0.06} ry={d.h * 0.022} fill="#ffb15a" opacity={0.9} />
                <ellipse cx={d.h * 0.17} cy={2} rx={d.h * 0.06} ry={d.h * 0.022} fill="#ffb15a" opacity={0.9} />
                {/* 장갑 이음새 */}
                <path d={`M${-d.h * 0.2} ${-d.h * 0.36} L${d.h * 0.2} ${-d.h * 0.36}`} stroke="rgba(0,0,0,0.35)" strokeWidth={Math.max(2, d.h * 0.015)} />
                <path d={`M${-d.h * 0.27} ${-d.h * 0.14} L${d.h * 0.27} ${-d.h * 0.14}`} stroke="rgba(0,0,0,0.35)" strokeWidth={Math.max(2, d.h * 0.015)} />
                {/* 약점: 밝게 테두리 친 원형 패치 */}
                <circle cx={0} cy={-d.h * 0.62} r={d.h * 0.105} fill="#2a1512" stroke="#fff4dc" strokeWidth={Math.max(3, d.h * 0.018)} />
                <circle cx={0} cy={-d.h * 0.62} r={d.h * 0.055} fill="#ffe7a8" className={s.core} />
                {/* 피격 번쩍임 (드론 자체의 반응) */}
                <path
                  ref={setFlinchRef[i]}
                  d={`M0 ${-d.h} L${d.h * 0.315} 0 L${-d.h * 0.315} 0 Z`}
                  fill="#ffffff"
                  style={{ opacity: 0 }}
                />
                {/* 내구도 칸 */}
                <g transform={`translate(0 ${-d.h - 18 - d.h * 0.04})`}>
                  {Array.from({ length: MAX_HP }, (_, k) => {
                    const pw = Math.max(12, d.h * 0.07)
                    const gap = pw * 0.35
                    const total = MAX_HP * pw + (MAX_HP - 1) * gap
                    return (
                      <rect
                        key={k}
                        ref={setPipRef[i * MAX_HP + k]}
                        className={s.pip}
                        x={-total / 2 + k * (pw + gap)}
                        y={0}
                        width={pw}
                        height={Math.max(6, pw * 0.4)}
                      />
                    )
                  })}
                </g>
              </g>
            </g>
          ))}
          {/* 실제 탄착 */}
          {Array.from({ length: IMPACTS }, (_, i) => (
            <g key={i} ref={setImpactRef[i]} className={s.impact} style={{ opacity: 0 }}>
              <circle r={9} className={s.impactCore} />
              <path d="M-16 0 L-6 0 M6 0 L16 0 M0 -16 L0 -6 M0 6 L0 16" className={s.impactRay} />
            </g>
          ))}
        </g>

        {/* 세계 안 레이저 (비교 모드) */}
        <g className={s.laser}>
          <line ref={beamGlowRef} className={s.beamGlow} />
          <polygon ref={beamRef} className={s.beam} />
          <g ref={laserDotRef} className={s.laserDot} data-part={mode === 'laser' ? 'reticle' : undefined}>
            <circle r={18} className={s.laserHalo} />
            <circle r={7} className={s.laserCore} />
          </g>
        </g>

        {/* 1인칭 무기 */}
        <g ref={weaponRef}>
          <Weapon />
          <polygon ref={flashMuzzleRef} points="-70,0 -20,-14 -6,-40 4,-12 30,-20 8,0 30,20 4,12 -6,40 -20,14" fill="#fff1c2" style={{ opacity: 0 }} />
          <g data-part="laser">
            <rect x={-14} y={-26} width={60} height={52} fill="transparent" />
            <circle r={6} fill="#a6f04a" className={s.emitter} />
          </g>
        </g>
      </svg>

      {/* 넓은 처치 번쩍임 (requestFlash 통과 시에만) */}
      <div ref={flashRef} className={s.flash} />

      {/* 조준 위치에 붙는 조준점 + 적중 표시 */}
      <div ref={aimRef} className={s.aim}>
        <div ref={reticleRef} className={s.reticle}>
          {/* 해설 번호 자리: 탄이 떨어지는 원(반지름 = 퍼짐). 모든 방식에서 보이지 않는 영역 표시 */}
          <div className={s.spreadArea} data-part="arms" />
          <div className={`${s.arm} ${s.armT}`} />
          <div className={`${s.arm} ${s.armB}`} />
          <div className={`${s.arm} ${s.armL}`} />
          <div className={`${s.arm} ${s.armR}`} />
          <div className={s.circle} />
          <div className={s.dot} data-part={mode === 'laser' ? undefined : 'reticle'} />
        </div>
        <div className={s.hm}>
          {/* 해설 번호 자리: 적중 표시가 차지하는 범위 (처치 원이 2배로 퍼지는 곳까지) */}
          <div className={s.hmArea} data-part="hitmarker" />
          <div ref={hmLinesRef} className={s.hmLines} data-kind="hit" style={{ opacity: 0 }}>
            <div className={s.hmLine} style={{ '--a': '45deg' } as React.CSSProperties} />
            <div className={s.hmLine} style={{ '--a': '135deg' } as React.CSSProperties} />
            <div className={s.hmLine} style={{ '--a': '225deg' } as React.CSSProperties} />
            <div className={s.hmLine} style={{ '--a': '315deg' } as React.CSSProperties} />
          </div>
          <div ref={ringRef} className={s.killRing} style={{ opacity: 0 }} />
        </div>
      </div>

      {/* ── HUD ── */}
      <div className={s.objective}>
        <div className={s.objTag}>외곽 탐사대 · 궤도 정비 기지</div>
        <div className={s.objTitle}>C구역 격납 복도 정리</div>
        <div className={s.objRow}>
          <span>잔해 드론 처치</span>
          <b>
            {kills} <i>/ {GOAL}</i>
          </b>
        </div>
        <div className={s.objBar}>
          <div style={{ width: `${(kills / GOAL) * 100}%` }} />
        </div>
      </div>

      <div className={s.feed} aria-live="polite">
        {feed.map(f => (
          <div key={f.key} className={s.feedRow} data-crit={f.crit || undefined}>
            <svg viewBox="-20 -20 40 40" className={s.feedIcon} aria-hidden>
              <circle r={15} fill="none" strokeWidth={3} />
              <path d="M-9 -9 L-4 -4 M9 -9 L4 -4 M-9 9 L-4 4 M9 9 L4 4" strokeWidth={f.crit ? 4.5 : 2.5} />
            </svg>
            <span>잔해 드론</span>
            <b>{f.crit ? '약점 처치' : '처치'}</b>
            <em>+{f.crit ? 60 : 40} 크레딧</em>
          </div>
        ))}
      </div>

      <div className={s.stance}>
        <div className={s.stanceHead}>
          <svg viewBox="0 0 24 24" className={s.stanceIcon} aria-hidden>
            {moving ? <path d="M13 4a2 2 0 1 1 0 .1M10 9l3-1 3 3 3 1M13 8l-2 6 3 3v4M11 14l-3 3H5" /> : <path d="M12 4a2 2 0 1 1 0 .1M12 8v7M9 21l3-6 3 6M8 11h8" />}
          </svg>
          <span className={s.stanceLabel} data-moving={moving || undefined}>
            {moving ? '이동 중' : '정지'}
          </span>
        </div>
        {mode === 'laser' ? (
          <div className={s.spreadNone}>레이저: 퍼짐 표시 없음</div>
        ) : (
          <>
            <div className={s.spreadRow}>
              <span>탄 퍼짐</span>
              <b>
                <span ref={readoutRef} />
                <i> px</i>
              </b>
            </div>
            <div className={s.meter}>
              <div ref={meterRef} className={s.meterFill} />
              <div className={s.meterMark} style={{ left: '25%' }} />
              <div className={s.meterMark} style={{ left: `${Math.min(75, 25 * moveScale)}%` }} data-move />
            </div>
            <div className={s.meterLegend}>
              <span>기본 {baseSpread}</span>
              <span>최대 {maxSpread}</span>
            </div>
          </>
        )}
      </div>

      <div ref={ammoBoxRef} className={s.ammo}>
        <div className={s.ammoName}>탐사대 표준 소총</div>
        <div className={s.ammoRow}>
          <span ref={ammoRef} className={s.ammoNow}>
            24
          </span>
          <span className={s.ammoSep}>/</span>
          <span ref={reserveRef} className={s.ammoReserve}>
            120
          </span>
        </div>
        <div className={s.reloadTag}>재장전</div>
      </div>

      {!p.thumbnail && (
        <div className={s.hint}>
          <span className={s.hintKey}>마우스</span> 조준 <span className={s.hintKey}>클릭</span> 사격 · 누르고 있으면 연사
        </div>
      )}
    </div>
  )
}
