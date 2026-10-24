import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'upgrade-draft-choice',
  title: '레벨업 3택 업그레이드',
  titleEn: 'Level-Up Upgrade Draft',
  group: 'E',
  order: 2,
  paradigms: ['menu'],
  oneLiner: '레벨이 오르면 세계가 멈추고 카드 세 장이 차례로 뜬다. 고를 수 있는 것만, 희귀도는 색과 모양으로, 수치는 지금 → 다음으로. 연타한 손이 잘못 고르지 않게 잠깐 잠근다',
  goals: [
    '게임 시간을 멈춘(`Time.timeScale = 0`) 채 **실제 시간**으로 카드를 차례로 띄울 수 있다',
    '**중복 없이 · 최대 레벨과 꽉 찬 슬롯을 걸러** 뽑고, 고를 것이 모자라면 대체 보상으로 채울 수 있다',
    '희귀도를 **색 + 모양**으로, 효과를 **지금 → 다음** 수치로 보여 비교를 쉽게 할 수 있다',
    '**입력 잠금**과 횟수가 정해진 **리롤 · 추방** 버튼의 상태를 설계할 수 있다',
  ],
  principles: ['인지 부하', '시각 위계', '즉각 피드백', '어포던스', '접근성'],
  platforms: ['pc', 'console', 'mobile'],
  inputs: ['mouse', 'keyboard', 'gamepad', 'touch'],
  genres: ['서바이버', '로그라이트', '액션 로그라이크', '덱빌딩'],
  difficulty: 2,
  stage: { aspect: '16:9', backdrop: 'none' },
  params: [
    { key: 'choices', label: '카드 수', type: 'range', min: 3, max: 4, step: 1, default: 3, unit: '장', hint: '3장이 비교하기 가장 쉽다. 4장은 선택 폭이 넓지만 읽을 것이 늘어난다' },
    { key: 'inputLockMs', label: '입력 잠금', type: 'range', min: 0, max: 800, step: 50, default: 400, unit: 'ms', hint: '카드가 뜬 직후 이만큼은 고르기 입력을 무시한다. "공격 연타 중 레벨업" 으로 비교 — 0이면 연타한 손이 첫 카드를 골라 버린다' },
    { key: 'staggerMs', label: '순차 등장 간격', type: 'range', min: 0, max: 200, step: 10, default: 90, unit: 'ms', hint: '카드가 왼쪽부터 차례로 올라온다. 눈이 한 장씩 따라가며 읽게 된다. 너무 길면 기다리게 된다' },
    { key: 'rerolls', label: '리롤 횟수', type: 'range', min: 0, max: 3, step: 1, default: 2, unit: '회', hint: '판마다 정해진 자원. 다 쓰면 버튼이 흐려지고 숫자가 0으로 빨갛게 — 왜 안 눌리는지 보인다' },
    { key: 'banishes', label: '추방 횟수', type: 'range', min: 0, max: 2, step: 1, default: 1, unit: '회', hint: '추방한 업그레이드는 이번 판에 다시 나오지 않는다. 원치 않는 것을 풀에서 빼는 전략' },
    { key: 'slotLimit', label: '슬롯 한도', type: 'range', min: 2, max: 6, step: 1, default: 4, unit: '칸', hint: '무기 · 보조 각각. 가득 차면 새 것은 나오지 않고 강화만 나온다 (지금 무기 4/4)' },
    { key: 'showDiff', label: '수치 비교 표시', type: 'toggle', default: true, hint: '카드 아래 "피해 +18 → +24". 끄면 이름만 보고 골라야 한다' },
    { key: 'pauseGame', label: '고르는 동안 정지', type: 'toggle', default: true, hint: '끄면 카드를 읽는 동안에도 적이 다가와 체력이 깎인다' },
  ],
  presets: [
    {
      id: 'survivor',
      name: '서바이버',
      look: '3장, 빠른 등장, 리롤 2 · 추방 1, 무기 슬롯 4',
      values: { choices: 3, inputLockMs: 400, staggerMs: 90, rerolls: 2, banishes: 1, slotLimit: 4, showDiff: true, pauseGame: true },
    },
    {
      id: 'roguelite-boon',
      name: '로그라이트 축복',
      look: '3장, 천천히 하나씩 — 고르는 것 자체가 이야기. 리롤 없음',
      values: { choices: 3, inputLockMs: 600, staggerMs: 160, rerolls: 0, banishes: 0, slotLimit: 6, showDiff: true, pauseGame: true },
    },
    {
      id: 'wide-build',
      name: '선택지 많은 빌드',
      look: '4장, 리롤 3 · 추방 2, 슬롯 6 — 고르는 재미가 크지만 읽을 것도 많다',
      values: { choices: 4, inputLockMs: 400, staggerMs: 70, rerolls: 3, banishes: 2, slotLimit: 6, showDiff: true, pauseGame: true },
    },
  ],
  events: [
    { id: 'level-up', label: '레벨 업' },
    { id: 'mash', label: '공격 연타 중 레벨업' },
    { id: 'reroll', label: '리롤' },
    { id: 'banish', label: '포커스 카드 추방' },
  ],
  hotspots: [
    {
      n: 1,
      part: 'card',
      title: '희귀도는 색 + 모양',
      body: '테두리 색(일반 회색 · 희귀 파랑 · 영웅 주황)과 함께 왼쪽 위 **모양**(원 · 마름모 · 별)으로 희귀도를 알린다. 색을 구분하기 어려운 플레이어도 한눈에 비교한다. 무기 · 보조 표시와 NEW / Lv 2 → 3 으로 "새로 얻는가, 강화인가" 를 먼저 보여 준다.',
      principle: '시각 위계',
      pin: 'inside',
    },
    {
      n: 2,
      part: 'diff',
      title: '지금 → 다음',
      body: '"피해 +12" 처럼 결과만 쓰면 지금 얼마인지 기억해야 한다. **지금 값 → 다음 값**을 나란히 두면 카드끼리 바로 비교된다. 희귀도가 높으면 한 번에 더 많이 오르고, 그만큼 쌓인 값이 다음 카드의 "지금" 이 된다.',
      principle: '인지 부하',
    },
    {
      n: 3,
      part: 'slots',
      title: '고를 수 있는 것만 보여 준다',
      body: '무기 슬롯이 4/4로 가득 차면 새 무기는 **풀에서 빠지고** 강화만 나온다. 최대 레벨(5)인 것과 추방한 것도 빠진다. 다 배워서 고를 게 없으면 빈 카드 대신 회복 · 크레딧 같은 보상으로 채운다. 효과를 끄면 같은 카드 두 장, 고를 수 없는 새 무기가 섞여 선택 한 번이 날아간다.',
      principle: '어포던스',
      pin: 'right',
    },
    {
      n: 4,
      part: 'reroll',
      title: '횟수가 정해진 자원',
      body: '리롤(새로 뽑기)과 추방(이번 판에서 빼기)은 횟수가 정해진 자원이다. 남은 횟수를 버튼 위에 늘 보이고, 다 쓰면 흐리게 + 빨간 0으로 **왜 안 눌리는지** 알린다. 키보드 · 패드로도 같은 기능(R · B)을 쓸 수 있다.',
      principle: '즉각 피드백',
      pin: 'below',
    },
    {
      n: 5,
      part: 'lock',
      title: '연타하던 손을 잠깐 막는다',
      body: '서바이버류는 공격 · 확인 버튼을 계속 누르며 싸운다. 그 손이 레벨업 직후 첫 카드를 그대로 골라 버리지 않게, 카드가 뜬 뒤 **0.4초** 동안은 고르기 입력을 무시한다(막대가 차는 동안). "공격 연타 중 레벨업" 을 효과를 켜고 끄고 비교하자.',
      principle: '접근성',
    },
  ],
  mistakes: [
    { title: '그냥 무작위로 뽑기', body: '같은 카드 두 장, 이미 최대 레벨인 것, 슬롯이 없어 고를 수 없는 새 무기가 섞이면 세 장 중 실제 선택지는 한두 장뿐이다. 고를 수 있는 것만 모아 중복 없이 뽑는다.' },
    { title: '입력 잠금 없음', body: '연타하던 확인 버튼이 카드가 뜨자마자 첫 카드를 고른다. 플레이어는 무엇을 골랐는지도 모른다.' },
    { title: '고르는 동안 게임이 계속됨', body: '카드를 읽는 사이에 적에게 맞으면 천천히 비교할 수 없다. 레벨업 화면에서는 게임 시간을 멈추고, UI 는 실제 시간으로 움직인다.' },
    { title: '희귀도를 색으로만', body: '테두리 색만 다르면 색각이상 플레이어는 희귀도를 구분하지 못한다. 모양 · 글자를 함께 쓴다.' },
    { title: '다 쓴 버튼이 그대로', body: '리롤을 다 썼는데 버튼이 똑같아 보이면 눌러도 반응이 없어 고장으로 보인다. 비활성 상태와 남은 횟수를 보인다.' },
  ],
  juiceOff:
    '흔한 실수를 한꺼번에 재현한다. 전체 풀에서 그냥 뽑아 같은 카드 · 최대 레벨 · 슬롯 없는 새 무기가 섞이고, 그런 카드를 고르면 선택이 날아간다. 희귀도 표시와 수치 비교가 없고, 카드가 한꺼번에 툭 뜨며, 입력 잠금이 없어 연타한 손이 첫 카드를 고른다. 고르는 동안에도 게임이 계속되어 적에게 맞는다.',
  timings: [
    { event: '카드 등장 (아래에서 40px + 페이드)', ms: 240, easing: 'easeOutCubic', note: '권장값. 실제 시간 기준' },
    { event: '카드 사이 간격', ms: 90, easing: '—', note: '권장값. 3장이면 마지막 카드까지 약 0.42초' },
    { event: '입력 잠금', ms: 400, easing: '—', note: '권장값 0.3~0.6초. 등장 연출이 끝나는 시간과 비슷하게' },
    { event: '고른 카드 강조 → 닫기', ms: 450, easing: 'ease-out', note: '무엇을 골랐는지 확인할 시간' },
  ],
  unity: {
    ugui: {
      hierarchy: `Canvas_LevelUp (Screen Space - Overlay · Canvas Scaler 1920×1080 · Sort Order 높게)
└─ LevelUpPanel (CanvasGroup · LevelUpPanel.cs)
   ├─ Dim (Image 검정 α0.7)
   ├─ LockBar (Image · Filled Horizontal)
   ├─ Cards (HorizontalLayoutGroup — UpgradeCard 프리팹을 n 장)
   │  └─ UpgradeCard 프리팹 (Button · UpgradeCardView.cs)
   │     └─ Content (CanvasGroup — 등장 연출은 이 자식을 움직인다. 루트는 LayoutGroup 이 자리를 정한다)
   │        ├─ Frame (Image 테두리) · RarityShape (Image 원 · 마름모 · 별) · RarityText · KindText
   │        └─ Icon (Image) · Name · Level · Diff (TextMeshProUGUI)
   ├─ RerollButton (Button + TextMeshProUGUI 남은 횟수)
   └─ BanishButton (Button + TextMeshProUGUI 남은 횟수)
Upgrade 에셋들 (Upgrade.cs — ScriptableObject, 업그레이드 하나에 에셋 하나)
UpgradeDraft.cs (추첨 · 수치 문구 — 순수 계산)`,
      steps: [
        '`UpgradeDraft.Draw(빌드, n)` 은 **고를 수 있는 것만**(최대 레벨 · 꽉 찬 슬롯의 새 것 · 추방한 것 제외) 모아 중복 없이 n 장을 뽑고, 희귀도는 가중치로 정한다. 모자라면 대체 보상으로 채운다. UI 와 상관없는 순수 계산이라 따로 시험하기 쉽다.',
        '레벨업하면 `LevelUpPanel.Show()` 가 `Time.timeScale = 0` 으로 세계를 멈추고 카드를 만든다. 카드 등장은 `Time.unscaledDeltaTime` 으로 도는 코루틴(Animator 를 쓴다면 **Update Mode = Unscaled Time**), 대기는 `WaitForSecondsRealtime` — 안 그러면 timeScale 0 에서 연출이 멈춘다.',
        '입력 잠금은 **누른 시각**으로 판정한다. 카드(`IPointerDownHandler`)가 누른 시각을 기억하고, `onClick` 에서 그 시각이 `unlockAt`(등장 + `lockSeconds`)보다 이르면 무시한다. 키보드 · 패드 Submit 은 지금 시각으로 판정. 잠금이 풀리면 첫 카드를 `EventSystem.SetSelectedGameObject` 로 선택해 패드 · 키보드로도 바로 고른다.',
        '리롤 · 추방 버튼은 남은 횟수가 0이면 `interactable = false` 로 바꾸고 숫자를 빨갛게. 추방은 그 업그레이드 id 를 빌드의 추방 목록에 넣고 그 자리만 새로 뽑는다.',
        '카드를 고르면 `Build.Apply()` 가 레벨을 올리고 **수치를 쌓는다**(희귀도마다 오르는 양이 달라 "레벨 × 기본값" 으로는 지금 값을 알 수 없다). 0.45초 강조 뒤 패널을 닫고 `Time.timeScale` 을 되돌린다. 고르는 사이 레벨이 또 올랐다면 닫지 않고 다음 카드를 띄운다.',
      ],
      pitfalls: [
        '`Time.timeScale = 0` 이면 `Update` 는 돌지만 `Time.deltaTime` 이 0 이다. 연출을 `deltaTime` 으로 짰다면 카드가 영영 나타나지 않는다.',
        '`Random.Range` 로 n 번 뽑으면 중복이 나온다. 후보 목록에서 뽑은 것을 빼며 뽑는다 (가중치가 있으면 매번 남은 것의 가중치 합으로).',
        '입력 잠금을 `Button.interactable` 이나 `CanvasGroup.interactable = false` 로 걸면 모든 카드가 비활성 색(Disabled Color)으로 깜빡인다. 게다가 `onClick` 은 손을 뗄 때 불려서, 잠금 중에 누르고 풀린 뒤 떼면 그대로 통과한다 — 누른 시각으로 판정한다.',
        '`Mathf.Round` 는 .5 를 짝수 쪽으로 보낸다(2.5 → 2, 3.5 → 4). 카드 숫자는 `Mathf.Floor(x + 0.5f)` 로 반올림해야 희귀도별 증가량이 고르게 보인다.',
      ],
    },
    uitk: {
      hierarchy: `UIDocument (Panel Settings: Scale With Screen Size 1920×1080)
└─ LevelUp.uxml
   └─ #levelup (.levelup — 열리면 .levelup--open)
      ├─ Label #title
      ├─ #lock (.lock) > #lock-fill
      ├─ #cards (.cards ← C# 가 UpgradeCard.uxml 템플릿을 n 장 복제)
      └─ #actions > Button #reroll   (추방은 UGUI 판에만 — 같은 방식으로 더할 수 있다)
UpgradeCard.uxml (Button .card .card--common/rare/epic > #rarity · #kind · #name · #level · #diff)
LevelUpUITK.cs (UpgradeDraft.cs 를 그대로 쓴다)`,
      steps: [
        '카드는 `VisualTreeAsset.Instantiate()` 로 템플릿을 복제해 `#cards` 에 넣고, 희귀도 클래스(`.card--rare`)로 색 · 모양을 바꾼다.',
        '순차 등장: 각 카드에 `.card--in` 을 `schedule.Execute(...).StartingIn(i × 90)` 으로 붙인다. USS `transition` 은 `Time.timeScale` 과 상관없이 실제 시간으로 돈다.',
        '입력 잠금은 카드를 **누른 시각**으로 판정한다(`PointerDownEvent` 를 TrickleDown 으로 먼저 받아 잠금 중이었는지 기억). `SetEnabled(false)` 로 막으면 `:disabled` 스타일로 흐려져 깜빡인다.',
        '영웅 카드의 별 모양은 USS 로 그릴 수 없어 별 이미지(`background-image`)를 쓴다 — 예제 USS 에 자리만 표시해 두었다.',
      ],
      pitfalls: [
        'UI Toolkit 의 `Button.clicked` 는 손을 뗄 때 불린다. 잠금이 풀리기 전에 누르고 풀린 뒤 떼면 클릭이 된다 — 잠금은 누른 시각(PointerDownEvent)으로 판정한다.',
        '템플릿을 복제할 때마다 `clicked` 를 등록하면 리롤할 때 이전 카드의 콜백이 남지 않게 카드를 지우고(`Clear()`) 다시 만든다.',
      ],
    },
  },
  inspiredBy: [],
  original:
    '탐사 장비 열두 가지와 수치, 희귀도 세 단계의 색 · 모양, 카드 구성(무기/보조 · NEW · Lv → · 지금 → 다음), 입력 잠금 막대, 리롤 · 추방 버튼 상태, 경기장과 슬롯 표시, 나쁜 예 재현은 모두 이 갤러리에서 새로 만들었다. 특정 게임의 화면을 재현하지 않고 서바이버 · 로그라이트 장르 관례와 공개된 디자인 분석 글에서 정리한 원리로 만들었다.',
  references: [
    { label: '디자인 분석 글 — 서바이버류의 추방(banish) 메커니즘', url: 'https://gmdq.substack.com/p/vampire-survivors-banish-mechanic' },
    { label: 'Unity 6.3 — Time.timeScale', url: 'https://docs.unity3d.com/6000.3/Documentation/ScriptReference/Time-timeScale.html' },
    { label: 'Unity 6.3 — AnimatorUpdateMode.UnscaledTime', url: 'https://docs.unity3d.com/6000.3/Documentation/ScriptReference/AnimatorUpdateMode.UnscaledTime.html' },
    { label: 'Game Accessibility Guidelines — 전체 목록 (색만으로 정보를 전달하지 않기)', url: 'https://gameaccessibilityguidelines.com/full-list/' },
  ],
  related: [
    { id: 'results-reward', why: '판이 끝난 뒤의 보상 화면 — 판 도중의 짧은 결정과 연출 길이가 어떻게 다른지' },
    { id: 'inventory-grid-tooltip', why: '희귀도 팔레트와 장착 중인 것과의 수치 비교를 툴팁에서' },
    { id: 'radial-quick-select', why: '같은 "세계는 느리게(멈춤), UI 는 실제 시간" 원리를 휠에서' },
  ],
}
