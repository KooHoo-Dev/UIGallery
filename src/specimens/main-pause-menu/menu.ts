import { getPanel, siblingsOf, stepFocus, type Item } from './data'

/* ──────────────────────────────────────────────────────────────
 * 메뉴 스택 상태 기계 (화면과 분리된 순수 로직)
 *  - 스택: push(확인) / pop(뒤로) / replaceTop(Q·E 페이지 전환)
 *  - 전환 연출 중(busy) 입력: buffer(버퍼 후 적용) · drop(버림) · leak(이전 패널이 받음 = 흔한 버그)
 *  - 한 입력은 한 단계만 소비. 메뉴가 닫히면 남은 입력은 버리고 짧게 입력 잠금
 * 시간 t 는 게임 시간(초, 배속 반영). 모든 전환 길이는 transitionMs 에서 비율로 계산한다.
 * ────────────────────────────────────────────────────────────── */

export type Input = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'back' | 'pagePrev' | 'pageNext' | 'pause'
export type Dev = 'keyboard' | 'gamepad' | 'mouse' | 'touch'
export type BusyMode = 'buffer' | 'drop' | 'leak'
export type AnimKind = 'none' | 'open' | 'close' | 'push' | 'pop' | 'page' | 'screen' | 'dialog'
export type Slot = 'L' | 'R' | 'P' | 'S' | 'H'
export type Tone = 'ok' | 'buf' | 'drop' | 'bad'
export type EnterMode = 'right' | 'left' | 'fade' | 'open' | 'none'

export interface Config {
  juice: boolean
  style: 'slide' | 'fade' | 'cut'
  ms: number
  remember: boolean
  busy: BusyMode
}

export interface Level {
  panel: string
  focus: number
}

/** 화면에 놓인 패널 하나 (스택 칸 또는 미리보기) */
export interface Vis {
  key: string
  panel?: string
  card?: Item
  focus: number
  slot: Slot
  role: 'active' | 'parent' | 'spine' | 'preview'
  index: number
}

export interface Ghost extends Vis {
  mode: EnterMode
  until: number
}

export interface LogEntry {
  id: number
  key: string
  text: string
  tone: Tone
}

export interface Sim {
  t: number
  version: number
  screen: 'game' | 'menu'
  ctx: 'pause' | 'title'
  stack: Level[]
  dialog: null | { focus: 0 | 1; openedAt: number }
  mem: Record<string, number>
  values: Record<string, string>
  focusLost: boolean
  anim: { kind: AnimKind; dir: 1 | -1; dur: number; seq: number }
  busyUntil: number
  lockUntil: number
  closingUntil: number
  queue: { input: Input; dev: Dev }[]
  log: LogEntry[]
  logSeq: number
  ghosts: Ghost[]
  enter: Record<string, EnterMode>
  /** 등장 연출이 다 끝나는 시각 — 지나면 enter 표시를 지워, 나중에 전환 길이가 바뀌어도 연출이 다시 돌지 않게 */
  enterClearAt: number
  openSeq: number
  screenSeq: number
  pick: { seq: number; id: string }
  /** 전환 직전 스택 — leak(이전 패널이 입력을 받는 버그) 재현용 */
  prevStack: Level[] | null
  macro: { at: number; run: () => void }[]
  ripple: { x: number; y: number; seq: number } | null
}

const QUEUE_MAX = 4
/** 메뉴가 닫힌 뒤 입력 잠금 (초) */
const CLOSE_LOCK = 0.25
/** 확인 창이 막 열린 뒤 확정 입력 잠금 (초) — 공통 용어 '입력 잠금' */
const DIALOG_LOCK = 0.3

export function createSim(): Sim {
  return {
    t: 0,
    version: 0,
    screen: 'menu',
    ctx: 'pause',
    stack: [{ panel: 'pause', focus: 1 }],
    dialog: null,
    mem: {},
    values: {},
    focusLost: false,
    anim: { kind: 'none', dir: 1, dur: 0, seq: 0 },
    busyUntil: -1,
    lockUntil: -1,
    closingUntil: 0,
    queue: [],
    log: [],
    logSeq: 0,
    ghosts: [],
    enter: {},
    enterClearAt: 0,
    openSeq: 0,
    screenSeq: 0,
    pick: { seq: 0, id: '' },
    prevStack: null,
    macro: [],
    ripple: null,
  }
}

/** 전환 길이(ms) — transitionMs 에서 비율로 */
export function durOf(kind: AnimKind, cfg: Config): number {
  if (!cfg.juice || cfg.style === 'cut') return 0
  const k = { none: 0, open: 0.9, close: 0.65, push: 1, pop: 0.7, page: 0.65, screen: 1.5, dialog: 0.8 }[kind]
  return cfg.ms * k
}

