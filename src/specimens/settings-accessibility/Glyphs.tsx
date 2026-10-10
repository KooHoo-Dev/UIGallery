import type { ReactNode } from 'react'
import { KeyCap, PadButton, Shoulder, TouchGlyph } from '../../core/input'
import type { Device } from './model'
import s from './style.module.css'

/* 입력 안내 기호 — 버튼·키·터치 기호는 갤러리 공통 글리프(core/input)를 쓰고,
 * core 에 없는 십자키(DPad)·고대비 아이콘·프리셋 아이콘만 여기서 그린다 */

export const DPad = ({ axis, size = 34 }: { axis: 'v' | 'h'; size?: number }) => (
  <svg className={s.glyphDpad} width={size} height={size} viewBox="0 0 30 30" role="img" aria-label={axis === 'v' ? '십자키 위아래' : '십자키 좌우'}>
    <path d="M11 2h8v9h9v8h-9v9h-8v-9H2v-8h9z" fill="rgba(10,14,22,0.75)" stroke="#f4f7fb" strokeWidth="1.6" />
    {axis === 'v' ? <path d="M15 4.5l3 4h-6zM15 25.5l3-4h-6z" fill="#f4f7fb" /> : <path d="M4.5 15l4-3v6zM25.5 15l-4-3v6z" fill="#f4f7fb" />}
  </svg>
)

export const Contrast = ({ size = 34 }: { size?: number }) => (
  <svg className={s.glyphTouch} width={size} height={size} viewBox="0 0 30 30" role="img" aria-label="고대비">
    <circle cx="15" cy="15" r="11" fill="none" stroke="currentColor" strokeWidth="2.2" />
    <path d="M15 4a11 11 0 0 1 0 22z" fill="currentColor" />
  </svg>
)

export interface Hint {
  id: string
  icon: ReactNode
  text: string
}

/** 입력 장치별 하단 안내 — 같은 기능을 장치마다 하나씩 연결한다 */
export function hintsFor(device: Device, size = 36): Hint[] {
  if (device === 'pad')
    return [
      { id: 'move', icon: <DPad axis="v" size={size} />, text: '이동' },
      { id: 'value', icon: <DPad axis="h" size={size} />, text: '값 변경' },
      { id: 'tab', icon: <><Shoulder side="L" size={size} /><Shoulder side="R" size={size} /></>, text: '탭' },
      { id: 'ok', icon: <PadButton face="bottom" size={size} />, text: '확인' },
      { id: 'back', icon: <PadButton face="right" size={size} />, text: '뒤로' },
      { id: 'reset', icon: <PadButton face="left" size={size} />, text: '기본값 복원' },
      { id: 'quick', icon: <><PadButton face="top" size={size} /><small className={s.hold}>길게</small></>, text: '고대비 빠른 전환' },
    ]
  if (device === 'kbm')
    return [
      { id: 'move', icon: <><KeyCap label="↑" size={size} /><KeyCap label="↓" size={size} /></>, text: '이동' },
      { id: 'value', icon: <><KeyCap label="←" size={size} /><KeyCap label="→" size={size} /></>, text: '값 변경' },
      { id: 'tab', icon: <><KeyCap label="Q" size={size} /><KeyCap label="E" size={size} /></>, text: '탭' },
      { id: 'ok', icon: <KeyCap label="Enter" size={size} />, text: '확인' },
      { id: 'back', icon: <KeyCap label="Esc" size={size} />, text: '뒤로' },
      { id: 'reset', icon: <KeyCap label="R" size={size} />, text: '기본값 복원' },
      { id: 'quick', icon: <KeyCap label="C" size={size} />, text: '고대비 빠른 전환' },
    ]
  return [
    { id: 'ok', icon: <TouchGlyph kind="tap" size={size} />, text: '눌러서 선택' },
    { id: 'value', icon: <TouchGlyph kind="swipe" size={size} />, text: '◀ ▶ 누르거나 밀어서 값 변경' },
    { id: 'quick', icon: <Contrast size={size} />, text: "미리보기의 '고대비' 버튼" },
    { id: 'back', icon: <TouchGlyph kind="tap" size={size} />, text: '‹ 뒤로 (화면 왼쪽 위)' },
  ]
}

export const PresetIcon = ({ kind }: { kind: 'eye' | 'ear' | 'hand' | 'wave' }) => (
  <svg className={s.presetIcon} viewBox="0 0 32 32" aria-hidden>
    {kind === 'eye' && (
      <>
        <path d="M2 16s5-9 14-9 14 9 14 9-5 9-14 9S2 16 2 16z" fill="none" stroke="currentColor" strokeWidth="2.4" />
        <circle cx="16" cy="16" r="4.5" fill="currentColor" />
      </>
    )}
    {kind === 'ear' && (
      <path
        d="M9 13a8 8 0 1 1 16 0c0 4-3 5-4.5 7.5S19 27 15 27a4.5 4.5 0 0 1-4.3-3M13.5 13a3 3 0 1 1 6 0c0 1.8-2 2.4-2 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    )}
    {kind === 'hand' && (
      <path
        d="M11 17V7.5a2 2 0 0 1 4 0V15m0-9a2 2 0 0 1 4 0v9m0-7a2 2 0 0 1 4 0v10c0 5-3.5 9-8.5 9-3.5 0-5.5-2-7.5-5l-3-5a2 2 0 0 1 3.4-2.1L11 19"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
    {kind === 'wave' && (
      <>
        <path d="M3 12c3.3-4 6.7 4 10 0s6.7-4 10 0 4.5 1 6 0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M3 21h26" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="16" cy="21" r="3" fill="currentColor" />
      </>
    )}
  </svg>
)
