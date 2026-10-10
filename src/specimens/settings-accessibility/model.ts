import { bool, num, str } from '../../core/params'
import type { ParamValues } from '../../core/types'

/* ──────────────────────────────────────────────────────────────
 * 설정 데이터 모델 — 메뉴 UI 와 미리보기는 모두 이 데이터 하나만 읽는다.
 * (Unity 의 AccessibilitySettings ScriptableObject 와 같은 역할)
 * ────────────────────────────────────────────────────────────── */

export interface Settings {
  textScale: number
  hudSize: string
  centerDot: boolean
  subtitleBg: string
  speakerCues: boolean
  subtitleColor: string
  colorMode: string
  highContrast: string
  cameraShake: number
  reduceMotion: boolean
  holdToPress: boolean
  aimAssist: string
}
export type OptKey = keyof Settings

export const DEFAULTS: Settings = {
  textScale: 100,
  hudSize: 'normal',
  centerDot: false,
  subtitleBg: 'default',
  speakerCues: true,
  subtitleColor: 'white',
  colorMode: 'off',
  highContrast: 'off',
  cameraShake: 5,
  reduceMotion: false,
  holdToPress: false,
  aimAssist: 'off',
}

/** 갤러리 조절 패널(param)과 연결된 설정. 나머지는 무대 안에서만 바꾸는 값 */
export const PARAM_KEYS: OptKey[] = ['textScale', 'subtitleBg', 'speakerCues', 'colorMode', 'highContrast', 'cameraShake', 'reduceMotion']

export function fromParams(p: ParamValues, base: Settings): Settings {
  return {
    ...base,
    textScale: num(p, 'textScale', DEFAULTS.textScale),
    subtitleBg: str(p, 'subtitleBg', DEFAULTS.subtitleBg),
    speakerCues: bool(p, 'speakerCues', DEFAULTS.speakerCues),
    colorMode: str(p, 'colorMode', DEFAULTS.colorMode),
    highContrast: str(p, 'highContrast', DEFAULTS.highContrast),
    cameraShake: num(p, 'cameraShake', DEFAULTS.cameraShake),
    reduceMotion: bool(p, 'reduceMotion', DEFAULTS.reduceMotion),
  }
}

export type TabId = 'display' | 'subtitle' | 'color' | 'motion' | 'control'
export const TABS: { id: TabId; label: string }[] = [
  { id: 'display', label: '화면' },
  { id: 'subtitle', label: '자막' },
  { id: 'color', label: '색·대비' },
  { id: 'motion', label: '모션' },
  { id: 'control', label: '조작' },
]

export type PreviewTarget = 'subtitle' | 'hud' | 'dot' | 'markers' | 'scene' | 'prompt' | 'reticle' | 'menu'

interface OptBase {
  key: OptKey
  tab: TabId
  label: string
  desc: string
  who: string[]
  target: PreviewTarget
}
export type OptDef =
  | (OptBase & { kind: 'slider'; min: number; max: number; step: number; unit: string })
  | (OptBase & { kind: 'step'; values: { v: string; label: string }[] })
  | (OptBase & { kind: 'toggle' })