export const top = (sim: Sim) => sim.stack[sim.stack.length - 1]

/* ───── 화면 배치 ───── */

export function visible(sim: Sim): Vis[] {
  const d = sim.stack.length
  const t = d - 1
  const out: Vis[] = sim.stack.map((lv, i) => {
    const slot: Slot = d === 1 ? 'L' : i === t ? 'R' : i === t - 1 ? 'L' : i === t - 2 ? 'S' : 'H'
    const role: Vis['role'] = i === t ? 'active' : i === t - 1 ? 'parent' : 'spine'
    return { key: `${i}:${lv.panel}`, panel: lv.panel, focus: lv.focus, slot, role, index: i }
  })
  if (d === 1) {
    const root = getPanel(sim.stack[0].panel, sim.values)
    const it = root.items[sim.stack[0].focus]
    if (it?.to) out.push({ key: `1:${it.to}`, panel: it.to, focus: sim.mem[it.to] ?? 0, slot: 'P', role: 'preview', index: 1 })
    else if (it) out.push({ key: `card:${sim.ctx}:${it.id}`, card: it, focus: 0, slot: 'P', role: 'preview', index: 1 })
  }
  return out
}

/** 상태를 바꾸고, 사라진 패널은 유령(퇴장 연출)으로 남기고, 새 패널은 등장 방식을 기록한다 */
function mutate(sim: Sim, cfg: Config, fn: () => void) {
  const before = visible(sim)
  const animSeq = sim.anim.seq
  fn()
  const after = visible(sim)
  const changedAnim = sim.anim.seq !== animSeq
  const kind = changedAnim ? sim.anim.kind : 'none'
  const dur = changedAnim ? sim.anim.dur : cfg.juice && cfg.style !== 'cut' ? cfg.ms * 0.5 : 0
  const keys = new Set(after.map(v => v.key))
  const prevKeys = new Set(before.map(v => v.key))
  const leaveMode: EnterMode = kind === 'pop' ? 'right' : kind === 'page' ? (sim.anim.dir > 0 ? 'left' : 'right') : 'fade'
  const enterMode: EnterMode =
    kind === 'push' ? 'right' : kind === 'page' ? (sim.anim.dir > 0 ? 'right' : 'left') : kind === 'open' || kind === 'screen' ? 'open' : 'fade'
  if (dur > 0 && kind !== 'open' && kind !== 'screen' && kind !== 'close') {
    for (const v of before) if (!keys.has(v.key)) sim.ghosts.push({ ...v, role: v.role === 'active' || v.role === 'preview' ? v.role : 'parent', mode: leaveMode, until: sim.t + dur / 1000 })
  }
  for (const v of after) if (!prevKeys.has(v.key) || kind === 'open' || kind === 'screen') sim.enter[v.key] = dur > 0 ? enterMode : 'none'
  sim.enterClearAt = Math.max(sim.enterClearAt, sim.t + dur / 1000 + 0.45)
  sim.version++
}

function begin(sim: Sim, cfg: Config, kind: AnimKind, dir: 1 | -1 = 1) {
  const dur = durOf(kind, cfg)
  sim.prevStack = sim.stack.map(l => ({ ...l }))
  sim.anim = { kind, dir, dur, seq: sim.anim.seq + 1 }
  sim.busyUntil = sim.t + dur / 1000
  // 패널이 바뀌면 새 패널의 항목이 선택된다 (나쁜 예의 '선택 없음'도 여기서 풀린다)
  sim.focusLost = false
}

export function log(sim: Sim, key: string, text: string, tone: Tone) {
  sim.log = [{ id: ++sim.logSeq, key, text, tone }, ...sim.log].slice(0, 4)
  sim.version++
}

export function inputName(inp: Input, dev: Dev): string {
  if (dev === 'gamepad')
    return { up: '십자 ↑', down: '십자 ↓', left: '십자 ←', right: '십자 →', confirm: '아래 버튼', back: '오른쪽 버튼', pagePrev: 'L', pageNext: 'R', pause: '메뉴 버튼' }[inp]
  if (dev === 'mouse' || dev === 'touch') return inp === 'confirm' ? '클릭' : inp === 'back' ? '우클릭' : '포인터'
  return { up: '↑', down: '↓', left: '←', right: '→', confirm: 'Enter', back: 'Esc', pagePrev: 'Q', pageNext: 'E', pause: 'Esc' }[inp]
}

