/* ──────────────────────────────────────────────────────────────
 * 팝업 관리자 시뮬레이션 (React 와 무관한 순수 로직)
 *
 * - 레이어: normal(일반 창) < system(연결 끊김·종료 확인) < toast(입력을 막지 않는 알림)
 * - 대기열: 접속 팝업은 우선순위 순으로 하나씩. 일반·시스템 창이 열려 있으면 기다린다
 * - 뒤로가기: 맨 위 창 하나만 닫는다. 닫을 수 없는 창이면 흔들고 이유를 알려 준다. 창이 없으면 종료 확인
 * - 딤: 맨 위 창 바로 아래에 한 장. 뒤 화면 입력을 막고, 탭하면 창 종류에 따라 닫거나 '막힘'을 보여 준다
 *
 * 나쁜 예(good=false)는 같은 입력을 흔한 실수 방식으로 처리한다:
 * 대기열 없이 한꺼번에, 레이어 없이 연 순서대로, 딤이 입력을 막지 않음(관통), 뒤로가기 한 번에 전부 닫기 → 앱 종료.
 * ────────────────────────────────────────────────────────────── */

export type Layer = 'normal' | 'system'
export type Kind = 'notice' | 'attend' | 'event' | 'reward' | 'mail' | 'shop' | 'buy' | 'dismantle' | 'offline' | 'quit'

export interface Def {
  title: string
  layer: Layer
  /** 딤(바깥)을 탭하면 닫히는 가벼운 창인가 */
  dimClose: boolean
  /** 뒤로가기로 닫을 수 있는가 (연결 끊김처럼 반드시 버튼으로 해결해야 하는 창은 false) */
  backClose: boolean
  /** 접속 팝업 대기열 우선순위 (작을수록 먼저) */
  priority: number
  /** 논리 해상도 기준 창 너비 */
  w: number
}

export const DEFS: Record<Kind, Def> = {
  notice: { title: '점검 예고', layer: 'normal', dimClose: false, backClose: true, priority: 1, w: 900 },
  attend: { title: '출석 보상', layer: 'normal', dimClose: false, backClose: true, priority: 2, w: 980 },
  event: { title: '이벤트', layer: 'normal', dimClose: true, backClose: true, priority: 3, w: 980 },
  reward: { title: '탐사 보상', layer: 'normal', dimClose: false, backClose: true, priority: 2, w: 820 },
  mail: { title: '우편함', layer: 'normal', dimClose: true, backClose: true, priority: 9, w: 900 },
  shop: { title: '보급 상점', layer: 'normal', dimClose: true, backClose: true, priority: 9, w: 1040 },
  buy: { title: '구매 확인', layer: 'normal', dimClose: false, backClose: true, priority: 9, w: 720 },
  dismantle: { title: '분해 확인', layer: 'normal', dimClose: false, backClose: true, priority: 9, w: 760 },
  offline: { title: '연결 끊김', layer: 'system', dimClose: false, backClose: false, priority: 0, w: 760 },
  quit: { title: '게임 종료', layer: 'system', dimClose: true, backClose: true, priority: 0, w: 680 },
}

export const SHOP_ITEMS = [
  { id: 'cell', name: '냉각 셀 ×5', price: 500 },
  { id: 'kit', name: '수리 키트', price: 1200 },
  { id: 'oxy', name: '산소 캔 ×10', price: 800 },
  { id: 'chip', name: '회로 조각 ×20', price: 2000 },
] as const
export type ShopItem = (typeof SHOP_ITEMS)[number]

export type DimTap = 'by-type' | 'always' | 'never'
export type RootBack = 'confirm' | 'ignore' | 'quit'
export type QueueMode = 'queue' | 'all'

export interface Cfg {
  good: boolean
  queueMode: QueueMode
  dimTap: DimTap
  rootBack: RootBack
  holdMs: number
  transitionMs: number
  queueGapMs: number
  /** 재생 배속 — 열림 연출(CSS)은 실제 시간으로 흐르므로 입력 잠금도 실제 시간으로 잰다 */
  timeScale: number
}

export interface OpenPopup {
  kind: Kind
  /** 연 시각 (게임 시간 초) — 열리는 연출 중 입력을 막는 데 쓴다 */
  at: number
  /** 전체에서 몇 번째로 열렸나 — 나쁜 예의 '연 순서대로' 겹치기 */
  order: number
  /** 연 실제 시각(ms) — 일시정지 중에도 CSS 연출은 끝나므로 입력 잠금은 이것으로 */
  realAt: number
}

export type Tone = 'ok' | 'info' | 'warn' | 'bad'

