import { memo } from 'react'

/* ──────────────────────────────────────────────────────────────
 * 1점 투시 격납 복도 (외곽 탐사대 궤도 정비 기지 C구역) — 정적 SVG.
 * 안쪽의 밝은 격납문은 '외곽선' 확인용, 오른쪽 벽의 붉은 경고등은 '색만으로 구분' 확인용.
 * 좌표는 논리 해상도 1920×1080.
 * ────────────────────────────────────────────────────────────── */

/** 안쪽 열린 문(소실 사각형) */
export const BACK = { l: 800, r: 1120, t: 335, b: 555 }

/** 깊이 t(0 = 화면 가장자리, 1 = 안쪽 문)에서의 복도 단면 사각형 */
export function slice(t: number) {
  return {
    l: BACK.l * t,
    r: 1920 + (BACK.r - 1920) * t,
    t: BACK.t * t,
    b: 1080 + (BACK.b - 1080) * t,
  }
}

const RIBS = [0.16, 0.38, 0.56, 0.7, 0.82, 0.91]

/** 벽면 위 사각 패널(깊이 t0~t1, 벽 높이 비율 v0~v1) */
function wallQuad(side: 'l' | 'r', t0: number, t1: number, v0: number, v1: number) {
  const a = slice(t0)
  const b = slice(t1)
  const x0 = side === 'l' ? a.l : a.r
  const x1 = side === 'l' ? b.l : b.r
  const y = (s: ReturnType<typeof slice>, v: number) => s.t + (s.b - s.t) * v
  return `${x0},${y(a, v0)} ${x1},${y(b, v0)} ${x1},${y(b, v1)} ${x0},${y(a, v1)}`
}

function ceilingLight(t0: number, t1: number) {
  const a = slice(t0)
  const b = slice(t1)
  const hw = (s: ReturnType<typeof slice>) => (s.r - s.l) * 0.07
  return `${960 - hw(a)},${a.t} ${960 + hw(a)},${a.t} ${960 + hw(b)},${b.t} ${960 - hw(b)},${b.t}`
}

function floorBand(t0: number, t1: number) {
  const a = slice(t0)
  const b = slice(t1)
  return `${a.l},${a.b} ${a.r},${a.b} ${b.r},${b.b} ${b.l},${b.b}`
}

