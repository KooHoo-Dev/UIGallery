import type { ReactNode } from 'react'
import { RARITY, type IconId, type Rarity } from './data'

/* 직접 그린 아이템 아이콘 (64×64, 선 위주) — 색은 currentColor 하나만 쓰고 희귀도는 칸 테두리가 맡는다 */

const P: Record<IconId, ReactNode> = {
  wrench: <path d="M41 9a12 12 0 0 0-11 16L11 44a5 5 0 0 0 7 7l19-19a12 12 0 0 0 16-11l-7 6-7-2-2-7z" />,
  gravity: (
    <>
      <path d="M41 13a10 10 0 0 0-9 13L15 43a4 4 0 0 0 6 6l17-17a10 10 0 0 0 13-9l-6 5-6-2-2-6z" />
      <ellipse cx="32" cy="34" rx="27" ry="9" transform="rotate(-24 32 34)" data-soft />
      <circle cx="54" cy="25" r="3" data-fill />
    </>
  ),
  cutter: (
    <>
      <rect x="6" y="26" width="32" height="13" rx="3" />
      <path d="M38 29h10l5 3.5-5 3.5H38" />
      <path d="M15 39v12h9V39" />
      <path d="M55 32.5c5-2 6-6 4-10 4 3 4 8-1 11" data-fill />
      <path d="M12 32h14" data-soft />
    </>
  ),
  torch: (
    <>
      <rect x="9" y="22" width="15" height="32" rx="6" />
      <path d="M13 22v-5h7v5" />
      <path d="M24 32c10-10 18-10 22-4" />
      <path d="M44 26l9-9" />
      <path d="M53 17c4-4 4-8 2-11 4 2 5 7 1 12" data-fill />
    </>
  ),
  clamp: (
    <>
      <path d="M15 10v22a17 17 0 0 0 34 0V10h-10v22a7 7 0 0 1-14 0V10z" />
      <path d="M15 10h10v8H15zM39 10h10v8H39z" data-fill />
    </>
  ),
  driver: (
    <>
      <path d="M10 54l14-14" strokeWidth="9" />
      <path d="M24 40l22-22" />
      <path d="M46 18l6-8 2 2-8 6" />
    </>
  ),
  headset: (
    <>
      <path d="M12 36v-6a20 20 0 0 1 40 0v6" />
      <rect x="8" y="34" width="11" height="17" rx="4" data-fillsoft />
      <rect x="45" y="34" width="11" height="17" rx="4" data-fillsoft />
      <path d="M13 51c0 6 8 8 16 8" />
      <circle cx="31" cy="59" r="2.5" data-fill />
    </>
  ),
  goggles: (
    <>
      <path d="M4 30h6M54 30h6" />
      <circle cx="21" cy="31" r="11" data-fillsoft />
      <circle cx="43" cy="31" r="11" data-fillsoft />
      <path d="M32 29v4" />
      <path d="M16 27a6 6 0 0 1 6-3" data-soft />
    </>
  ),
  helmet: (
    <>
      <path d="M10 44a22 22 0 0 1 44 0v6H10z" data-fillsoft />
      <path d="M10 40h44" />
      <path d="M32 18v12" data-soft />
    </>
  ),
  visor: (
    <>
      <path d="M10 46a22 22 0 0 1 44 0v4H10z" />
      <path d="M13 34h38v9H13z" data-fill />
      <path d="M54 30l6-4" />
    </>
  ),
  suit: (
    <>
      <path d="M23 9l-13 8 5 15 6-2v25h22V30l6 2 5-15-13-8c-4 6-14 6-18 0z" />
      <path d="M32 18v37" data-soft />
      <path d="M24 38h6" />
    </>
  ),
  armor: (
    <>
      <path d="M32 7l20 7v16c0 13-9 22-20 27-11-5-20-14-20-27V14z" data-fillsoft />
      <path d="M12 26h40M14 38h36" />
      <path d="M32 7v50" data-soft />
    </>
  ),
  vest: (
    <>
      <path d="M22 8l-10 6v40h16V30l4-6 4 6v24h16V14L42 8c-2 6-18 6-20 0z" />
      <path d="M19 30c0 8 6 10 9 10" data-soft />
      <circle cx="18" cy="26" r="3" data-fill />
    </>
  ),
  battery: (
    <>
      <rect x="12" y="14" width="40" height="42" rx="5" />
      <path d="M24 14V8h16v6" />
      <path d="M35 22l-9 15h9l-6 12" data-bolt />
    </>
  ),
  reactor: (
    <>
      <circle cx="32" cy="32" r="7" data-fill />
      <ellipse cx="32" cy="32" rx="25" ry="10" />
      <ellipse cx="32" cy="32" rx="25" ry="10" transform="rotate(60 32 32)" />
      <ellipse cx="32" cy="32" rx="25" ry="10" transform="rotate(-60 32 32)" />
    </>
  ),
  cellpack: (
    <>
      <rect x="7" y="18" width="11" height="36" rx="4" />
      <rect x="20" y="18" width="11" height="36" rx="4" />
      <rect x="33" y="18" width="11" height="36" rx="4" />
      <rect x="46" y="18" width="11" height="36" rx="4" />
      <path d="M5 30h54" data-soft />
      <path d="M10 14h8M23 14h8M36 14h8M49 14h8" />
    </>
  ),
  solar: (
    <>
      <path d="M8 16h48l-6 26H14z" data-fillsoft />
      <path d="M11 29h42M24 16l-3 26M40 16l3 26" />
      <path d="M32 42v14M22 56h20" />
    </>
  ),
  shield: (
    <>
      <path d="M32 6l22 12v28L32 58 10 46V18z" data-fillsoft />
      <path d="M32 18l12 7v14l-12 7-12-7V25z" />
    </>
  ),
  repair: (
    <>
      <rect x="8" y="18" width="48" height="36" rx="5" />
      <path d="M24 18v-6h16v6" />
      <path d="M32 26v20M22 36h20" strokeWidth="6" />
    </>
  ),
  coolcell: (
    <>
      <rect x="18" y="12" width="28" height="44" rx="8" />
      <path d="M26 8h12" />
      <path d="M32 24v20M23.5 29l17 10M40.5 29l-17 10" data-soft />
    </>
  ),
  circuit: (
    <>
      <rect x="16" y="16" width="32" height="32" rx="4" data-fillsoft />
      <path d="M24 16V8M32 16V8M40 16V8M24 56v-8M32 56v-8M40 56v-8M16 24H8M16 32H8M16 40H8M56 24h-8M56 32h-8M56 40h-8" />
      <rect x="26" y="26" width="12" height="12" rx="2" data-fill />
    </>
  ),
  oxygen: (
    <>
      <rect x="18" y="16" width="28" height="42" rx="10" />
      <path d="M26 16v-6h12v6M38 10h8" />
      <path d="M18 30h28M18 44h28" data-soft />
    </>
  ),
  core: (
    <>
      <path d="M32 6l27 50H5z" data-fillsoft />
      <circle cx="32" cy="38" r="8" />
      <circle cx="32" cy="38" r="3" data-fill />
    </>
  ),
  flare: (
    <>
      <path d="M18 56l18-28" strokeWidth="8" />
      <path d="M42 18l4-10M46 22l10-4M40 14l-4-8M50 28l8 2" />
      <circle cx="40" cy="22" r="5" data-fill />
    </>
  ),
  tape: (
    <>
      <circle cx="28" cy="32" r="20" data-fillsoft />
      <circle cx="28" cy="32" r="8" />
      <path d="M28 52h30v-8" />
    </>
  ),
}