export interface Sim {
  t: number
  open: OpenPopup[]
  queue: Kind[]
  order: number
  tasks: { at: number; fn: () => void }[]
  toasts: { id: number; text: string; until: number }[]
  toastSeq: number
  log: { text: string; tone: Tone }[]
  credits: number
  mailCount: number
  eventMuted: boolean
  eventChecked: boolean
  buyItem: ShopItem
  /** 맨 위 창에서 키보드 포커스가 있는 버튼 */
  focus: number
  hold: { active: boolean; p: number }
  retrying: boolean
  /** 앱 종료 데모 화면이 끝나는 시각 */
  quitUntil: number
  /** 마지막 탭 위치 표시 (논리 좌표) */
  ripple: { x: number; y: number; at: number; blocked: boolean } | null
  bump: { kind: Kind; at: number } | null
  shake: { kind: Kind; at: number } | null
  version: number
}

export function createSim(): Sim {
  return {
    t: 0,
    open: [],
    queue: [],
    order: 0,
    tasks: [],
    toasts: [],
    toastSeq: 0,
    log: [],
    credits: 12400,
    mailCount: 3,
    eventMuted: false,
    eventChecked: false,
    buyItem: SHOP_ITEMS[0],
    focus: 0,
    hold: { active: false, p: 0 },
    retrying: false,
    quitUntil: 0,
    ripple: null,
    bump: null,
    shake: null,
    version: 0,
  }
}

const touch = (s: Sim) => s.version++

export function log(s: Sim, text: string, tone: Tone = 'info') {
  s.log.unshift({ text, tone })
  s.log.length = Math.min(s.log.length, 4)
  touch(s)
}

export function toast(s: Sim, text: string, sec = 1.8) {
  s.toasts.push({ id: ++s.toastSeq, text, until: s.t + sec })
  if (s.toasts.length > 2) s.toasts.shift()
  touch(s)
}

const schedule = (s: Sim, sec: number, fn: () => void) => s.tasks.push({ at: s.t + sec, fn })

/* ───── 레이어 · 순서 ───── */

/** 화면에 그려지는 순서 (아래 → 위) */
export function drawOrder(s: Sim, cfg: Cfg): OpenPopup[] {
  const byOrder = [...s.open].sort((a, b) => a.order - b.order)
  if (!cfg.good) return byOrder
  return [...byOrder.filter(o => DEFS[o.kind].layer === 'normal'), ...byOrder.filter(o => DEFS[o.kind].layer === 'system')]
}

export const topPopup = (s: Sim, cfg: Cfg): OpenPopup | undefined => drawOrder(s, cfg).at(-1)

/** z-index: 일반 레이어 100번대, 시스템 레이어 1000번대. 딤은 맨 위 창 바로 아래(−1) */
export function zIndexOf(s: Sim, cfg: Cfg, kind: Kind): number {
  const list = drawOrder(s, cfg)
  const i = list.findIndex(o => o.kind === kind)
  if (i < 0) return 0
  if (!cfg.good) return 100 + i * 2
  const layer = DEFS[kind].layer
  const rank = list.filter(o => DEFS[o.kind].layer === layer).findIndex(o => o.kind === kind)
  return (layer === 'system' ? 1000 : 100) + rank * 2
}

export const isOpen = (s: Sim, kind: Kind) => s.open.some(o => o.kind === kind)

/** 열리는 연출 중인가 — 이때 들어온 클릭은 무시한다 (연타로 두 번 실행 방지) */
export const isBusy = (s: Sim, cfg: Cfg, kind: Kind) => {
  const o = s.open.find(x => x.kind === kind)
  return !!o && cfg.good && performance.now() - o.realAt < cfg.transitionMs / Math.max(0.05, cfg.timeScale)
}

/* ───── 버튼 정의 (키보드 포커스·기본 포커스용) ───── */

export interface Btn {
  id: string
  label: string
  /** 안전한 쪽 (취소). 위험한 창의 기본 포커스 */
  safe?: boolean
  /** 길게 눌러 확정 */
  hold?: boolean
  primary?: boolean
  /** 위험한 확정 (빨간 테두리) */
  danger?: boolean
}

