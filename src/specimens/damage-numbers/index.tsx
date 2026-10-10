import { useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react'
import { createCountUp, easeInOutSine, easeOutCubic, type CountUp } from '../../core/countup'
import { prefersReducedMotion, requestFlash } from '../../core/flash'
import { clamp, damp, useAutoplay, useGameLoop, useTrigger } from '../../core/hooks'
import { bool, num, str } from '../../core/params'
import { Silhouette } from '../../core/silhouettes'
import type { SpecimenProps } from '../../core/types'
import { Arena, Pool } from './Arena'
import {
  CAT_STYLE,
  colorOf,
  easeInQuad,
  easeOutQuart,
  easeOutSine,
  formatValue,
  hitAnchor,
  layoutFor,
  rng,
  type Cat,
  type ColorMap,
  type NumberFormat,
  type StackMode,
  type UnitDef,
  type UnitId,
} from './model'
import s from './style.module.css'

export { meta } from './meta'

/** 숫자 오브젝트 풀 크기 — 미리 만들어 두고 재사용한다 (Unity 의 ObjectPool 과 같은 역할) */
const POOL = 40
const FADE = 0.25
/** 같은 대상에 이 간격 안에 들어온 피해는 한 묶음(합계 후보) */
const CHAIN_GAP = 0.45
/** 마지막 히트 후 이만큼 조용하면 합계를 띄운다 */
const TOTAL_WAIT = 0.2
const TOTAL_COUNT_MS = 400
const TOTAL_HOLD = 0.8

/** 흩뿌리기 방향 순서 (도, -90 = 바로 위) */
const SCATTER_DEG = [-90, -150, -30, -120, -60, -165, -15]

const UNIT_IDS: UnitId[] = ['droneA', 'boss', 'droneB', 'sera', 'harin', 'doyun']

interface Entry {
  active: boolean
  cat: Cat
  value: number
  hits: number
  unit: UnitId
  /** 앵커 기준 시작 오프셋 */
  ox: number
  oy: number
  /** 떠오르는 방향 (단위 벡터) */
  dx: number
  dy: number
  /** 겹침 방지: 새 숫자가 아래에 생기면 위로 밀려 올라가는 목표·현재 오프셋 */
  py: number
  pyc: number
  tilt: number
  age: number
  life: number
  pop: number
  /** 마지막으로 생성·병합된 게임 시각 */
  born: number
  /** 풀에서 꺼낸 순서 (병합해도 바뀌지 않음 — 쌓는 순서 재계산용) */
  sn: number
  /** 자리 차지 높이(px) — 밀어 올림 간격 */
  h: number
  pose: boolean
  /** 정지 장면에서 남은 숫자 — 첫 실제 타격 뒤 빠르게 사라지며, 병합·밀어 올림 대상에서 빠진다 */
  stale: boolean
  /** 형태 단서가 보이는가 (해설 번호 위치용) */
  cue: boolean
}

interface UState {
  hp: number
  guard: number
  brokenT: number
  hitT: number
  /** 실루엣 흰 번쩍임 (번쩍임 제한기를 통과했을 때만) */
  flashT: number
  shieldT: number
  regen: boolean
}

type Action = 'normal' | 'crit' | 'break' | 'multi' | 'heal' | 'block' | 'counter'
type QItem = { at: number; unit: UnitId; cat: Cat; value: number } | { at: number; unit: UnitId; shatter: true }

const BANNER: Record<Action, [string, string]> = {
  normal: ['하린', '기본 사격'],
  crit: ['하린', '정밀 사격'],
  break: ['도윤', '과부하 충격'],
  multi: ['하린', '연속 사격 ×5'],
  heal: ['세라', '수리 드론'],
  block: ['하린', '기본 사격 → 방어막'],
  counter: ['대형 잔해 드론', '반격'],
}

const newEntry = (): Entry => ({
  active: false,
  cat: 'normal',
  value: 0,
  hits: 1,
  unit: 'boss',
  ox: 0,
  oy: 0,
  dx: 0,
  dy: -1,
  py: 0,
  pyc: 0,
  tilt: 0,
  age: 0,
  life: 1,
  pop: 1,
  born: 0,
  sn: 0,
  h: 0,
  pose: false,
  stale: false,
  cue: false,
})

const initUnits = (): Record<UnitId, UState> => ({
  droneA: { hp: 0.46, guard: 0, brokenT: 99, hitT: 0, flashT: 0, shieldT: 0, regen: false },
  boss: { hp: 0.74, guard: 4, brokenT: 0, hitT: 0, flashT: 0, shieldT: 0, regen: false },
  droneB: { hp: 0.88, guard: 3, brokenT: 0, hitT: 0, flashT: 0, shieldT: 0.6, regen: false },
  sera: { hp: 0.9, guard: 0, brokenT: 0, hitT: 0, flashT: 0, shieldT: 0, regen: false },
  harin: { hp: 0.82, guard: 0, brokenT: 0, hitT: 0, flashT: 0, shieldT: 0, regen: false },
  doyun: { hp: 0.62, guard: 0, brokenT: 0, hitT: 0, flashT: 0, shieldT: 0, regen: false },
})

/** 팝: 작게 → 크게(peak) → 1.0 */
function popCurve(t: number, from: number, peak: number) {
  if (t >= 1) return 1
  if (t < 0.5) return from + (peak - from) * easeOutCubic(t / 0.5)
  return peak + (1 - peak) * easeInOutSine((t - 0.5) / 0.5)
}

/**
 * 데미지 숫자 — 범주 위계(일반·치명·가드 파괴·회복·막힘) + 겹침 방지(밀어 올림·흩뿌리기·병합) + 오브젝트 풀 + 합계 카운트업.
 * 숫자 DOM 40개를 미리 만들어 두고 재사용하며, 매 프레임 바뀌는 값은 ref 로 직접 갱신한다 (setState 0).
 */
export default function DamageNumbers(p: SpecimenProps) {
  const critScale = num(p.params, 'critScale', 1.5)
  const stackMode = str(p.params, 'stackMode', 'lane') as StackMode
  const showTotal = bool(p.params, 'showTotal', true)
  const hitInterval = num(p.params, 'hitIntervalMs', 120) / 1000
  const floatDistance = num(p.params, 'floatDistance', 50)
  const lifetime = num(p.params, 'lifetimeMs', 900) / 1000
  const shapeCue = bool(p.params, 'shapeCue', true)
  const colorMap = str(p.params, 'damageColorMap', 'category') as ColorMap
  const fmt = str(p.params, 'numberFormat', 'grouped') as NumberFormat
  const mono = bool(p.params, 'monoPreview', false)
  const juice = p.juice
  const portrait = p.aspect === '9:16'

  const L = useMemo(() => layoutFor(p.aspect), [p.aspect])
  const unitOf = (id: UnitId) => L.units.find(u => u.id === id) as UnitDef
  const reduced = useMemo(() => prefersReducedMotion(), [])

  const st = useRef({
    t: 0,
    seq: 0,
    entries: Array.from({ length: POOL }, newEntry),
    units: initUnits(),
    queue: [] as QItem[],
    chain: { unit: 'boss' as UnitId, count: 0, sum: 0, lastT: -9 },
    total: { unit: 'boss' as UnitId, count: 0, sum: 0, phase: 'idle' as 'idle' | 'count' | 'hold' | 'fade' | 'pose', t: 0, shown: 0, counter: null as CountUp | null },
    posed: true,
    /** 효과 끄기(나쁜 예): 매번 새로 만들고 지운 횟수 */
    created: 0,
    destroyed: 0,
    autoStep: 0,
    scatter: {} as Partial<Record<UnitId, number>>,
    holders: {} as Record<string, Element | null>,
    painted: { used: -1, created: -1, destroyed: -1, juice: true },
    /** 표적 DOM 에 마지막으로 쓴 값 — 바뀔 때만 다시 쓴다 */
    dom: new Map<string, string>(),
  })

  /* ───── DOM refs ───── */
  const numRefs = useRef<(HTMLDivElement | null)[]>([])
  const valRefs = useRef<(HTMLSpanElement | null)[]>([])
  const badgeRefs = useRef<(HTMLSpanElement | null)[]>([])
  const cntRefs = useRef<(HTMLSpanElement | null)[]>([])
  const unitRefs = useRef<Partial<Record<UnitId, SVGGElement | null>>>({})
  const flashRefs = useRef<Partial<Record<UnitId, SVGGElement | null>>>({})
  const shieldRef = useRef<SVGGElement | null>(null)
  const hpRefs = useRef<Partial<Record<UnitId, HTMLElement | null>>>({})
  const trailRefs = useRef<Partial<Record<UnitId, HTMLElement | null>>>({})
  const guardRefs = useRef<Partial<Record<UnitId, HTMLElement | null>>>({})
  /** 가드 칸 요소 — 마운트 때 한 번 모아 두고 매 프레임 querySelectorAll 하지 않는다 */
  const pipRefs = useRef<Partial<Record<UnitId, (HTMLElement | null)[]>>>({})
  const totalRef = useRef<HTMLDivElement>(null)
  const totalValRef = useRef<HTMLElement>(null)
  const totalHitsRef = useRef<HTMLSpanElement>(null)
  const bannerRef = useRef<HTMLDivElement>(null)
  const bannerWhoRef = useRef<HTMLSpanElement>(null)
  const bannerWhatRef = useRef<HTMLElement>(null)
  const poolTextRef = useRef<HTMLSpanElement>(null)
  const poolCellsRef = useRef<HTMLDivElement>(null)
  const critPhRef = useRef<HTMLDivElement>(null)
  const cuePhRef = useRef<HTMLDivElement>(null)

  /* ───── 크기 계산 ───── */
  const fsOf = (cat: Cat) => L.base * (juice ? (cat === 'crit' ? critScale : CAT_STYLE[cat].size) : 0.86)
  const cueOn = (cat: Cat) => juice && shapeCue && (CAT_STYLE[cat].badge !== '' || cat === 'heal')
  const heightOf = (cat: Cat) => fsOf(cat) * 1.02 + (juice && shapeCue && CAT_STYLE[cat].badge ? L.badge * 1.55 : 0) + 6

  /** 풀 항목의 글자·색·크기를 한 번 써 넣는다 (매 프레임이 아니라 생성·병합 때만) */
  const writeEntry = (i: number) => {
    const e = st.current.entries[i]
    const el = numRefs.current[i]
    const val = valRefs.current[i]
    const badge = badgeRefs.current[i]
    const cnt = cntRefs.current[i]
    if (!el || !val || !badge || !cnt) return
    const plus = e.cat === 'heal' && juice && shapeCue ? '+' : ''
    val.textContent = plus + formatValue(e.value, fmt)
    badge.textContent = CAT_STYLE[e.cat].badge
    cnt.textContent = e.hits > 1 && juice ? `×${e.hits}` : ''
    el.dataset.cat = juice ? e.cat : 'plain'
    el.toggleAttribute('data-badge', juice && shapeCue && CAT_STYLE[e.cat].badge !== '')
    el.toggleAttribute('data-strong', juice && shapeCue && (e.cat === 'crit' || e.cat === 'break'))
    el.style.setProperty('--c', juice ? colorOf(e.cat, colorMap) : '#f2f4f7')
    el.style.setProperty('--fs', `${fsOf(e.cat).toFixed(1)}px`)
  }

  /* ───── 숫자 생성 (풀에서 꺼내기) ───── */
  const spawn = (uid: UnitId, cat: Cat, value: number, pose = false): Entry | null => {
    const x = st.current
    if (!pose && x.posed) unpose()
    x.seq++
    // 병합: 같은 대상·같은 범주가 짧은 간격으로 들어오면 숫자 하나를 키운다
    if (juice && stackMode === 'merge') {
      const win = hitInterval * 1.6 + 0.12
      const mi = x.entries.findIndex(e => e.active && !e.stale && e.unit === uid && e.cat === cat && x.t - e.born <= win && e.age < e.life - FADE)
      if (mi >= 0) {
        const m = x.entries[mi]
        m.value += value
        m.hits++
        m.born = x.t
        m.age = Math.min(m.age, m.life * 0.25)
        m.pop = 0
        writeEntry(mi)
        return m
      }
    }
    // 빈 칸 → 없으면 가장 오래된 것을 회수 (풀 상한)
    let idx = x.entries.findIndex(e => !e.active)
    if (idx < 0) {
      let best = 0
      x.entries.forEach((e, i) => {
        if (e.age / e.life > x.entries[best].age / x.entries[best].life) best = i
      })
      idx = best
    }
    if (!juice && !pose) x.created++
    const e = x.entries[idx]
    const h = heightOf(cat)
    // 위로 쌓기·병합: 같은 대상의 살아 있는 숫자를 새 숫자 높이만큼 밀어 올린다
    if (juice && (stackMode === 'lane' || stackMode === 'merge')) {
      x.entries.forEach(o => {
        if (o.active && !o.stale && o.unit === uid) o.py -= h
      })
    }
    Object.assign(e, newEntry())
    e.active = true
    e.cat = cat
    e.value = value
    e.unit = uid
    e.born = x.t
    e.sn = x.seq
    e.pop = 0
    e.h = h
    e.pose = pose
    e.cue = cueOn(cat)
    e.tilt = juice && shapeCue ? CAT_STYLE[cat].tiltDeg : 0
    e.life = juice ? lifetime * CAT_STYLE[cat].lifeScale : lifetime
    if (juice && stackMode === 'scatter') {
      // 방사 흩뿌리기: 위쪽 부채꼴을 번갈아 쓰고(층화) 약간만 흔든다 — 완전 무작위면 연속 두 개가 같은 곳에 겹치기 쉽다
      const k = (x.scatter[uid] = (x.scatter[uid] ?? -1) + 1)
      const ang = ((SCATTER_DEG[k % SCATTER_DEG.length] + (rng(x.seq) * 2 - 1) * 8) * Math.PI) / 180
      e.dx = Math.cos(ang)
      e.dy = Math.sin(ang)
      e.ox = e.dx * 90
      e.oy = e.dy * 46
    }
    writeEntry(idx)
    return e
  }

  const release = (e: Entry) => {
    e.active = false
    if (!juice && !e.pose) st.current.destroyed++
  }

  /** 첫 화면용 정지 장면을 풀어 준다 — 첫 실제 타격부터는 모두 정상적으로 나이를 먹는다 */
  const unpose = () => {
    const x = st.current
    x.posed = false
    // 정지 장면의 숫자는 실제로 들어간 타격이 아니다 → 바로 페이드로 보내고, 병합(×N)·밀어 올림에서 뺀다
    x.entries.forEach(e => {
      if (!e.active || !e.pose) return
      e.pose = false
      e.stale = true
      e.age = Math.max(e.age, e.life - FADE)
    })
    for (const id of UNIT_IDS) if (x.units[id].brokenT >= 50) x.units[id].brokenT = 1.5
    bannerRef.current?.removeAttribute('data-static')
    if (x.total.phase === 'pose') {
      // 정지 장면의 합계도 실제 타격이 아니므로 곧바로 흐려진다
      x.total.phase = 'fade'
      x.total.t = 0
    }
  }

  /* ───── 피해 적용 ───── */
  const applyHit = (uid: UnitId, cat: Cat, value: number) => {
    const x = st.current
    const u = unitOf(uid)
    const us = x.units[uid]
    if (cat === 'heal') {
      // 회복은 체력을 늘리기만 한다 (가득 차 있으면 바는 그대로, 숫자만 뜬다)
      us.hp = Math.min(1, us.hp + value / u.hpMax)
      return
    }
    us.hp = Math.max(0.04, us.hp - value / u.hpMax)
    us.hitT = juice ? 0.22 : 0
    // 큰 타격만 실루엣을 짧게 번쩍인다 — 연타해도 공통 제한기로 초당 3회 이하
    if (juice && !reduced && (cat === 'crit' || cat === 'break') && requestFlash()) us.flashT = 0.1
    if (cat === 'block') us.shieldT = 1
    if ((cat === 'normal' || cat === 'crit') && us.guard > 1 && us.brokenT <= 0) us.guard--
    if (us.hp < 0.18) us.regen = true
    // 합계 후보 묶음
    const c = x.chain
    if (c.count > 0 && c.unit === uid && x.t - c.lastT < CHAIN_GAP) {
      c.count++
      c.sum += value
    } else {
      c.unit = uid
      c.count = 1
      c.sum = value
    }
    c.lastT = x.t
  }

  const hit = (uid: UnitId, cat: Cat, value: number) => {
    applyHit(uid, cat, value)
    spawn(uid, cat, value)
  }

  const shatter = (uid: UnitId) => {
    const us = st.current.units[uid]
    us.guard = 0
    us.brokenT = 3.6
    const g = guardRefs.current[uid]
    if (g && juice) {
      g.removeAttribute('data-shatter')
      void g.offsetWidth
      g.setAttribute('data-shatter', '')
    }
  }

  const showBanner = (a: Action, target?: UnitId) => {
    const el = bannerRef.current
    if (!el || !bannerWhoRef.current || !bannerWhatRef.current) return
    const [who, what] = BANNER[a]
    const named = target && target !== 'boss' && (a === 'normal' || a === 'crit' || a === 'multi' || a === 'heal' || a === 'counter')
    bannerWhoRef.current.textContent = who
    bannerWhatRef.current.textContent = named ? `${what} → ${unitOf(target).name}` : what
    el.toggleAttribute('data-enemy', a === 'counter')
    el.removeAttribute('data-show')
    void el.offsetWidth
    el.setAttribute('data-show', '')
  }

  const act = (a: Action, uid: UnitId) => {
    const x = st.current
    const r = () => rng(++x.seq * 3.7)
    showBanner(a, uid)
    if (a === 'normal') hit(uid, 'normal', Math.round(1180 + r() * 240))
    else if (a === 'crit') hit(uid, 'crit', Math.round(3300 + r() * 520))
    else if (a === 'block') hit(uid, 'block', Math.round(60 + r() * 60))
    else if (a === 'heal') hit(uid, 'heal', Math.round(1480 + r() * 140))
    else if (a === 'counter') hit(uid, 'normal', Math.round(unitOf(uid).hpMax * (0.28 + r() * 0.05)))
    else if (a === 'break') {
      const us = x.units[uid]
      if (us.guard === 0) {
        us.guard = unitOf(uid).guard
        us.brokenT = 0
      }
      if (x.posed) unpose()
      const v = Math.round(5240 + r() * 360)
      if (juice) {
        // 원인 → 결과: 가드 바가 먼저 깨지고(220ms) 약 80ms 뒤 숫자
        shatter(uid)
        x.queue.push({ at: x.t + (reduced ? 0.05 : 0.3), unit: uid, cat: 'break', value: v })
      } else {
        x.units[uid].guard = 0
        x.units[uid].brokenT = 3.6
        hit(uid, 'break', v)
      }
    } else if (a === 'multi') {
      for (let i = 0; i < 5; i++) {
        const crit = i === 3
        const v = Math.round(crit ? 2050 + r() * 220 : 780 + r() * 160)
        x.queue.push({ at: x.t + i * hitInterval, unit: uid, cat: crit ? 'crit' : 'normal', value: v })
      }
      runQueue()
    }
    x.queue.sort((a1, b1) => a1.at - b1.at)
  }

  const runQueue = () => {
    const x = st.current
    while (x.queue.length && x.queue[0].at <= x.t + 1e-6) {
      const q = x.queue.shift()!
      if ('shatter' in q) shatter(q.unit)
      else hit(q.unit, q.cat, q.value)
    }
  }

  /** 회복 버튼은 체력이 가장 낮은 아군을 고친다 */
  const mostHurtAlly = (): UnitId => {
    const u = st.current.units
    return (['doyun', 'harin', 'sera'] as UnitId[]).reduce((m, id) => (u[id].hp < u[m].hp ? id : m))
  }

  const handle = (id: string) => {
    if (id === 'hit_normal') act('normal', 'boss')
    else if (id === 'hit_crit') act('crit', 'boss')
    else if (id === 'hit_break') act('break', 'boss')
    else if (id === 'multi_hit_5') act('multi', 'boss')
    else if (id === 'heal_ally') act('heal', mostHurtAlly())
    else if (id === 'hit_blocked') act('block', 'droneB')
    paint()
  }
  useTrigger(p.trigger, handle)

  // 자동 데모: 대상과 범주를 바꿔 가며 순환 (아군은 반격을 맞은 뒤 회복 — 회복이 늘 바를 채우는 쪽으로 보이게)
  const SCRIPT: [Action, UnitId][] = [
    ['normal', 'droneA'],
    ['crit', 'boss'],
    ['multi', 'boss'],
    ['counter', 'doyun'],
    ['heal', 'doyun'],
    ['break', 'boss'],
    ['block', 'droneB'],
    ['normal', 'boss'],
    ['multi', 'droneA'],
    ['crit', 'droneB'],
    ['counter', 'harin'],
    ['heal', 'harin'],
  ]
  useAutoplay(
    p.autoplay,
    p.playing,
    p.timeScale,
    1.5,
    () => {
      const x = st.current
      const [a, u] = SCRIPT[x.autoStep % SCRIPT.length]
      x.autoStep++
      act(a, u)
    },
    p.trigger?.seq,
  )

  /* ───── 게임 루프 ───── */
  useGameLoop(p.playing, p.timeScale, dt => {
    const x = st.current
    x.t += dt
    runQueue()
    for (const e of x.entries) {
      if (!e.active || e.pose) continue
      e.age += dt
      e.pop += dt
      e.pyc = juice && !reduced ? damp(e.pyc, e.py, 22, dt) : e.py
      if (e.age >= e.life) release(e)
    }
    for (const id of UNIT_IDS) {
      const us = x.units[id]
      us.hitT = Math.max(0, us.hitT - dt)
      us.flashT = Math.max(0, us.flashT - dt)
      us.shieldT = Math.max(0, us.shieldT - dt * 1.6)
      if (us.brokenT > 0 && us.brokenT < 50) {
        us.brokenT -= dt
        if (us.brokenT <= 0) {
          us.guard = unitOf(id).guard
          const g = guardRefs.current[id]
          if (g) {
            g.removeAttribute('data-shatter')
            g.removeAttribute('data-refill')
            void g.offsetWidth
            if (juice) g.setAttribute('data-refill', '')
          }
        }
      }
      if (us.regen) {
        us.hp = Math.min(1, us.hp + dt * 0.8)
        if (us.hp >= 1) us.regen = false
      }
    }
    // 합계: 묶음이 끝나면(200ms 조용) 2타 이상일 때 카운트업
    const c = x.chain
    const T = x.total
    if (c.count > 0 && x.t - c.lastT > TOTAL_WAIT) {
      if (c.count >= 2 && showTotal && juice) {
        T.unit = c.unit
        T.count = c.count
        T.sum = c.sum
        T.counter = createCountUp(0, c.sum, TOTAL_COUNT_MS, easeOutQuart)
        T.phase = 'count'
        T.t = 0
        T.shown = 0
        if (totalHitsRef.current) totalHitsRef.current.textContent = `${c.count}타`
      }
      c.count = 0
    }
    if (T.phase === 'count' && T.counter) {
      T.t += dt
      T.shown = T.counter.step(dt)
      if (T.counter.done) {
        T.phase = 'hold'
        T.t = 0
      }
    } else if (T.phase === 'hold') {
      T.t += dt
      if (T.t >= TOTAL_HOLD) {
        T.phase = 'fade'
        T.t = 0
      }
    } else if (T.phase === 'fade') {
      T.t += dt
      if (T.t >= 0.25) T.phase = 'idle'
    }
    paint()
  })

  /** 합계는 공간이 있으면 숫자 기둥의 오른쪽, 없으면 왼쪽 (세로 화면의 중앙 대형 드론은 왼쪽) */
  const totalOnRight = (ax: number) => ax + 510 * (portrait ? 1.25 : 1) < L.W

  /* ───── 그리기 (DOM 직접 갱신) ───── */
  const setHolder = (key: string, el: Element | null) => {
    const h = st.current.holders
    if (h[key] === el) return
    h[key]?.removeAttribute('data-part')
    el?.setAttribute('data-part', key)
    h[key] = el
  }

  const paint = () => {
    const x = st.current
    let newestCrit = -1
    let newestCue = -1
    let used = 0
    x.entries.forEach((e, i) => {
      const el = numRefs.current[i]
      if (!el) return
      if (!e.active) {
        if (el.style.visibility !== 'hidden') el.style.visibility = 'hidden'
        return
      }
      used++
      el.style.visibility = 'visible'
      const a = hitAnchor(unitOf(e.unit))
      const st0 = CAT_STYLE[e.cat]
      let sc = 1
      let rise = 0
      let alpha = 1
      let shake = 0
      if (juice) {
        if (!reduced) {
          sc = popCurve(clamp(e.pop / (st0.popMs / 1000), 0, 1), st0.popFrom, st0.popPeak)
          const k = clamp(e.age / e.life, 0, 1)
          rise = floatDistance * (stackMode === 'scatter' ? 1.4 : 1) * (e.cat === 'heal' ? easeOutSine(k) : easeOutCubic(k))
          if ((e.cat === 'crit' || e.cat === 'break') && e.pop < 0.12) shake = Math.sin(e.pop * 190) * 5 * (1 - e.pop / 0.12)
        }
        const fadeStart = e.life - FADE
        alpha = e.age > fadeStart ? 1 - easeInQuad(clamp((e.age - fadeStart) / FADE, 0, 1)) : 1
      }
      const px = a.x + e.ox + e.dx * rise + shake
      const py = a.y + e.oy + e.pyc + e.dy * rise
      el.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) translate(-50%, -100%) rotate(${e.tilt}deg) scale(${sc.toFixed(3)})`
      el.style.opacity = alpha.toFixed(3)
      el.style.zIndex = String(Math.round(e.born * 100) % 100000)
      if (e.cat === 'crit' && (newestCrit < 0 || e.born >= x.entries[newestCrit].born)) newestCrit = i
      if (e.cue && e.cat !== 'crit' && (newestCue < 0 || e.born >= x.entries[newestCue].born)) newestCue = i
    })
    // 해설 번호: 살아 있는 숫자가 있으면 그 숫자에, 없으면 숫자가 나타날 자리에
    // 치명: 배지가 보이면 배지에(번호가 숫자 사이가 아니라 '치명' 표시 위에 놓이게), 아니면 숫자 전체에
    const critEl = newestCrit >= 0 ? numRefs.current[newestCrit] : null
    setHolder('crit-number', critEl ? (critEl.hasAttribute('data-badge') ? badgeRefs.current[newestCrit] : critEl) : critPhRef.current)
    setHolder(
      'shape-cue',
      newestCue >= 0 ? (x.entries[newestCue].cat === 'heal' ? valRefs.current[newestCue] : badgeRefs.current[newestCue]) : cuePhRef.current,
    )

    // 표적 — 값이 바뀐 것만 DOM 에 쓴다
    const dom = x.dom
    const put = (key: string, v: string, write: () => void) => {
      if (dom.get(key) === v) return
      dom.set(key, v)
      write()
    }
    for (const u of L.units) {
      const id = u.id
      const us = x.units[id]
      const g = unitRefs.current[id]
      if (g) {
        const k = us.hitT / 0.22
        const v = k > 0 ? `translate(${(Math.sin(x.t * 95) * 9 * k).toFixed(1)} 0)` : ''
        put(`${id}.shake`, v, () => g.setAttribute('transform', v))
      }
      const f = flashRefs.current[id]
      if (f) {
        const v = us.flashT > 0 ? '0.7' : '0'
        put(`${id}.flash`, v, () => f.setAttribute('opacity', v))
      }
      const w = `${(us.hp * 100).toFixed(2)}%`
      put(`${id}.hp`, w, () => {
        const hp = hpRefs.current[id]
        const tr = trailRefs.current[id]
        if (hp) hp.style.width = w
        if (tr) tr.style.width = w
      })
      const gd = guardRefs.current[id]
      if (gd) {
        put(`${id}.guard`, String(us.guard), () => {
          pipRefs.current[id]?.forEach((pp, j) => pp?.toggleAttribute('data-on', j < us.guard))
          gd.toggleAttribute('data-broken', us.guard === 0)
        })
      }
    }
    const sh = shieldRef.current
    if (sh) {
      const v = (0.28 + 0.62 * x.units.droneB.shieldT).toFixed(2)
      put('droneB.shield', v, () => sh.setAttribute('opacity', v))
    }

    // 합계
    const T = x.total
    const tEl = totalRef.current
    if (tEl) {
      const vis = juice && showTotal && T.phase !== 'idle'
      const u = unitOf(T.unit)
      const a = hitAnchor(u)
      const k = portrait ? 1.25 : 1
      const right = totalOnRight(a.x)
      tEl.style.left = `${right ? a.x + 140 * k : a.x - 140 * k}px`
      tEl.style.top = `${a.y - (portrait ? 95 : 150) * k}px`
      tEl.dataset.side = right ? 'r' : 'l'
      let op = vis ? 1 : 0
      let sc = 1
      if (vis && T.phase === 'fade') op = 1 - T.t / 0.25
      if (T.phase === 'count' && T.counter && !reduced) sc = 0.86 + 0.14 * easeOutCubic(Math.min(1, T.counter.progress * 2.5)) + 0.06 * Math.sin(Math.PI * T.counter.progress)
      tEl.style.opacity = op.toFixed(3)
      tEl.style.setProperty('--sc', sc.toFixed(3))
      if (totalValRef.current) totalValRef.current.textContent = formatValue(T.shown, fmt)
    }

    // 풀 상태 (디버그)
    const pd = x.painted
    if (pd.used !== used || pd.created !== x.created || pd.destroyed !== x.destroyed || pd.juice !== juice) {
      pd.used = used
      pd.created = x.created
      pd.destroyed = x.destroyed
      pd.juice = juice
      if (poolTextRef.current)
        poolTextRef.current.textContent = juice ? `사용 ${used} / ${POOL} · 새로 생성 0회` : `새로 생성 ${x.created}회 · 삭제 ${x.destroyed}회`
      poolCellsRef.current?.querySelectorAll('i').forEach((c, j) => c.toggleAttribute('data-on', j < used))
    }
  }

  /* ───── 첫 화면: 범주 다섯 가지가 한 화면에 보이는 정지 장면 ───── */
  const buildPose = () => {
    const x = st.current
    x.entries.forEach(e => (e.active = false))
    x.queue = []
    x.posed = true
    x.units = initUnits()
    x.chain.count = 0
    const P = (uid: UnitId, cat: Cat, v: number, ageFrac: number) => {
      const e = spawn(uid, cat, v, true)
      if (e) {
        e.age = e.life * ageFrac
        e.pop = 1
      }
    }
    // 치명타를 기둥 맨 위(가장 오래된 숫자)에 둔다 — 해설 번호 1 이 다른 숫자를 덮지 않는다
    P('boss', 'crit', 3912, 0.26)
    P('boss', 'normal', 1284, 0.14)
    P('boss', 'normal', 1302, 0.04)
    P('doyun', 'heal', 1560, 0.3)
    P('droneB', 'block', 96, 0.18)
    // 마지막에 꺼낸 형태 단서(가드 파괴 배지)에 해설 번호 3 이 붙는다 — 위쪽이 비어 있어 번호가 다른 글자를 덮지 않는다
    P('droneA', 'break', 5240, 0.22)
    x.entries.forEach(e => (e.pyc = e.py))
    const T = x.total
    T.unit = 'boss'
    T.count = 3
    T.sum = 3912 + 1284 + 1302
    T.shown = T.sum
    T.counter = null
    T.phase = juice && showTotal ? 'pose' : 'idle'
    T.t = 0
    if (totalHitsRef.current) totalHitsRef.current.textContent = '3타'
  }

  /** 정지 장면이 풀린 뒤 파라미터를 바꾸면 살아 있는 숫자도 새 규칙으로 다시 그린다 (일시정지 상태에서 비교할 수 있게) */
  const refreshLive = () => {
    const x = st.current
    x.entries.forEach((e, i) => {
      if (!e.active) return
      e.cue = cueOn(e.cat)
      e.tilt = juice && shapeCue ? CAT_STYLE[e.cat].tiltDeg : 0
      e.h = heightOf(e.cat)
      writeEntry(i)
    })
    // 밀어 올림 오프셋도 새 높이로 다시 쌓는다: 같은 대상에서 자기보다 새 숫자들의 높이 합만큼 위
    const stacked = juice && (stackMode === 'lane' || stackMode === 'merge')
    for (const e of x.entries) {
      if (!e.active || e.stale) continue
      e.py = stacked ? -x.entries.reduce((sum, o) => (o.active && !o.stale && o.unit === e.unit && o.sn > e.sn ? sum + o.h : sum), 0) : 0
      e.pyc = e.py
    }
  }

  const poseKey = [critScale, stackMode, showTotal, floatDistance, lifetime, shapeCue, colorMap, fmt, juice, p.aspect].join('|')
  useLayoutEffect(() => {
    const x = st.current
    x.dom.clear()
    if (x.posed) buildPose()
    else refreshLive()
    paint()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poseKey])

  /* ───── 화면 구성 ───── */
  const boss = unitOf('boss')
  const bossA = hitAnchor(boss)
  // 형태 단서 자리: 가드 파괴 배지가 뜨는 잔해 드론 위 (위쪽이 비어 해설 번호가 다른 글자를 덮지 않는다)
  const cueA = hitAnchor(unitOf('droneA'))
  const k = portrait ? 1.25 : 1
  const rootStyle = {
    '--ts': p.timeScale,
    '--k': k,
    '--badge': `${L.badge}px`,
  } as CSSProperties

  return (
    <div className={s.root} data-juice={juice || undefined} data-paused={!p.playing || undefined} data-mono={mono || undefined} data-portrait={portrait || undefined} style={rootStyle}>
      <Arena W={L.W} H={L.H} />

      {/* 표적 (실루엣 키트: 적 = 삼각, 아군 = 캡슐) */}
      <svg className={s.world} width={L.W} height={L.H} viewBox={`0 0 ${L.W} ${L.H}`} aria-hidden>
        {L.units.map(u => (
          <Pool key={u.id} x={u.x} y={u.y} w={u.h * 0.75} enemy={u.role === 'enemy'} />
        ))}
        {L.units.map(u => (
          <g key={u.id} ref={el => void (unitRefs.current[u.id] = el)}>
            <Silhouette role={u.role} x={u.x} y={u.y} height={u.h} />
            {u.role === 'enemy' ? <DroneDeco u={u} /> : <AllyDeco u={u} />}
            <g ref={el => void (flashRefs.current[u.id] = el)} opacity="0">
              <Silhouette role={u.role} x={u.x} y={u.y} height={u.h} color="#ffffff" />
            </g>
            {u.id === 'droneB' && (
              <g ref={shieldRef} opacity="0.3">
                <Hex x={u.x} y={u.y - u.h * 0.48} r={u.h * 0.72} />
              </g>
            )}
          </g>
        ))}
      </svg>

      {/* 가드 게이지 + 이름표 + 체력 (발 아래 — 숫자가 바를 가리지 않게. 가드 칸은 몸 바로 아래라 깨질 때 원인으로 읽힌다) */}
      {L.units.map(u => (
        <div
          key={u.id}
          className={s.plate}
          data-role={u.role}
          data-boss={u.id === 'boss' || undefined}
          style={{ left: u.x, top: u.y + (u.role === 'enemy' ? 26 : 22), width: u.plateW }}
        >
          {u.guard > 0 && (
            <div className={s.guard} ref={el => void (guardRefs.current[u.id] = el)}>
              <svg className={s.guardIcon} viewBox="0 0 24 24" aria-hidden>
                <path d="M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5z" />
              </svg>
              <span className={s.pips} data-part={u.id === 'boss' ? 'guard-bar' : undefined}>
                {Array.from({ length: u.guard }, (_, j) => (
                  <i
                    key={j}
                    data-pip
                    style={{ '--j': j } as CSSProperties}
                    ref={el => {
                      ;(pipRefs.current[u.id] ??= [])[j] = el
                    }}
                  />
                ))}
              </span>
              <span className={s.brokenTag}>파괴됨</span>
            </div>
          )}
          <div className={s.plateHead}>
            {u.level && <span className={s.lv}>Lv.{u.level}</span>}
            <b>{u.name}</b>
          </div>
          <div className={s.hp}>
            <i className={s.hpTrail} ref={el => void (trailRefs.current[u.id] = el)} />
            <i className={s.hpFill} ref={el => void (hpRefs.current[u.id] = el)} />
          </div>
        </div>
      ))}

      {/* 해설 번호 자리 (숨김 상태여도 DOM 에 항상 존재) */}
      {/* 밀어 올림 기둥 옆 세로 띠 — 합계 반대쪽에 두어 해설 번호가 숫자·합계·행동 배너를 덮지 않게 */}
      <div
        className={s.zone}
        data-part="stack-lane"
        style={{ left: totalOnRight(bossA.x) ? bossA.x - 175 * k : bossA.x + 135 * k, top: bossA.y - 290 * k, width: 40 * k, height: 290 * k }}
      />
      <div ref={critPhRef} className={s.zone} style={{ left: bossA.x - 130 * k, top: bossA.y - 100 * k, width: 260 * k, height: 100 * k }} />
      <div ref={cuePhRef} className={s.zone} style={{ left: cueA.x - 90 * k, top: cueA.y - 80 * k, width: 180 * k, height: 80 * k }} />

      {/* 숫자 레이어 — 풀 40개를 미리 만들어 둔다 */}
      <div className={s.layer} aria-hidden>
        {Array.from({ length: POOL }, (_, i) => (
          <div key={i} className={s.num} ref={el => void (numRefs.current[i] = el)} style={{ visibility: 'hidden' }}>
            <span className={s.badge} ref={el => void (badgeRefs.current[i] = el)} />
            <span className={s.row}>
              <span className={s.val} ref={el => void (valRefs.current[i] = el)} />
              <span className={s.cnt} ref={el => void (cntRefs.current[i] = el)} />
            </span>
          </div>
        ))}
      </div>

      {/* 누적 합계 */}
      <div ref={totalRef} className={s.total} data-part="total-counter" style={{ opacity: 0 }}>
        <span className={s.totalLbl}>합계</span>
        <b ref={totalValRef} className={s.totalVal}>
          0
        </b>
        <span ref={totalHitsRef} className={s.totalHits}>
          0타
        </span>
      </div>

      {/* 행동 이름 */}
      <div ref={bannerRef} className={s.banner} data-static="">
        <span className={s.bannerEyebrow}>행동</span>
        <span className={s.bannerBody}>
          <span ref={bannerWhoRef} className={s.bannerWho}>
            하린
          </span>
          <b ref={bannerWhatRef}>연속 사격 ×3</b>
        </span>
      </div>

      {/* 풀 상태 — 수업용 디버그 표시 */}
      <div className={s.pool}>
        <span className={s.poolTitle}>{juice ? '숫자 풀 (재사용)' : '숫자 생성 방식: 매번 새로 만들기'}</span>
        {juice && (
          <div className={s.poolCells} ref={poolCellsRef}>
            {Array.from({ length: POOL }, (_, i) => (
              <i key={i} />
            ))}
          </div>
        )}
        <span ref={poolTextRef} className={s.poolText} />
      </div>
    </div>
  )
}

/* ───── 장식 ───── */
function DroneDeco({ u }: { u: UnitDef }) {
  const cy = u.y - u.h * 0.42
  const r = u.h * 0.075
  return (
    <g>
      <path d={`M${u.x - u.h * 0.32} ${u.y - u.h * 0.2} L${u.x - u.h * 0.62} ${u.y - u.h * 0.42} L${u.x - u.h * 0.36} ${u.y - u.h * 0.34}Z`} fill="#c84c40" opacity="0.9" />
      <path d={`M${u.x + u.h * 0.32} ${u.y - u.h * 0.2} L${u.x + u.h * 0.62} ${u.y - u.h * 0.42} L${u.x + u.h * 0.36} ${u.y - u.h * 0.34}Z`} fill="#c84c40" opacity="0.9" />
      <circle cx={u.x} cy={cy} r={r * 1.7} fill="#2a0e10" opacity="0.55" />
      <circle cx={u.x} cy={cy} r={r} fill="#ffe2d6" />
      <path d={`M${u.x - u.h * 0.12} ${u.y - u.h * 0.12} H${u.x + u.h * 0.12}`} stroke="#2a0e10" strokeOpacity="0.5" strokeWidth="4" />
    </g>
  )
}

function AllyDeco({ u }: { u: UnitDef }) {
  const w = u.h * 0.42
  return <rect x={u.x - w * 0.32} y={u.y - u.h * 0.84} width={w * 0.64} height={u.h * 0.09} rx={u.h * 0.04} fill="#0b2a3a" opacity="0.8" />
}

function Hex({ x, y, r }: { x: number; y: number; r: number }) {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i + Math.PI / 6
    return `${(x + Math.cos(a) * r).toFixed(1)},${(y + Math.sin(a) * r * 0.92).toFixed(1)}`
  }).join(' ')
  return <polygon points={pts} fill="#5fd4ff" fillOpacity="0.08" stroke="#8fe3ff" strokeWidth="4" strokeLinejoin="round" />
}
