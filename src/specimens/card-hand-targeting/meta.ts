import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'card-hand-targeting',
  title: '카드 손패 + 타겟 화살표',
  titleEn: 'Card Hand Fan & Targeting',
  group: 'E',
  order: 3,
  paradigms: ['non-diegetic'],
  oneLiner: '손패를 원호 공식으로 부채꼴로 펼치고, 올린 카드는 똑바로 세워 맨 앞으로. 적을 고르는 카드는 화살표로 겨누고, 적 머리 위 의도를 보고 계획한다',
  goals: [
    '카드 i 의 각도·위치·회전을 **원호 공식**으로 직접 계산해 부채꼴 손패를 만들 수 있다',
    '호버한 카드를 들어 올리고 이웃을 비키되, **판정은 원래 자리**로 해서 떨리지 않게 할 수 있다',
    '대상 지정 카드를 **포인터 위치로 판정**하는 베지어 화살표와 미리보기(피해 · 처치)를 만들 수 있다',
    '적의 **다음 행동(의도)** 을 데이터에서 아이콘 · 수치로 묶어 보여 주고, 왜 전략을 만드는지 설명할 수 있다',
  ],
  principles: ['시각 위계', '가독성', '어포던스', '인지 부하', '즉각 피드백'],
  platforms: ['pc', 'mobile', 'console'],
  inputs: ['mouse', 'touch', 'keyboard', 'gamepad'],
  genres: ['덱빌딩 로그라이크', '카드 대전', '전술 카드'],
  difficulty: 3,
  stage: { aspect: '16:9', backdrop: 'none' },
  params: [
    { key: 'handSize', label: '손패 수', type: 'range', min: 3, max: 10, step: 1, default: 7, unit: '장', hint: '턴마다 이만큼 뽑는다. 늘려도 부채꼴 전체 각도는 그대로라 카드가 더 겹친다 — 그래도 왼쪽 위 비용과 이름 줄은 보인다' },
    { key: 'fanDeg', label: '부채꼴 각도', type: 'range', min: 8, max: 40, step: 2, default: 22, unit: '°', hint: '양 끝 카드 사이의 전체 각도. 손패 폭 ≈ 2R·sin(각도/2) 라 각도가 작으면 카드가 가운데로 모인다. 장수가 적으면 카드 사이 7°로 묶어 너무 벌어지지 않게 한다' },
    { key: 'radiusPx', label: '원호 반지름', type: 'range', min: 1000, max: 4000, step: 100, default: 2000, unit: 'px', hint: '원의 중심은 화면 아래 바깥. 작을수록 많이 휘고 좁게, 클수록 평평하고 넓게 펼쳐진다' },
    { key: 'hoverLift', label: '호버 상승', type: 'range', min: 0, max: 180, step: 10, default: 100, unit: 'px', hint: '포인터를 올린 카드를 이만큼 들어 올리고 똑바로 세워 1.25배로 키운다. 터치에서는 손가락에 가리지 않게 더 높이' },
    { key: 'neighborPush', label: '이웃 비킴', type: 'range', min: 0, max: 100, step: 5, default: 50, unit: 'px', hint: '올린 카드 양옆 카드가 비켜서 올린 카드의 가장자리가 보이게 한다 (바로 옆 100%, 두 칸 50%, 그 밖 25%)' },
    { key: 'showIntent', label: '적 의도 표시', type: 'toggle', default: true, hint: '적 머리 위에 다음 행동(공격 9 · 방어 · 강화)을 보인다. 끄면 "?" — 방어를 할지 공격을 할지 계획할 근거가 사라진다' },
  ],
  presets: [
    {
      id: 'deckbuilder',
      name: '덱빌딩 로그라이크',
      look: '5장, 완만한 부채꼴, 적 의도 공개 — 매 턴 퍼즐처럼 계획',
      values: { handSize: 5, fanDeg: 18, radiusPx: 2200, hoverLift: 100, neighborPush: 50, showIntent: true },
    },
    {
      id: 'card-battler',
      name: '카드 대전',
      look: '9장, 많이 휜 부채꼴, 크게 들어 올림. 상대의 다음 수는 숨김',
      values: { handSize: 9, fanDeg: 30, radiusPx: 1500, hoverLift: 140, neighborPush: 40, showIntent: false },
    },
    {
      id: 'touch-big',
      name: '터치 화면',
      look: '큰 반지름으로 거의 평평하게, 아주 높이 들어 올리고 이웃을 크게 비킨다 — 손가락에 가리지 않게',
      values: { handSize: 5, fanDeg: 12, radiusPx: 3600, hoverLift: 170, neighborPush: 80, showIntent: true },
    },
  ],
  events: [
    { id: 'aim', label: '공격 카드로 겨누기' },
    { id: 'misaim', label: '두 적 경계에서 놓기' },
    { id: 'broke', label: '에너지 0 에서 카드 쓰기' },
    { id: 'draw', label: '카드 1장 뽑기' },
    { id: 'end-turn', label: '턴 종료' },
  ],
  hotspots: [
    {
      n: 1,
      part: 'fan',
      title: '원호 공식으로 직접 배치',
      body: '원의 중심을 화면 아래 바깥에 두고, 카드 i 를 각도 **a = lerp(−전체/2, +전체/2, i/(n−1))** 의 원호 위에 놓는다. 위치는 **x = 중심 + R·sin a, y = 기준 + R·(1 − cos a)**, 회전은 a. 장수가 적을 때는 카드 사이를 최대 7°로 묶는다. 왼쪽 카드가 아래에 깔리게 쌓아 **왼쪽 위 비용 · 이름**이 늘 보인다. LayoutGroup 으로는 만들 수 없는 배치다.',
      principle: '시각 위계',
      pin: 'left',
    },
    {
      n: 2,
      part: 'hover',
      title: '올린 카드는 위로 · 똑바로 · 맨 앞으로',
      body: '포인터를 올린 카드는 들어 올려 회전을 0으로 펴고 1.25배로 키워 **맨 앞에** 그린다. 양옆 카드는 비켜서 가장자리를 드러낸다. 판정은 **원래 자리**로 한다 — 움직인 카드로 판정하면 카드가 포인터에서 벗어나 내려오고, 다시 걸려 올라가며 떨린다. 효과를 끄면 쌓는 순서가 그대로라 오른쪽 카드에 가려 글을 읽을 수 없다.',
      principle: '가독성',
    },
    {
      n: 3,
      part: 'arrow',
      title: '판정은 포인터 끝',
      body: '적 하나를 고르는 카드(오른쪽 위 조준 표시)는 손패 위 가운데에 멈추고 **베지어 화살표**가 포인터를 따라간다. 판정 지점은 화살촉 = 포인터. 적 위에 오면 금색 + 모서리 괄호 + 체력 바에 깎일 양(−12 / 처치)을 미리 보인다. 빈 곳에서 놓거나 오른쪽 클릭 · Esc 면 취소. 효과를 끄면 카드째 끌어 적을 가리고, **카드 사각형과 먼저 겹친 적**에게 맞는다 — "두 적 경계에서 놓기" 로 비교.',
      principle: '어포던스',
    },
    {
      n: 4,
      part: 'intent',
      title: '적의 다음 행동을 공개한다',
      body: '적 머리 위에 다음 행동을 **아이콘 모양 + 수치 + 글자**로 보인다(공격 9 · 3×2 · 방어 · 강화). 플레이어 아래에는 합계 "들어올 피해 14 → 방어 후 7". 정보를 공개하면 "이번 턴은 막을까, 먼저 쓰러뜨릴까" 를 계산하는 **전략**이 생긴다. 약화 카드를 겨누면 수치가 9 → 6 으로 미리 바뀐다.',
      principle: '인지 부하',
    },
    {
      n: 5,
      part: 'energy',
      title: '못 쓰는 카드는 미리 알린다',
      body: '카드 비용이 남은 에너지보다 크면 카드를 흐리게 하고 비용을 빨갛게 한다. 집으려 하면 **바로** 흔들리며 이유를 말한다. 효과를 끄면 끌어서 놓은 뒤에야 "에너지 부족" 이 뜬다 — "에너지 0 에서 카드 쓰기" 로 비교.',
      principle: '즉각 피드백',
    },
  ],
  mistakes: [
    { title: 'LayoutGroup 한 줄', body: '고정 간격으로 늘어놓으면 부채꼴 · 회전이 없고, 장수가 늘면 겹치기만 한다. 호버해도 쌓는 순서가 그대로면 오른쪽 카드에 가려 읽을 수 없다.' },
    { title: '움직이는 카드로 호버 판정', body: '들어 올린 카드가 포인터에서 벗어나면 호버가 풀려 내려오고, 다시 걸려 올라간다. 판정용(제자리)과 그림용(움직임)을 나눈다.' },
    { title: '카드 사각형으로 대상 판정', body: '카드째 끌어 놓고 "카드와 겹친 첫 적" 을 대상으로 삼으면 포인터가 가리킨 적과 다른 적이 맞는다. 판정은 포인터 위치 하나로.' },
    { title: '의도를 숨긴 적', body: '다음 행동을 모르면 방어와 공격 중 무엇이 나은지 판단할 근거가 없다. 장르 특성상 숨긴다면(카드 대전) 그만큼 다른 정보를 준다.' },
    { title: '놓은 뒤에야 알리는 거절', body: '에너지가 모자란 카드를 끝까지 끌게 한 뒤 거절하면 손이 헛수고를 한다. 못 쓰는 카드는 처음부터 흐리게, 집는 순간 이유를 알린다.' },
  ],
  juiceOff:
    '흔한 실수를 한꺼번에 재현한다. 손패가 고정 간격 한 줄이고 호버해도 맨 앞으로 오지 않아 오른쪽 카드에 가린다. 공격 카드는 화살표 없이 카드째 끌려 적을 가리고, 대상은 카드 사각형과 먼저 겹친 적이다. 키보드로는 대상을 고를 수 없어 늘 첫 번째 적. 적 의도는 "?", 못 쓰는 카드도 멀쩡해 보이고 놓은 뒤에야 거절한다. 카드가 보간 없이 순간 이동한다.',
  timings: [
    { event: '카드가 제자리로 따라감', ms: 140, easing: '지수 감쇠 (λ = 16)', note: '권장값. 1 − e^(−λ·dt) 로 프레임레이트와 무관하게' },
    { event: '집은 카드가 따라감', ms: 80, easing: '지수 감쇠 (λ = 30)', note: '권장값. 손에 붙은 느낌이 나게 더 빠르게' },
    { event: '사용한 카드가 버린 더미로', ms: 350, easing: 'ease-in + 위로 휘는 호', note: '권장값' },
    { event: '새 카드 뽑기 간격', ms: 70, easing: '—', note: '권장값. 한 장씩 날아와 장수를 셀 수 있게' },
    { event: '적 행동 간격', ms: 550, easing: '—', note: '권장값. 누가 무엇을 했는지 따라갈 수 있게' },
    { event: '못 쓰는 카드 흔들림', ms: 350, easing: 'linear', note: '권장값' },
  ],
  unity: {
    ugui: {
      hierarchy: `Canvas_Battle (Screen Space - Overlay · Canvas Scaler 1920×1080)
├─ Player
│  ├─ PlayerText (TextMeshProUGUI — 체력 · 방어)
│  └─ IncomingText (TextMeshProUGUI — 들어올 피해 → 방어 후)
├─ Enemies
│  └─ EnemyView 프리팹 ×3 (EnemyView.cs · Image 실루엣 = Raycast Target 켬)
│     ├─ Intent (Image 아이콘 + TextMeshProUGUI 수치 · 글자)
│     ├─ Brackets (Image — 겨누는 동안만 켬) · ArrowAnchor (빈 RectTransform — 키보드로 겨눌 때 화살촉 자리)
│     ├─ Name (TextMeshProUGUI)
│     ├─ HpBar (Preview Image Filled 흰색 · Fill Image Filled · TextMeshProUGUI)
│     ├─ BlockBadge (Image + TextMeshProUGUI)
│     └─ PreviewText (TextMeshProUGUI — "-12" / "처치")
├─ Hand (RectTransform · HandView.cs — LayoutGroup 없음, 위치를 직접 계산)
│  └─ CardView 프리팹 (CardView.cs · CanvasGroup · 투명 Image = 판정용, 부채꼴 제자리에 가만히)
│     └─ Visual (그림 — 들어 올림 · 끌기는 이 자식만 움직인다. 바탕 Image 는 호버 중에만 Raycast Target)
│        ├─ Frame · Art (Image) · Cost (Image + TMP) · AimMark
│        └─ Name · Type · Text (TextMeshProUGUI)
├─ TargetArrow (TargetArrow.cs · 점 Image 14개 + 화살촉, 모두 Raycast Target 끔)
├─ PlayLine (Image 점선 — 대상 없는 카드를 끄는 동안만)
├─ Energy (Image + TextMeshProUGUI)
├─ EndTurnButton (Button · Navigation = None)
└─ BattleDemo (CardBattleDemo.cs — 시험용: 덱 섞기 · 뽑기 · 턴 종료 · 적 행동)
CardData 에셋들 (CardData.cs — ScriptableObject)`,
      steps: [
        '`HandView.FanPose(i, n)` 이 원호 공식으로 각 카드의 위치 · 회전을 돌려준다. 카드 루트(판정용)는 그 자리에 두고, `LateUpdate` 에서 `Visual` 자식이 목표 자세를 지수 감쇠(`1 − exp(−λ·dt)`)로 따라간다.',
        '호버: `CardView` 의 `IPointerEnterHandler` → `HandView.SetHover(card)`. 그 카드의 Visual 을 들어 올리고 회전 0 · 1.25배, `SetAsLastSibling()` 으로 맨 앞에 그린다. 판정용 루트는 제자리라 떨리지 않고, 호버 중에만 Visual 바탕의 Raycast Target 을 켜서 올린 카드 위로 포인터를 옮겨도 호버가 이어진다(자식으로 옮겨 가면 Exit 가 오지 않는다). 호버가 풀리면 원래 순서(`SetSiblingIndex`)로 되돌린다.',
        '끌기: `IBeginDragHandler · IDragHandler · IEndDragHandler`. 대상 카드는 Visual 을 손패 위 가운데에 세우고 `TargetArrow.Draw(시작, 포인터)` 로 2차 베지어 위에 점을 찍는다. 대상 없는 카드는 Visual 이 포인터를 따라간다.',
        '대상 판정은 `EventSystem.current.RaycastAll(eventData, 결과)` 에서 `EnemyView` 를 찾는다 — 기준은 **포인터 위치**. 끄는 동안 카드의 `CanvasGroup.blocksRaycasts = false` 로 카드가 레이캐스트를 가로막지 않게 한다.',
        '`EnemyView.Bind(적)` 이 의도 아이콘 · 수치를 데이터에서 계산해 표시한다(강화 · 약화 반영). 겨누는 동안 `ShowPreview(깎일 양)` 으로 체력 바 미리보기.',
        '키보드 · 패드: Input System 의 `UI/Navigate · Submit · Cancel` 을 `InputActionReference` 로 받아, 좌우로 카드 → Submit → 좌우로 대상 → Submit. 턴 진행(뽑기 · 적 행동)은 `CardBattleDemo` 가 맡고 손패 UI 는 `Played` 이벤트만 알린다.',
      ],
      pitfalls: [
        '`HorizontalLayoutGroup` 을 쓰면 회전 · 부채꼴이 안 되고, 레이아웃이 위치를 계속 덮어써 연출과 싸운다. 손패는 직접 계산한다.',
        '움직이는 그림(Visual)에 Raycast Target 을 켜면 호버가 떨린다. 판정은 제자리 루트의 투명 Image 하나로.',
        '끄는 카드가 `blocksRaycasts` 를 켠 채면 레이캐스트 맨 위가 늘 그 카드라 아래 적이 잡히지 않는다. 끝나면 다시 켠다.',
        '`SetAsLastSibling()` 으로 그리는 순서만 바꾸고 배치 순서는 리스트로 따로 둔다. 안 그러면 호버할 때마다 손패 순서가 뒤섞인다.',
      ],
    },
    uitk: {
      hierarchy: `UIDocument (Panel Settings: Scale With Screen Size 1920×1080)
└─ CardHand.uxml
   └─ #battle (.battle)
      ├─ #enemies > #enemy-0 ~ #enemy-2 (.enemy > .intent(아이콘 · 수치 · 글자) · .bracket · .enemy__name · .hp)
      ├─ #hand (.hand — C# 가 Card.uxml 을 복제해 넣는다. 카드는 모두 picking-mode Ignore)
      ├─ #energy (.energy) · Button #end-turn
      └─ ArrowElement (C# 가 맨 위에 더한다 — generateVisualContent + Painter2D)
Card.uxml (.card .card--attack/skill/unplayable > #cost · #aim · #name · #art · #type · #text)
CardHandUITK.cs (+ HandPointer 조작기 · ArrowElement. CardData · EnemyIntent 는 UGUI 폴더 것을 쓴다)`,
      steps: [
        '카드 요소는 `position: absolute`. 매 프레임 `style.translate` · `style.rotate` · `style.scale` 만 바꾼다 — `left/top` 을 바꾸면 레이아웃을 다시 계산한다.',
        '호버 판정은 C# 수학으로: 포인터를 카드 회전의 반대로 돌려 사각형 안인지 본다. 올린 카드는 지금 자리, 나머지는 **부채꼴 제자리**로 판정해 떨리지 않는다. 맨 앞으로는 `BringToFront()`, 되돌릴 때는 `hand.Insert(원래 순서, 카드)`.',
        '끌기는 `PointerManipulator` 하나로: `PointerDownEvent` 에서 `target.CapturePointer(pointerId)`, `PointerMoveEvent` 로 따라가고, `PointerUpEvent` 에서 놓고 `ReleasePointer`.',
        '대상 판정은 `panel.Pick(포인터 위치)` 로 `.enemy` 를 찾는다. 카드 · 화살표는 `pickingMode = Ignore` 라 가로막지 않는다.',
        '화살표는 `ArrowElement.generateVisualContent` 에서 `Painter2D` 로 베지어 위에 점 · 화살촉을 그리고, 포인터가 움직일 때 `MarkDirtyRepaint()`.',
      ],
      pitfalls: [
        'USS `transition` 으로 카드를 따라가게 하면 끄는 동안 값이 매 프레임 바뀌어 한참 늦게 따라온다. 자세는 C# 에서 감쇠로 계산하고 transition 은 쓰지 않는다.',
        '`panel.Pick` 은 가장 위 요소를 돌려준다. 카드 · 화살표가 `pickingMode = Position` 이면 끄는 동안 늘 그것이 잡혀 적을 찾지 못한다.',
        '`BringToFront()` 는 계층 순서를 바꾼다. 배치 계산은 따로 둔 리스트 순서로 해야 손패가 뒤섞이지 않는다.',
      ],
    },
  },
  inspiredBy: [],
  original:
    '카드 여덟 가지와 수치, 드론 세 종류와 행동 패턴, 카드 · 의도 아이콘, 사용선, 화살표 모양, 손패 배치 수치, 나쁜 예 재현은 모두 이 갤러리에서 새로 만들었다. 특정 게임의 화면을 재현하지 않고 덱빌딩 · 카드 대전 장르 관례와 공개된 부채꼴 배치 원리로 만들었다.',
  references: [
    { label: 'cardsJS — 부채꼴(fan) 손패 배치 라이브러리 README', url: 'https://github.com/richardschneider/cardsJS/blob/master/README.md' },
    { label: 'Unity 6.3 — UI Toolkit 조작기(Manipulator)', url: 'https://docs.unity3d.com/6000.3/Documentation/Manual/UIE-manipulators.html' },
    { label: 'Unity 6.3 — Painter2D', url: 'https://docs.unity3d.com/6000.3/Documentation/ScriptReference/UIElements.Painter2D.html' },
    { label: 'Game Accessibility Guidelines — 전체 목록 (색만으로 정보를 전달하지 않기)', url: 'https://gameaccessibilityguidelines.com/full-list/' },
  ],
  related: [
    { id: 'upgrade-draft-choice', why: '같은 카드 모양 UI — 고르는 화면에서는 희귀도와 수치 비교에 집중' },
    { id: 'inventory-grid-tooltip', why: '끌어서 놓기와 놓을 수 있는 칸 표시를 격자에서' },
    { id: 'radial-quick-select', why: '포인터 방향으로 고르는 또 다른 입력 판정 — 데드존 · 히스테리시스' },
  ],
}