export function buttonsOf(s: Sim, kind: Kind): Btn[] {
  switch (kind) {
    case 'notice':
      return [{ id: 'ok', label: '확인', primary: true }]
    case 'attend':
      return [{ id: 'claim', label: '받기', primary: true }]
    case 'event':
      return [
        { id: 'close', label: '닫기', safe: true },
        { id: 'go', label: '이벤트 보기', primary: true },
      ]
    case 'reward':
      return [{ id: 'claim', label: '받기', primary: true }]
    case 'mail':
      return [{ id: 'claimAll', label: s.mailCount ? '모두 받기' : '받을 우편 없음', primary: true }]
    case 'shop':
      return [{ id: 'close', label: '닫기', safe: true }]
    case 'buy':
      return [
        { id: 'cancel', label: '취소', safe: true },
        { id: 'buy', label: '구매', primary: true },
      ]
    case 'dismantle':
      return [
        { id: 'cancel', label: '취소', safe: true },
        { id: 'dismantle', label: '분해', primary: true, hold: true },
      ]
    case 'offline':
      return [{ id: 'retry', label: s.retrying ? '다시 연결하는 중…' : '재시도', primary: true }]
    case 'quit':
      return [
        { id: 'cancel', label: '취소', safe: true },
        { id: 'quit', label: '종료', primary: true, danger: true },
      ]
  }
}

/** 기본 포커스: 좋은 예는 안전한 버튼, 나쁜 예는 늘 '확정' 버튼 */
export function defaultFocus(s: Sim, cfg: Cfg, kind: Kind) {
  const btns = buttonsOf(s, kind)
  const i = cfg.good ? btns.findIndex(b => b.safe) : btns.findIndex(b => b.primary)
  return Math.max(0, i)
}

/* ───── 열기 · 닫기 · 대기열 ───── */

export function openPopup(s: Sim, cfg: Cfg, kind: Kind, why?: string) {
  if (isOpen(s, kind)) return
  s.open.push({ kind, at: s.t, order: ++s.order, realAt: performance.now() })
  s.hold = { active: false, p: 0 }
  s.focus = defaultFocus(s, cfg, kind)
  if (why) log(s, why, DEFS[kind].layer === 'system' ? 'warn' : 'info')
  touch(s)
}

export function closePopup(s: Sim, cfg: Cfg, kind: Kind, why?: string) {
  if (!isOpen(s, kind)) return
  s.open = s.open.filter(o => o.kind !== kind)
  if (kind === 'event' && s.eventChecked) {
    s.eventMuted = true
    s.eventChecked = false
    log(s, '오늘 하루 보지 않기 → 다음 접속부터 이벤트 창을 대기열에 넣지 않음', 'ok')
  } else if (why) log(s, why)
  const top = topPopup(s, cfg)
  if (top) s.focus = defaultFocus(s, cfg, top.kind)
  s.hold = { active: false, p: 0 }
  // 창이 닫히면 간격을 두고 다음 접속 팝업을 꺼낸다 (연달아 바로 뜨면 방금 닫은 창을 또 누르는 실수가 생긴다)
  schedule(s, cfg.queueGapMs / 1000, () => pump(s, cfg))
  touch(s)
}

/** 대기열에서 다음 창을 꺼낸다 */
export function pump(s: Sim, cfg: Cfg) {
  if (!s.queue.length) return
  if (!cfg.good || cfg.queueMode === 'all') {
    // 한꺼번에 — 남은 창을 전부 연다
    while (s.queue.length) openPopup(s, cfg, s.queue.shift()!)
    return
  }
  const systemUp = s.open.some(o => DEFS[o.kind].layer === 'system')
  const normalUp = s.open.some(o => DEFS[o.kind].layer === 'normal')
  if (systemUp || normalUp) {
    if (systemUp) log(s, `대기: ${DEFS[s.queue[0]].title} — 시스템 창이 먼저`, 'info')
    return
  }
  const next = s.queue.shift()!
  openPopup(s, cfg, next, `대기열 → ${DEFS[next].title} (남은 ${s.queue.length}개)`)
}

export function enqueue(s: Sim, cfg: Cfg, kinds: Kind[]) {
  for (const k of kinds) if (!s.queue.includes(k) && !isOpen(s, k)) s.queue.push(k)
  // 안정 정렬: 우선순위가 같으면 들어온 순서
  s.queue = s.queue.map((k, i) => ({ k, i })).sort((a, b) => DEFS[a.k].priority - DEFS[b.k].priority || a.i - b.i).map(x => x.k)
  touch(s)
  pump(s, cfg)
}

export function enterLobby(s: Sim, cfg: Cfg) {
  const kinds: Kind[] = ['notice', 'attend']
  if (s.eventMuted) log(s, '이벤트 창은 오늘 숨김 — 대기열에서 제외', 'ok')
  else kinds.push('event')
  log(s, `로비 진입: 접속 팝업 ${kinds.length}개`, 'info')
  enqueue(s, cfg, kinds)
}

/* ───── 입력 ───── */

