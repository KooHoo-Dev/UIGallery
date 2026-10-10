/* 이 표본 전용 기하 아이콘 (직접 그린 SVG · 비트맵 0) */

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }

export function ItemIcon({ id, size = 36 }: { id: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      {id === 'circuit' && (
        <g {...S}>
          <path d="M16 3 27 9.5v13L16 29 5 22.5v-13Z" />
          <path d="M11 16h4l2-3h4M16 20v3M12 12v-2" />
          <circle cx="11" cy="16" r="1.6" fill="currentColor" />
        </g>
      )}
      {id === 'cell' && (
        <g {...S}>
          <rect x="9" y="6" width="14" height="22" rx="3" />
          <path d="M13 3h6M9 13h14M9 20h14" />
          <path d="M16 15.5v3" />
        </g>
      )}
      {id === 'oxygen' && (
        <g {...S}>
          <path d="M11 9a5 5 0 0 1 10 0v17a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2Z" />
          <path d="M14 4h4M16 4v2" />
          <circle cx="16" cy="18" r="3" />
        </g>
      )}
      {id === 'credit' && (
        <g {...S}>
          <circle cx="16" cy="16" r="11" />
          <circle cx="16" cy="16" r="6" />
          <path d="M16 5v4M16 23v4" />
        </g>
      )}
      {id === 'repair' && (
        <g {...S}>
          <rect x="5" y="9" width="22" height="17" rx="2.5" />
          <path d="M12 9V6h8v3M16 13v9M11.5 17.5h9" />
        </g>
      )}
      {id === 'lens' && (
        <g {...S}>
          <circle cx="16" cy="16" r="11" />
          <path d="M16 8.5 22 16l-6 7.5L10 16Z" />
        </g>
      )}
      {id === 'core' && (
        <g {...S}>
          <path d="M16 2.5 19.2 12.2 29 13 21.4 19.2 24 29 16 23.4 8 29 10.6 19.2 3 13 12.8 12.2Z" fill="currentColor" fillOpacity="0.25" />
          <circle cx="16" cy="16.5" r="3" fill="currentColor" />
        </g>
      )}
      {id === 'quest' && (
        <g {...S}>
          <path d="M16 3 28 16 16 29 4 16Z" fill="currentColor" fillOpacity="0.2" />
          <path d="M16 10v8M16 22v.5" />
        </g>
      )}
    </svg>
  )
}

/** 목표 체크 상자 — 완료는 채움 + 체크 표시 (색만으로 구분하지 않는다) */
export function Check({ done, size = 26 }: { done: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" aria-label={done ? '완료' : '진행 중'} role="img">
      <rect x="3" y="3" width="20" height="20" rx="3" fill={done ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.4" />
      {done && <path d="M7.5 13.5 11.5 17.5 19 9" fill="none" stroke="#0a1018" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  )
}

/** 주 임무 = 마름모, 반복 과제 = 순환 화살표 (모양으로도 구분) */
export function KindIcon({ kind, size = 24 }: { kind: 'main' | 'repeat'; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {kind === 'main' ? (
        <path d="M12 2.5 21.5 12 12 21.5 2.5 12Z" fill="currentColor" />
      ) : (
        <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 9.5A7.5 7.5 0 0 0 5.4 8M5 14.5A7.5 7.5 0 0 0 18.6 16" />
          <path d="M5 3.5V8h4.5M19 20.5V16h-4.5" />
        </g>
      )}
    </svg>
  )
}

/** 우선 배너 문장 — 팔각 메달 */
export function Emblem({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <path d="M22 4h20l18 18v20L42 60H22L4 42V22Z" fill="rgba(255,182,72,0.14)" stroke="currentColor" strokeWidth="3" />
      <path d="M32 15 36.5 27.5 49 28 39 36 42.5 48.5 32 41 21.5 48.5 25 36 15 28 27.5 27.5Z" fill="currentColor" />
    </svg>
  )
}
