/**
 * 알림 큐 — 뷰(React·UGUI·UI Toolkit)와 분리된 순수 로직.
 * Unity 의 NotificationQueue.cs 와 같은 구조로 짰다 (줄 단위로 옮길 수 있게).
 * C# 쪽 이름 대응: displayMs → displaySeconds (시간은 초), unit → plusUnit, icon → iconId, changed → OnChanged.
 *
 *   enqueue(req)          알림 요청 1건. 같은 키면 병합, 아니면 대기열에 넣고 '정렬 필요' 표시만 한다
 *   tick(dtMs, frozen)    게임 시간 진행. frozen 이면 표시 시간이 줄지 않는다 (일시정지·우선 배너 중)
 *   clear()               전부 비우기
 *
 * 뷰는 listener 의 show / update / hide / changed 만 받아서 그린다. 시간 계산은 뷰에서 하지 않는다.
 */

/** 0 일반 · 1 고급 · 2 희귀 · 3 전설 */
export type Rarity = 0 | 1 | 2 | 3
export type QueueMode = 'fifo' | 'priority' | 'priority-preempt'

export interface ToastRequest {
  /** 병합 키 (아이템 ID) */
  key: string
  rarity: Rarity
  label: string
  amount: number
  /** 'count' = ×3 처럼 개수, 'plus' = +120 처럼 합계 */
  unit: 'count' | 'plus'
  icon: string
}

export interface Toast extends ToastRequest {
  uid: number
  durationMs: number
  remainingMs: number
  /** 처음 도착한 시각 — fifo 정렬과 '같은 등급 안에서 먼저 온 것' 판정 */
  arrivedAt: number
  /** 마지막으로 병합된 시각 — 병합 창 판정 */
  lastMergeAt: number
  mergeCount: number
}

export interface QueueConfig {
  maxVisible: number
  displayMs: number
  /** 0 이면 병합하지 않는다 */
  mergeWindowMs: number
  mode: QueueMode
  /** 등급이 높을수록 표시 시간을 늘린다 (RARITY_TIME_SCALE) */
  rarityBonus: boolean
}

export interface QueueListener {
  show(t: Toast): void
  update(t: Toast): void
  hide(t: Toast, reason: 'expired' | 'preempted' | 'cleared'): void
  /** 대기열·통계가 바뀜 (+N 대기 갱신용) */
  changed(): void
}

/** 표시 시간 배율 — 일반·고급 ×1, 희귀 ×1.3, 전설 ×1.6 */
export const RARITY_TIME_SCALE = [1, 1, 1.3, 1.6] as const

export class NotificationQueue {
  readonly active: Toast[] = []
  readonly pending: Toast[] = []
  readonly stats = { shown: 0, merged: 0, preempted: 0 }
  private now = 0
  private nextUid = 1
  private needsSort = false
  config: QueueConfig
  private listener: QueueListener

  constructor(config: QueueConfig, listener: QueueListener) {
    this.config = config
    this.listener = listener
  }

  durationOf(rarity: Rarity) {
    return this.config.displayMs * (this.config.rarityBonus ? RARITY_TIME_SCALE[rarity] : 1)
  }

  enqueue(req: ToastRequest) {
    const c = this.config
    if (c.mergeWindowMs > 0) {
      // (1) 표시 중인 같은 키 — 병합 창 안이면 수량만 올리고 표시 시간을 다시 채운다
      const live = this.active.find(t => t.key === req.key && this.now - t.lastMergeAt <= c.mergeWindowMs)
      if (live) {
        live.amount += req.amount
        live.remainingMs = live.durationMs
        live.lastMergeAt = this.now
        live.mergeCount++
        this.stats.merged++
        this.listener.update(live)
        this.listener.changed()
        return
      }
      // (2) 대기 중인 같은 키 — 아직 안 보였으니 수량만 합친다 (+N 대기 수는 그대로)
      const waiting = this.pending.find(t => t.key === req.key)
      if (waiting) {
        waiting.amount += req.amount
        waiting.lastMergeAt = this.now
        waiting.mergeCount++
        this.stats.merged++
        this.listener.changed()
        return
      }
    }
    // (3) 새 요청 — 대기열에 넣고 정렬은 tick 에서 한 번만
    const d = this.durationOf(req.rarity)
    this.pending.push({ ...req, uid: this.nextUid++, durationMs: d, remainingMs: d, arrivedAt: this.now, lastMergeAt: this.now, mergeCount: 0 })
    this.needsSort = true
    this.listener.changed()
  }