/** 뒤로가기 (Esc · 안드로이드 뒤로 버튼) */
export function back(s: Sim, cfg: Cfg) {
  if (s.quitUntil > s.t) return
  if (!cfg.good) {
    if (s.open.length) {
      const n = s.open.length
      s.open = []
      log(s, `뒤로 한 번에 창 ${n}개가 전부 닫힘`, 'bad')
      schedule(s, 0.1, () => pump(s, cfg))
    } else quitApp(s, '창이 없을 때 뒤로 → 묻지 않고 바로 종료')
    touch(s)
    return
  }
  const top = topPopup(s, cfg)
  if (!top) {
    if (cfg.rootBack === 'confirm') openPopup(s, cfg, 'quit', '뒤로 (열린 창 없음) → 종료 확인')
    else if (cfg.rootBack === 'quit') quitApp(s, '뒤로 (열린 창 없음) → 바로 종료')
    else {
      log(s, '뒤로 (열린 창 없음) → 무시', 'warn')
      toast(s, '아무 반응 없음 — 앱이 멈춘 것처럼 보인다')
    }
    return
  }
  if (!DEFS[top.kind].backClose) {
    s.shake = { kind: top.kind, at: s.t }
    log(s, `뒤로 → ${DEFS[top.kind].title}: 닫을 수 없는 창 (흔들기)`, 'warn')
    toast(s, '[재시도]를 눌러 연결을 확인해 주세요')
    return
  }
  closePopup(s, cfg, top.kind, `뒤로 → ${DEFS[top.kind].title} 닫음`)
}

/** 딤(창 바깥)을 탭 */
export function dimTap(s: Sim, cfg: Cfg) {
  const top = topPopup(s, cfg)
  if (!top) return
  const closes = cfg.dimTap === 'always' || (cfg.dimTap === 'by-type' && DEFS[top.kind].dimClose)
  if (closes && top.kind !== 'offline') closePopup(s, cfg, top.kind, `바깥 탭 → ${DEFS[top.kind].title} 닫음`)
  else {
    s.bump = { kind: top.kind, at: s.t }
    const why = top.kind === 'offline' ? '버튼으로만 해결' : cfg.dimTap === 'never' ? '바깥 탭 무시 설정' : '중요한 창'
    log(s, `바깥 탭 → ${DEFS[top.kind].title} 유지 (${why})`, 'info')
    touch(s)
  }
}

export function quitApp(s: Sim, why: string) {
  s.open = []
  s.queue = []
  s.quitUntil = s.t + 1.8
  log(s, why, 'bad')
  touch(s)
}

export function buy(s: Sim, cfg: Cfg) {
  const it = s.buyItem
  if (s.credits < it.price) {
    toast(s, '크레딧이 부족합니다')
    return
  }
  s.credits -= it.price
  closePopup(s, cfg, 'buy', `구매: ${it.name} (−${it.price.toLocaleString('ko-KR')})`)
  toast(s, `${it.name} 구매 완료`)
}

export function dismantle(s: Sim, cfg: Cfg) {
  s.credits += 360
  closePopup(s, cfg, 'dismantle', '분해 확정: 회로 조각 ×12')
  toast(s, '분해 완료 · 크레딧 +360')
}

export function retry(s: Sim, cfg: Cfg) {
  if (s.retrying) return
  s.retrying = true
  log(s, '재시도 → 다시 연결하는 중', 'info')
  schedule(s, 1.2, () => {
    s.retrying = false
    closePopup(s, cfg, 'offline', '연결 복구 → 연결 끊김 창 닫음')
    toast(s, '서버에 다시 연결되었습니다')
  })
  touch(s)
}

/** 연결 끊김: 시스템 창이 끼어든다. 0.5초 뒤 끊기기 전에 요청했던 탐사 보상 창이 늦게 도착해 대기열로 들어온다 */
export function disconnect(s: Sim, cfg: Cfg) {
  s.retrying = false
  openPopup(s, cfg, 'offline', '끼어들기: 연결 끊김 (시스템 레이어)')
  schedule(s, 0.5, () => {
    log(s, '늦게 도착한 탐사 보상 창 → 대기열', 'info')
    enqueue(s, cfg, ['reward'])
  })
}

/** 매 프레임: 예약 작업 · 토스트 수명 */
export function step(s: Sim, dt: number) {
  s.t += dt
  const due = s.tasks.filter(x => x.at <= s.t)
  if (due.length) {
    s.tasks = s.tasks.filter(x => x.at > s.t)
    for (const x of due) x.fn()
  }
  const before = s.toasts.length
  s.toasts = s.toasts.filter(x => x.until > s.t)
  if (s.toasts.length !== before) touch(s)
  if (s.quitUntil && s.quitUntil <= s.t) {
    s.quitUntil = 0
    touch(s)
  }
}