export function ItemIcon({ id, className }: { id: IconId; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden>
      {P[id]}
    </svg>
  )
}

/** 희귀도 모서리 표식 — 기본: 빈 네모 · 개량: 원 · 정예: 삼각 · 명품: 마름모 · 유일: 별 */
export function RarityMark({ r, size = 26, className, color }: { r: Rarity; size?: number; className?: string; color?: string }) {
  const c = color ?? RARITY[r].color
  const common = { fill: c, stroke: '#0a0d13', strokeWidth: 2.5, strokeLinejoin: 'round' as const }
  let shape: ReactNode = null
  if (r === 0) shape = <rect x="7" y="7" width="10" height="10" fill="none" stroke={c} strokeWidth="2" opacity="0.7" />
  else if (r === 1) shape = <circle cx="12" cy="12" r="7" {...common} />
  else if (r === 2) shape = <path d="M12 3.5l9 16H3z" {...common} />
  else if (r === 3) shape = <path d="M12 2.5l9.5 9.5-9.5 9.5L2.5 12z" {...common} />
  else shape = <path d="M12 1.8l2.9 6.5 7 .7-5.3 4.7 1.6 6.9L12 17l-6.2 3.6 1.6-6.9L2.1 9l7-.7z" {...common} />
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={`희귀도 ${RARITY[r].name}`}>
      {shape}
    </svg>
  )
}
