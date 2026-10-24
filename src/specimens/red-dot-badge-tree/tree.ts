/* ──────────────────────────────────────────────────────────────
 * 레드닷 트리 (React 와 무관한 순수 로직)
 *
 * 좋은 예: 빨간 점 데이터는 '잎(항목)' 에만 있다. 메뉴·탭 배지는 언제나 자식에서 **계산**한다
 *         → 부모와 자식이 어긋날 수 없다. Unity 판은 노드가 Changed 이벤트를 내고 배지 UI 가 구독한다(옵저버).
 * 나쁜 예: 화면마다 따로 '빨간 점 켜짐' 플래그를 들고, 항목이 생길 때 켜고 그 화면을 열 때 끈다.
 *         → 열기만 해도 꺼져 받을 보상이 남았는데 점이 사라지고(사라진 레드닷),
 *           '모두 받기' 로 항목을 다 처리해도 탭 플래그는 남는다(유령 레드닷).
 * ────────────────────────────────────────────────────────────── */

export type Kind = 'reward' | 'info' | 'promo'

export interface Item {
  id: string
  menu: string
  tab: string
  label: string
  /** 할 일(받아야 끝) · 소식(보면 끝) · 홍보 */
  kind: Kind
  /** 이 항목의 빨간 점 */
  dot: boolean
  /** 보상을 받았다 */
  done: boolean
}

export interface TabDef {
  id: string
  label: string
}
export interface MenuDef {
  id: string
  label: string
  icon: 'mail' | 'mission' | 'crew' | 'shop'
  tabs: TabDef[]
}

export const MENUS: MenuDef[] = [
  { id: 'mail', label: '우편', icon: 'mail', tabs: [{ id: 'reward', label: '보상' }, { id: 'notice', label: '공지' }] },
  { id: 'mission', label: '임무', icon: 'mission', tabs: [{ id: 'daily', label: '일일' }, { id: 'weekly', label: '주간' }] },
  { id: 'crew', label: '탐사대', icon: 'crew', tabs: [{ id: 'harin', label: '하린' }, { id: 'doyun', label: '도윤' }, { id: 'sera', label: '세라' }] },
  { id: 'shop', label: '상점', icon: 'shop', tabs: [{ id: 'supply', label: '보급' }, { id: 'package', label: '패키지' }] },
]

export const KIND_LABEL: Record<Kind, string> = { reward: '할 일', info: '소식', promo: '홍보' }

type NewItem = Pick<Item, 'menu' | 'tab' | 'label' | 'kind'>

const INITIAL: NewItem[] = [
  { menu: 'mail', tab: 'reward', label: '정비 지원금', kind: 'reward' },
  { menu: 'mail', tab: 'reward', label: '점검 보상', kind: 'reward' },
  { menu: 'mail', tab: 'notice', label: '정기 점검 안내', kind: 'info' },
  { menu: 'mission', tab: 'daily', label: '잔해 드론 5기 격추', kind: 'reward' },
  { menu: 'mission', tab: 'daily', label: '지표 탐사 1회', kind: 'reward' },
  { menu: 'mission', tab: 'weekly', label: '통신탑 3곳 복구', kind: 'reward' },
  { menu: 'crew', tab: 'harin', label: '레벨 업 가능', kind: 'reward' },
  { menu: 'crew', tab: 'doyun', label: '새 기술 해금', kind: 'info' },
  { menu: 'shop', tab: 'package', label: '신규 탐사 패키지', kind: 'promo' },
  { menu: 'shop', tab: 'package', label: '주말 한정 할인', kind: 'promo' },
]

export type ClearRule = 'by-type' | 'on-view' | 'on-action'
export type PromoDots = 'red' | 'subtle' | 'off'

export interface Cfg {
  good: boolean
  clearRule: ClearRule
  promoDots: PromoDots
  /** 메뉴를 열 때 점이 있는 첫 탭으로 바로 */
  openToLit: boolean
}

export type Tone = 'ok' | 'info' | 'bad'

export interface Sim {
  t: number
  items: Item[]
  seq: number
  menu: string
  tab: string
  /** 나쁜 예: 화면마다 따로 든 플래그 ('mail', 'mail/reward' …) */
  flags: Record<string, boolean>
  /** 새 항목이 생긴 경로 — 항목 → 탭 → 메뉴 순으로 번쩍인다 */
  pulse: { menu: string; tab: string; item: string; at: number; n: number } | null
  log: { text: string; tone: Tone }[]
  credits: number
  mailNo: number
  promoNo: number
  pulseNo: number
  version: number
}

export function createSim(): Sim {
  const s: Sim = { t: 0, items: [], seq: 0, menu: 'mail', tab: 'reward', flags: {}, pulse: null, log: [], credits: 12400, mailNo: 0, promoNo: 0, pulseNo: 0, version: 0 }
  for (const l of INITIAL) addItem(s, l, true)
  return s
}

const touch = (s: Sim) => s.version++

