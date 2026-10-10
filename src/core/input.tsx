import { useEffect, useState } from 'react'

/* ──────────────────────────────────────────────────────────────
 * 입력 장치 글리프 (상표 없는 중립 디자인) + 마지막 입력 장치 추적
 * 특정 콘솔의 버튼 기호(A/B, ○/×)나 로고는 쓰지 않는다 — 위치(아래/오른쪽…)로 표현한다.
 * ────────────────────────────────────────────────────────────── */

export type Device = 'keyboard' | 'mouse' | 'gamepad' | 'touch'
export type PadFace = 'bottom' | 'right' | 'left' | 'top'

/** 갤러리 공통 행동 → 장치별 입력 */
export type Action = 'confirm' | 'back' | 'tabPrev' | 'tabNext' | 'option' | 'menu' | 'skip' | 'interact'

const KEYS: Record<Action, string> = {
  confirm: 'Enter',
  back: 'Esc',
  tabPrev: 'Q',
  tabNext: 'E',
  option: 'R',
  menu: 'Tab',
  skip: 'Space',
  interact: 'F',
}
const PAD: Record<Action, { kind: 'face'; face: PadFace } | { kind: 'shoulder'; side: 'L' | 'R' } | { kind: 'start' }> = {
  confirm: { kind: 'face', face: 'bottom' },
  back: { kind: 'face', face: 'right' },
  tabPrev: { kind: 'shoulder', side: 'L' },
  tabNext: { kind: 'shoulder', side: 'R' },
  option: { kind: 'face', face: 'left' },
  menu: { kind: 'start' },
  skip: { kind: 'face', face: 'top' },
  interact: { kind: 'face', face: 'left' },
}
const TOUCH: Record<Action, 'tap' | 'hold' | 'swipe'> = {
  confirm: 'tap',
  back: 'swipe',
  tabPrev: 'swipe',
  tabNext: 'swipe',
  option: 'hold',
  menu: 'tap',
  skip: 'tap',
  interact: 'tap',
}

interface GlyphProps {
  size?: number
  /** 밝은 배경용이면 'dark' */
  tone?: 'light' | 'dark'
}

const ink = (tone: GlyphProps['tone']) => (tone === 'dark' ? '#10141c' : '#f4f7fb')
const paper = (tone: GlyphProps['tone']) => (tone === 'dark' ? '#f4f7fb' : 'rgba(10,14,22,0.75)')

/** 행동 하나를 현재 장치에 맞는 글리프로 */
export function ActionGlyph({ action, device, size = 40, tone }: GlyphProps & { action: Action; device: Device }) {
  if (device === 'gamepad') {
    const m = PAD[action]
    if (m.kind === 'face') return <PadButton face={m.face} size={size} tone={tone} />
    if (m.kind === 'shoulder') return <Shoulder side={m.side} size={size} tone={tone} />
    return <StartButton size={size} tone={tone} />
  }
  if (device === 'touch') return <TouchGlyph kind={TOUCH[action]} size={size} tone={tone} />
  if (device === 'mouse' && action === 'confirm') return <MouseGlyph button="left" size={size} tone={tone} />
  if (device === 'mouse' && action === 'back') return <MouseGlyph button="right" size={size} tone={tone} />
  return <KeyCap label={KEYS[action]} size={size} tone={tone} />
}

export function KeyCap({ label, size = 40, tone }: GlyphProps & { label: string }) {
  const w = Math.max(size, label.length > 1 ? size * (0.42 + label.length * 0.26) : size)
  return (
    <svg width={w} height={size} viewBox={`0 0 ${w} ${size}`} aria-label={`${label} 키`} role="img" style={{ verticalAlign: 'middle' }}>
      <rect x="1.5" y="1.5" width={w - 3} height={size - 3} rx={size * 0.18} fill={paper(tone)} stroke={ink(tone)} strokeWidth="2.5" />
      <rect x="1.5" y={size - 8} width={w - 3} height="6.5" rx="3" fill={ink(tone)} opacity="0.25" />
      <text x={w / 2} y={size / 2 + size * 0.14} textAnchor="middle" fontSize={size * (label.length > 3 ? 0.34 : 0.44)} fontWeight="700" fill={ink(tone)} fontFamily="'Chakra Petch', sans-serif">
        {label}
      </text>
    </svg>
  )
}

/** 마름모 배치 네 버튼 중 하나를 채운다 — 위치로 버튼을 가리키는 중립 표기 */
export function PadButton({ face, size = 40, tone }: GlyphProps & { face: PadFace }) {
  const c = size / 2
  const r = size * 0.15
  const d = size * 0.3
  const pos: Record<PadFace, [number, number]> = { bottom: [c, c + d], right: [c + d, c], left: [c - d, c], top: [c, c - d] }
  const label = { bottom: '아래', right: '오른쪽', left: '왼쪽', top: '위' }[face]
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`게임패드 ${label} 버튼`} style={{ verticalAlign: 'middle' }}>
      <circle cx={c} cy={c} r={c - 1.5} fill={paper(tone)} stroke={ink(tone)} strokeWidth="2" />
      {(Object.keys(pos) as PadFace[]).map(f => (
        <circle key={f} cx={pos[f][0]} cy={pos[f][1]} r={r} fill={f === face ? ink(tone) : 'none'} stroke={ink(tone)} strokeWidth="2" opacity={f === face ? 1 : 0.55} />
      ))}
    </svg>
  )
}

