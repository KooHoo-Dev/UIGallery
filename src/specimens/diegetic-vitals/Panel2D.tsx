import { hexPoints, type Layout } from './world'
import s from './style.module.css'

/** 2D 대체 화면·손목 화면에서 쓰는 SVG 게이지 판 — 3D 패널과 같은 배치(Layout)를 픽셀로 옮긴다 */
export interface PanelRefs {
  cores: (SVGPolygonElement | null)[]
  hatches: (SVGPolygonElement | null)[]
  arcFill: SVGPathElement | null
  arcDash: SVGPathElement | null
  o2: SVGGElement | null
  o2Num: SVGTextElement | null
  o2Glyph: SVGGElement | null
  bad: SVGRectElement | null
  badO2: SVGTextElement | null
}

export const emptyPanelRefs = (): PanelRefs => ({
  cores: [],
  hatches: [],
  arcFill: null,
  arcDash: null,
  o2: null,
  o2Num: null,
  o2Glyph: null,
  bad: null,
  badO2: null,
})

/** 산소 글리프: 물방울 + 압력계 바늘 (단위 크기, 중심 0,0) */
export function O2Glyph({ size }: { size: number }) {
  const k = size / 2
  return (
    <g transform={`scale(${k})`}>
      <path d="M0,-0.95 C0.55,-0.28 0.78,0.12 0.78,0.36 A0.78,0.62 0 0 1 -0.78,0.36 C-0.78,0.12 -0.55,-0.28 0,-0.95 Z" fill="none" stroke="currentColor" strokeWidth={0.13} strokeLinejoin="round" />
      <path d="M-0.42,0.42 A0.42,0.42 0 0 1 0.42,0.42" fill="none" stroke="currentColor" strokeWidth={0.1} strokeLinecap="round" />
      <path d="M0,0.42 L0.24,0.08" stroke="currentColor" strokeWidth={0.11} strokeLinecap="round" />
    </g>
  )
}

export function arcPath(cx: number, cy: number, R: number, orient: 'v' | 'h') {
  // v: 왼쪽 → 아래 → 오른쪽 (아래 반원), h: 위 → 왼쪽 → 아래 (왼쪽 반원). SVG 는 y 가 아래로 + 이므로 반시계 = sweep 0
  return orient === 'v' ? `M${cx - R},${cy} A${R},${R} 0 0 0 ${cx + R},${cy}` : `M${cx},${cy - R} A${R},${R} 0 0 0 ${cx},${cy + R}`
}

