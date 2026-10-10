/* ──────────────────────────────────────────────────────────────
 * 메뉴 데이터 — 패널(스택 한 칸)과 항목. 문구는 모두 갤러리 공통 세계관(외곽 탐사대)용으로 새로 썼다.
 * ────────────────────────────────────────────────────────────── */

export type Action = 'resume' | 'toTitle' | 'continue' | 'newGame' | 'pick'

export interface Item {
  id: string
  label: string
  /** 오른쪽에 붙는 현재 값 (장착 중인 장비 등) */
  value?: string
  desc: string
  /** 확정하면 이 패널을 스택에 push */
  to?: string
  action?: Action
  disabled?: boolean
}

export interface Panel {
  id: string
  title: string
  items: Item[]
  /** 루트 패널(스택 바닥) */
  root?: boolean
}

const ROOT_PAUSE: Panel = {
  id: 'pause',
  title: '일시정지',
  root: true,
  items: [
    { id: 'resume', label: '이어하기', action: 'resume', desc: '탐사로 돌아간다. 메뉴를 연 순간 멈춘 시간이 그대로 이어진다.' },
    { id: 'equip', label: '장비', to: 'equip', desc: '무기 · 보조 장비 · 슈트 · 소모품을 바꾼다.' },
    { id: 'records', label: '기록', to: 'records', desc: '탐사 일지와 개체 도감, 지역 지도를 본다.' },
    { id: 'settings', label: '설정', to: 'settings', desc: '화면 · 사운드 · 조작 · 접근성.' },
    { id: 'title', label: '타이틀로', action: 'toTitle', desc: '마지막 저장 이후의 진행(4분)은 사라진다. 확인 창이 한 번 더 묻는다.' },
  ],
}

const ROOT_TITLE: Panel = {
  id: 'title',
  title: '타이틀',
  root: true,
  items: [
    { id: 'continue', label: '이어하기', action: 'continue', desc: '마지막 저장 · 궤도 정비 기지 · 플레이 3시간 12분' },
    { id: 'new', label: '새 탐사', action: 'newGame', desc: '새 기록 칸에서 처음부터 시작한다. 지금 기록은 그대로 남는다.' },
    { id: 'settings', label: '설정', to: 'settings', desc: '일시정지 메뉴와 같은 설정 패널을 같은 스택 규칙으로 연다.' },
    { id: 'quit', label: '나가기', disabled: true, desc: '웹 시연에서는 쓸 수 없는 항목 — 흐리게 두고 포커스 이동에서 건너뛴다.' },
  ],
}

const SUB: Panel[] = [
  {
    id: 'equip',
    title: '장비',
    items: [
      { id: 'weapon', label: '주 무기', value: '절단 레이저', to: 'd:weapon', desc: '잔해 드론의 외피를 자르는 근거리 무기.' },
      { id: 'tool', label: '보조 장비', value: '수리 드론', to: 'd:tool', desc: '전투 중 자동으로 따라다니는 소형 장치.' },
      { id: 'suit', label: '탐사 슈트', value: '냉각형', to: 'd:suit', desc: '지표 온도에 맞춰 고르는 외피.' },
      { id: 'kit', label: '소모품', value: '수리 키트 ×3', to: 'd:kit', desc: '단축 입력으로 바로 쓰는 소모품 한 칸.' },
    ],
  },
  {
    id: 'records',
    title: '기록',
    items: [
      { id: 'log', label: '탐사 일지', value: '12건', to: 'd:log', desc: '진행 중 · 완료한 임무 기록.' },
      { id: 'codex', label: '개체 도감', value: '6종', to: 'd:codex', desc: '마주친 잔해 드론의 종류와 약점.' },
      { id: 'comms', label: '통신 기록', value: '잠김', disabled: true, desc: '북쪽 통신탑을 복구하면 열린다. 잠긴 항목은 건너뛴다.' },
      { id: 'map', label: '지역 지도', value: '구역 B-3', to: 'd:map', desc: '정비 기지와 지표 탐사 구역 지도.' },
    ],
  },
  {
    id: 'settings',
    title: '설정',
    items: [
      { id: 'display', label: '화면', value: '기본', to: 'd:display', desc: '밝기 · 대비 묶음.' },
      { id: 'sound', label: '사운드', value: '헤드폰', to: 'd:sound', desc: '출력 장치에 맞춘 음향 묶음.' },
      { id: 'controls', label: '조작', value: '기본 배치', to: 'd:controls', desc: '버튼 배치 묶음.' },
      { id: 'access', label: '접근성', value: '기본', to: 'd:access', desc: '자막 · 모션 · 대비 보조.' },
    ],
  },
]

