import { useEffect, useLayoutEffect, useReducer, useRef, type CSSProperties } from 'react'
import { useAutoplay, useGameLoop, useTrigger } from '../../core/hooks'
import { KeyCap } from '../../core/input'
import { bool, num, str } from '../../core/params'
import type { SpecimenProps } from '../../core/types'
import { Check, Emblem, ItemIcon, KindIcon } from './Icons'
import { NotificationQueue, type QueueConfig, type QueueListener, type QueueMode, type Toast, type ToastRequest } from './queue'
import { ITEMS, LOOT_BURST, MAIN_CHAIN, makeRepeat, RARITY_NAME, RARITY_NUMERAL, type Objective, type Quest } from './quests'
import { World } from './World'
import s from './style.module.css'

export { meta } from './meta'

/* ───────── 타이밍 (ms, 게임 시간) ───────── */
const EXIT_MS = 180 // 토스트 나가기
const BANNER_MS = 2500 // 우선 배너 전체
const BANNER_OUT_MS = 300
const QUEST_ENTER_MS = 600
const QUEST_HOLD_MS = 1250 // 완료 상태를 보여 주는 시간
const QUEST_COLLAPSE_MS = 250
const SAME_ITEM_GAP_MS = 200
/** 사용자가 이벤트를 누르거나 값을 바꾸면 이 시간(게임 시간) 동안 자동 데모를 쉬어 실험이 섞이지 않게 한다 */
const USER_HOLD_MS = 8000

interface ViewCard {
  t: Toast
  /** seed = 첫 화면에 이미 떠 있던 카드 (등장 연출 없음) */
  phase: 'seed' | 'in' | 'out'
  outMs: number
  bump: number
  why?: 'expired' | 'preempted' | 'cleared'
}
interface BannerData {
  eyebrow: string
  title: string
  sub: string
}

/** 자동 데모 순서 — 1.4초(게임 시간)마다 한 단계 */
const AUTO_SCRIPT = [
  'loot-same-item',
  'kill-enemy',
  'loot-burst',
  'kill-enemy',
  'loot-legendary',
  'kill-enemy',
  'pause-on',
  'wait',
  'pause-off',
  'quest-complete',
  'wait',
  'kill-enemy',
  'wait',
] as const

/**
 * 퀘스트 트래커(고정 정보) + 토스트 알림 큐(일시 정보) + 우선 배너(별도 채널).
 * 큐 규칙은 queue.ts 의 NotificationQueue 가 전부 맡고, 이 컴포넌트는 show/update/hide 를 받아 그리기만 한다.
 * 매 프레임 바뀌는 것(타이머 막대)은 ref 로 DOM 을 직접 갱신하고, 카드가 들고 나는 순간에만 다시 렌더한다.
 */
