/* 대본 — 갤러리 공통 세계관(외곽 탐사대). 원작과 무관한 새 문구.
 * 첫 줄의 화자는 아직 소개 전이라 '???' 로 표시되고, 다음 줄에서 이름이 밝혀진다. */

export type SpeakerId = 'harin' | 'doyun' | 'sera'

export const SPEAKERS: Record<SpeakerId, { name: string; role: string }> = {
  harin: { name: '하린', role: '탐사대장' },
  doyun: { name: '도윤', role: '정비사' },
  sera: { name: '세라', role: '통신 담당' },
}

export interface Line {
  who: SpeakerId
  /** 아직 소개되지 않은 인물 → 이름표 '???', 초상화는 실루엣 */
  unknown?: boolean
  text: string
}

export interface Choice {
  text: string
  /** 대사가 아닌 행동(침묵 등) — 괄호로 표시 */
  action?: boolean
  reply: Line
}

/** 0~4: 공통 줄. 4번 줄이 끝나면 선택지가 열린다 */
export const LINES: Line[] = [
  { who: 'sera', unknown: true, text: '…들려요? 북쪽 통신탑 신호가 또 끊겼어요. 거기 누구 있어요?' },
  { who: 'sera', text: '아, 소개가 늦었네요. 통신 담당 세라예요. 오늘부터 같은 조예요.' },
  { who: 'harin', text: '탐사대장 하린이다. 잔해 드론이 통신탑 주변에 몰려 있어.' },
  { who: 'doyun', text: '그런데 냉각 셀이 3개뿐이에요. 한 번 왕복하면 바닥나요.' },
  { who: 'harin', text: '출발 전에 정하자. 신입, 어디부터 갈래?' },
]
export const CHOICE_NODE = 4
export const REPLY_NODE = 5
export const END_NODE = 6

export const CHOICES: Choice[] = [
  { text: '통신탑부터 복구하죠.', reply: { who: 'sera', text: '좋아요! 신호가 살아나면 드론 위치를 제가 불러 드릴게요.' } },
  { text: '냉각 셀부터 회수해요.', reply: { who: 'doyun', text: '현명하네요. 셀이 넉넉하면 수리 키트도 아끼지 않아도 돼요.' } },
  { text: '아무 말도 하지 않는다', action: true, reply: { who: 'harin', text: '대답이 없군. 그럼 내 판단대로 통신탑으로 간다.' } },
]
/** 시간이 다 되면 확정되는 기본 선택 = 침묵 */
export const DEFAULT_CHOICE = 2

export const END_LINE: Line = { who: 'harin', text: '10분 뒤 격납고에서 출발한다. 산소 캔 챙겨.' }

export function lineAt(node: number, chosen: number | null): Line {
  if (node <= CHOICE_NODE) return LINES[node]
  if (node === REPLY_NODE) return CHOICES[chosen ?? DEFAULT_CHOICE].reply
  return END_LINE
}

/** 대화 기록에 미리 남아 있는 이전 장면 (기록이 장면을 넘어 이어진다는 것을 보여 준다) */
export const PREVIOUS: Line[] = [
  { who: 'doyun', text: '수리 키트 두 개 챙겼어요. 회로 조각은 현장에서 주워야 해요.' },
  { who: 'harin', text: '드론 잔해는 맨손으로 만지지 마. 아직 전류가 남아 있을 수 있어.' },
  { who: 'doyun', text: '알겠어요. 크레딧 정산은 돌아와서 하죠.' },
]

/** 이 글자 뒤에서 잠깐 멈춘다 (말하는 리듬) */
export const PAUSE_CHARS = new Set(['.', ',', '!', '?', '…'])
