/* 무대 배경 — 궤도 정비 기지 외곽의 전투 구역 (SVG 로 직접 그림, 비트맵 0) */

export function Arena({ W, H }: { W: number; H: number }) {
  const portrait = H > W
  const horizon = portrait ? H * 0.36 : H * 0.42
  const vpX = W / 2
  const rays = 18
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }} aria-hidden>
      <defs>
        <linearGradient id="dn-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#070b17" />
          <stop offset="0.7" stopColor="#14213a" />
          <stop offset="1" stopColor="#1f3550" />
        </linearGradient>
        <linearGradient id="dn-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#152238" />
          <stop offset="1" stopColor="#060a12" />
        </linearGradient>
        <radialGradient id="dn-planet" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.82" stopColor="#2b4566" />
          <stop offset="0.97" stopColor="#5d8fb8" />
          <stop offset="1" stopColor="#5d8fb8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="dn-pool" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#5fd4ff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#5fd4ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="dn-pool-red" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ff6a5c" stopOpacity="0.2" />
          <stop offset="1" stopColor="#ff6a5c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="dn-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fb6e0" stopOpacity="0" />
          <stop offset="1" stopColor="#7fb6e0" stopOpacity="0.18" />
        </linearGradient>
      </defs>

      <rect width={W} height={horizon} fill="url(#dn-sky)" />
      {/* 별 */}
      {Array.from({ length: 60 }, (_, i) => (
        <circle key={i} cx={(i * 7919) % W} cy={((i * 104729) % Math.round(horizon * 0.9)) | 0} r={(i % 3) * 0.8 + 1} fill="#dfe9ff" opacity={0.18 + (i % 4) * 0.1} />
      ))}
      {/* 큰 행성의 테두리 */}
      <circle cx={portrait ? W * 0.82 : W * 0.16} cy={portrait ? horizon * 0.42 : horizon * 0.5} r={portrait ? 260 : 320} fill="url(#dn-planet)" opacity="0.65" />
      {/* 먼 정비 기지 구조물 */}
      <g fill="#0b1426" opacity="0.95">
        {Array.from({ length: 11 }, (_, i) => {
          const w = 70 + ((i * 37) % 90)
          const h = 60 + ((i * 53) % 150)
          const x = (i / 10) * W - w / 2
          return <rect key={i} x={x} y={horizon - h} width={w} height={h} />
        })}
        <rect x={W * 0.58} y={horizon - 250} width="18" height="250" />
        <rect x={W * 0.58 - 60} y={horizon - 250} width="140" height="10" />
      </g>
      <g fill="#ffb43c" opacity="0.55">
        {Array.from({ length: 9 }, (_, i) => (
          <rect key={i} x={((i * 211) % W) + 10} y={horizon - 40 - ((i * 29) % 90)} width="8" height="4" />
        ))}
      </g>
      <rect y={horizon - 120} width={W} height="120" fill="url(#dn-haze)" />

      {/* 바닥 + 원근 격자 */}
      <rect y={horizon} width={W} height={H - horizon} fill="url(#dn-floor)" />
      <line x1="0" x2={W} y1={horizon} y2={horizon} stroke="#7fd8ff" strokeOpacity="0.35" strokeWidth="2" />
      {Array.from({ length: rays + 1 }, (_, i) => {
        const x = -W * 0.6 + (i / rays) * W * 2.2
        return <line key={i} x1={vpX + (x - vpX) * 0.06} y1={horizon} x2={x} y2={H} stroke="#5fd4ff" strokeOpacity="0.07" strokeWidth="2" />
      })}
      {[0.05, 0.13, 0.25, 0.42, 0.65, 0.95].map((k, i) => {
        const y = horizon + (H - horizon) * k
        return <line key={i} x1="0" x2={W} y1={y} y2={y} stroke="#5fd4ff" strokeOpacity={0.05 + k * 0.05} strokeWidth="2" />
      })}
    </svg>
  )
}

/** 표적 아래 빛 웅덩이 */
export function Pool({ x, y, w, enemy }: { x: number; y: number; w: number; enemy: boolean }) {
  return <ellipse cx={x} cy={y} rx={w} ry={w * 0.22} fill={enemy ? 'url(#dn-pool-red)' : 'url(#dn-pool)'} />
}
