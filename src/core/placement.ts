/**
 * 부유 요소(툴팁·선택지 패널·말풍선) 배치: 크기를 잰 뒤 → 선호 방향에 두고 → 넘치면 반대로 뒤집고 → 그래도 넘치면 경계 안으로 고정.
 * 모든 좌표는 같은 좌표계(보통 무대 논리 좌표 1920×1080)여야 한다.
 */
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export type Side = 'right' | 'left' | 'top' | 'bottom'

export interface Placement {
  x: number
  y: number
  side: Side
  flipped: boolean
  clamped: boolean
}

const OPPOSITE: Record<Side, Side> = { right: 'left', left: 'right', top: 'bottom', bottom: 'top' }

export function placeFloating(anchor: Rect, size: { w: number; h: number }, bounds: Rect, prefer: Side = 'right', gap = 16): Placement {
  const at = (side: Side) => {
    switch (side) {
      case 'right':
        return { x: anchor.x + anchor.w + gap, y: anchor.y + anchor.h / 2 - size.h / 2 }
      case 'left':
        return { x: anchor.x - gap - size.w, y: anchor.y + anchor.h / 2 - size.h / 2 }
      case 'top':
        return { x: anchor.x + anchor.w / 2 - size.w / 2, y: anchor.y - gap - size.h }
      case 'bottom':
        return { x: anchor.x + anchor.w / 2 - size.w / 2, y: anchor.y + anchor.h + gap }
    }
  }
  const fitsMain = (side: Side, p: { x: number; y: number }) =>
    side === 'right' || side === 'left' ? p.x >= bounds.x && p.x + size.w <= bounds.x + bounds.w : p.y >= bounds.y && p.y + size.h <= bounds.y + bounds.h

  let side = prefer
  let p = at(side)
  let flipped = false
  if (!fitsMain(side, p)) {
    const alt = at(OPPOSITE[side])
    if (fitsMain(OPPOSITE[side], alt)) {
      side = OPPOSITE[side]
      p = alt
      flipped = true
    }
  }
  const cx = Math.min(Math.max(p.x, bounds.x), bounds.x + bounds.w - size.w)
  const cy = Math.min(Math.max(p.y, bounds.y), bounds.y + bounds.h - size.h)
  return { x: cx, y: cy, side, flipped, clamped: cx !== p.x || cy !== p.y }
}

/** DOM 요소의 크기를 무대 논리 좌표 기준으로 잰다 (무대가 축소돼 있어도 offset 크기는 논리 px) */
export const measure = (el: HTMLElement) => ({ w: el.offsetWidth, h: el.offsetHeight })