export const OPTIONS: OptDef[] = [
  { key: 'textScale', tab: 'display', kind: 'slider', min: 80, max: 200, step: 10, unit: '%', label: '글자 크기', desc: '메뉴, 설명, 자막 글자를 한꺼번에 키운다. 커진 글자가 잘리지 않게 행 높이도 같이 늘어난다.', who: ['저시력', '먼 거리 TV 플레이'], target: 'subtitle' },
  { key: 'hudSize', tab: 'display', kind: 'step', values: [{ v: 'small', label: '작게' }, { v: 'normal', label: '보통' }, { v: 'large', label: '크게' }], label: 'HUD 크기', desc: '체력·탄약 표시의 크기를 바꾼다. 화면 구석 정보를 읽기 어려울 때 키운다.', who: ['저시력', '작은 화면'], target: 'hud' },
  { key: 'centerDot', tab: 'display', kind: 'toggle', label: '화면 중앙 점', desc: '화면 한가운데에 작은 점을 항상 띄운다. 시선이 머무를 기준점이 생겨 멀미가 줄어든다.', who: ['멀미', '조준 보조'], target: 'dot' },
  { key: 'subtitleBg', tab: 'subtitle', kind: 'step', values: [{ v: 'off', label: '끔' }, { v: 'default', label: '기본' }, { v: 'heavy', label: '진하게' }], label: '자막 배경', desc: '자막 뒤 반투명 판의 진하기. 밝은 장면에서도 글자가 배경에 묻히지 않게 한다.', who: ['청각', '저시력'], target: 'subtitle' },
  { key: 'speakerCues', tab: 'subtitle', kind: 'toggle', label: '화자명·방향 표시', desc: '대사 앞에 말하는 사람 이름을 색으로 붙이고, 화면 밖 화자 쪽으로 화살표를 띄운다.', who: ['청각', '한쪽 귀 청력 저하'], target: 'subtitle' },
  { key: 'subtitleColor', tab: 'subtitle', kind: 'step', values: [{ v: 'white', label: '흰색' }, { v: 'yellow', label: '노랑' }, { v: 'sky', label: '하늘' }], label: '자막 글자 색', desc: '대사 글자 색. 배경과 대비가 큰 색을 고르면 더 빨리 읽힌다.', who: ['저시력', '난독'], target: 'subtitle' },
  { key: 'colorMode', tab: 'color', kind: 'step', values: [{ v: 'off', label: '끔' }, { v: 'protanopia', label: '적색약' }, { v: 'deuteranopia', label: '녹색약' }, { v: 'tritanopia', label: '청색약' }], label: '색각 모드', desc: '아군·적·아이템·위험의 역할 색을 해당 색각에서도 구별되는 조합으로 바꾼다. 모양은 그대로 둔다.', who: ['색각 이상'], target: 'markers' },
  { key: 'highContrast', tab: 'color', kind: 'step', values: [{ v: 'off', label: '끔' }, { v: 'dim-bg', label: '배경 억제' }, { v: 'role-color', label: '역할 단색' }, { v: 'role-outline', label: '단색+외곽선' }], label: '고대비 디스플레이', desc: '배경 채도를 낮추고, 대상을 역할 색 단색(과 굵은 외곽선)으로 칠해 무엇이 중요한지 떠오르게 한다.', who: ['저시력', '복잡한 장면'], target: 'scene' },
  { key: 'cameraShake', tab: 'motion', kind: 'slider', min: 0, max: 10, step: 1, unit: '단계', label: '카메라 흔들림', desc: '피격·폭발 때 장면이 흔들리는 크기. 0이면 흔들림 대신 테두리만 잠깐 강조한다. 메뉴 움직임과는 무관하다.', who: ['멀미', '전정 장애'], target: 'scene' },
  { key: 'reduceMotion', tab: 'motion', kind: 'toggle', label: '모션 줄이기', desc: '메뉴 쪽 움직임(탭 페이드, 순차 강조, 창 확대, 색 전환)을 모두 즉시 전환으로 바꾼다. 장면 흔들림은 위 옵션이 맡는다.', who: ['멀미', '주의 분산'], target: 'menu' },
  { key: 'holdToPress', tab: 'control', kind: 'toggle', label: '연타 대신 길게 누르기', desc: '버튼을 여러 번 빠르게 눌러야 하는 동작을 한 번 길게 누르기로 바꾼다.', who: ['운동', '손 떨림'], target: 'prompt' },
  { key: 'aimAssist', tab: 'control', kind: 'step', values: [{ v: 'off', label: '끔' }, { v: 'weak', label: '약하게' }, { v: 'strong', label: '강하게' }], label: '조준 보조', desc: '조준점이 가까운 적 쪽으로 끌려간다. 강하게 하면 적에게 바로 붙는다.', who: ['운동', '입문자'], target: 'reticle' },
]

export const optsOf = (tab: TabId) => OPTIONS.filter(o => o.tab === tab)
export const optDef = (key: OptKey) => OPTIONS.find(o => o.key === key)!

