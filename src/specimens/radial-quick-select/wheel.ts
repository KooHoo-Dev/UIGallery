/* ──────────────────────────────────────────────────────────────
 * 방사형 휠 선택 계산 (순수 함수)
 * 각도는 '위 = 0°, 시계 방향 +' 로 통일한다. 칸 i 의 가운데 = i × (360 / n).
 * ────────────────────────────────────────────────────────────── */

export const ITEMS = [
  { id: 'laser', name: '절단 레이저', desc: '잔해를 잘라 길을 연다' },
  { id: 'kit', name: '수리 키트', desc: '체력 40 회복' },
  { id: 'cell', name: '냉각 셀', desc: '과열을 즉시 식힌다' },
  { id: 'lamp', name: '탐사 조명', desc: '어두운 구역을 밝힌다' },
  { id: 'cable', name: '견인 케이블', desc: '먼 물체를 끌어온다' },
  { id: 'scan', name: '지형 스캔', desc: '주변 지형을 표시' },
  { id: 'oxy', name: '산소 캔', desc: '산소 30초 보충' },
  { id: 'flare', name: '신호탄', desc: '동료에게 위치 알림' },
  { id: 'shield', name: '방어막', desc: '피해 1회 막기' },
  { id: 'decoy', name: '드론 미끼', desc: '잔해 드론을 유인' },
  { id: 'chip', name: '회로 조각', desc: '장치를 고친다' },
  { id: 'sos', name: '구조 신호', desc: '기지에 귀환 요청' },
] as const
export type ItemId = (typeof ITEMS)[number]['id']

/** -180 ~ 180 으로 감싼 각도 차이 */
export const wrapDeg = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180

/** 벡터(화면 좌표: y 아래 +) → 위 = 0°, 시계 방향 + 각도 (0~360) */
export const angleOf = (x: number, y: number) => ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360

/**
 * 각도 → 칸 번호. 지금 고른 칸이 있으면, 그 칸 경계를 hysteresis 만큼 넓게 봐서
 * 경계 위에서 손이 조금 떨려도 선택이 왔다 갔다 하지 않게 한다.
 */
export function sectorOf(angle: number, n: number, current: number, hysteresis: number): number {
  const step = 360 / n
  if (current >= 0 && current < n) {
    const off = Math.abs(wrapDeg(angle - current * step))
    if (off <= step / 2 + hysteresis) return current
  }
  return Math.round(angle / step) % n
}

/** 고리 모양 칸(부채꼴 − 안쪽 원)의 SVG 경로. 가운데 (cx, cy), 각도는 위 = 0° 시계 방향 */
export function sectorPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const pt = (r: number, a: number) => {
    const rad = (a * Math.PI) / 180
    return `${(cx + Math.sin(rad) * r).toFixed(1)} ${(cy - Math.cos(rad) * r).toFixed(1)}`
  }
  const large = a1 - a0 > 180 ? 1 : 0
  return `M${pt(r1, a0)} A${r1} ${r1} 0 ${large} 1 ${pt(r1, a1)} L${pt(r0, a1)} A${r0} ${r0} 0 ${large} 0 ${pt(r0, a0)} Z`
}