export function Shoulder({ side, size = 40, tone }: GlyphProps & { side: 'L' | 'R' }) {
  const w = size * 1.3
  const path = side === 'L' ? `M4 ${size - 6} Q4 6 ${w * 0.45} 6 H${w - 4} V${size - 6} Z` : `M${w - 4} ${size - 6} Q${w - 4} 6 ${w * 0.55} 6 H4 V${size - 6} Z`
  return (
    <svg width={w} height={size} viewBox={`0 0 ${w} ${size}`} role="img" aria-label={`게임패드 ${side === 'L' ? '왼쪽' : '오른쪽'} 숄더 버튼`} style={{ verticalAlign: 'middle' }}>
      <path d={path} fill={paper(tone)} stroke={ink(tone)} strokeWidth="2.5" strokeLinejoin="round" />
      <text x={w / 2} y={size / 2 + size * 0.16} textAnchor="middle" fontSize={size * 0.42} fontWeight="700" fill={ink(tone)} fontFamily="'Chakra Petch', sans-serif">
        {side}
      </text>
    </svg>
  )
}

export function StartButton({ size = 40, tone }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="게임패드 메뉴 버튼" style={{ verticalAlign: 'middle' }}>
      <rect x="2" y={size * 0.22} width={size - 4} height={size * 0.56} rx={size * 0.28} fill={paper(tone)} stroke={ink(tone)} strokeWidth="2" />
      {[0.38, 0.5, 0.62].map(y => (
        <line key={y} x1={size * 0.32} x2={size * 0.68} y1={size * y} y2={size * y} stroke={ink(tone)} strokeWidth="2.2" strokeLinecap="round" />
      ))}
    </svg>
  )
}

export function MouseGlyph({ button, size = 40, tone }: GlyphProps & { button: 'left' | 'right' | 'wheel' }) {
  const w = size * 0.72
  return (
    <svg width={w} height={size} viewBox={`0 0 ${w} ${size}`} role="img" aria-label={`마우스 ${button === 'left' ? '왼쪽' : button === 'right' ? '오른쪽' : '휠'} 버튼`} style={{ verticalAlign: 'middle' }}>
      <rect x="2" y="2" width={w - 4} height={size - 4} rx={w * 0.45} fill={paper(tone)} stroke={ink(tone)} strokeWidth="2.2" />
      <line x1={w / 2} y1="2" x2={w / 2} y2={size * 0.42} stroke={ink(tone)} strokeWidth="2" />
      <line x1="2" y1={size * 0.42} x2={w - 2} y2={size * 0.42} stroke={ink(tone)} strokeWidth="2" />
      {button !== 'wheel' && (
        <path
          d={button === 'left' ? `M${w / 2 - 1} 4 Q4 4 4 ${size * 0.4} H${w / 2 - 1} Z` : `M${w / 2 + 1} 4 Q${w - 4} 4 ${w - 4} ${size * 0.4} H${w / 2 + 1} Z`}
          fill={ink(tone)}
        />
      )}
      {button === 'wheel' && <rect x={w / 2 - 3} y={size * 0.12} width="6" height={size * 0.2} rx="3" fill={ink(tone)} />}
    </svg>
  )
}

export function TouchGlyph({ kind, size = 40, tone }: GlyphProps & { kind: 'tap' | 'hold' | 'swipe' }) {
  const c = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={{ tap: '탭', hold: '길게 누르기', swipe: '밀기' }[kind]} style={{ verticalAlign: 'middle' }}>
      <circle cx={c} cy={c} r={c - 1.5} fill={paper(tone)} stroke={ink(tone)} strokeWidth="2" />
      <circle cx={c} cy={c} r={size * 0.14} fill={ink(tone)} />
      {kind === 'hold' && <circle cx={c} cy={c} r={size * 0.28} fill="none" stroke={ink(tone)} strokeWidth="2" strokeDasharray="4 3" />}
      {kind === 'tap' && <circle cx={c} cy={c} r={size * 0.28} fill="none" stroke={ink(tone)} strokeWidth="2" opacity="0.5" />}
      {kind === 'swipe' && <path d={`M${size * 0.2} ${c} H${size * 0.8} M${size * 0.66} ${c - 6} L${size * 0.8} ${c} L${size * 0.66} ${c + 6}`} stroke={ink(tone)} strokeWidth="2.2" fill="none" strokeLinecap="round" />}
    </svg>
  )
}

/**
 * 마지막으로 쓴 입력 장치. forced 를 주면 그 값을 그대로 돌려준다 (조절 패널의 '입력 장치' 선택용).
 * 게임패드는 Gamepad API 를 0.25초마다 확인한다 (보안 컨텍스트에서만 동작 — file:// 와 https 는 OK).
 */
export function useLastInputDevice(forced?: Device | 'auto'): Device {
  const [device, setDevice] = useState<Device>('keyboard')
  useEffect(() => {
    if (forced && forced !== 'auto') return
    const onKey = () => setDevice('keyboard')
    const onPointer = (e: PointerEvent) => setDevice(e.pointerType === 'touch' ? 'touch' : 'mouse')
    addEventListener('keydown', onKey)
    addEventListener('pointerdown', onPointer)
    let timer = 0
    if (typeof navigator.getGamepads === 'function') {
      timer = window.setInterval(() => {
        for (const gp of navigator.getGamepads()) {
          if (!gp) continue
          if (gp.buttons.some(b => b.pressed) || gp.axes.some(a => Math.abs(a) > 0.5)) {
            setDevice('gamepad')
            return
          }
        }
      }, 250)
    }
    return () => {
      removeEventListener('keydown', onKey)
      removeEventListener('pointerdown', onPointer)
      clearInterval(timer)
    }
  }, [forced])
  return forced && forced !== 'auto' ? forced : device
}
