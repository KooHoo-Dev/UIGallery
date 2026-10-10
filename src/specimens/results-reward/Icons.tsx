import type { ItemId } from './data'

/**
 * 획득 물자 아이콘 — 갤러리 공통 규칙대로 아이템은 마름모 틀(중립) 안에 그린다.
 * 모양이 서로 달라 색 없이도 구분된다.
 */
export function ItemIcon({ id, size = 96 }: { id: ItemId; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <path d="M50 4 L96 50 L50 96 L4 50 Z" fill="rgba(242,201,76,0.12)" stroke="#f2c94c" strokeWidth="4" strokeLinejoin="round" />
      <g fill="none" stroke="#fff4d6" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        {id === 'repair' && (
          <>
            <rect x="32" y="38" width="36" height="28" rx="4" />
            <path d="M42 38v-6h16v6M50 45v14M43 52h14" />
          </>
        )}
        {id === 'coolant' && (
          <>
            <rect x="38" y="28" width="24" height="44" rx="8" />
            <path d="M44 28v-4h12v4M50 40v20M42 50h16M44 44l12 12M56 44 44 56" strokeWidth="3.5" />
          </>
        )}
        {id === 'circuit' && (
          <>
            <rect x="37" y="37" width="26" height="26" rx="3" />
            <path d="M44 37v-8M56 37v-8M44 63v8M56 63v8M37 44h-8M37 56h-8M63 44h8M63 56h8" />
          </>
        )}
        {id === 'oxygen' && (
          <>
            <path d="M40 34h20v36a6 6 0 0 1-6 6H46a6 6 0 0 1-6-6z" />
            <path d="M45 34v-6h10v6M46 52h8" />
          </>
        )}
      </g>
    </svg>
  )
}

/** 등급 도장 — 글자 + 테두리 모양(별·이중 원·원)으로 색 없이도 구분 */
export function RankShape({ rank }: { rank: 'S' | 'A' | 'B' }) {
  const star = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2
    const r = i % 2 ? 84 : 96
    return `${100 + Math.cos(a) * r},${100 + Math.sin(a) * r}`
  }).join(' ')
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" aria-hidden>
      {rank === 'S' && <polygon points={star} fill="none" stroke="currentColor" strokeWidth="7" strokeLinejoin="round" />}
      {rank !== 'B' && <circle cx="100" cy="100" r="74" fill="none" stroke="currentColor" strokeWidth="5" />}
      <circle cx="100" cy="100" r={rank === 'B' ? 86 : 64} fill="none" stroke="currentColor" strokeWidth={rank === 'B' ? 7 : 3} strokeDasharray={rank === 'B' ? '0' : '6 6'} />
    </svg>
  )
}