export function log(s: Sim, text: string, tone: Tone = 'info') {
  s.log.unshift({ text, tone })
  s.log.length = Math.min(s.log.length, 4)
  touch(s)
}

export const menuLabel = (menu: string) => MENUS.find(m => m.id === menu)?.label ?? menu
export const tabLabel = (menu: string, tab: string) => MENUS.find(m => m.id === menu)?.tabs.find(t => t.id === tab)?.label ?? tab

/** 이 항목의 점이 셈에 들어가는가 (홍보 점을 끄면 뺀다) */
export const dotCounts = (cfg: Cfg, l: Item) => l.dot && !(l.kind === 'promo' && cfg.promoDots === 'off')

export interface Badge {
  /** 자식에서 계산한 점 개수 */
  count: number
  /** 그중 할 일(보상) — 숫자로 보여 줄 대상 */
  rewards: number
  /** 아래가 홍보뿐 (약한 점) */
  promoOnly: boolean
  /** 화면에 켜져 있나 — 좋은 예는 count > 0, 나쁜 예는 따로 든 플래그 */
  on: boolean
}

function badgeOf(s: Sim, cfg: Cfg, pick: (l: Item) => boolean, flagKey: string): Badge {
  const ls = s.items.filter(l => pick(l) && dotCounts(cfg, l))
  return {
    count: ls.length,
    rewards: ls.filter(l => l.kind === 'reward').length,
    promoOnly: ls.length > 0 && ls.every(l => l.kind === 'promo'),
    on: cfg.good ? ls.length > 0 : !!s.flags[flagKey],
  }
}

export const menuBadge = (s: Sim, cfg: Cfg, menu: string) => badgeOf(s, cfg, l => l.menu === menu, menu)
export const tabBadge = (s: Sim, cfg: Cfg, menu: string, tab: string) => badgeOf(s, cfg, l => l.menu === menu && l.tab === tab, `${menu}/${tab}`)
export const rootCount = (s: Sim, cfg: Cfg) => s.items.filter(l => dotCounts(cfg, l)).length
/** 로비 배지 — 좋은 예는 모든 항목에서 계산, 나쁜 예는 플래그 중 하나라도 켜져 있으면 */
export const rootBadge = (s: Sim, cfg: Cfg): Badge => {
  const b = badgeOf(s, cfg, () => true, '')
  return cfg.good ? b : { ...b, on: Object.values(s.flags).some(Boolean) }
}

/** 한 탭에 남겨 둘 끝난 항목 수 — 오래 돌려도 목록이 넘치지 않게 오래된 끝난 항목부터 정리한다 */
const KEEP_FINISHED = 3

export function addItem(s: Sim, l: NewItem, silent = false) {
  const item: Item = { ...l, id: `item-${++s.seq}`, dot: true, done: false }
  s.items.unshift(item) // 새 항목은 목록 맨 위
  const finished = s.items.filter(x => x.menu === l.menu && x.tab === l.tab && (x.kind === 'reward' ? x.done : !x.dot))
  if (finished.length > KEEP_FINISHED) {
    const drop = new Set(finished.slice(KEEP_FINISHED))
    s.items = s.items.filter(x => !drop.has(x))
  }
  // 나쁜 예의 방식: 항목이 생길 때 그 화면들의 플래그를 켠다 (끄는 쪽은 화면을 열 때)
  s.flags[l.menu] = true
  s.flags[`${l.menu}/${l.tab}`] = true
  if (!silent) {
    s.pulse = { menu: l.menu, tab: l.tab, item: item.id, at: s.t, n: ++s.pulseNo }
    log(s, `새 항목: ${menuLabel(l.menu)} › ${tabLabel(l.menu, l.tab)} › ${l.label}`, 'info')
  }
  touch(s)
  return item
}

/** 메뉴를 연다 — 좋은 예는 점이 있는 첫 탭으로 바로 (어디로 가야 하는지 다시 찾지 않게) */
export function openMenu(s: Sim, cfg: Cfg, menu: string) {
  const def = MENUS.find(m => m.id === menu)!
  s.menu = menu
  // 플래그 장부는 두 모드 모두 적는다 (보여 주는 건 나쁜 예에서만) — 효과를 중간에 꺼도 공정하게 비교된다
  if (!cfg.good && s.flags[menu] && s.items.some(l => l.menu === menu && l.kind === 'reward' && !l.done))
    log(s, `${def.label} 열기 → 메뉴 점 꺼짐 (받을 보상이 남았는데) — 사라진 레드닷`, 'bad')
  s.flags[menu] = false
  if (!cfg.good) {
    openTab(s, cfg, def.tabs[0].id)
    return
  }
  const firstLit = cfg.openToLit ? def.tabs.find(t => tabBadge(s, cfg, menu, t.id).on) : undefined
  openTab(s, cfg, (firstLit ?? def.tabs[0]).id)
}

