import type { CSSProperties, Ref } from 'react'
import { ActionGlyph } from '../../core/input'
import { Silhouette, type Role } from '../../core/silhouettes'
import { LINES, PALETTES, SUBTITLE_COLORS, type Device, type PreviewTarget, type Settings } from './model'
import s from './style.module.css'

/** 미리보기 장면의 기준 크기 — 부모가 CSS scale 로 맞춘다 */
export const PV_W = 976
export const PV_H = 549

/* 실루엣은 발 위치(x, y) 기준 — 갤러리 공통 키트(core/silhouettes)와 같은 좌표 규칙 */
const ALLY = { x: 326, y: 412, h: 124 }
const ENEMIES = [
  { x: 690, y: 352, h: 100 },
  { x: 818, y: 394, h: 100 },
]
const ITEM = { x: 470, y: 430, h: 64 }
const DANGER = { x: 760, y: 476 }

/** 고대비가 꺼져 있을 때의 자연색 (배경에 묻히는 흙빛) */
const NATURAL: Record<Role, string> = { ally: '#59684a', enemy: '#4b3931', neutral: '#a27945' }

const MODE_LABEL: Record<string, string> = { off: '기본', protanopia: '적색약', deuteranopia: '녹색약', tritanopia: '청색약' }

export const TARGET_LABEL: Record<PreviewTarget, string> = {
  subtitle: '자막',
  hud: 'HUD',
  dot: '중앙 점',
  markers: '역할 색',
  scene: '장면 전체',
  prompt: '버튼 안내',
  reticle: '조준점',
  menu: '메뉴 (장면 아님)',
}

export interface PreviewProps {
  settings: Settings
  line: number
  lineSeq: number
  target: PreviewTarget | null
  hitSeq: number
  /** 피격 테두리 재생 번호 — 번쩍임 제한기(requestFlash)가 허락할 때만 올라간다 */
  ringSeq?: number
  sceneRef?: Ref<HTMLDivElement>
  touchQuick?: boolean
  onQuick?: () => void
  quickSeq?: number
  /** 버튼 안내를 그릴 입력 장치 */
  device?: Device
  /** 해설 번호용 data-part 를 붙일지 (나쁜 예에서도 같은 부분을 가리킨다) */
  parts?: boolean
}

type MarkKind = 'ally' | 'enemy' | 'item' | 'danger'

/** 역할 표식 — 실루엣과 같은 모양 언어(캡슐·삼각·마름모) + 위험은 '!' 육각형. 색은 역할 색 변수 */
function Mark({ kind, x, y, size = 36 }: { kind: MarkKind; x: number; y: number; size?: number }) {
  const h = size
  const ink = '#10131c'
  return (
    <g transform={`translate(${x} ${y})`}>
      {kind === 'ally' && <rect x={-h * 0.28} y={-h / 2} width={h * 0.56} height={h} rx={h * 0.28} style={{ fill: 'var(--c-ally)' }} stroke={ink} strokeWidth="2.5" />}
      {kind === 'enemy' && <path d={`M0 ${-h / 2} L${h * 0.55} ${h / 2} L${-h * 0.55} ${h / 2}Z`} style={{ fill: 'var(--c-enemy)' }} stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />}
      {kind === 'item' && <path d={`M0 ${-h / 2} L${h * 0.42} 0 L0 ${h / 2} L${-h * 0.42} 0Z`} style={{ fill: 'var(--c-item)' }} stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />}
      {kind === 'danger' && (
        <>
          <path
            d={`M${-h * 0.25} ${-h * 0.45} H${h * 0.25} L${h * 0.5} 0 L${h * 0.25} ${h * 0.45} H${-h * 0.25} L${-h * 0.5} 0Z`}
            style={{ fill: 'var(--c-danger)' }}
            stroke={ink}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <rect x={-h * 0.055} y={-h * 0.28} width={h * 0.11} height={h * 0.32} rx="1.5" fill={ink} />
          <rect x={-h * 0.055} y={h * 0.12} width={h * 0.11} height={h * 0.11} rx="1.5" fill={ink} />
        </>
      )}
    </g>
  )
}

