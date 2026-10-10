import { Silhouette } from '../../core/silhouettes'
import type { SpeakerId } from './script'

/* ──────────────────────────────────────────────────────────────
 * 그림 — 도형으로만 만든 흑백 초상화 + 궤도 기지 격납고 배경 (비트맵 0)
 * 초상화는 흑백으로 두고 강조색은 UI(이름표·포커스)에만 쓴다 → '강조색 하나 + 흑백' 규칙.
 * 인물은 색이 아니라 실루엣(머리 모양·소품)으로 구분된다.
 * ────────────────────────────────────────────────────────────── */

const SKIN = '#e3e6ea'
const SHADE = '#c3c8cf'
const INK = '#14181e'

interface PortraitProps {
  who: SpeakerId
  unknown?: boolean
  /** bust = 상반신(큰 측면 초상화), icon = 얼굴만 잘라 낸 아이콘 */
  variant: 'bust' | 'icon'
  className?: string
}

/** viewBox 240×300 기준 상반신. 아이콘은 얼굴 부분만 잘라 보여 준다 */
export function Portrait({ who, unknown = false, variant, className }: PortraitProps) {
  const vb = variant === 'icon' ? '44 22 152 152' : '0 0 240 300'
  return (
    <svg className={className} viewBox={vb} aria-hidden preserveAspectRatio="xMidYMax meet">
      {unknown ? <Unknown who={who} /> : who === 'harin' ? <Harin /> : who === 'doyun' ? <Doyun /> : <Sera />}
    </svg>
  )
}

const Body = ({ fill, collar, neck = SHADE }: { fill: string; collar?: string; neck?: string }) => (
  <>
    <rect x="103" y="150" width="34" height="48" fill={neck} />
    <path d="M14 300 C14 226 56 196 120 196 C184 196 226 226 226 300 Z" fill={fill} />
    {collar && <path d="M86 200 L120 236 L154 200 L144 192 L120 214 L96 192 Z" fill={collar} />}
  </>
)

const Head = () => <rect x="74" y="50" width="92" height="116" rx="44" fill={SKIN} />

function Harin() {
  return (
    <g>
      <Body fill="#39404a" collar="#8b939e" />
      {/* 어깨 견장 — 대장 표시 */}
      <path d="M156 214 L204 230 L198 246 L150 230 Z" fill="#cfd4db" />
      <path d="M164 222 L174 214 L184 226" fill="none" stroke={INK} strokeWidth="4" />
      <Head />
      {/* 옆으로 넘긴 짧은 머리 — 각진 앞머리 */}
      <path d="M68 108 C60 50 98 30 128 34 C162 38 182 62 174 108 L166 82 L142 94 L156 66 L118 86 L104 66 L88 92 L80 84 Z" fill="#1e232b" />
      <path d="M92 112 L110 108" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <path d="M130 108 L148 112" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <rect x="96" y="118" width="12" height="7" rx="3" fill={INK} />
      <rect x="132" y="118" width="12" height="7" rx="3" fill={INK} />
      <path d="M110 148 L130 148" stroke="#7d848e" strokeWidth="4" strokeLinecap="round" />
    </g>
  )
}

function Doyun() {
  return (
    <g>
      <Body fill="#59616c" />
      {/* 작업복 멜빵 */}
      <path d="M78 206 L92 300 M162 206 L148 300" stroke="#c6ccd4" strokeWidth="10" />
      <rect x="104" y="246" width="32" height="24" rx="4" fill="#3b424c" />
      <Head />
      {/* 삐친 머리 */}
      <path d="M70 96 L66 60 L84 70 L88 40 L106 56 L118 30 L130 54 L148 36 L152 64 L172 58 L170 98 C160 76 84 76 70 96 Z" fill="#262b33" />
      {/* 이마 위 보안경 */}
      <rect x="72" y="74" width="96" height="10" fill="#3b424c" />
      <circle cx="102" cy="80" r="15" fill="#9aa3ae" stroke="#262b33" strokeWidth="5" />
      <circle cx="138" cy="80" r="15" fill="#9aa3ae" stroke="#262b33" strokeWidth="5" />
      <circle cx="104" cy="122" r="6" fill={INK} />
      <circle cx="136" cy="122" r="6" fill={INK} />
      <path d="M108 144 Q120 152 132 144" fill="none" stroke="#7d848e" strokeWidth="4" strokeLinecap="round" />
      {/* 뺨 반창고 */}
      <rect x="144" y="132" width="16" height="8" rx="2" fill="#b8bec6" transform="rotate(-18 152 136)" />
    </g>
  )
}

