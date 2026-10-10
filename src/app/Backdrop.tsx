import type { BackdropId } from '../core/types'

/**
 * 2D 무대 배경 — 모두 SVG/CSS 로 새로 그린 범용 장면 (비트맵 0).
 * 논리 해상도(1920×1080 또는 1080×1920) 좌표계 안에서 그려진다.
 */
export function Backdrop({ id, width, height }: { id: BackdropId; width: number; height: number }) {
  if (id === 'none') return null
  const portrait = height > width
  const horizon = portrait ? height * 0.52 : height * 0.56
  return (
    <svg className="backdrop" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden preserveAspectRatio="none">
      <defs>
        <linearGradient id="bd-sky-field" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f6fa8" />
          <stop offset="0.55" stopColor="#9cc3d8" />
          <stop offset="1" stopColor="#f1d9b0" />
        </linearGradient>
        <linearGradient id="bd-ground-field" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5d7a4a" />
          <stop offset="1" stopColor="#2c3d24" />
        </linearGradient>
        <radialGradient id="bd-sun" cx="0.72" cy="0.32" r="0.35">
          <stop offset="0" stopColor="#fff6d8" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff6d8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bd-sky-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#060914" />
          <stop offset="1" stopColor="#1b2443" />
        </linearGradient>
        <radialGradient id="bd-dungeon" cx="0.5" cy="0.45" r="0.75">
          <stop offset="0" stopColor="#3a2c24" />
          <stop offset="1" stopColor="#0c0806" />
        </radialGradient>
        <radialGradient id="bd-torch" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffb35c" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffb35c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bd-scifi" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#081428" />
          <stop offset="1" stopColor="#0f2a3f" />
        </linearGradient>
        <pattern id="bd-grid" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M80 0H0V80" fill="none" stroke="#5fd4ff" strokeOpacity="0.08" strokeWidth="2" />
        </pattern>
        <linearGradient id="bd-menu" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1a1030" />
          <stop offset="1" stopColor="#0b1a2c" />
        </linearGradient>
      </defs>

      {id === 'field' && (
        <g>
          <rect width={width} height={horizon} fill="url(#bd-sky-field)" />
          <rect width={width} height={height} fill="url(#bd-sun)" />
          <path
            d={ridge(width, horizon, 0.18 * height, 7, 11)}
            fill="#6d86a0"
            opacity="0.55"
          />
          <path d={ridge(width, horizon, 0.1 * height, 11, 3)} fill="#4f6a57" opacity="0.85" />
          <rect y={horizon} width={width} height={height - horizon} fill="url(#bd-ground-field)" />
          {Array.from({ length: 14 }, (_, i) => {
            const x = (i / 13) * width
            return <line key={i} x1={width / 2 + (x - width / 2) * 0.08} y1={horizon} x2={x * 1.6 - width * 0.3} y2={height} stroke="#ffffff" strokeOpacity="0.05" strokeWidth="3" />
          })}
          {[0.2, 0.32, 0.5, 0.74].map((t, i) => (
            <line key={i} x1="0" x2={width} y1={horizon + (height - horizon) * t * t * 1.4} y2={horizon + (height - horizon) * t * t * 1.4} stroke="#ffffff" strokeOpacity="0.04" strokeWidth="3" />
          ))}
          <Tree x={width * 0.14} y={horizon + 40} s={1.4} />
          <Tree x={width * 0.22} y={horizon + 12} s={0.8} />
          <Tree x={width * 0.84} y={horizon + 30} s={1.1} />
        </g>
      )}

      {id === 'night' && (
        <g>
          <rect width={width} height={height} fill="url(#bd-sky-night)" />
          {Array.from({ length: 90 }, (_, i) => (
            <circle key={i} cx={(i * 7919) % width} cy={((i * 104729) % horizon) * 0.95} r={(i % 3) + 1} fill="#fff" opacity={0.25 + (i % 5) * 0.12} />
          ))}
          <path d={ridge(width, horizon, 0.12 * height, 9, 5)} fill="#0d1428" />
          <rect y={horizon} width={width} height={height - horizon} fill="#0b1020" />
        </g>
      )}

      {id === 'dungeon' && (
        <g>
          <rect width={width} height={height} fill="url(#bd-dungeon)" />
          {Array.from({ length: Math.ceil(height / 90) }, (_, r) =>
            Array.from({ length: Math.ceil(width / 180) + 1 }, (_, c) => (
              <rect key={`${r}-${c}`} x={c * 180 - (r % 2) * 90} y={r * 90} width="176" height="86" fill="none" stroke="#000" strokeOpacity="0.35" strokeWidth="4" />
            )),
          )}
          <circle cx={width * 0.18} cy={height * 0.35} r={height * 0.3} fill="url(#bd-torch)" />
          <circle cx={width * 0.82} cy={height * 0.35} r={height * 0.3} fill="url(#bd-torch)" />
          <rect y={height * 0.78} width={width} height={height * 0.22} fill="#000" opacity="0.35" />
        </g>
      )}

      {id === 'scifi' && (
        <g>
          <rect width={width} height={height} fill="url(#bd-scifi)" />
          <rect width={width} height={height} fill="url(#bd-grid)" />
          <path d={`M0 ${height * 0.7} L${width * 0.35} ${height * 0.55} L${width * 0.65} ${height * 0.55} L${width} ${height * 0.7} V${height} H0Z`} fill="#06101e" opacity="0.8" />
          <rect x={width * 0.35} y={height * 0.2} width={width * 0.3} height={height * 0.35} rx="12" fill="none" stroke="#5fd4ff" strokeOpacity="0.18" strokeWidth="3" />
        </g>
      )}

      {id === 'menu' && (
        <g>
          <rect width={width} height={height} fill="url(#bd-menu)" />
          <path d={`M${width * 0.55} 0 L${width} 0 L${width} ${height} L${width * 0.35} ${height} Z`} fill="#ffffff" opacity="0.03" />
          <path d={`M${width * 0.7} 0 L${width} 0 L${width} ${height} L${width * 0.5} ${height} Z`} fill="#ffffff" opacity="0.03" />
        </g>
      )}
    </svg>
  )
}

/* 결정론적 능선 — 무작위 없이 사인 합으로 만든다 (매 렌더 동일) */
function ridge(w: number, base: number, amp: number, f1: number, f2: number) {
  const pts: string[] = [`M0 ${base}`]
  for (let i = 0; i <= 48; i++) {
    const x = (i / 48) * w
    const y = base - amp * (0.55 + 0.3 * Math.sin((i / 48) * f1) + 0.15 * Math.sin((i / 48) * f2 * 3.1))
    pts.push(`L${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  pts.push(`L${w} ${base} Z`)
  return pts.join(' ')
}

function Tree({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity="0.9">
      <rect x="-6" y="-40" width="12" height="44" fill="#2a2016" />
      <path d="M0 -150 L48 -36 L-48 -36 Z" fill="#2f4a2c" />
      <path d="M0 -190 L38 -90 L-38 -90 Z" fill="#37573a" />
    </g>
  )
}
