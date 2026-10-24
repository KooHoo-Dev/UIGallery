/* ──────────────────────────────────────────────────────────────
 * 기기 화면 · 세이프 에어리어 · 터치 HUD 배치 (순수 계산)
 * 무대(1920×1080) 안에 가상 기기 화면을 그리고, HUD 는 그 화면의 세이프 에어리어 기준으로 놓는다.
 * 좋은 예는 위치를 세이프 에어리어 안의 **비율(0~1)** 로 저장하고, 나쁜 예는 넓은 폰에서 잰 **픽셀**로 저장한다.
 * ────────────────────────────────────────────────────────────── */

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export type DeviceId = 'phone' | 'tablet'

export interface Device {
  label: string
  screen: Rect
  /** 세이프 에어리어 여백 (왼 · 위 · 오른 · 아래) */
  inset: [number, number, number, number]
  corner: number
  /** 가로 모드에서 왼쪽 가장자리의 노치 (세로 길이) */
  notch: number
}

/** 19.5:9 노치 폰(가로) · 4:3 태블릿 — 무대에 꽉 차게 맞춘 크기 */
export const DEVICES: Record<DeviceId, Device> = {
  phone: { label: '19.5:9 노치 폰', screen: { x: 0, y: 97, w: 1920, h: 886 }, inset: [110, 0, 110, 52], corner: 96, notch: 300 },
  tablet: { label: '4:3 태블릿', screen: { x: 240, y: 0, w: 1440, h: 1080 }, inset: [0, 0, 0, 36], corner: 44, notch: 0 },
}

export function safeRect(d: Device, useSafe: boolean): Rect {
  const s = d.screen
  if (!useSafe) return { ...s }
  const [l, t, r, b] = d.inset
  return { x: s.x + l, y: s.y + t, w: s.w - l - r, h: s.h - t - b }
}

export type ItemId = 'stick' | 'attack' | 'skill1' | 'skill2' | 'dodge'

export interface LayoutItem {
  id: ItemId
  /** 좋은 예: 세이프 에어리어 안의 비율 (가운데 기준) */
  nx: number
  ny: number
  /** 지름 (논리 px) — 엄지 크기는 기기와 무관하므로 비율로 늘리지 않는다 */
  size: number
}

export const LABEL: Record<ItemId, string> = { stick: '이동', attack: '공격', skill1: '스킬 1', skill2: '스킬 2', dodge: '회피' }

export const DEFAULT_LAYOUT: LayoutItem[] = [
  { id: 'stick', nx: 0.15, ny: 0.7, size: 280 },
  { id: 'attack', nx: 0.885, ny: 0.74, size: 196 },
  { id: 'skill1', nx: 0.72, ny: 0.85, size: 132 },
  { id: 'skill2', nx: 0.765, ny: 0.55, size: 132 },
  { id: 'dodge', nx: 0.905, ny: 0.4, size: 120 },
]

/** 나쁜 예의 저장 방식: 넓은 폰 화면(세이프 에어리어 무시)의 왼쪽 위에서 잰 픽셀 */
export const toPixelLayout = (items: LayoutItem[]) => {
  const s = DEVICES.phone.screen
  return items.map(it => ({ ...it, px: it.nx * s.w, py: it.ny * s.h }))
}

export function centerOf(it: LayoutItem & { px?: number; py?: number }, d: Device, safe: Rect, good: boolean) {
  if (!good && it.px !== undefined && it.py !== undefined) return { x: d.screen.x + it.px, y: d.screen.y + it.py }
  return { x: safe.x + it.nx * safe.w, y: safe.y + it.ny * safe.h }
}

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/** 입력 벡터 → 데드존 · 반응 곡선을 거친 출력 (크기 0~1) */
export function shape(rx: number, ry: number, deadzone: number, curve: 'linear' | 'fine') {
  const mag = Math.min(1, Math.hypot(rx, ry))
  if (mag <= deadzone || mag === 0) return { x: 0, y: 0, mag: 0, raw: mag }
  let out = (mag - deadzone) / (1 - deadzone)
  if (curve === 'fine') out = Math.pow(out, 1.8) // 작은 기울기에서 더 섬세하게
  return { x: (rx / mag) * out, y: (ry / mag) * out, mag: out, raw: mag }
}