  tick(dtMs: number, frozen: boolean) {
    this.now += dtMs
    if (!frozen) {
      for (let i = this.active.length - 1; i >= 0; i--) {
        const t = this.active[i]
        t.remainingMs -= dtMs
        if (t.remainingMs <= 0) {
          this.active.splice(i, 1)
          this.listener.hide(t, 'expired')
          this.listener.changed()
        }
      }
    }
    if (this.needsSort) {
      this.sortPending()
      this.needsSort = false
    }
    this.pump()
  }

  /** 빈 슬롯을 채우고, 선점 모드면 낮은 등급 카드를 밀어낸다 */
  private pump() {
    const c = this.config
    while (this.pending.length > 0) {
      if (this.active.length < c.maxVisible) {
        this.showNext()
        continue
      }
      if (c.mode !== 'priority-preempt' || this.active.length === 0) break
      // 표시 중인 카드 중 등급이 가장 낮고, 그중 가장 오래된 것
      let victim = this.active[0]
      for (const t of this.active) if (t.rarity < victim.rarity || (t.rarity === victim.rarity && t.arrivedAt < victim.arrivedAt)) victim = t
      if (this.pending[0].rarity <= victim.rarity) break
      this.active.splice(this.active.indexOf(victim), 1)
      this.listener.hide(victim, 'preempted')
      this.stats.preempted++
      this.showNext()
      // 밀려난 알림은 표시 시간을 다시 채워 대기열로 돌아간다 (같은 등급 안에서는 먼저 온 순서라 맨 앞)
      victim.remainingMs = victim.durationMs
      this.pending.push(victim)
      this.sortPending()
      this.listener.changed()
    }
  }

  private showNext() {
    const t = this.pending.shift()!
    t.remainingMs = t.durationMs
    t.lastMergeAt = this.now
    this.active.push(t)
    this.stats.shown++
    this.listener.show(t)
    this.listener.changed()
  }

  private sortPending() {
    if (this.config.mode === 'fifo') this.pending.sort((a, b) => a.arrivedAt - b.arrivedAt || a.uid - b.uid)
    else this.pending.sort((a, b) => b.rarity - a.rarity || a.arrivedAt - b.arrivedAt || a.uid - b.uid)
  }

  clear() {
    for (const t of this.active) this.listener.hide(t, 'cleared')
    this.active.length = 0
    this.pending.length = 0
    this.stats.shown = this.stats.merged = this.stats.preempted = 0
    this.listener.changed()
  }

  /**
   * 설정 변경(슬롯 수·표시 시간·정렬 방식)을 바로 반영한다.
   * 표시 시간이 바뀌면 이미 떠 있거나 기다리는 카드도 새 길이로 바꾸고, 남은 비율은 그대로 둔다
   * (막대가 70% 남아 있었다면 새 길이의 70%).
   */
  reconfigure(config: QueueConfig) {
    this.config = config
    for (const t of [...this.active, ...this.pending]) {
      const d = this.durationOf(t.rarity)
      if (d === t.durationMs) continue
      t.remainingMs = t.durationMs > 0 ? (t.remainingMs / t.durationMs) * d : d
      t.durationMs = d // 뷰는 매 프레임 남은 비율을 읽으므로 따로 알릴 필요가 없다
    }
    this.needsSort = true
    // 슬롯 수가 줄었으면 오래된 것부터 대기열로 돌려보낸다.
    // 규칙에 따른 선점이 아니라 설정 변경이므로 stats.preempted 에는 세지 않는다 (나가는 연출만 선점과 같다)
    while (this.active.length > config.maxVisible) {
      const t = this.active.shift()!
      this.listener.hide(t, 'preempted')
      t.remainingMs = t.durationMs
      this.pending.push(t)
    }
    this.listener.changed()
  }
}
