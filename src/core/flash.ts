/**
 * 번쩍임 제한기 — WCAG 2.3.1 (초당 3회 이하).
 * 화면 전체나 넓은 영역을 번쩍이게 하는 효과는 반드시 이 함수를 거친다.
 * false 가 돌아오면 이번 번쩍임은 건너뛴다 (흔들림·숫자 등 다른 피드백은 유지).
 */
const stamps: number[] = []

export function requestFlash(): boolean {
  const now = performance.now()
  while (stamps.length && now - stamps[0] > 1000) stamps.shift()
  if (stamps.length >= 3) return false
  stamps.push(now)
  return true
}

export function prefersReducedMotion(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
}