/* ───── 입력 ───── */

/** 입력 하나 — 잠금 → 전환 중 처리(버퍼/버림/새어 나감) → 적용 */
export function input(sim: Sim, cfg: Config, inp: Input, dev: Dev) {
  const name = inputName(inp, dev)
  const safe = cfg.juice && cfg.busy !== 'leak'
  if (safe && sim.t < sim.lockUntil) {
    log(sim, name, '닫힌 직후 입력 잠금 — 버림', 'drop')
    return
  }
  if (sim.t < sim.busyUntil) {
    if (cfg.busy === 'buffer') {
      if (sim.queue.length >= QUEUE_MAX) log(sim, name, '버퍼 가득 참 — 버림', 'drop')
      else {
        sim.queue.push({ input: inp, dev })
        log(sim, name, '전환 중 — 버퍼에 보관', 'buf')
      }
      return
    }
    if (cfg.busy === 'drop') {
      log(sim, name, '전환 중 — 무시됨 (다시 눌러야 함)', 'drop')
      return
    }
    // leak: 전환 전 패널이 아직 확정을 받는다 → 같은 패널이 한 번 더 열린다
    if (inp === 'confirm' && sim.prevStack && sim.screen === 'menu' && !sim.dialog) {
      const prev = sim.prevStack[sim.prevStack.length - 1]
      const it = getPanel(prev.panel, sim.values).items[prev.focus]
      if (it?.to && sim.stack.length < 6) {
        mutate(sim, cfg, () => {
          sim.stack.push({ panel: it.to!, focus: 0 })
          begin(sim, cfg, 'push')
        })
        log(sim, name, `이전 패널이 확정을 받음 — '${it.label}' 두 번 열림`, 'bad')
        return
      }
    }
  }
  apply(sim, cfg, inp, dev, name)
}