/** 깊이 3 — 고르면 바로 위 항목의 값이 바뀐다 */
const DETAIL: Record<string, [string, string][]> = {
  weapon: [['절단 레이저', '근거리 · 외피 관통'], ['펄스 소총', '중거리 · 연사'], ['충격 망치', '근거리 · 넉백']],
  tool: [['수리 드론', '초당 체력 회복'], ['정찰 비콘', '적 위치 표시'], ['방어막 발생기', '전방 피해 감소']],
  suit: [['냉각형', '고온 지대용'], ['경량형', '이동 속도 증가'], ['중장갑형', '받는 피해 감소']],
  kit: [['수리 키트 ×3', '체력 40 회복'], ['냉각 셀 ×2', '과열 즉시 해소'], ['산소 캔 ×4', '산소 30초 보충']],
  log: [['북쪽 통신탑 복구', '진행 중 · 2/3'], ['냉각 셀 3개 회수', '완료'], ['잔해 드론 둥지 조사', '완료']],
  codex: [['잔해 드론', '외피가 약한 등 쪽을 노린다'], ['정찰 드론', '빛에 반응한다'], ['수송 드론', '화물을 떨어뜨린다']],
  map: [['구역 B-3', '지표 탐사 구역'], ['궤도 정비 기지', '안전 지대'], ['북쪽 통신탑', '목표 지점']],
  display: [['기본', '표준 밝기'], ['선명하게', '대비 +20%'], ['부드럽게', '밝기 −10%']],
  sound: [['헤드폰', '입체 음향'], ['스피커', '넓은 음장'], ['야간 모드', '큰 소리 억제']],
  controls: [['기본 배치', '확인 · 아래 버튼'], ['왼손 배치', '좌우 반전'], ['한 손 배치', '주요 행동을 한쪽에']],
  access: [['기본', '보조 끔'], ['큰 자막', '자막 150%'], ['모션 줄이기', '전환 즉시']],
}

const PANELS: Record<string, Panel> = Object.fromEntries([ROOT_PAUSE, ROOT_TITLE, ...SUB].map(p => [p.id, p]))

/** 현재 값(values)을 반영한 패널. 깊이 3 패널은 부모 항목에서 만들어 낸다 */
export function getPanel(id: string, values: Record<string, string>): Panel {
  if (id.startsWith('d:')) {
    const key = id.slice(2)
    const parent = SUB.flatMap(p => p.items).find(i => i.id === key)!
    const cur = values[key] ?? parent.value
    return {
      id,
      title: parent.label,
      items: DETAIL[key].map(([label, note], i) => ({
        id: `${key}-${i}`,
        label,
        value: label === cur ? '사용 중' : note,
        action: 'pick' as const,
        desc: note,
      })),
    }
  }
  const p = PANELS[id]
  return { ...p, items: p.items.map(i => (values[i.id] ? { ...i, value: values[i.id] } : i)) }
}

/** 처음 값 (깊이 3 에서 고르면 바뀐다) */
export const INITIAL_VALUES: Record<string, string> = {}

/** 패널의 이웃(같은 부모 아래 하위 패널이 있는 항목들) — Q/E 페이지 전환 대상 */
export function siblingsOf(parent: Panel): { index: number; item: Item }[] {
  return parent.items.map((item, index) => ({ index, item })).filter(x => x.item.to && !x.item.disabled)
}

/** 비활성 항목을 건너뛰며 dir 방향으로 한 칸 (끝에서 반대쪽 끝으로 돈다) */
export function stepFocus(panel: Panel, from: number, dir: 1 | -1): number {
  const n = panel.items.length
  for (let k = 1; k <= n; k++) {
    const i = (((from + dir * k) % n) + n) % n
    if (!panel.items[i].disabled) return i
  }
  return from
}

export const STATUS = [
  ['위치', '지표 탐사 구역 B-3'],
  ['목표', '북쪽 통신탑 복구 · 2/3'],
  ['플레이', '3시간 12분'],
  ['크레딧', '1,240'],
] as const