export const Corridor = memo(function Corridor() {
  const gratings = Array.from({ length: 15 }, (_, i) => -560 + i * 217)
  return (
    <g>
      <defs>
        <linearGradient id="rh-ceil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1017" />
          <stop offset="1" stopColor="#1a2430" />
        </linearGradient>
        <linearGradient id="rh-floor" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#0c1117" />
          <stop offset="1" stopColor="#222d39" />
        </linearGradient>
        <linearGradient id="rh-wall-l" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#111821" />
          <stop offset="1" stopColor="#263241" />
        </linearGradient>
        <linearGradient id="rh-wall-r" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#0f151d" />
          <stop offset="1" stopColor="#243040" />
        </linearGradient>
        <linearGradient id="rh-door" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#e9f3fb" />
          <stop offset="1" stopColor="#c7dae8" />
        </linearGradient>
        <radialGradient id="rh-door-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgba(230,244,255,0.55)" />
          <stop offset="1" stopColor="rgba(230,244,255,0)" />
        </radialGradient>
        <radialGradient id="rh-red-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgba(255,70,60,0.5)" />
          <stop offset="1" stopColor="rgba(255,70,60,0)" />
        </radialGradient>
        <pattern id="rh-hazard" width="36" height="36" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="36" height="36" fill="#d6a23a" />
          <rect width="18" height="36" fill="#1a1f26" />
        </pattern>
      </defs>

      {/* 면 */}
      <polygon points={`0,0 1920,0 ${BACK.r},${BACK.t} ${BACK.l},${BACK.t}`} fill="url(#rh-ceil)" />
      <polygon points={`0,1080 1920,1080 ${BACK.r},${BACK.b} ${BACK.l},${BACK.b}`} fill="url(#rh-floor)" />
      <polygon points={`0,0 ${BACK.l},${BACK.t} ${BACK.l},${BACK.b} 0,1080`} fill="url(#rh-wall-l)" />
      <polygon points={`1920,0 ${BACK.r},${BACK.t} ${BACK.r},${BACK.b} 1920,1080`} fill="url(#rh-wall-r)" />

      {/* 바닥 격자 */}
      {gratings.map(x => (
        <line key={x} x1={x} y1={1080} x2={BACK.l + (x / 1920) * (BACK.r - BACK.l)} y2={BACK.b} stroke="rgba(120,150,180,0.08)" strokeWidth={3} />
      ))}
      <polygon points={floorBand(0.86, 0.9)} fill="url(#rh-hazard)" opacity={0.75} />

      {/* 왼쪽 벽: 보관함 패널 */}
      {[
        [0.06, 0.15],
        [0.2, 0.34],
        [0.42, 0.53],
        [0.6, 0.68],
      ].map(([a, b]) => (
        <polygon key={a} points={wallQuad('l', a, b, 0.22, 0.78)} fill="#1b2430" stroke="rgba(150,180,210,0.14)" strokeWidth={3} />
      ))}
      {[
        [0.06, 0.15],
        [0.2, 0.34],
        [0.42, 0.53],
      ].map(([a, b]) => (
        <polygon key={a} points={wallQuad('l', a, b, 0.3, 0.34)} fill="rgba(90,209,255,0.35)" />
      ))}

      {/* 오른쪽 벽: 붉은 경고등 패널 */}
      <polygon points={wallQuad('r', 0.56, 0.7, 0.3, 0.62)} fill="#8f1f22" />
      <polygon points={wallQuad('r', 0.575, 0.685, 0.34, 0.58)} fill="#e0413a" />
      <ellipse cx={1405} cy={470} rx={210} ry={170} fill="url(#rh-red-glow)" />
      <polygon points={wallQuad('r', 0.12, 0.3, 0.2, 0.8)} fill="#19212b" stroke="rgba(150,180,210,0.14)" strokeWidth={3} />
      <polygon points={wallQuad('r', 0.12, 0.3, 0.46, 0.5)} fill="rgba(242,201,76,0.4)" />

      {/* 늑골 프레임 */}
      {RIBS.map((t, i) => {
        const s = slice(t)
        const w = 30 * (1 - t) + 4
        return (
          <g key={t}>
            <rect x={s.l} y={s.t} width={s.r - s.l} height={s.b - s.t} fill="none" stroke="#0a0f15" strokeWidth={w} />
            <rect x={s.l + w / 2} y={s.t + w / 2} width={s.r - s.l - w} height={s.b - s.t - w} fill="none" stroke="rgba(160,190,220,0.13)" strokeWidth={2} />
            {i < RIBS.length - 1 && <polygon points={ceilingLight(t + 0.015, t + 0.05)} fill="#d8eeff" opacity={0.85 - i * 0.08} />}
          </g>
        )
      })}

      {/* 안쪽 밝은 격납문 */}
      <ellipse cx={960} cy={445} rx={420} ry={300} fill="url(#rh-door-glow)" />
      <rect x={BACK.l} y={BACK.t} width={BACK.r - BACK.l} height={BACK.b - BACK.t} fill="url(#rh-door)" />
      <rect x={BACK.l} y={BACK.t} width={BACK.r - BACK.l} height={18} fill="#9fb3c4" />
      <rect x={BACK.l} y={BACK.b - 10} width={BACK.r - BACK.l} height={10} fill="#aebfcd" />
      <text x={960} y={BACK.t - 14} textAnchor="middle" fontSize={24} fontWeight={700} fill="rgba(200,220,240,0.55)" letterSpacing="0.2em">
        격납고 C-04
      </text>
    </g>
  )
})

/** 1인칭 무기 실루엣. 로컬 원점(0, 0) = 총구, +x = 손잡이 쪽 */
export const Weapon = memo(function Weapon() {
  return (
    <g>
      <polygon
        points="-6,-14 34,-14 34,-10 112,-12 124,-32 384,-50 398,-68 980,-100 980,150 612,124 590,262 478,248 500,110 384,56 124,34 112,12 34,10 34,14 -6,14"
        fill="#1f262f"
        stroke="#080b10"
        strokeWidth={4}
        strokeLinejoin="round"
      />
      {/* 윗면 하이라이트 */}
      <polyline points="124,-30 384,-48 398,-66 980,-98" fill="none" stroke="#56677a" strokeWidth={5} />
      <polyline points="34,-12 112,-11" fill="none" stroke="#56677a" strokeWidth={3} />
      {/* 총열 덮개 구멍 */}
      {[150, 200, 250, 300].map(x => (
        <rect key={x} x={x} y={-14 - (x - 124) * 0.07} width={30} height={16 + (x - 124) * 0.08} rx={5} fill="#0c1015" />
      ))}
      {/* 탄창 */}
      <polygon points="508,118 600,126 584,250 486,240" fill="#2a323c" />
      <line x1={500} y1={150} x2={594} y2={158} stroke="#0c1015" strokeWidth={4} />
      {/* 조준기 블록 */}
      <polygon points="440,-70 580,-80 590,-128 452,-118" fill="#2b343f" stroke="#080b10" strokeWidth={4} />
      <rect x={470} y={-114} width={84} height={14} fill="#a6f04a" opacity={0.85} />
      {/* 탐사대 표식 띠 */}
      <polygon points="700,-86 760,-89 760,140 700,134" fill="#e58f3a" />
      <polygon points="724,-87 736,-87.5 736,138 724,137" fill="#1f262f" />
    </g>
  )
})
