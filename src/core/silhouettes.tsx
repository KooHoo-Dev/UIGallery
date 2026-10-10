/* ──────────────────────────────────────────────────────────────
 * 실루엣 캐릭터 키트 — 갤러리 공통 모양 규칙 (이중 부호화: 색 + 모양)
 *   아군 = 캡슐   적 = 삼각형   중립·아이템 = 마름모
 * 모두 SVG <g> 로, 부모 <svg> 안에서 (x, y) = 발 위치 기준으로 그린다.
 * ────────────────────────────────────────────────────────────── */

export type Role = 'ally' | 'enemy' | 'neutral'

export const ROLE_COLOR: Record<Role, string> = {
  ally: '#5ad1ff',
  enemy: '#ff6a5c',
  neutral: '#f2c94c',
}

interface SilhouetteProps {
  role: Role
  x: number
  y: number
  /** 키(px) */
  height?: number
  /** 쓰러짐 상태 (회색·눕힘) */
  down?: boolean
  /** 색을 덮어쓸 때 (색각 모드 등) */
  color?: string
  /** 외곽선 강조 (고대비 모드 등) */
  outline?: boolean
  partId?: string
}

export function Silhouette({ role, x, y, height = 160, down = false, color, outline = false, partId }: SilhouetteProps) {
  const fill = down ? '#6b7280' : (color ?? ROLE_COLOR[role])
  const stroke = outline ? '#ffffff' : 'rgba(0,0,0,0.45)'
  const sw = outline ? 6 : 3
  const h = height
  const w = h * 0.42
  const transform = `translate(${x} ${y})${down ? ` rotate(-90) translate(${-w * 0.2} ${-h * 0.15})` : ''}`
  return (
    <g transform={transform} data-part={partId}>
      <ellipse cx="0" cy="0" rx={w * 0.7} ry={h * 0.06} fill="rgba(0,0,0,0.35)" />
      {role === 'ally' && <rect x={-w / 2} y={-h} width={w} height={h} rx={w / 2} fill={fill} stroke={stroke} strokeWidth={sw} />}
      {role === 'enemy' && <path d={`M0 ${-h} L${w * 0.75} 0 L${-w * 0.75} 0 Z`} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />}
      {role === 'neutral' && <path d={`M0 ${-h} L${w * 0.6} ${-h / 2} L0 0 L${-w * 0.6} ${-h / 2} Z`} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />}
    </g>
  )
}

/** 머리 위 앵커(이름표·체력·데미지 숫자 위치) — 발 위치 기준 */
export const headAnchor = (x: number, y: number, height = 160) => ({ x, y: y - height - 18 })
