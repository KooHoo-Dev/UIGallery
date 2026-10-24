import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'tutorial-spotlight',
  title: '튜토리얼 스포트라이트 + 코치마크',
  titleEn: 'Tutorial Spotlight & Coach Marks',
  group: 'D',
  order: 4,
  paradigms: ['non-diegetic'],
  oneLiner: '화면을 어둡게 덮고 지금 눌러야 할 곳만 뚫어 보여 준다. 읽고 넘기는 대신 진짜 버튼을 직접 눌러 보며 배우는 첫 접속 튜토리얼',
  goals: [
    '**구멍 바깥만 막는** 스포트라이트를 만들어, 튜토리얼 전용 가짜 버튼 없이 진짜 버튼을 누르게 할 수 있다',
    '대상이 움직이거나(서랍) 스크롤 목록 안에 있어도 구멍과 말풍선이 **대상을 따라가게** 할 수 있다',
    '말풍선을 대상 옆에 두되 넘치면 뒤집는 **배치 규칙**과 단계 표시·건너뛰기·다시 보기를 설계할 수 있다',
    '가만히 있거나 엉뚱한 곳을 누르면 **손가락 힌트**를 띄우는 유휴 타이머를 구현할 수 있다',
  ],
  principles: ['어포던스', '가독성', '시각 위계', '접근성', '인지 부하'],
  platforms: ['mobile', 'pc'],
  inputs: ['touch', 'mouse', 'keyboard'],
  genres: ['모바일 수집형 RPG', '전략', '캐주얼', '공통'],
  difficulty: 2,
  stage: { aspect: 'both', backdrop: 'none' },
  params: [
    {
      key: 'holeShape',
      label: '구멍 모양',
      type: 'select',
      default: 'auto',
      options: [
        { value: 'auto', label: '자동 (정사각형이면 원)' },
        { value: 'circle', label: '항상 원' },
        { value: 'rect', label: '항상 둥근 사각형' },
      ],
      hint: '넓은 버튼을 원으로 뚫으면 구멍이 지나치게 커져 주변 버튼까지 보인다',
    },
    { key: 'holePadding', label: '구멍 여백', type: 'range', min: 0, max: 40, step: 2, default: 14, unit: 'px', hint: '대상 가장자리와 구멍 사이. 0이면 테두리가 잘려 보이고, 너무 크면 옆 버튼이 함께 드러난다' },
    { key: 'dimOpacity', label: '딤 농도', type: 'range', min: 0, max: 0.9, step: 0.05, default: 0.72, hint: '낮으면 주변이 보여 시선이 흩어지고, 너무 높으면 지금 어디에 있는지 맥락을 잃는다' },
    { key: 'trackTarget', label: '대상 따라가기', type: 'toggle', default: true, hint: '끄면 단계가 시작할 때 잰 자리에 구멍이 머문다. 2단계(서랍이 미끄러져 들어옴)·4단계(목록 스크롤)에서 구멍이 빈 곳을 가리킨다' },
    { key: 'transitionMs', label: '구멍 이동 시간', type: 'range', min: 0, max: 800, step: 20, default: 280, unit: 'ms', hint: '다음 대상으로 구멍이 미끄러져 가는 시간. 0이면 툭 바뀌어 어디로 옮겨 갔는지 놓치기 쉽다' },
    { key: 'idleHintMs', label: '손가락 힌트까지', type: 'range', min: 0, max: 10000, step: 500, default: 4000, unit: 'ms', hint: '아무 입력이 없으면 이 시간 뒤 손가락이 대상을 톡톡 누른다. 0이면 끈다. 바깥을 누르면 기다리지 않고 바로 뜬다' },
    {
      key: 'outsideTap',
      label: '구멍 바깥 탭',
      type: 'select',
      default: 'block-feedback',
      options: [
        { value: 'block-feedback', label: '막고 알려 주기 (권장)' },
        { value: 'block-silent', label: '조용히 막기' },
        { value: 'pass', label: '그대로 통과' },
      ],
      hint: '"바깥 누르기" 이벤트로 비교. 조용히 막으면 "고장 났나?", 통과시키면 튜토리얼 도중 다른 화면이 열려 안내와 화면이 어긋난다',
    },
    {
      key: 'tipPlacement',
      label: '말풍선 위치',
      type: 'select',
      default: 'auto',
      options: [
        { value: 'auto', label: '대상 옆 (넘치면 뒤집기)' },
        { value: 'fixed', label: '왼쪽 아래 고정 (대화창처럼)' },
      ],
      hint: '고정 위치는 구현이 쉽지만 하단 탭 단계(1·3단계)에서 말풍선이 강조한 대상을 덮는다',
    },
    { key: 'showSkip', label: '건너뛰기 버튼', type: 'toggle', default: true, hint: '재설치·두 번째 계정처럼 이미 아는 사람을 위한 탈출구. 누르면 한 번 더 묻고, 다시 보기 위치를 알려 준다' },
  ],
  presets: [
    {
      id: 'collector-rpg',
      name: '모바일 수집형 RPG',
      look: '진한 딤과 원형 구멍, 빠른 손가락 힌트. 엄지가 가리는 하단 버튼이 많아 말풍선은 늘 위로',
      values: { holeShape: 'auto', holePadding: 16, dimOpacity: 0.78, trackTarget: true, transitionMs: 300, idleHintMs: 3000, outsideTap: 'block-feedback', tipPlacement: 'auto', showSkip: true },
    },
    {
      id: 'pc-strategy',
      name: 'PC 전략',
      look: '정보가 많은 화면이라 딤은 옅게, 구멍은 사각형으로 넉넉히. 힌트는 늦게',
      values: { holeShape: 'rect', holePadding: 24, dimOpacity: 0.5, trackTarget: true, transitionMs: 220, idleHintMs: 7000, outsideTap: 'block-feedback', tipPlacement: 'auto', showSkip: true },
    },
    {
      id: 'hyper-casual',
      name: '하이퍼캐주얼',
      look: '글을 거의 안 읽는 플레이어. 딤은 가볍게, 손가락이 금방 나와 "여기"만 알려 준다',
      values: { holeShape: 'circle', holePadding: 20, dimOpacity: 0.45, trackTarget: true, transitionMs: 360, idleHintMs: 1500, outsideTap: 'block-feedback', tipPlacement: 'auto', showSkip: false },
    },
  ],
  events: [
    { id: 'tap-target', label: '강조된 곳 누르기' },
    { id: 'tap-outside', label: '바깥 누르기' },
    { id: 'idle', label: '가만히 있기 (힌트)' },
    { id: 'skip', label: '건너뛰기' },
    { id: 'restart', label: '처음부터' },
  ],
  hotspots: [
    {
      n: 1,
      part: 'hole',
      title: '구멍 바깥만 막는다',
      body: '구멍 **바깥** 네 면에 투명한 막을 깔고, 구멍 안은 비워 둔다. 그래서 강조된 **진짜 버튼**이 그대로 눌린다 — 튜토리얼 전용 가짜 버튼을 만들면 실제 버튼과 위치·모양이 어긋나기 쉽다. 어두운 곳은 "지금은 못 누른다", 밝은 구멍은 "여기를 누른다"는 신호가 된다.',
      principle: '어포던스',
    },
    {
      n: 2,
      part: 'tip',
      title: '말풍선은 대상 옆, 가리지 않게',
      body: '대상 쪽(위·왼쪽)에 먼저 두고, 화면을 넘치면 반대쪽으로 **뒤집고**, 그래도 넘치면 화면 안으로 민다. 꼬리는 늘 구멍 가운데를 가리킨다. 한 단계에 한 문장, 해야 할 일 하나만 굵게.',
      principle: '가독성',
      pin: 'left',
    },
    {
      n: 3,
      part: 'track',
      title: '대상이 숨어 있으면 먼저 보이게',
      body: '4단계의 냉각 셀은 목록 아래쪽, 화면 밖에 있다. 구멍을 뚫기 전에 목록을 **대상이 보이는 곳(가능하면 가운데)까지 스크롤**하고, 서랍처럼 움직이는 대상은 매 프레임 위치를 다시 재서 따라간다. "대상 따라가기"를 끄고 2·4단계를 보자.',
      principle: '시각 위계',
    },
    {
      n: 4,
      part: 'hint',
      title: '헤매면 손가락 힌트',
      body: '일정 시간 입력이 없거나 구멍 바깥을 누르면 손가락이 대상을 톡톡 누른다. 글을 읽지 않거나 읽기 어려운 플레이어에게 **조작 리마인더**가 된다. 바깥을 눌렀을 때 아무 반응이 없으면 "고장 났나?" 로 읽힌다.',
      principle: '접근성',
    },
    {
      n: 5,
      part: 'progress',
      title: '몇 단계 남았나 · 나가는 문',
      body: '점과 "2 / 5" 로 남은 양을 알려 주면 끝이 보여 참을 만하다. 이미 아는 사람을 위해 **건너뛰기**를 두되 한 번 더 묻고, 끝나면 **다시 보기** 위치(설정 › 도움말)를 알려 준다.',
      principle: '인지 부하',
      pin: 'right',
    },
  ],
  mistakes: [
    {
      title: '"다음" 버튼으로 읽고 넘기기',
      body: '설명만 읽고 넘기면 손이 기억하지 못한다. 더 나쁜 점은 실제로 해야 할 일(서랍 열기)을 하지 않은 채 다음 단계로 가서, 구멍이 **보이지 않는 대상**을 가리키게 된다는 것. 단계 완료 조건은 "그 행동을 했다" 여야 한다.',
    },
    {
      title: '구멍 위치를 단계 시작 때 한 번만 계산',
      body: '애니메이션으로 들어오는 서랍, 스크롤 목록, 해상도 변경 뒤에는 대상이 움직인다. 구멍은 매 프레임(또는 레이아웃이 바뀔 때마다) 대상의 **현재 화면 위치**를 다시 재야 한다.',
    },
    {
      title: '구멍 바깥 클릭이 그대로 통과',
      body: '딤만 깔고 입력을 막지 않으면 튜토리얼 도중 다른 버튼이 눌려 화면과 안내가 어긋난다(상점이 열렸는데 "우편함을 여세요"). 반대로 **전부 막고** 구멍 안까지 막으면 진행할 수 없는 소프트락이 된다.',
    },
    {
      title: '말풍선 위치 고정',
      body: '대화창처럼 한 자리에 고정한 말풍선은 그 자리에 있는 대상(여기서는 하단 탭)을 **덮는다**. 대상 위치에 따라 방향을 고른다.',
    },
    {
      title: '건너뛰기도 다시 보기도 없음',
      body: '두 번째 계정·재설치 플레이어는 같은 튜토리얼을 다시 해야 하고, 처음 하는 플레이어는 놓친 내용을 다시 볼 곳이 없다.',
    },
  ],
  juiceOff:
    '흔한 실수를 한꺼번에 재현한다. 말풍선에 **"다음" 버튼**이 있어 하지 않고 읽기만 해도 넘어가고, 그러면 서랍이 열리지 않은 채 2단계 구멍이 화면 밖 빈 곳을 가리킨다. 구멍은 단계 시작 때 잰 자리에 고정되고 목록도 스크롤해 주지 않는다. 딤이 입력을 막지 않아 바깥을 누르면 뒤의 상점이 열리고, 말풍선은 왼쪽 아래 고정이라 하단 탭을 덮는다. 손가락 힌트와 건너뛰기도 없다.',
  timings: [
    { event: '구멍 이동 (다음 대상으로)', ms: 280, easing: '지수 감쇠 (거의 easeOutQuart)', note: '권장값 200~400. 어디로 옮겨 갔는지 눈으로 따라갈 수 있게' },
    { event: '손가락 힌트까지 대기', ms: 4000, easing: '—', note: '권장값. 장르에 따라 1.5~7초. 바깥을 누르면 즉시' },
    { event: '손가락 톡톡 주기', ms: 1100, easing: 'ease-in-out', note: '약 0.9Hz — 반복 맥동은 2Hz 이하' },
    { event: '구멍 테두리 숨쉬기', ms: 1600, easing: 'ease-in-out', note: '시선 유도. 크기 4% 이내' },
    { event: '바깥 탭 피드백', ms: 450, easing: 'ease-out', note: '테두리가 한 번 퍼지고 말풍선이 살짝 흔들린다' },
    { event: '목록 자동 스크롤', ms: 500, easing: '지수 감쇠 (Unity 예제는 easeOutCubic 0.5초)', note: '대상이 보이는 곳(가능하면 가운데)까지' },
  ],
  unity: {
    ugui: {
      hierarchy: `Canvas_Game (Screen Space - Overlay · Canvas Scaler 1920×1080)
├─ TabBar
│  ├─ Tab_Shop  (Button · TutorialTarget id="tab-shop")
│  └─ Tab_Mail  (Button · TutorialTarget id="tab-mail")
├─ Sortie       (Button · TutorialTarget id="sortie")
├─ MailDrawer   (Animator 또는 코루틴으로 슬라이드)
│  └─ ClaimAll  (Button · TutorialTarget id="mail-claim")
└─ Shop
   └─ ScrollRect > Viewport > Content (Pivot Y = 1, VerticalLayoutGroup)
      └─ Item_Cell (Button · TutorialTarget id="item-cell")
Canvas_Tutorial (Sort Order 높게 · Canvas_Game 과 같은 Canvas Scaler · TutorialSpotlight.cs)
└─ Overlay     (앵커 0,0–1,1 늘이기 · 오프셋 0 · 피벗 0,0)  ← TutorialSpotlight.overlay
   ├─ Block_Top / Block_Bottom / Block_Left / Block_Right
   │     (Image 검정 α0.72 · Raycast Target 켬 · EventTrigger PointerDown → OnOutsideTapped)
   ├─ Ring    (Image 원/둥근 사각 테두리 · Raycast Target 끔)
   ├─ Hand    (Image · Raycast Target 끔 · 처음엔 꺼 둠)
   ├─ Tip     (Image + TextMeshProUGUI Title · Body · Progress · 모두 Raycast Target 끔)
   └─ Skip    (Button → 확인 창 → TutorialSpotlight.Skip)
※ Overlay 아래 요소는 모두 앵커 = 피벗 = 왼쪽 아래(0, 0)
TutorialSequence.asset (TutorialSequence.cs — 단계 목록)`,
      steps: [
        '`TutorialSequence` ScriptableObject 를 만들고 단계마다 `targetId` · 제목 · 본문 · 말풍선 선호 방향을 적는다. 문구를 코드에서 빼 두면 기획자가 바로 고친다.',
        '강조할 버튼마다 `TutorialTarget` 을 붙이고 같은 `id` 를 준다. 버튼이 눌리면 `TutorialTarget.Clicked` 이벤트가 나가고, `TutorialSpotlight` 는 **현재 단계의 id 일 때만** 다음 단계로 넘어간다 (버튼의 본래 기능은 그대로 실행된다).',
        '딤은 **구멍 바깥 네 장의 Image** 로 만든다. 네 장이 Raycast Target 이라 바깥 입력을 막고, 구멍 자리에는 아무것도 없으니 진짜 버튼이 눌린다. 매 프레임 대상의 `GetWorldCorners` 를 튜토리얼 Canvas 좌표로 바꿔(`RectTransformUtility.ScreenPointToLocalPointInRectangle`) 네 장의 위치·크기를 갱신한다.',
        '대상이 `ScrollRect` 안에 있으면 단계를 시작할 때 `verticalNormalizedPosition` 을 대상이 가운데 오도록 옮긴다 (Content 의 Pivot Y = 1 기준 계산).',
        '말풍선은 대상 위(또는 선호 방향)에 두고, 화면을 넘치면 반대로 뒤집은 뒤 화면 안으로 고정한다. 아무 입력이 없는 시간이 `idleHintSeconds` 를 넘거나 바깥을 누르면 `Hand` 를 켠다.',
      ],
      pitfalls: [
        '네 장 방식은 구멍이 **사각형**이다. 원형 구멍을 정확히 하려면 전체 화면 딤 한 장에 `ICanvasRaycastFilter.IsRaycastLocationValid` 를 구현해 원 안쪽만 통과시키고, 모양은 SDF 셰이더(또는 스텐실 마스크)로 그린다. 이 예제는 사각 구멍 + 원형 테두리로 타협했다.',
        '`Mask` 컴포넌트로 구멍을 뚫으면 스텐실 비트를 쓰므로, 다른 Mask(스크롤 목록 Viewport) 와 겹칠 때 엉뚱하게 잘릴 수 있다.',
        '월드(3D) 오브젝트를 클릭하는 게임이면 UI 막이 있어도 물리 레이캐스트는 따로 막아야 한다 — 입력 처리 전에 `EventSystem.current.IsPointerOverGameObject()` 를 확인한다.',
        '차단막은 **포인터만** 막는다. 키보드·패드 내비게이션은 딤 뒤의 버튼으로 선택을 옮겨 Submit 으로 누를 수 있으므로, 튜토리얼 동안 대상이 아닌 Selectable 의 `navigation.mode` 를 `None` 으로 두거나 선택이 벗어나면 대상으로 되돌린다. 말풍선(Tip)의 Image·Text 도 Raycast Target 을 꺼야 아래 대상이 눌린다.',
        '대상 위치는 레이아웃이 끝난 뒤에 재야 맞다. 단계를 시작한 프레임에는 `Canvas.ForceUpdateCanvases()` 를 한 번 부르거나 한 프레임 기다린다.',
      ],
    },
    uitk: {
      hierarchy: `UIDocument (Panel Settings: Scale With Screen Size 1920×1080)
└─ TutorialSpotlight.uxml
   ├─ #game (게임 화면 — 탭 · 출격 · 서랍 · 상점)
   │  ├─ #tab-shop · #tab-mail · #sortie (Button)
   │  ├─ #mail-drawer > #mail-claim (Button)
   │  └─ #shop > ScrollView #shop-list > … #item-cell (Button)
   └─ #tutorial (.tutorial, picking-mode: Ignore)
      ├─ #block-top · #block-bottom · #block-left · #block-right (.block)
      ├─ #ring (.ring, picking-mode: Ignore)
      ├─ #hand (.hand, picking-mode: Ignore)
      ├─ #tip (.tip) > #tip-title · #tip-progress · #tip-body
      └─ #skip (Button)`,
      steps: [
        '튜토리얼 레이어(`#tutorial`)는 게임 화면 **뒤의 형제**로 두어 위에 그려지게 하고, 자신은 `picking-mode: Ignore`. 입력은 네 장의 `.block` 만 받는다.',
        '단계마다 `Q(targetId)` 로 대상을 찾고, 매 프레임 `tutorial.WorldToLocal(target.worldBound)` 로 튜토리얼 레이어 좌표(왼쪽 위 원점)를 얻어 네 장과 `#ring` 의 `style.left/top/width/height` 를 갱신한다. 같은 패널 안이라 화면 좌표 변환은 필요 없다.',
        '대상이 `ScrollView` 안에 있으면 `scrollView.ScrollTo(target)` 로 먼저 보이게 한다.',
        '대상 버튼의 `clicked` 에 "현재 단계면 다음으로" 를 등록한다(다시 켜져도 두 번 등록되지 않게 한 번만). 루트에 `TrickleDown` 으로 `PointerDownEvent` 를 걸고, 키보드는 Input System 의 `Keyboard.current.anyKey` 로 확인해 유휴 타이머를 0으로 되돌린다.',
      ],
      pitfalls: [
        'UI Toolkit 에는 마스크 구멍이 없다. 네 장 방식이 가장 단순하고, 원형 구멍이 꼭 필요하면 `generateVisualContent` 의 `Painter2D` 로 "화면 사각형 − 원" 경로를 칠한다(입력 판정은 별도).',
        '`worldBound` 는 레이아웃이 계산된 뒤에야 맞다. 단계를 시작한 직후에는 `schedule.Execute` 로 한 프레임 미루거나 `GeometryChangedEvent` 를 기다린다.',
        '`display: none` 인 대상(닫힌 서랍)의 `worldBound` 는 크기가 0이다. 단계 순서가 "서랍 열기 → 서랍 안 버튼" 이 되도록 데이터를 짠다.',
      ],
    },
  },
  inspiredBy: [],
  original:
    '첫 접속 시나리오(우편함 → 보상 → 상점 → 냉각 셀 → 첫 출격)와 문구, 정비 기지 화면, 네 장 차단막 + 그림자 구멍 구성, 말풍선 뒤집기 배치와 꼬리, 손가락 힌트 그림, 단계 점·건너뛰기 확인·다시 보기 카드, 나쁜 예 재현은 모두 이 갤러리에서 새로 만들었다. 특정 게임의 튜토리얼을 재현하지 않고 모바일 게임 전반의 관례와 접근성 지침(상호작용형 튜토리얼 · 조작 리마인더)을 바탕으로 정리했다.',
  references: [
    { label: 'Game Accessibility Guidelines — 전체 목록 (상호작용형 튜토리얼 · 리마인더)', url: 'https://gameaccessibilityguidelines.com/full-list/' },
    { label: 'Game Developer — Inside the UX of onboarding and player engagement (영상 기사)', url: 'https://www.gamedeveloper.com/design/video-inside-the-ux-of-onboarding-and-player-engagement' },
    { label: 'Unity 6.3 — ICanvasRaycastFilter.IsRaycastLocationValid', url: 'https://docs.unity3d.com/6000.3/Documentation/ScriptReference/ICanvasRaycastFilter.IsRaycastLocationValid.html' },
    { label: 'Unity 6.3 — RectTransform.GetWorldCorners', url: 'https://docs.unity3d.com/6000.3/Documentation/ScriptReference/RectTransform.GetWorldCorners.html' },
    { label: 'Unity 6.3 — ScrollView.ScrollTo (UI Toolkit)', url: 'https://docs.unity3d.com/6000.3/Documentation/ScriptReference/UIElements.ScrollView.ScrollTo.html' },
  ],
  related: [
    { id: 'popup-queue-stack', why: '딤으로 입력을 막는 같은 원리 — 저쪽은 창 바깥 전체를, 이쪽은 구멍만 남기고 막는다' },
    { id: 'inventory-grid-tooltip', why: '말풍선 배치에 쓴 "재고 → 뒤집고 → 고정" 규칙을 툴팁에서 자세히' },
    { id: 'skill-cooldown-prompt', why: '손가락 힌트 같은 조작 안내를 입력 장치별 버튼 글리프로' },
  ],
}