const LEGEND: { kind: MarkKind; label: string }[] = [
  { kind: 'ally', label: '아군' },
  { kind: 'enemy', label: '적' },
  { kind: 'item', label: '아이템' },
  { kind: 'danger', label: '위험' },
]

/**
 * 즉시 미리보기 — 갤러리 공통 실루엣(아군 캡슐 · 적 삼각 · 아이템 마름모)으로 그린 작은 전투 장면
 * + 역할 범례 + 자막 샘플 + 미니 HUD. 모든 값은 settings 에서만 읽는다 (설정 데이터 → 화면).
 */
export function Preview(p: PreviewProps) {
  const st = p.settings
  const pal = PALETTES[st.colorMode] ?? PALETTES.off
  const hc = st.highContrast
  const roleFill = hc === 'role-color' || hc === 'role-outline'
  const outline = hc === 'role-outline'
  const L = LINES[p.line % LINES.length]
  const subBg = st.subtitleBg === 'off' ? 0 : st.subtitleBg === 'heavy' ? 0.86 : 0.5
  const k = st.textScale / 100
  // 장면 속 HUD·안내 글자 배율: 글자 크기 설정을 따르되, 축소된 미리보기에서도 22px 아래로 내려가지 않게 바닥을 둔다
  const pvK = Math.max(k, 0.9)
  const hud = st.hudSize === 'small' ? 0.78 : st.hudSize === 'large' ? 1.38 : 1
  const vars = {
    '--c-ally': pal.ally,
    '--c-enemy': pal.enemy,
    '--c-item': pal.item,
    '--c-danger': pal.danger,
    '--c-voice2': pal.voice2,
    '--sub-bg': `rgba(6, 8, 14, ${subBg})`,
    '--sub-k': k,
    '--pv-k': pvK,
    '--sub-color': SUBTITLE_COLORS[st.subtitleColor] ?? '#fff',
    '--hud-k': hud,
  } as CSSProperties
  const fillOf = (role: Role) => (roleFill ? (role === 'ally' ? pal.ally : role === 'enemy' ? pal.enemy : pal.item) : NATURAL[role])
  const e0 = ENEMIES[0]
  const e0cy = e0.y - e0.h * 0.42
  const reticleX = st.aimAssist === 'strong' ? e0.x : st.aimAssist === 'weak' ? e0.x - 34 : e0.x - 96
  const reticleY = st.aimAssist === 'strong' ? e0cy : e0cy - 22
  const hl = p.target
  const ringSeq = p.ringSeq ?? p.hitSeq
  const device = p.device === 'kbm' ? 'keyboard' : p.device === 'touch' ? 'touch' : 'gamepad'

  const markPos: { kind: MarkKind; x: number; y: number }[] = [
    { kind: 'ally', x: ALLY.x, y: ALLY.y - ALLY.h - 30 },
    ...ENEMIES.map(e => ({ kind: 'enemy' as const, x: e.x, y: e.y - e.h - 30 })),
    { kind: 'item', x: ITEM.x, y: ITEM.y - ITEM.h - 28 },
    // 위험 표식은 구역 오른쪽 위 — 아이템 버튼 안내와 겹치지 않게
    { kind: 'danger', x: DANGER.x + 116, y: DANGER.y - 30 },
  ]

  return (
    <div className={s.pv} style={vars} data-hc={hc} data-role={roleFill || undefined} data-rm={st.reduceMotion || undefined}>
      {/* 장면 (카메라 흔들림은 이 층에만 — 자막·HUD 는 흔들지 않는다) */}
      <div ref={p.sceneRef} className={s.pvScene}>
        <svg width={PV_W} height={PV_H} viewBox={`0 0 ${PV_W} ${PV_H}`} aria-hidden>
          <defs>
            <linearGradient id="sa-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f0a868" />
              <stop offset="0.6" stopColor="#fbd9a6" />
              <stop offset="1" stopColor="#fff1d6" />
            </linearGradient>
            <linearGradient id="sa-ground" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f1d8a6" />
              <stop offset="1" stopColor="#d6ac72" />
            </linearGradient>
            <pattern id="sa-hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="14" height="14" style={{ fill: 'var(--danger-fill)' }} />
              <rect width="6" height="14" fill="#1b1206" opacity="0.55" />
            </pattern>
          </defs>
          <g className={s.pvBg}>
            <rect x="-40" y="-40" width={PV_W + 80} height={PV_H + 80} fill="url(#sa-sky)" />
            <circle cx="770" cy="120" r="70" fill="#fff7e2" opacity="0.85" />
            <path d="M-40 250 L0 240 L90 196 L180 230 L280 160 L380 222 L470 176 L590 236 L690 170 L800 228 L900 180 L976 214 L1016 230 V300 H-40Z" fill="#c98f66" opacity="0.6" />
            <path d="M-40 292 L0 292 L120 250 L240 276 L360 240 L520 282 L660 252 L800 286 L976 258 L1016 262 V330 H-40Z" fill="#b07b55" opacity="0.8" />
            <rect x="-40" y="300" width={PV_W + 80} height={PV_H - 260} fill="url(#sa-ground)" />
            <path d="M0 300 H976" stroke="#fff" strokeOpacity="0.35" strokeWidth="2" />
            {/* 폐허 벽 */}
            <path d="M60 300 V214 H96 V236 H122 V196 H160 V300Z" fill="#8a6650" />
            <path d="M880 300 V228 H912 V252 H944 V300Z" fill="#8a6650" />
            <ellipse cx="160" cy="470" rx="90" ry="22" fill="#b98f5c" opacity="0.6" />
            <ellipse cx="860" cy="500" rx="120" ry="26" fill="#b98f5c" opacity="0.5" />
            <path d="M380 470 l26 -30 l30 8 l14 24 z" fill="#9d7652" />
          </g>

          {/* 대상: 공통 실루엣 키트 — 모양이 역할을 구분한다 (색은 보조) */}
          <g className={s.pvActors}>
            <ellipse cx={DANGER.x} cy={DANGER.y} rx="92" ry="26" fill="url(#sa-hatch)" className={s.pvDanger} />
            <g className={s.pvActor}>
              <Silhouette role="ally" x={ALLY.x} y={ALLY.y} height={ALLY.h} color={fillOf('ally')} outline={outline} />
            </g>
            {ENEMIES.map((e, i) => (
              <g key={i} className={s.pvActor}>
                <Silhouette role="enemy" x={e.x} y={e.y} height={e.h} color={fillOf('enemy')} outline={outline} />
              </g>
            ))}
            <g className={s.pvActor}>
              <Silhouette role="neutral" x={ITEM.x} y={ITEM.y} height={ITEM.h} color={fillOf('neutral')} outline={outline} />
            </g>
          </g>

          {/* 역할 표식 (월드 위 HUD) — 색각 모드가 바꾸는 곳 */}
          <g className={s.pvMarks} data-part={p.parts ? 'role-marks' : undefined}>
            {markPos.map((m, i) => (
              <Mark key={i} kind={m.kind} x={m.x} y={m.y} />
            ))}
            {hl === 'markers' && (
              <g fill="none" stroke="#ffe066" strokeWidth="3" strokeDasharray="8 6">
                {markPos.map((m, i) => (
                  <circle key={i} cx={m.x} cy={m.y} r="30" />
                ))}
              </g>
            )}
          </g>

          {/* 조준점 + 조준 보조 */}
          <g className={s.pvReticle} transform={`translate(${reticleX} ${reticleY})`}>
            {st.aimAssist !== 'off' && (
              <circle r={st.aimAssist === 'strong' ? 46 : 34} fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="2.5" strokeDasharray="5 6" />
            )}
            <g stroke="#fff" strokeWidth="4" strokeLinecap="round">
              <path d="M-22 0 H-9 M9 0 H22 M0 -22 V-9 M0 9 V22" />
            </g>
            <g stroke="#10131c" strokeWidth="1.5" strokeOpacity="0.6" fill="none">
              <path d="M-22 0 H-9 M9 0 H22 M0 -22 V-9 M0 9 V22" />
            </g>
            {st.aimAssist === 'strong' && <circle r="5" style={{ fill: 'var(--c-enemy)' }} />}
            {hl === 'reticle' && <circle r="62" fill="none" stroke="#ffe066" strokeWidth="3" strokeDasharray="8 6" />}
          </g>
        </svg>
      </div>

      {/* 역할 범례 — 색각 모드를 바꾸면 견본 색이 바로 바뀐다 (모양 + 색 + 글자 3중 표기) */}
      <div className={s.pvLegend} data-hl={hl === 'markers' || undefined}>
        <span className={s.pvLegendHead}>역할 색 · {MODE_LABEL[st.colorMode] ?? st.colorMode}</span>
        {LEGEND.map(l => (
          <span key={l.kind} className={s.pvLegendRow}>
            <svg viewBox="-20 -20 40 40" className={s.pvLegendSwatch} aria-hidden>
              <Mark kind={l.kind} x={0} y={0} size={32} />
            </svg>
            {l.label}
          </span>
        ))}
      </div>

      {/* 화면 중앙 점 */}
      <div className={s.pvDot} data-on={st.centerDot || undefined} data-hl={hl === 'dot' || undefined} />

      {/* 미니 HUD */}
      <div className={s.pvHud} data-hl={hl === 'hud' || undefined}>
        <svg viewBox="0 0 24 24" className={s.pvHudIcon} aria-hidden>
          <path d="M12 21s-7.5-4.6-9.6-9.2C.8 8.3 3 4.5 6.6 4.5c2.1 0 3.6 1.2 5.4 3.2 1.8-2 3.3-3.2 5.4-3.2 3.6 0 5.8 3.8 4.2 7.3C19.5 16.4 12 21 12 21z" />
        </svg>
        <div className={s.pvHudBar}>
          <i style={{ width: '68%' }} />
        </div>
        <b className={s.pvHudNum}>68</b>
      </div>
      <div className={s.pvAmmo} data-hl={hl === 'hud' || undefined}>
        <b>24</b>
        <span>/ 90</span>
      </div>

      {/* 버튼 안내 (연타 ↔ 길게 누르기) — 현재 입력 장치의 글리프 */}
      <div className={s.pvPrompt} data-hl={hl === 'prompt' || undefined} style={{ left: ITEM.x + 40, top: ITEM.y - ITEM.h + 4 }}>
        <ActionGlyph action="interact" device={device} size={Math.round(32 * pvK)} />
        {st.holdToPress ? (
          <>
            <span className={s.pvHold} aria-hidden />
            길게 눌러 줍기
          </>
        ) : (
          <>
            <b className={s.pvMash}>×5</b>
            연타해서 줍기
          </>
        )}
      </div>

      {/* 자막 샘플 */}
      <div className={s.subWrap}>
        <div key={p.lineSeq} className={s.sub} data-part={p.parts ? 'subtitle-sample' : undefined} data-hl={hl === 'subtitle' || undefined} data-bg={st.subtitleBg}>
          {st.speakerCues && L.dir === 'left' && <span className={s.subArrow} data-dir="left" aria-label="왼쪽 화면 밖" />}
          {st.speakerCues && (
            <b className={s.subName} style={{ color: L.voice === 'ally' ? 'var(--c-ally)' : 'var(--c-voice2)' }}>
              {L.who}
            </b>
          )}
          <span className={s.subText}>{L.text}</span>
          {st.speakerCues && L.dir === 'right' && <span className={s.subArrow} data-dir="right" aria-label="오른쪽 화면 밖" />}
        </div>
      </div>

      {/* 피격 테스트 테두리 (번쩍임 제한기를 통과했을 때만 새로 재생) / 흔들림 수치 */}
      {ringSeq > 0 && (
        <div
          key={ringSeq}
          className={s.hitRing}
          data-mode={st.cameraShake === 0 ? (st.reduceMotion ? 'still' : 'blink') : 'shake'}
        />
      )}
      {p.hitSeq > 0 && (
        <div key={`r${p.hitSeq}`} className={s.hitReadout}>
          {st.cameraShake === 0 ? '흔들림 0 → 테두리만 강조' : `흔들림 ±${st.cameraShake * 2}px`}
        </div>
      )}

      {hl === 'scene' && <div className={s.pvSceneHl} />}

      {p.touchQuick && (
        <button type="button" className={s.pvQuick} onClick={p.onQuick} data-on={hc !== 'off' || undefined}>
          <span key={p.quickSeq} className={s.pvQuickIcon} aria-hidden />
          고대비
        </button>
      )}
    </div>
  )
}