export function Panel2D({
  lay,
  k,
  cx,
  cy,
  refs,
  hatchId,
  parts,
}: {
  lay: Layout
  /** 1m 당 px */
  k: number
  cx: number
  cy: number
  refs: PanelRefs
  hatchId: string
  /** 해설 번호용 data-part 를 붙일지 */
  parts: boolean
}) {
  const X = (x: number) => cx + x * k
  const Y = (y: number) => cy - y * k
  const [sx, sy] = lay.cellScale
  const hex = (x: number, y: number, r: number) =>
    hexPoints(lay.hexRot)
      .map(([px, py]) => `${(X(x) + px * r * sx * k).toFixed(1)},${(Y(y) - py * r * sy * k).toFixed(1)}`)
      .join(' ')
  const a = lay.arc
  const sp = lay.spineBox
  const o = lay.o2
  const arcD = arcPath(X(a.cx), Y(a.cy), a.R * k, lay.orient)
  return (
    <g className={s.panel2d}>
      {/* 해설 번호 위치용 영역 */}
      <rect x={X(sp.x0)} y={Y(sp.y1)} width={(sp.x1 - sp.x0) * k} height={(sp.y1 - sp.y0) * k} fill="none" data-part={parts ? 'spine-gauge' : undefined} />
      <rect x={X(lay.arcBox.x0)} y={Y(lay.arcBox.y1)} width={(lay.arcBox.x1 - lay.arcBox.x0) * k} height={(lay.arcBox.y1 - lay.arcBox.y0) * k} fill="none" data-part={parts ? 'energy-arc' : undefined} />
      <rect x={X(lay.o2Box.x0)} y={Y(lay.o2Box.y1)} width={o.w * k} height={o.h * k} fill="none" data-part={parts ? 'o2-readout' : undefined} />

      <g className={s.fancy}>
        {lay.cells.map((c, i) => (
          <polygon key={`s${i}`} className={s.socket} points={hex(c.x, c.y, lay.r * 0.98)} />
        ))}
        {lay.cells.map((c, i) => (
          <polygon
            key={`c${i}`}
            ref={el => {
              refs.cores[i] = el
            }}
            className={s.cellCore}
            points={hex(c.x, c.y, lay.r * 0.8)}
          />
        ))}
        {lay.cells.map((c, i) => (
          <polygon
            key={`h${i}`}
            ref={el => {
              refs.hatches[i] = el
            }}
            className={s.cellHatch}
            points={hex(c.x, c.y, lay.r * 0.8)}
            fill={`url(#${hatchId})`}
          />
        ))}
        <path d={arcD} className={s.arcTrack} strokeWidth={a.w * k} />
        <path
          ref={el => {
            refs.arcDash = el
          }}
          d={arcD}
          className={s.arcDash}
          strokeWidth={a.w * k * 0.45}
          pathLength={100}
        />
        <path
          ref={el => {
            refs.arcFill = el
          }}
          d={arcD}
          className={s.arcFill}
          strokeWidth={a.w * k * 0.7}
          pathLength={100}
        />
        {/* 산소 소켓: 산소가 숨어 있어도 늘 보이는 어두운 빈 창 (나타날 자리) */}
        <rect x={X(o.x - o.w / 2) - 3} y={Y(o.y + o.h / 2) - 3} width={o.w * k + 6} height={o.h * k + 6} rx={o.h * k * 0.2} className={s.o2Socket} />
        <g
          ref={el => {
            refs.o2 = el
          }}
          className={s.o2Svg}
          style={{ transformOrigin: `${X(o.x)}px ${Y(o.y)}px` }}
        >
          <rect x={X(o.x - o.w / 2)} y={Y(o.y + o.h / 2)} width={o.w * k} height={o.h * k} rx={o.h * k * 0.18} className={s.o2Plate} />
          <g
            ref={el => {
              refs.o2Glyph = el
            }}
            transform={`translate(${X(o.x - o.w * 0.3)} ${Y(o.y)})`}
          >
            <O2Glyph size={o.h * k * 0.72} />
          </g>
          <text
            ref={el => {
              refs.o2Num = el
            }}
            x={X(o.x + o.w * 0.4)}
            y={Y(o.y) + o.h * k * 0.3}
            className={s.o2NumSvg}
            style={{ fontSize: o.h * k * 0.78 }}
            textAnchor="end"
          >
            100
          </text>
        </g>
      </g>

      {/* 효과 끄기: 조명을 받는 회색 막대 하나 + 늘 떠 있는 숫자 */}
      <g className={s.plain}>
        <rect
          ref={el => {
            refs.bad = el
          }}
          {...(lay.orient === 'v'
            ? { x: X(-0.035), y: Y(sp.y1), width: 0.07 * k, height: (sp.y1 - sp.y0) * k }
            : { x: X(sp.x0), y: Y(lay.cells[0].y + 0.035), width: (sp.x1 - sp.x0) * k, height: 0.07 * k })}
          className={s.badBar}
        />
        <text
          ref={el => {
            refs.badO2 = el
          }}
          x={X(o.x)}
          y={Y(o.y) + o.h * k * 0.28}
          className={s.badO2}
          style={{ fontSize: o.h * k * 0.62 }}
          textAnchor="middle"
        >
          100
        </text>
      </g>
    </g>
  )
}

/** 대각선 해칭 무늬 (색을 구분하기 어려워도 위험 칸을 알아보게) */
export function HatchPattern({ id, size = 10 }: { id: string; size?: number }) {
  return (
    <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width={size * 0.45} height={size} fill="rgba(5,8,12,0.85)" />
    </pattern>
  )
}