export default function QuestTrackerToasts(p: SpecimenProps) {
  const maxVisible = num(p.params, 'maxVisible', 3)
  const displayMs = num(p.params, 'displayMs', 3500)
  const mergeWindowMs = num(p.params, 'mergeWindowMs', 1500)
  const priorityMode = str(p.params, 'priorityMode', 'priority') as QueueMode
  const trackerMode = str(p.params, 'trackerMode', 'multi-list')
  const stackAnchor = str(p.params, 'stackAnchor', 'left-up')
  const progressFlash = bool(p.params, 'progressFlash', true)
  const freezeOnPause = bool(p.params, 'freezeOnPause', true)
  const juice = p.juice
  const portrait = p.aspect === '9:16'

  // 효과 끄기(나쁜 예) = 큐가 없는 구현: 슬롯 제한·병합·우선순위·등급 보너스·일시정지 동결이 모두 없다
  const cfg: QueueConfig = juice
    ? { maxVisible, displayMs, mergeWindowMs, mode: priorityMode, rarityBonus: true }
    : { maxVisible: 99, displayMs, mergeWindowMs: 0, mode: 'fifo', rarityBonus: false }

  const [, rerender] = useReducer((n: number) => n + 1, 0)
  const live = useRef({ juice, freezeOnPause })
  live.current = { juice, freezeOnPause }

  const S = useRef({
    cards: [] as ViewCard[],
    quests: [MAIN_CHAIN[0](), makeRepeat()] as Quest[],
    mainIdx: 0,
    paused: false,
    /** 사용자가 직접 건 일시정지 — 자동 데모가 풀지 못한다 */
    pausedByUser: false,
    /** 남은 자동 데모 휴식 시간 (ms, 게임 시간) */
    userHoldMs: 0,
    banners: [] as BannerData[],
    banner: null as null | (BannerData & { ms: number; phase: 'in' | 'out'; seq: number }),
    bannerSeq: 0,
    schedule: [] as { at: number; fn: () => void }[],
    clock: 0,
    autoStep: 0,
    silent: false,
  })
  const timerEls = useRef(new Map<number, HTMLElement>())

  /* ───────── 큐 → 뷰 ───────── */
  const listener = useRef<QueueListener>({
    show(t) {
      const x = S.current
      x.cards.push({ t, phase: x.silent ? 'seed' : 'in', outMs: 0, bump: 0 })
      if (!x.silent) rerender()
    },
    update(t) {
      const c = S.current.cards.find(c => c.t.uid === t.uid && c.phase !== 'out')
      if (c) c.bump++
      if (!S.current.silent) rerender()
    },
    hide(t, why) {
      const x = S.current
      const i = x.cards.findIndex(c => c.t.uid === t.uid && c.phase !== 'out')
      if (i < 0) return
      // 나쁜 예: 나가기 연출 없이 즉시 제거 → 남은 카드가 한 칸씩 툭 건너뛴다
      if (!live.current.juice) {
        x.cards.splice(i, 1)
        timerEls.current.delete(t.uid)
      } else Object.assign(x.cards[i], { phase: 'out', outMs: 0, why })
      if (!x.silent) rerender()
    },
    changed() {
      if (!S.current.silent) rerender()
    },
  })

  const qRef = useRef<NotificationQueue | null>(null)
  if (!qRef.current) {
    // 첫 화면(썸네일 포함)부터 큐가 일하는 모습이 보이도록 몇 건을 미리 넣어 둔다
    const q = new NotificationQueue(cfg, listener.current)
    S.current.silent = true
    for (let i = 0; i < 4; i++) q.enqueue(ITEMS.circuit())
    q.enqueue(ITEMS.lens())
    q.enqueue(ITEMS.credit(120))
    q.enqueue(ITEMS.repair())
    q.enqueue(ITEMS.oxygen())
    q.enqueue(ITEMS.cell(2))
    q.tick(0, false)
    // 남은 시간을 엇갈리게 — 하나씩 차례로 빠지고 대기열에서 다음 카드가 들어온다
    q.active.forEach((t, i) => (t.remainingMs = Math.min(t.durationMs, [1300, 2700, 4300, 5200, 6000][i] ?? t.durationMs)))
    S.current.silent = false
    qRef.current = q
  }
  const q = qRef.current

  // 조절 값이 바뀌면 큐 규칙을 바로 바꾼다 (슬롯 수가 줄면 넘치는 카드는 대기열로)
  const cfgKey = JSON.stringify(cfg)
  useEffect(() => {
    q.reconfigure(JSON.parse(cfgKey) as QueueConfig)
  }, [cfgKey, q])

  // 값을 바꾸는 것도 실험의 시작 — 잠시 자동 데모를 쉰다 (첫 렌더는 제외)
  const paramKey = JSON.stringify(p.params) + juice
  const prevParamKey = useRef(paramKey)
  useEffect(() => {
    if (paramKey !== prevParamKey.current) S.current.userHoldMs = USER_HOLD_MS
    prevParamKey.current = paramKey
  }, [paramKey])

  /* ───────── 게임 쪽 동작 ───────── */
  const enqueue = (r: ToastRequest) => q.enqueue(r)

  const complete = (quest: Quest) => {
    const x = S.current
    quest.phase = 'done'
    quest.phaseMs = 0
    for (const o of quest.objectives) {
      if (o.cur < o.max) {
        o.delta = o.max - o.cur
        o.cur = o.max
        o.flashSeq++
      }
    }
    if (quest.kind === 'main' && quest.reward) {
      if (live.current.juice) {
        // 최상위 알림은 일반 큐가 아니라 별도 배너 채널로
        x.banners.push({ eyebrow: '임무 완료', title: quest.title, sub: quest.reward.label })
        enqueue(ITEMS.credit(quest.reward.credit))
      } else {
        // 나쁜 예: 임무 완료도 일반 토스트 더미 속 한 줄
        enqueue({ key: `done-${quest.id}`, label: `임무 완료 · ${quest.title}`, rarity: 3, amount: 1, unit: 'count', icon: 'quest' })
      }
    } else {
      enqueue({ key: 'repeat-done', label: '반복 과제 완료', rarity: 1, amount: 1, unit: 'count', icon: 'quest' })
    }
  }

  const progress = (feed: NonNullable<Objective['feed']>, n = 1) => {
    for (const quest of S.current.quests) {
      if (quest.phase !== 'live' && quest.phase !== 'enter') continue
      let hit = false
      for (const o of quest.objectives) {
        if (o.feed !== feed || o.cur >= o.max) continue
        const before = o.cur
        o.cur = Math.min(o.max, o.cur + n)
        o.delta = o.cur - before
        o.flashSeq++
        hit = true
      }
      if (hit && quest.objectives.every(o => o.cur >= o.max)) complete(quest)
    }
  }

  /** fromUser = 이벤트 버튼·숫자키. 자동 데모(false)는 사용자가 건 일시정지를 풀지 못한다 */
  const handle = (id: string, fromUser: boolean) => {
    const x = S.current
    if (id === 'pause-toggle' || id === 'pause-on' || id === 'pause-off') {
      x.paused = id === 'pause-toggle' ? !x.paused : id === 'pause-on'
      x.pausedByUser = fromUser && x.paused
      rerender()
      return
    }
    if (x.paused) {
      if (!fromUser) return // 자동 데모는 일시정지 중에 게임 이벤트를 내지 않는다
      x.paused = false // 사용자가 게임 이벤트를 누르면 일시정지를 풀고 처리
      x.pausedByUser = false
    }
    if (id === 'kill-enemy') {
      progress('kill')
      progress('circuit')
      enqueue(ITEMS.circuit())
    } else if (id === 'loot-burst') {
      // 상자 하나 — 10건이 한 프레임에 몰린다
      for (const r of LOOT_BURST) enqueue({ ...r })
      progress('circuit', 3)
      progress('oxygen', 2)
      progress('cell', 1)
    } else if (id === 'loot-same-item') {
      // 같은 재료를 0.2초 간격으로 6번 줍는다
      for (let i = 0; i < 6; i++)
        x.schedule.push({
          at: x.clock + i * SAME_ITEM_GAP_MS,
          fn: () => {
            enqueue(ITEMS.cell())
            progress('cell')
          },
        })
    } else if (id === 'loot-legendary') {
      enqueue(ITEMS.core())
    } else if (id === 'quest-complete') {
      const main = x.quests.find(qq => qq.kind === 'main' && (qq.phase === 'live' || qq.phase === 'enter'))
      if (main) complete(main)
    }
    rerender()
  }
  useTrigger(p.trigger, id => {
    S.current.userHoldMs = USER_HOLD_MS
    handle(id, true)
  })

  useAutoplay(
    p.autoplay,
    p.playing,
    p.timeScale,
    1.4,
    () => {
      const x = S.current
      // 사용자가 실험 중(최근 조작 · 직접 건 일시정지)이면 자동 데모는 끼어들지 않는다
      if (x.userHoldMs > 0 || x.pausedByUser) return
      const step = AUTO_SCRIPT[x.autoStep++ % AUTO_SCRIPT.length]
      if (step !== 'wait') handle(step, false)
    },
    p.trigger?.seq,
  )

  /* ───────── 루프 ───────── */
  useGameLoop(p.playing, p.timeScale, dt => {
    const x = S.current
    const ms = dt * 1000
    let dirty = false

    // 게임 세계는 일시정지 중 멈춘다 (예약된 획득·배너·트래커 연출)
    // 자동 데모 휴식은 일시정지와 무관하게 줄인다 (사용자가 건 일시정지는 pausedByUser 가 따로 막는다)
    if (x.userHoldMs > 0) x.userHoldMs -= ms

    if (!x.paused) {
      x.clock += ms
      if (x.schedule.length) {
        const due = x.schedule.filter(e => e.at <= x.clock)
        if (due.length) {
          x.schedule = x.schedule.filter(e => e.at > x.clock)
          due.forEach(e => e.fn())
          dirty = true
        }
      }
      if (x.banner) {
        x.banner.ms += ms
        if (x.banner.phase === 'in' && x.banner.ms >= BANNER_MS - BANNER_OUT_MS) {
          x.banner.phase = 'out'
          dirty = true
        }
        if (x.banner.ms >= BANNER_MS) {
          x.banner = null
          dirty = true
        }
      }
      if (!x.banner && x.banners.length) {
        x.banner = { ...x.banners.shift()!, ms: 0, phase: 'in', seq: ++x.bannerSeq }
        dirty = true
      }
      for (const quest of [...x.quests]) {
        quest.phaseMs += ms
        if (quest.phase === 'enter' && quest.phaseMs >= QUEST_ENTER_MS) {
          quest.phase = 'live'
          dirty = true
        } else if (quest.phase === 'done' && quest.phaseMs >= QUEST_HOLD_MS) {
          quest.phase = 'collapse'
          quest.phaseMs = 0
          dirty = true
        } else if (quest.phase === 'collapse' && quest.phaseMs >= QUEST_COLLAPSE_MS) {
          x.quests.splice(x.quests.indexOf(quest), 1)
          // 다음 임무를 자동으로 추적 — 목록 맨 위에 펼쳐지며 들어온다
          if (quest.kind === 'main') {
            x.mainIdx = (x.mainIdx + 1) % MAIN_CHAIN.length
            x.quests.unshift(MAIN_CHAIN[x.mainIdx]())
          } else x.quests.push({ ...makeRepeat(), phase: 'enter', objectives: makeRepeat().objectives.map(o => ({ ...o, cur: 0 })) })
          dirty = true
        }
      }
    }

    // 토스트 타이머: 일시정지(동결 켬) 또는 우선 배너 중이면 줄지 않는다. 나쁜 예는 언제나 흐른다
    const L = live.current
    const frozen = L.juice && ((x.paused && L.freezeOnPause) || !!x.banner)
    q.tick(ms, frozen)

    for (let i = x.cards.length - 1; i >= 0; i--) {
      const c = x.cards[i]
      if (c.phase !== 'out') continue
      c.outMs += ms
      if (c.outMs >= EXIT_MS + 20) {
        x.cards.splice(i, 1)
        timerEls.current.delete(c.t.uid)
        dirty = true
      }
    }
    if (dirty) rerender()
    paint()
  })

  const paint = () => {
    for (const c of S.current.cards) {
      const el = timerEls.current.get(c.t.uid)
      if (el) el.style.transform = `scaleX(${Math.max(0, c.t.remainingMs / c.t.durationMs)})`
    }
  }
  useLayoutEffect(() => paint())

  /* ───────── 그리기 ───────── */
  const x = S.current
  const shown = x.cards.filter(c => c.phase !== 'out')
  const badgeVisible = (t: Toast) => t.unit === 'plus' || t.amount > 1
  // 해설 번호가 가리킬 카드: 병합된 카드 · 가장 높은 등급 · 나머지 하나
  const badgeCard = shown.find(c => c.t.mergeCount > 0 && badgeVisible(c.t)) ?? shown.find(c => badgeVisible(c.t))
  const stripeCard = [...shown].sort((a, b) => b.t.rarity - a.t.rarity || a.t.arrivedAt - b.t.arrivedAt)[0]
  // 타이머 번호는 막대 오른쪽 끝에 붙는다 → 배지가 없어 오른쪽이 빈 카드, 그중 화면에서 가장 아래 카드를 고른다
  // (배지 번호는 배지 위 = 윗카드 오른쪽 끝에 붙으므로 둘이 같은 자리를 다투지 않게)
  const visualTopDown = stackAnchor === 'right-down' ? [...shown].reverse() : shown
  const timerCard =
    [...visualTopDown].reverse().find(c => c !== badgeCard && !badgeVisible(c.t)) ?? shown.find(c => c !== badgeCard) ?? shown[0]
  const frozenNow = juice && ((x.paused && freezeOnPause) || !!x.banner)
  const frozenWhy = !juice ? '' : x.paused && freezeOnPause ? '일시정지' : x.banner ? '우선 배너' : ''

  const mains = x.quests.filter(qq => qq.kind === 'main')
  const focusQuest = mains[0]
  /** 단일 목표형이 보여 줄 한 줄 — 아직 남은 첫 목표 (모두 끝났으면 마지막 목표) */
  const focusRow = (qq: Quest) => qq.objectives.find(o => o.cur < o.max) ?? qq.objectives[qq.objectives.length - 1]
  // 해설 3번이 가리킬 행 — 실제로 그려지는 행 중에서 고른다
  const progressTarget = (() => {
    if (trackerMode === 'single-focus') return focusQuest ? `${focusQuest.id}:${focusRow(focusQuest).id}` : ''
    for (const qq of x.quests) {
      const o = qq.objectives.find(o => o.max > 1 && o.cur < o.max)
      if (o) return `${qq.id}:${o.id}`
    }
    const qq = x.quests.find(qq => qq.objectives.some(o => o.max > 1))
    const o = qq?.objectives.find(o => o.max > 1)
    return qq && o ? `${qq.id}:${o.id}` : ''
  })()

  const flashOn = juice && progressFlash

  const objRow = (quest: Quest, o: Objective, compact = false) => {
    const done = o.cur >= o.max
    const isTarget = `${quest.id}:${o.id}` === progressTarget
    return (
      <div key={o.id} className={s.obj} data-done={done || undefined} data-compact={compact || undefined}>
        {flashOn && o.flashSeq > 0 && <i key={`f${o.flashSeq}`} className={s.objFlash} />}
        <span className={s.objCheck}>
          <Check done={done} />
        </span>
        <span className={s.objLabel}>{o.label}</span>
        <span className={s.objCount}>
          {o.max > 1 ? (
            <>
              <b key={flashOn ? `n${o.flashSeq}` : 'n'} className={s.objNum}>
                {o.cur}
              </b>
              <span className={s.objMax}>/{o.max}</span>
            </>
          ) : (
            <span className={s.objMax}>{done ? '완료' : ''}</span>
          )}
          {flashOn && o.flashSeq > 0 && o.delta > 0 && (
            <em key={`d${o.flashSeq}`} className={s.objDelta}>
              +{o.delta}
            </em>
          )}
        </span>
        {o.max > 1 ? (
          <span className={s.objBar}>
            <i style={{ width: `${(o.cur / o.max) * 100}%` }} />
            {/* 해설 번호는 바 오른쪽 부분에 — 번호가 목표 문구를 가리지 않게 */}
            {isTarget && <b className={s.objBarMark} data-part="tracker-progress" />}
          </span>
        ) : (
          // 바가 없는 목표(1회 행동)도 해설 번호가 갈 자리를 남긴다
          isTarget && (
            <span className={s.objBarGhost}>
              <b className={s.objBarMark} data-part="tracker-progress" />
            </span>
          )
        )}
      </div>
    )
  }

  const tracker =
    trackerMode === 'single-focus' ? (
      <div className={s.focus} data-part="tracker-panel">
        {focusQuest && (
          <div key={focusQuest.id} className={s.focusInner} data-phase={focusQuest.phase}>
            <div className={s.focusHead}>
              <span className={s.kindMain}>
                <KindIcon kind="main" size={22} />
              </span>
              <span className={s.focusTitle}>{focusQuest.title}</span>
              {focusQuest.phase === 'done' || focusQuest.phase === 'collapse' ? <span className={s.doneTag}>완료</span> : null}
            </div>
            {objRow(focusQuest, focusRow(focusQuest), true)}
            <div className={s.focusMore}>
              <KeyCap label="Tab" size={30} /> 추적 중 {x.quests.length}개 · 목록 보기
            </div>
          </div>
        )}
      </div>
    ) : (
      <div className={s.tracker} data-part="tracker-panel">
        <div className={s.trackerHead}>
          <span>추적 중인 임무</span>
          <span className={s.trackerKey}>
            <KeyCap label="Tab" size={30} />
          </span>
        </div>
        {x.quests.map(quest => (
          <section key={quest.id + quest.kind} className={s.quest} data-phase={quest.phase} data-kind={quest.kind}>
            <div className={s.questInner}>
              <div className={s.questKind}>
                <KindIcon kind={quest.kind} size={20} />
                {quest.kind === 'main' ? '주 임무' : '반복 과제'}
              </div>
              <div className={s.questTitle}>
                {quest.title}
                {(quest.phase === 'done' || quest.phase === 'collapse') && <span className={s.doneTag}>완료</span>}
              </div>
              {quest.objectives.map(o => objRow(quest, o))}
            </div>
          </section>
        ))}
      </div>
    )

  const pending = q.pending.length

  return (
    <div
      className={s.root}
      data-juice={juice || undefined}
      data-paused={!p.playing || undefined}
      data-layout={portrait ? 'portrait' : 'landscape'}
      data-tracker={trackerMode}
      data-frozen={frozenNow || undefined}
      style={{ '--ts': p.timeScale } as CSSProperties}
    >
      <World width={p.width} height={p.height} allyAside={stackAnchor === 'bottom-center-up'} />

      {tracker}

      {/* 토스트 스택 — 같은 자리, 같은 방향. 대기 표시는 다음 카드가 들어올 쪽 끝에 */}
      <div className={s.dock} data-anchor={stackAnchor}>
        <div className={s.stack} data-part="toast-stack">
          {x.cards.map(c => {
            const t = c.t
            return (
              <div key={t.uid} className={s.slot} data-phase={c.phase} data-why={c.why}>
                <div className={s.card} data-rarity={t.rarity}>
                  <span className={s.stripe} data-part={c === stripeCard ? 'toast-rarity-stripe' : undefined} />
                  <span className={s.numeral} aria-label={RARITY_NAME[t.rarity]}>
                    {RARITY_NUMERAL[t.rarity]}
                  </span>
                  <span className={s.icon}>
                    <ItemIcon id={t.icon} size={38} />
                  </span>
                  <span className={s.label}>
                    {t.label}
                    {t.rarity >= 2 && <em className={s.rarityWord}>{RARITY_NAME[t.rarity]}</em>}
                  </span>
                  {badgeVisible(t) && (
                    <span key={`b${c.bump}`} className={s.badge} data-bump={c.bump > 0 || undefined} data-part={c === badgeCard ? 'toast-count-badge' : undefined}>
                      {t.unit === 'plus' ? `+${t.amount}` : `×${t.amount}`}
                    </span>
                  )}
                  <span className={s.timer}>
                    <i
                      ref={el => {
                        if (el) timerEls.current.set(t.uid, el)
                        else timerEls.current.delete(t.uid)
                      }}
                    />
                    {/* 해설 번호는 막대 오른쪽 끝에 — 카드 문구를 가리지 않게 */}
                    {c === timerCard && <b className={s.timerMark} data-part="toast-timer" />}
                  </span>
                </div>
              </div>
            )
          })}
          {/* 카드가 하나도 없을 때도 해설 번호가 갈 자리 */}
          {/* 배지 자리는 스택 맨 위 오른쪽 — 번호가 스택 바깥에 떠서 카드 문구를 가리지 않게 */}
          {!badgeCard && <i className={s.phBadge} data-part="toast-count-badge" />}
          {!stripeCard && <i className={s.ph} data-part="toast-rarity-stripe" />}
          {!timerCard && <i className={s.ph} data-part="toast-timer" />}
        </div>
        <div className={s.overflow} data-show={(juice && pending > 0) || undefined}>
          <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
            <rect x="4" y="11" width="22" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2.4" />
            <path d="M7 7.5h16M10 4h10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          <b>+{pending}</b> 대기
        </div>
      </div>

      {/* 우선 배너 — 일반 큐와 별도 채널 */}
      {x.banner && (
        <div key={x.banner.seq} className={s.banner} data-phase={x.banner.phase}>
          <span className={s.bannerEmblem}>
            <Emblem size={72} />
          </span>
          <div className={s.bannerText}>
            <span className={s.bannerEyebrow}>{x.banner.eyebrow}</span>
            <span className={s.bannerTitle}>{x.banner.title}</span>
            <span className={s.bannerSub}>{x.banner.sub}</span>
          </div>
        </div>
      )}

      {portrait && <TouchControls />}

      {/* 학습용: 큐 상태 */}
      {!p.thumbnail && (
        <div className={s.debug}>
          <span className={s.debugTitle}>큐 상태</span>
          {juice ? (
            <>
              <span>
                표시 <b>{q.active.length}</b>/{maxVisible}
              </span>
              <span>
                대기 <b>{pending}</b>
              </span>
              <span>
                병합 <b>{q.stats.merged}</b>
              </span>
              <span>
                선점 <b>{q.stats.preempted}</b>
              </span>
            </>
          ) : (
            <span className={s.debugBad}>큐 없음 · 받는 즉시 전부 표시 ({shown.length}장)</span>
          )}
          <span className={s.debugTimer} data-frozen={frozenNow || undefined}>
            {frozenNow ? `⏸ 타이머 멈춤 (${frozenWhy})` : '▶ 타이머 흐름'}
          </span>
        </div>
      )}

      {x.paused && (
        <div className={s.pause}>
          <div className={s.pauseCard}>
            <div className={s.pauseTitle}>일시정지</div>
            <ul className={s.pauseMenu}>
              <li data-on>계속하기</li>
              <li>임무 목록</li>
              <li>설정</li>
            </ul>
            <div className={s.pauseNote} data-frozen={frozenNow || undefined}>
              {frozenNow ? (
                <>
                  <b>⏸ 알림 타이머 멈춤</b>
                  <span>메뉴를 보는 동안 알림을 놓치지 않는다</span>
                </>
              ) : (
                <>
                  <b>▶ 알림 타이머 계속 흐름</b>
                  <span>돌아오면 알림이 이미 사라져 있다</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** 9:16 — 모바일 가상 패드(장식). 토스트·트래커가 엄지 영역을 피해 배치되는 것을 보여 준다 */
function TouchControls() {
  return (
    <svg className={s.touch} width="1080" height="420" viewBox="0 0 1080 420" aria-hidden>
      <circle cx="210" cy="210" r="130" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.35)" strokeWidth="4" />
      <circle cx="210" cy="210" r="56" fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.6)" strokeWidth="4" />
      <circle cx="880" cy="250" r="88" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.5)" strokeWidth="4" />
      <circle cx="730" cy="300" r="54" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.35)" strokeWidth="4" />
      <circle cx="760" cy="150" r="54" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.35)" strokeWidth="4" />
      <circle cx="900" cy="90" r="54" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.35)" strokeWidth="4" />
    </svg>
  )
}