function apply(sim: Sim, cfg: Config, inp: Input, dev: Dev, name: string) {
  const safe = cfg.juice && cfg.busy !== 'leak'
  /* 게임 중: Esc = 일시정지 */
  if (sim.screen === 'game') {
    if (inp === 'pause' || (inp === 'back' && dev !== 'gamepad')) {
      const reopened = sim.t < sim.closingUntil + 0.6 && !safe
      mutate(sim, cfg, () => open(sim, cfg))
      log(sim, name, reopened ? '닫히자마자 다시 열림 (입력 관통)' : '일시정지 — 같은 프레임에 반응', reopened ? 'bad' : 'ok')
    }
    return
  }

  /* 확인 창 */
  if (sim.dialog) {
    const dlg = sim.dialog
    if (inp === 'left' || inp === 'up') setDialog(sim, 0)
    else if (inp === 'right' || inp === 'down') setDialog(sim, 1)
    else if (inp === 'back') {
      closeDialog(sim, cfg)
      log(sim, name, '확인 창 닫기 — 한 칸만', 'ok')
    } else if (inp === 'confirm') {
      if (cfg.juice && sim.t - dlg.openedAt < DIALOG_LOCK) {
        log(sim, name, '창이 막 열림 — 확정 입력 잠금', 'drop')
        return
      }
      if (dlg.focus === 0) {
        closeDialog(sim, cfg)
        log(sim, name, '취소 — 메뉴로', 'ok')
      } else {
        mutate(sim, cfg, () => {
          begin(sim, cfg, 'screen')
          sim.dialog = null
          sim.ctx = 'title'
          sim.stack = [{ panel: 'title', focus: 0 }]
          sim.screenSeq++
          sim.queue = []
        })
        log(sim, name, '타이틀 화면으로', cfg.juice ? 'ok' : 'bad')
      }
    }
    return
  }

  const lv = top(sim)
  const panel = getPanel(lv.panel, sim.values)

  /* 나쁜 예: 빈 곳 클릭으로 선택이 풀린 상태 */
  if (sim.focusLost && inp !== 'back' && inp !== 'pause') {
    log(sim, name, '선택 대상 없음 (null) — 입력이 갈 곳이 없다', 'bad')
    return
  }

  if (inp === 'up' || inp === 'down') {
    const f = stepFocus(panel, lv.focus, inp === 'down' ? 1 : -1)
    mutate(sim, cfg, () => {
      lv.focus = f
      sim.mem[lv.panel] = f
    })
    log(sim, name, `포커스 → ${panel.items[f].label}`, 'ok')
    return
  }
  if (inp === 'left' || inp === 'right') return

  if (inp === 'confirm') {
    const it = panel.items[lv.focus]
    if (!it || it.disabled) return
    if (it.to) {
      const sub = getPanel(it.to, sim.values)
      const want = cfg.remember && cfg.juice ? (sim.mem[it.to] ?? 0) : 0
      const f = sub.items[want]?.disabled ? stepFocus(sub, want, 1) : want
      mutate(sim, cfg, () => {
        sim.stack.push({ panel: it.to!, focus: f })
        begin(sim, cfg, 'push')
      })
      log(sim, name, `'${it.label}' 열기 — 스택 ${sim.stack.length}칸`, 'ok')
    } else if (it.action === 'resume') {
      close(sim, cfg, name, '이어하기 — 게임으로')
    } else if (it.action === 'toTitle') {
      mutate(sim, cfg, () => {
        begin(sim, cfg, 'dialog')
        // 확인 창의 기본 포커스는 안전한 쪽(취소). 나쁜 예는 '확인'
        sim.dialog = { focus: cfg.juice ? 0 : 1, openedAt: sim.t }
      })
      log(sim, name, cfg.juice ? '확인 창 — 기본 포커스는 취소' : '확인 창 — 기본 포커스가 확인', cfg.juice ? 'ok' : 'bad')
    } else if (it.action === 'continue' || it.action === 'newGame') {
      const cont = it.action === 'continue'
      mutate(sim, cfg, () => {
        begin(sim, cfg, 'screen')
        sim.ctx = 'pause'
        sim.stack = [{ panel: 'pause', focus: 0 }]
        sim.screenSeq++
        sim.openSeq++
        sim.queue = []
        if (!cont) {
          sim.screen = 'game'
          sim.closingUntil = sim.t
        }
      })
      log(sim, name, cont ? '이어하기 — 일시정지 메뉴로' : '새 탐사 — 게임 시작', 'ok')
    } else if (it.action === 'pick') {
      const key = lv.panel.slice(2)
      mutate(sim, cfg, () => {
        sim.values[key] = it.label
        sim.pick = { seq: sim.pick.seq + 1, id: it.id }
      })
      log(sim, name, `선택: ${it.label}`, 'ok')
    }
    return
  }

  if (inp === 'back') {
    if (sim.stack.length > 1) {
      const leaving = getPanel(lv.panel, sim.values).title
      mutate(sim, cfg, () => {
        sim.stack.pop()
        const nt = top(sim)
        // 포커스를 기억하지 않는 나쁜 예: 돌아오면 늘 첫 항목
        if (!(cfg.remember && cfg.juice)) nt.focus = stepFocus(getPanel(nt.panel, sim.values), -1, 1)
        begin(sim, cfg, 'pop')
      })
      log(sim, name, `'${leaving}' 닫기 — 한 칸 뒤로`, 'ok')
    } else if (sim.ctx === 'pause') close(sim, cfg, name, '스택 바닥 — 메뉴 닫기')
    else log(sim, name, '타이틀 바닥 — 더 돌아갈 곳 없음', 'drop')
    return
  }

  if (inp === 'pagePrev' || inp === 'pageNext') {
    if (sim.stack.length < 2) {
      log(sim, name, '카테고리 단축키는 하위 메뉴에서만', 'drop')
      return
    }
    const parentLv = sim.stack[sim.stack.length - 2]
    const parent = getPanel(parentLv.panel, sim.values)
    const sibs = siblingsOf(parent)
    const cur = sibs.findIndex(s => s.index === parentLv.focus)
    if (sibs.length < 2 || cur < 0) {
      log(sim, name, '옆 카테고리 없음', 'drop')
      return
    }
    const dir = inp === 'pageNext' ? 1 : -1
    const next = sibs[(cur + dir + sibs.length) % sibs.length]
    const sub = getPanel(next.item.to!, sim.values)
    const want = cfg.remember && cfg.juice ? (sim.mem[next.item.to!] ?? 0) : 0
    mutate(sim, cfg, () => {
      parentLv.focus = next.index
      sim.mem[parentLv.panel] = next.index
      sim.stack[sim.stack.length - 1] = { panel: next.item.to!, focus: sub.items[want]?.disabled ? stepFocus(sub, want, 1) : want }
      begin(sim, cfg, 'page', dir)
    })
    log(sim, name, `옆 카테고리 → ${next.item.label} (깊이 그대로)`, 'ok')
    return
  }

  if (inp === 'pause') {
    if (sim.ctx === 'pause') close(sim, cfg, name, '메뉴 버튼 — 어느 깊이에서든 닫기')
  }
}

