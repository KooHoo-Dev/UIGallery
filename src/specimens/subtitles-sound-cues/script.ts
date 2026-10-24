/* ──────────────────────────────────────────────────────────────
 * 대본 · 자막 나누기 · 표시 시간 (순수 함수)
 * ────────────────────────────────────────────────────────────── */

export type SpeakerId = 'harin' | 'doyun' | 'sera'

export interface Speaker {
  name: string
  color: string
  /** 색만으로 구분하지 않도록 모양도 다르게 */
  shape: 'circle' | 'square' | 'diamond'
  /** 화면 밖 화자의 방향(도, 위 = 0° 시계 +) — 없으면 화면 안 */
  offscreenDeg?: number
  radio?: boolean
}

export const SPEAKERS: Record<SpeakerId, Speaker> = {
  harin: { name: '하린', color: '#5ee6c9', shape: 'circle' },
  doyun: { name: '도윤', color: '#ffd166', shape: 'square', offscreenDeg: 90 },
  sera: { name: '세라', color: '#c3a6ff', shape: 'diamond', radio: true },
}

export interface Line {
  who: SpeakerId
  text: string
}

export const LINES: Line[] = [
  { who: 'sera', text: '북쪽 통신탑 신호가 또 끊겼어. 하린, 근처에 있지? 지금 있는 곳을 알려 줘.' },
  { who: 'harin', text: '통신탑 이백 미터 앞이야. 그런데 오른쪽에서 잔해 드론 소리가 들려.' },
  { who: 'doyun', text: '격납고 문은 내가 열어 둘게. 문이 열리면 망설이지 말고 바로 안으로 뛰어들어. 드론은 내가 맡을게!' },
  { who: 'sera', text: '방금 그 소리 뭐야? 하린, 괜찮아?' },
  { who: 'harin', text: '괜찮아. 왼쪽 연료통이 터졌을 뿐이야.' },
  // 같은 사람이 곧바로 이어 말한다 → 이름을 다시 붙이지 않는다
  { who: 'harin', text: '계속 갈게. 통신탑까지 얼마 안 남았어.' },
]

export type SoundKind = 'danger' | 'info'

export interface Sound {
  label: string
  /** 플레이어 기준 방향 (위 = 앞 = 0°, 시계 +) */
  deg: number
  kind: SoundKind
  /** 0 = 바로 옆, 1 = 멀리 */
  dist: number
}

/** 대본에 맞춰 나오는 효과음 (초) */
export const SOUND_CUES: { at: number; sound: Sound }[] = [
  { at: 7, sound: { label: '드론 접근', deg: 80, kind: 'danger', dist: 0.6 } },
  { at: 12.5, sound: { label: '문 열리는 소리', deg: 45, kind: 'info', dist: 0.5 } },
  { at: 17.5, sound: { label: '폭발음', deg: -100, kind: 'danger', dist: 0.25 } },
  { at: 23, sound: { label: '발소리', deg: 180, kind: 'info', dist: 0.35 } },
]
export const SCRIPT_LEN = 30

/** 한 줄에 들어가는 대략적인 글자 수 (한글은 글자 폭이 거의 일정해 글자 크기로 어림한다) */
export const charsPerLine = (boxWidth: number, fontPx: number) => Math.max(8, Math.floor(boxWidth / (fontPx * 1.02)))

/**
 * 긴 대사를 '최대 줄 수' 에 맞춰 여러 장으로 나눈다.
 * 띄어쓰기 단위로 채우되, 장이 60% 이상 찼으면 문장 끝(. ? !)에서 끊는다 — 문장 중간에서 장이 넘어가지 않게.
 */
export function chunk(text: string, capacity: number): string[] {
  const words = text.split(' ')
  const out: string[] = []
  let cur = ''
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w
    if (next.length > capacity && cur) {
      out.push(cur)
      cur = w
    } else {
      cur = next
      if (/[.?!]$/.test(w) && cur.length >= capacity * 0.6) {
        out.push(cur)
        cur = ''
      }
    }
  }
  if (cur) out.push(cur)
  return out
}

/** 표시 시간: 글자 수 ÷ 읽기 속도, 최소 1.5초 */
export const durationOf = (text: string, cps: number) => Math.max(1.5, text.replace(/\s/g, '').length / cps)