export function openTab(s: Sim, cfg: Cfg, tab: string) {
  s.tab = tab
  s.flags[`${s.menu}/${tab}`] = false
  if (!cfg.good) {
    touch(s)
    return
  }
  // 보는 것만으로 끝나는 점을 끈다: 규칙에 따라 소식·홍보만, 또는 전부(보상까지 — 나쁜 규칙)
  const here = s.items.filter(l => l.menu === s.menu && l.tab === tab && l.dot)
  const clears = here.filter(l => cfg.clearRule === 'on-view' || (cfg.clearRule === 'by-type' && l.kind !== 'reward'))
  for (const l of clears) l.dot = false
  const lost = clears.filter(l => l.kind === 'reward' && !l.done).length
  if (lost) log(s, `${tabLabel(s.menu, tab)} 보기만 했는데 보상 점 ${lost}개 꺼짐 — 받을 게 남았는지 모른다`, 'bad')
  else if (clears.length) log(s, `${tabLabel(s.menu, tab)} 보기 → 소식·홍보 점 ${clears.length}개 꺼짐`, 'ok')
  touch(s)
}

/** 항목 하나의 행동: 보상은 받기, 소식·홍보는 확인 */
export function act(s: Sim, cfg: Cfg, id: string) {
  const l = s.items.find(x => x.id === id)
  if (!l) return
  if (l.kind === 'reward') {
    if (l.done) return
    l.done = true
    s.credits += 100
  }
  const had = l.dot
  l.dot = false
  log(s, `${l.label} ${l.kind === 'reward' ? '받기' : '확인'}${had && cfg.good ? ' → 탭·메뉴 다시 계산' : ''}`, 'ok')
}

/** '모두 받기' — 메뉴의 보상 항목을 한 번에 */
export function claimAll(s: Sim, cfg: Cfg, menu: string) {
  const ls = s.items.filter(l => l.menu === menu && l.kind === 'reward' && !l.done)
  if (!ls.length) return
  for (const l of ls) {
    l.done = true
    l.dot = false
  }
  s.credits += ls.length * 100
  if (cfg.good) log(s, `${menuLabel(menu)} 모두 받기 → 보상 ${ls.length}개 · 탭·메뉴 점은 계산이라 저절로 꺼짐`, 'ok')
  else {
    const ghosts = MENUS.find(m => m.id === menu)!.tabs.filter(t => s.flags[`${menu}/${t.id}`] && !s.items.some(l => l.menu === menu && l.tab === t.id && l.dot))
    if (ghosts.length) log(s, `${menuLabel(menu)} 모두 받기 → 항목은 끝났는데 탭 플래그 ${ghosts.length}개가 남음 — 유령 레드닷`, 'bad')
    else log(s, `${menuLabel(menu)} 모두 받기 → 보상 ${ls.length}개 (열어 본 탭이라 플래그도 꺼져 있었다)`, 'ok')
  }
  touch(s)
}

/** 새 우편 도착 */
export function newMail(s: Sim) {
  s.mailNo++
  addItem(s, { menu: 'mail', tab: 'reward', label: `탐사 보상 #${s.mailNo}`, kind: 'reward' })
}

/** 홍보 추가 */
export function newPromo(s: Sim) {
  s.promoNo++
  addItem(s, { menu: 'shop', tab: 'package', label: `기간 한정 패키지 ${s.promoNo}`, kind: 'promo' })
}

/** 우편 대량 도착 — 숫자 상한(9+ · 99+)을 보려고 */
export function mailFlood(s: Sim, n = 120) {
  for (let i = 0; i < n; i++) {
    s.mailNo++
    addItem(s, { menu: 'mail', tab: 'reward', label: `이벤트 보상 #${s.mailNo}`, kind: 'reward' }, true)
  }
  s.pulse = { menu: 'mail', tab: 'reward', item: s.items[0].id, at: s.t, n: ++s.pulseNo }
  log(s, `우편 ${n}개 도착 → 숫자 상한 확인`, 'info')
}

/** 하루가 지남 — 일일 임무와 무료 보급이 다시 생긴다 */
export function nextDay(s: Sim) {
  let added = 0
  const again = (l: NewItem) => {
    const old = s.items.find(x => x.menu === l.menu && x.label === l.label)
    if (old && !old.done) return
    if (old) s.items = s.items.filter(x => x !== old)
    addItem(s, l, true)
    added++
  }
  again({ menu: 'mission', tab: 'daily', label: '잔해 드론 5기 격추', kind: 'reward' })
  again({ menu: 'mission', tab: 'daily', label: '지표 탐사 1회', kind: 'reward' })
  again({ menu: 'shop', tab: 'supply', label: '무료 보급 상자', kind: 'reward' })
  if (!added) {
    log(s, '하루 지남 → 아직 받지 않은 일일 보상이 그대로 남아 있음', 'info')
    return
  }
  s.pulse = { menu: 'mission', tab: 'daily', item: '', at: s.t, n: ++s.pulseNo }
  log(s, `하루 지남 → 일일 임무 · 무료 보급 ${added}개 다시 생김`, 'info')
}