function SeraShapes({ hair, set, face = true }: { hair: string; set: string; face?: boolean }) {
  return (
    <g>
      {/* 긴 머리 (뒤) */}
      <path d="M64 100 C60 40 180 40 176 100 L184 230 L150 214 L150 120 L90 120 L90 214 L56 230 Z" fill={hair} />
      <Body fill={face ? '#4a525e' : hair} collar={face ? '#9ba3ad' : undefined} neck={face ? SHADE : hair} />
      {face && <Head />}
      {/* 앞머리 */}
      <path d="M72 104 C70 52 170 52 168 104 C150 84 128 74 118 76 C104 82 88 92 72 104 Z" fill={hair} />
      {/* 헤드셋: 머리띠 + 귀덮개 + 마이크 */}
      <path d="M66 112 C62 30 178 30 174 112" fill="none" stroke={set} strokeWidth="9" />
      <rect x="54" y="98" width="26" height="40" rx="10" fill={set} />
      <path d="M68 136 C72 160 92 166 108 160" fill="none" stroke={set} strokeWidth="6" strokeLinecap="round" />
      <circle cx="110" cy="159" r="6" fill={set} />
      {face && (
        <>
          <path d="M94 122 Q103 114 112 122" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          <path d="M128 122 Q137 114 146 122" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          <path d="M112 146 Q120 151 128 146" fill="none" stroke="#7d848e" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
    </g>
  )
}

const Sera = () => <SeraShapes hair="#2a2f38" set="#cfd4db" />

/** 아직 소개 전 — 같은 실루엣을 검게 칠해 '누군가 있다'만 알린다 (+ 무전 표시) */
function Unknown({ who }: { who: SpeakerId }) {
  return (
    <g>
      {who === 'sera' ? <SeraShapes hair="#0b0e13" set="#0b0e13" face={false} /> : <><Body fill="#0b0e13" neck="#0b0e13" /><rect x="74" y="50" width="92" height="116" rx="44" fill="#0b0e13" /></>}
      <rect x="74" y="50" width="92" height="116" rx="44" fill="#0b0e13" />
      <text x="120" y="138" textAnchor="middle" fontSize="72" fontWeight="800" fill="#f4f6f8" fontFamily="'Malgun Gothic', sans-serif">
        ?
      </text>
      {/* 무전 전파 */}
      <path d="M186 70 Q200 90 186 110 M198 58 Q220 90 198 122" fill="none" stroke="#f4f6f8" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
    </g>
  )
}

/* ───── 배경: 궤도 정비 기지 격납고 (창밖 행성) ───── */

/** 고정 시드 별 — 렌더마다 같은 자리 */
const STARS = (() => {
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  return Array.from({ length: 70 }, () => ({ x: rnd(), y: rnd(), r: 0.8 + rnd() * 2.2, o: 0.25 + rnd() * 0.6 }))
})()

export function SceneBackdrop({ portrait, speaking }: { portrait: boolean; speaking: SpeakerId | null }) {
  const W = portrait ? 1080 : 1920
  const H = portrait ? 1920 : 1080
  const win = portrait ? { x: 60, y: 150, w: 960, h: 880 } : { x: 220, y: 70, w: 1480, h: 560 }
  const planet = portrait ? { cx: 760, cy: 1420, r: 820 } : { cx: 1330, cy: 1300, r: 960 }
  const floorY = portrait ? 1060 : 640
  const struts = portrait ? [380, 700] : [700, 1220]
  const feet = portrait ? 1250 : 770
  const sh = portrait ? 300 : 250
  const people: { id: SpeakerId; x: number }[] = portrait
    ? [
        { id: 'harin', x: 420 },
        { id: 'doyun', x: 610 },
      ]
    : [
        { id: 'harin', x: 800 },
        { id: 'doyun', x: 980 },
      ]
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id="dc-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#121b28" />
          <stop offset="1" stopColor="#06090e" />
        </linearGradient>
        <linearGradient id="dc-space" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#03060c" />
          <stop offset="1" stopColor="#0c1c2c" />
        </linearGradient>
        <radialGradient id="dc-planet" cx="0.38" cy="0.18" r="0.75">
          <stop offset="0" stopColor="#5d8c93" />
          <stop offset="0.45" stopColor="#2b5560" />
          <stop offset="1" stopColor="#0d2229" />
        </radialGradient>
        <linearGradient id="dc-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#18212d" />
          <stop offset="1" stopColor="#080b10" />
        </linearGradient>
        <linearGradient id="dc-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.45" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.72" />
        </linearGradient>
        <clipPath id="dc-win">
          <rect x={win.x} y={win.y} width={win.w} height={win.h} rx="26" />
        </clipPath>
      </defs>
      <rect width={W} height={H} fill="url(#dc-bg)" />
      {/* 창 */}
      <g clipPath="url(#dc-win)">
        <rect x={win.x} y={win.y} width={win.w} height={win.h} fill="url(#dc-space)" />
        {STARS.map((s, i) => (
          <circle key={i} cx={win.x + s.x * win.w} cy={win.y + s.y * win.h * 0.7} r={s.r} fill="#dfe9f2" opacity={s.o} />
        ))}
        <circle cx={planet.cx} cy={planet.cy} r={planet.r + 26} fill="#8fdbe6" opacity="0.08" />
        <circle cx={planet.cx} cy={planet.cy} r={planet.r + 10} fill="#8fdbe6" opacity="0.12" />
        <circle cx={planet.cx} cy={planet.cy} r={planet.r} fill="url(#dc-planet)" />
        <circle cx={planet.cx} cy={planet.cy} r={planet.r} fill="none" stroke="#a6e6ee" strokeOpacity="0.5" strokeWidth="4" />
        {/* 궤도 위성 띠 */}
        <path d={`M${win.x} ${win.y + win.h * 0.32} L${win.x + win.w} ${win.y + win.h * 0.12}`} stroke="#9fb4c6" strokeOpacity="0.12" strokeWidth="3" />
      </g>
      {struts.map(x => (
        <path key={x} d={`M${x} ${win.y - 10} L${x + 30} ${win.y - 10} L${x + 10} ${win.y + win.h + 10} L${x - 20} ${win.y + win.h + 10} Z`} fill="#0b1119" />
      ))}
      <rect x={win.x} y={win.y} width={win.w} height={win.h} rx="26" fill="none" stroke="#1d2836" strokeWidth="20" />
      <rect x={win.x - 14} y={win.y - 14} width={win.w + 28} height={win.h + 28} rx="34" fill="none" stroke="#0a0f15" strokeWidth="8" />
      {/* 바닥 */}
      <rect x="0" y={floorY} width={W} height={H - floorY} fill="url(#dc-floor)" />
      {[0, 1, 2, 3].map(i => (
        <line key={i} x1="0" x2={W} y1={floorY + 40 + i * i * 34} y2={floorY + 40 + i * i * 34} stroke="#2a3644" strokeOpacity={0.5 - i * 0.1} strokeWidth="2" />
      ))}
      {/* 정비 콘솔 (왼쪽) · 화물 상자 (오른쪽) */}
      <g fill="#0c1219">
        <path d={portrait ? `M0 ${floorY - 120} H250 L290 ${floorY + 60} H0 Z` : `M60 ${floorY - 90} H430 L470 ${floorY + 90} H40 Z`} />
        <rect x={portrait ? 830 : 1500} y={floorY - 130} width="190" height="150" />
        <rect x={portrait ? 870 : 1560} y={floorY - 230} width="130" height="104" />
        <rect x={portrait ? 700 : 1380} y={floorY - 60} width="120" height="80" />
      </g>
      <g>
        {[0, 1, 2, 3, 4].map(i => (
          <rect key={i} x={(portrait ? 30 : 100) + i * 46} y={floorY - (portrait ? 92 : 64)} width="26" height="7" rx="3" fill={i === 1 ? '#7fd1b8' : i === 3 ? '#e2b65c' : '#4b6a86'} opacity="0.8" />
        ))}
      </g>
      {/* 인물 — 공통 실루엣 키트(아군 = 캡슐). 지금 말하는 사람만 밝게 */}
      {people.map(pp => (
        <Silhouette key={pp.id} role="ally" x={pp.x} y={feet} height={sh} color={speaking === pp.id ? '#aebfcd' : '#1f2b38'} />
      ))}
      <rect width={W} height={H} fill="url(#dc-shade)" />
    </svg>
  )
}
