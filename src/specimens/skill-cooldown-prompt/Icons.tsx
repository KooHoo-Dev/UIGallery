import type { SlotId } from './model'

/* 직접 그린 기하 아이콘 (viewBox 100) — 파동 = 동심원 호, 도약 = 겹친 화살촉, 보호막 = 육각형, 폭주 = 여덟 갈래 별 */
export function SkillIcon({ id, className }: { id: SlotId; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden>
      {id === 'primary' && (
        <g fill="none" stroke="currentColor" strokeLinecap="round">
          <circle cx="30" cy="50" r="9" fill="currentColor" stroke="none" />
          <path d="M44 32 A22 22 0 0 1 44 68" strokeWidth="7" />
          <path d="M56 22 A34 34 0 0 1 56 78" strokeWidth="6" opacity="0.8" />
          <path d="M68 13 A46 46 0 0 1 68 87" strokeWidth="5" opacity="0.6" />
        </g>
      )}
      {id === 'dash' && (
        <g fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M24 70 L50 44 L76 70" opacity="0.55" />
          <path d="M24 50 L50 24 L76 50" />
          <path d="M50 84 V60" strokeWidth="6" opacity="0.4" />
        </g>
      )}
      {id === 'utility' && (
        <g fill="none" stroke="currentColor" strokeLinejoin="round">
          <path d="M50 12 L83 31 V69 L50 88 L17 69 V31 Z" strokeWidth="7" />
          <path d="M50 30 L66 39 V61 L50 70 L34 61 V39 Z" strokeWidth="5" opacity="0.7" />
          <circle cx="50" cy="50" r="5" fill="currentColor" stroke="none" />
        </g>
      )}
      {id === 'ult' && (
        <g fill="currentColor">
          <path d="M50 8 L57 38 L80 20 L62 43 L92 50 L62 57 L80 80 L57 62 L50 92 L43 62 L20 80 L38 57 L8 50 L38 43 L20 20 L43 38 Z" />
          <circle cx="50" cy="50" r="9" fill="#0b1220" />
        </g>
      )}
    </svg>
  )
}

/** 자원 부족 기호 — 물방울 */
export function DropIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2.5 C12 2.5 4.5 11 4.5 15.5 A7.5 7.5 0 0 0 19.5 15.5 C19.5 11 12 2.5 12 2.5 Z" fill="currentColor" />
      <path d="M8.6 15.4 A3.6 3.6 0 0 0 11 19" fill="none" stroke="#0b1220" strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
    </svg>
  )
}

/** 쿨다운 기호 — 시계 바늘 */
export function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <path d="M12 6.5 V12 L15.5 14.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

/** 충전 0 기호 — 빈 점 두 개 */
export function EmptyPipsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <rect x="2.5" y="8.5" width="8" height="7" rx="2" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <rect x="13.5" y="8.5" width="8" height="7" rx="2" fill="none" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  )
}

/** 가속 버프 기호 — 겹친 오른쪽 화살촉 */
export function HasteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path d="M4 5 L11 12 L4 19 M12 5 L19 12 L12 19" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