export function valueLabel(o: OptDef, v: Settings[OptKey]): string {
  if (o.kind === 'slider') return o.unit === '%' ? `${v}%` : `${v}`
  if (o.kind === 'toggle') return v ? '켬' : '끔'
  return o.values.find(x => x.v === v)?.label ?? String(v)
}

/** 좌우 입력 하나로 모든 위젯을 조작한다 (슬라이더: 한 칸, 단계: 순환하지 않고 끝에서 멈춤, 토글: 반전) */
export function stepValue(o: OptDef, v: Settings[OptKey], dir: 1 | -1): Settings[OptKey] {
  if (o.kind === 'slider') return Math.min(o.max, Math.max(o.min, (v as number) + dir * o.step))
  if (o.kind === 'toggle') return !v
  const i = o.values.findIndex(x => x.v === v)
  return o.values[Math.min(o.values.length - 1, Math.max(0, i + dir))].v
}

export const changedKeys = (s: Settings) => (Object.keys(DEFAULTS) as OptKey[]).filter(k => s[k] !== DEFAULTS[k])

/* ───── 무대 안의 유형별 프리셋 (값을 한 번 덮어쓰는 함수일 뿐) ───── */
export interface InPreset {
  id: string
  label: string
  icon: 'eye' | 'ear' | 'hand' | 'wave'
  values: Partial<Settings>
}
export const IN_PRESETS: InPreset[] = [
  { id: 'vision', label: '시각', icon: 'eye', values: { textScale: 160, hudSize: 'large', centerDot: true, subtitleBg: 'heavy', highContrast: 'role-outline', cameraShake: 2 } },
  { id: 'hearing', label: '청각', icon: 'ear', values: { textScale: 120, subtitleBg: 'heavy', speakerCues: true, subtitleColor: 'yellow' } },
  { id: 'motor', label: '운동', icon: 'hand', values: { holdToPress: true, aimAssist: 'strong', hudSize: 'large' } },
  { id: 'comfort', label: '멀미 완화', icon: 'wave', values: { cameraShake: 0, reduceMotion: true, centerDot: true } },
]

/* ───── 역할 색 팔레트 (색각 유형별로 다시 구성 — 원작 값 아님) ───── */
export interface Palette {
  ally: string
  enemy: string
  item: string
  danger: string
  voice2: string
}
export const PALETTES: Record<string, Palette> = {
  off: { ally: '#45b6ff', enemy: '#ff4a5a', item: '#ffd23f', danger: '#ff8a1f', voice2: '#7cf0a2' },
  protanopia: { ally: '#3b82ff', enemy: '#f2b300', item: '#f4f4f4', danger: '#b56cf2', voice2: '#a9dcff' },
  deuteranopia: { ally: '#2f74ff', enemy: '#ff8800', item: '#fff09a', danger: '#c26bff', voice2: '#b4d6ff' },
  tritanopia: { ally: '#16c4b2', enemy: '#ff3b7c', item: '#ffffff', danger: '#ff9a45', voice2: '#ffc1d8' },
}

export const SUBTITLE_COLORS: Record<string, string> = { white: '#ffffff', yellow: '#ffe45c', sky: '#a6e6ff' }

/* ───── 자막 샘플 (수업용으로 새로 쓴 대사) ───── */
export interface Line {
  who: string
  voice: 'ally' | 'voice2'
  text: string
  /** 화면 밖 화자 방향 */
  dir?: 'left' | 'right'
}
export const LINES: Line[] = [
  { who: '하린', voice: 'ally', text: '저 언덕 너머에 보급 상자가 있어. 내가 엄호할게.' },
  { who: '도윤', voice: 'voice2', text: '왼쪽에 둘 더 있어! 몸 낮춰!', dir: 'left' },
  { who: '하린', voice: 'ally', text: '좋아, 신호하면 같이 움직이자.' },
  { who: '도윤', voice: 'voice2', text: '뒤쪽은 내가 막을게. 서둘러.', dir: 'right' },
]

export type Device = 'pad' | 'kbm' | 'touch'