function open(sim: Sim, cfg: Config) {
  begin(sim, cfg, 'open')
  sim.screen = 'menu'
  sim.ctx = 'pause'
  sim.stack = [{ panel: 'pause', focus: 0 }]
  sim.dialog = null
  sim.focusLost = false
  sim.openSeq++
}

function close(sim: Sim, cfg: Config, name: string, text: string) {
  const safe = cfg.juice && cfg.busy !== 'leak'
  mutate(sim, cfg, () => {
    begin(sim, cfg, 'close')
    sim.screen = 'game'
    sim.closingUntil = sim.t + durOf('close', cfg) / 1000
    sim.dialog = null
    sim.focusLost = false
  })
  log(sim, name, text, 'ok')
  if (safe) {
    // 남은 입력은 버리고, 닫힘 연출 + 0.25초 동안 잠근다 → 연타해도 다시 열리지 않는다
    if (sim.queue.length) log(sim, '버퍼', `메뉴 닫힘 — 남은 입력 ${sim.queue.length}개 버림`, 'drop')
    sim.queue = []
    sim.lockUntil = sim.closingUntil + CLOSE_LOCK
  }
}

function setDialog(sim: Sim, f: 0 | 1) {
  if (sim.dialog && sim.dialog.focus !== f) {
    sim.dialog = { ...sim.dialog, focus: f }
    sim.version++
  }
}

function closeDialog(sim: Sim, cfg: Config) {
  mutate(sim, cfg, () => {
    sim.dialog = null
  })
}

/* ───── 포인터 ───── */

/** 마우스가 항목 위로 — 포커스를 같은 하나로 통일 (전환 중에는 무시) */
export function hover(sim: Sim, cfg: Config, index: number) {
  if (sim.screen !== 'menu' || sim.dialog || sim.t < sim.busyUntil) return
  const lv = top(sim)
  const panel = getPanel(lv.panel, sim.values)
  if (panel.items[index]?.disabled) return
  if (lv.focus === index && !sim.focusLost) return
  mutate(sim, cfg, () => {
    lv.focus = index
    sim.mem[lv.panel] = index
    sim.focusLost = false
  })
}

export function hoverDialog(sim: Sim, f: 0 | 1) {
  setDialog(sim, f)
}

/** 메뉴 빈 곳 클릭 — 좋은 예는 포커스 유지, 나쁜 예는 선택이 풀린다 */
export function clickEmpty(sim: Sim, cfg: Config, x: number, y: number) {
  sim.ripple = { x, y, seq: (sim.ripple?.seq ?? 0) + 1 }
  if (sim.screen !== 'menu') {
    sim.version++
    return
  }
  if (cfg.juice) log(sim, '클릭', '빈 곳 클릭 — 포커스는 마지막 항목에 그대로', 'ok')
  else {
    sim.focusLost = true
    log(sim, '클릭', '빈 곳 클릭 — 선택이 풀림 (null)', 'bad')
  }
}

/* ───── 매 프레임 ───── */

/** 시간 진행: 유령 정리 → 예약 입력(매크로) → 전환이 끝났으면 버퍼에서 하나 꺼내 적용 */
export function tick(sim: Sim, cfg: Config, dt: number) {
  // 첫 프레임의 rAF 시각이 effect 시작 시각보다 앞설 수 있어 dt 가 음수가 될 수 있다 → 0 으로
  sim.t += Math.max(0, dt)
  if (sim.ghosts.length && sim.ghosts.some(g => g.until <= sim.t)) {
    sim.ghosts = sim.ghosts.filter(g => g.until > sim.t)
    sim.version++
  }
  if (sim.enterClearAt && sim.t > sim.enterClearAt) {
    sim.enter = {}
    sim.enterClearAt = 0
    sim.version++
  }
  if (sim.macro.length) {
    const due = sim.macro.filter(m => m.at <= sim.t)
    if (due.length) {
      sim.macro = sim.macro.filter(m => m.at > sim.t)
      due.forEach(m => m.run())
    }
  }
  if (sim.t >= sim.busyUntil && sim.queue.length) {
    const q = sim.queue.shift()!
    sim.version++
    apply(sim, cfg, q.input, q.dev, inputName(q.input, q.dev) + '·버퍼')
  }
}

/** 예약 입력 — 이벤트 버튼이 '사람이 연달아 누른 것'을 재현할 때 */
export function schedule(sim: Sim, delay: number, run: () => void) {
  sim.macro.push({ at: sim.t + delay, run })
}

/** 화면에 보일 경로 (브레드크럼) */
export function pathOf(sim: Sim): string[] {
  return sim.stack.map(l => getPanel(l.panel, sim.values).title)
}
