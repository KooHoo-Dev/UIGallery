import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'popup-queue-stack',
  title: '팝업 관리자: 대기열 + 레이어 + 뒤로가기',
  titleEn: 'Popup Manager: Queue, Layers & Back Rules',
  group: 'D',
  order: 3,
  paradigms: ['menu'],
  oneLiner: '접속하자마자 쏟아지는 공지·출석·이벤트 창을 하나씩 줄 세우고, 끼어드는 시스템 창은 늘 맨 위에, 뒤로가기는 한 번에 한 장만',
  goals: [
    '팝업을 **레이어(일반 · 시스템 · 토스트)** 로 나누고, 레이어 안에서는 스택으로 쌓는 팝업 관리자를 설계할 수 있다',
    '접속 팝업을 **우선순위 대기열**로 하나씩 보여 주고, 시스템 창이 끼어들면 대기열을 멈출 수 있다',
    '**딤 한 장**으로 뒤 화면 입력을 막고, 창 종류에 따라 바깥 탭·뒤로가기 동작을 다르게 정할 수 있다',
    '되돌릴 수 없는 행동에 **기본 포커스 취소 + 길게 눌러 확정**을 적용할 수 있다',
  ],
  principles: ['인지 부하', '시각 위계', '일관성', '어포던스', '즉각 피드백'],
  platforms: ['mobile', 'pc'],
  inputs: ['touch', 'mouse', 'keyboard'],
  genres: ['모바일 수집형 RPG', '라이브 서비스', '캐주얼', '공통'],
  difficulty: 2,
  stage: { aspect: 'both', backdrop: 'none' },
  params: [
    {
      key: 'queueMode',
      label: '접속 팝업 표시',
      type: 'select',
      default: 'queue',
      options: [
        { value: 'queue', label: '대기열 — 하나씩 (권장)' },
        { value: 'all', label: '한꺼번에 겹쳐 띄우기' },
      ],
      hint: '"로비 진입"을 눌러 비교. 한꺼번에 띄우면 맨 위 창만 읽고 나머지는 반사적으로 닫게 된다',
    },
    { key: 'queueGapMs', label: '대기열 간격', type: 'range', min: 0, max: 1000, step: 50, default: 250, unit: 'ms', hint: '창을 닫은 뒤 다음 창이 뜰 때까지. 0이면 닫자마자 같은 자리에 새 창이 떠서 방금 누른 손가락이 다음 창 버튼을 누르기 쉽다' },
    {
      key: 'dimTap',
      label: '바깥(딤) 탭',
      type: 'select',
      default: 'by-type',
      options: [
        { value: 'by-type', label: '가벼운 창만 닫기 (권장)' },
        { value: 'always', label: '항상 닫기' },
        { value: 'never', label: '항상 무시' },
      ],
      hint: '가벼운 창(이벤트·우편·상점)은 바깥 탭으로 닫히고, 구매·분해 확인과 공지는 살짝 튕기며 유지된다. 연결 끊김은 어떤 설정이든 닫히지 않는다',
    },
    { key: 'dimOpacity', label: '딤 농도', type: 'range', min: 0, max: 0.9, step: 0.05, default: 0.6, hint: '0이어도 딤은 입력을 막는다 — 보이지 않는 벽이 되므로 "왜 안 눌리지?" 가 생긴다. 0.4~0.7 권장' },
    {
      key: 'rootBack',
      label: '창이 없을 때 뒤로가기',
      type: 'select',
      default: 'confirm',
      options: [
        { value: 'confirm', label: '종료 확인 창 (권장)' },
        { value: 'ignore', label: '무시' },
        { value: 'quit', label: '바로 종료' },
      ],
      hint: '안드로이드 뒤로 버튼은 습관적으로 연타된다. 마지막 한 번에 앱이 꺼지면 진행을 잃는다',
    },
    { key: 'holdMs', label: '길게 눌러 확정 시간', type: 'range', min: 0, max: 2000, step: 100, default: 800, unit: 'ms', hint: '분해 확인에 적용. 0이면 한 번 탭으로 확정 (되돌릴 수 없는 행동에는 위험)' },
    { key: 'transitionMs', label: '열림 연출', type: 'range', min: 0, max: 400, step: 20, default: 180, unit: 'ms', hint: '창이 커지며 나타나는 시간. 연출 중 클릭은 무시해 연타로 두 번 구매되는 일을 막는다 (상태 패널 기록 참고)' },
    { key: 'showDebug', label: '상태 패널', type: 'toggle', default: true, hint: '레이어별 스택과 대기열, 최근 처리 기록. 실제 게임에는 없는 수업용 패널' },
  ],
  presets: [
    {
      id: 'collector-rpg',
      name: '모바일 수집형 RPG',
      look: '접속 팝업이 많아 대기열이 핵심. 딤은 진하게, 분해·강화는 길게 눌러 확정',
      values: { queueMode: 'queue', queueGapMs: 300, dimTap: 'by-type', dimOpacity: 0.7, rootBack: 'confirm', holdMs: 1000, transitionMs: 200, showDebug: true },
    },
    {
      id: 'casual-puzzle',
      name: '캐주얼 퍼즐',
      look: '창이 가볍고 빨리 닫혀야 한다. 바깥 탭은 항상 닫기, 확정은 짧게',
      values: { queueMode: 'queue', queueGapMs: 150, dimTap: 'always', dimOpacity: 0.45, rootBack: 'confirm', holdMs: 500, transitionMs: 140, showDebug: true },
    },
    {
      id: 'pc-client',
      name: 'PC 클라이언트',
      look: '마우스가 정확하고 실수로 바깥을 누르는 일이 적다. 바깥 탭은 무시, 뒤로(Esc)는 창만 닫고 앱 종료는 메뉴로',
      values: { queueMode: 'queue', queueGapMs: 200, dimTap: 'never', dimOpacity: 0.5, rootBack: 'ignore', holdMs: 600, transitionMs: 120, showDebug: true },
    },
  ],
  events: [
    { id: 'enter-lobby', label: '로비 진입 (접속 팝업 3개)' },
    { id: 'open-shop', label: '상점 → 구매 확인' },
    { id: 'dismantle', label: '분해 (길게 누르기)' },
    { id: 'disconnect', label: '연결 끊김 (끼어들기)' },
    { id: 'back', label: '뒤로가기' },
    { id: 'tap-behind', label: '뒤 화면 "출격" 탭' },
  ],
  hotspots: [
    {
      n: 1,
      part: 'queue',
      title: '접속 팝업은 대기열로 하나씩',
      body: '공지·출석·이벤트를 한꺼번에 띄우면 맨 위 창만 읽고 나머지는 **반사적으로 닫는다**. 우선순위(점검 공지 → 보상 → 광고성 이벤트) 순서로 하나씩 꺼내고, 일반 창이나 시스템 창이 열려 있는 동안은 기다린다. "오늘 하루 보지 않기"는 다음 접속의 대기열에서 그 창을 빼는 규칙이다.',
      principle: '인지 부하',
      pin: 'right',
    },
    {
      n: 2,
      part: 'layers',
      title: '시스템 창은 다른 레이어',
      body: '연결 끊김·종료 확인은 **시스템 레이어**라 나중에 열린 일반 창보다 항상 위에 있다. "연결 끊김"을 누르면 0.5초 뒤 늦게 도착한 탐사 보상 창이 **대기열에서 기다리는** 것을 보자. 효과를 끄면 연 순서대로 겹쳐 보상 창이 **재시도 버튼을 덮는다**.',
      principle: '시각 위계',
      pin: 'right',
    },
    {
      n: 3,
      part: 'dim',
      title: '딤은 보이는 입력 차단벽',
      body: '맨 위 창 **바로 아래에 딤 한 장**을 두면 그 아래 모든 것(로비와 아래 창)이 눌리지 않는다. 어둡게 보이는 것이 곧 "지금은 못 누른다"는 신호다. "뒤 화면 탭"으로 확인 — 효과를 끄면 클릭이 창을 **관통해** 뒤의 출격 버튼이 눌린다.',
      principle: '어포던스',
      pin: 'inside',
    },
    {
      n: 4,
      part: 'back',
      title: '뒤로가기는 한 번에 한 장',
      body: 'Esc·안드로이드 뒤로 버튼은 **맨 위 창 하나만** 닫는다. 반드시 버튼으로 해결해야 하는 창(연결 끊김)은 흔들고 이유를 알려 준다. 창이 하나도 없을 때의 뒤로가기는 앱을 끄지 말고 **종료 확인**을 띄운다 — 뒤로 연타는 습관이다.',
      principle: '일관성',
    },
    {
      n: 5,
      part: 'hold',
      title: '되돌릴 수 없으면 길게 눌러 확정',
      body: '분해·판매처럼 되돌릴 수 없는 행동은 기본 포커스를 **취소**에 두고, 확정은 **길게 누르기**로 받는다. 채워지는 링이 "누르고 있으면 된다"를 즉시 보여 주고, 중간에 떼면 되감겨 취소된다. 효과를 끄면 기본 포커스가 "분해"이고 한 번 탭으로 끝난다.',
      principle: '즉각 피드백',
    },
  ],
  mistakes: [
    {
      title: '팝업 매니저 없이 각자 Instantiate',
      body: '상점·우편·공지가 저마다 프리팹을 띄우면 누가 위에 있는지, 뒤로가기가 무엇을 닫는지 아무도 모른다. 여는 것도 닫는 것도 **한 곳(PopupManager)** 을 거치게 한다.',
    },
    {
      title: '딤 없이 창만 띄우기 (클릭 관통)',
      body: '창 바깥을 눌렀는데 뒤의 버튼이 반응하면, 구매 창이 열린 채 다른 화면으로 넘어가는 버그가 생긴다. UGUI는 딤 Image의 **Raycast Target**, UI Toolkit은 딤 요소의 **pickingMode = Position** 이 입력을 받아야 한다.',
    },
    {
      title: '시스템 창을 일반 창과 같은 순서로',
      body: '나중에 연 창이 위로 오는 규칙만 있으면, 연결 끊김 창이 늦게 도착한 보상 창 아래에 깔린다. 레이어를 나누고 **sortingOrder(또는 레이어 루트의 순서)** 로 시스템 창을 항상 위에 둔다.',
    },
    {
      title: '뒤로가기 한 번에 전부 닫기 / 바로 종료',
      body: '스택을 한 번에 비우면 깊이 들어간 사용자가 처음부터 다시 찾아 들어가야 한다. 창이 없을 때 바로 종료하면 연타 한 번에 진행을 잃는다.',
    },
    {
      title: '위험한 확인의 기본 포커스가 "확정"',
      body: '패드·키보드로 확인을 연타하는 습관 때문에 분해·판매가 실수로 확정된다. 기본 포커스는 취소, 확정은 길게 누르기나 한 번 더 확인으로.',
    },
  ],
  juiceOff:
    '흔한 실수를 한꺼번에 재현한다. 접속 팝업 3개가 **한꺼번에 계단식으로 겹쳐** 뜨고, 레이어가 없어 늦게 도착한 탐사 보상 창이 연결 끊김 창을 덮는다. 딤이 없어 창 바깥을 누르면 뒤의 로비 버튼이 **관통해서** 눌린다. 뒤로가기 한 번에 창이 전부 닫히고, 창이 없으면 묻지 않고 앱이 꺼진다. 위험한 확인의 기본 포커스가 "확정"이고 분해는 한 번 탭으로 끝난다. 연출이 없어 창이 툭 나타난다.',
  timings: [
    { event: '창 열림 (확대 + 페이드)', ms: 180, easing: 'easeOutCubic', note: '권장값. 닫힘은 같은 시간. 이 동안 들어온 클릭은 무시' },
    { event: '대기열 다음 창까지 간격', ms: 250, easing: '—', note: '권장값. 닫자마자 같은 자리에 새 창이 뜨면 손가락이 다음 창을 누른다' },
    { event: '길게 눌러 확정', ms: 800, easing: 'linear', note: '권장값 0.5~1.2초. 중간에 떼면 약 0.25초에 걸쳐 되감김' },
    { event: '바깥 탭 막힘 튕김', ms: 320, easing: 'ease-out', note: '닫히지 않는다는 피드백. 크기 3.5% 이내' },
    { event: '닫을 수 없는 창 흔들기', ms: 450, easing: 'ease-out (감쇠)', note: '뒤로가기를 눌렀을 때. 이유를 토스트로 함께' },
    { event: '토스트 표시', ms: 1800, easing: '—', note: '입력을 막지 않는 맨 위 레이어. 최대 2개' },
  ],
  unity: {
    ugui: {
      hierarchy: `Canvas_Popup (Screen Space - Overlay · Sort Order 100 · Canvas Scaler 1920×1080)
├─ NormalLayer   (RectTransform 전체 화면)
├─ SystemLayer   (RectTransform 전체 화면)   ← 형제 순서가 곧 레이어 순서
├─ ToastLayer    (CanvasGroup · Blocks Raycasts 끔)
├─ Dim           (Image 검정 α0.6 · Raycast Target 켬 · Button → OnDimClicked)
└─ PopupManager  (PopupManager.cs)
Popup 프리팹 (Popup.cs · CanvasGroup)
├─ Panel (Image)
│  ├─ Title (TextMeshProUGUI)
│  ├─ Body
│  └─ Buttons
│     ├─ CancelButton (Button)          ← firstSelected
│     └─ ConfirmHold  (Button[onClick 비움] · HoldToConfirmButton.cs · submitAction = UI/Submit)
│        └─ Ring (Image · Filled · Radial 360)
PopupManagerDemo (PopupManagerDemo.cs — 숫자키로 시험)`,
      steps: [
        '`NormalLayer` · `SystemLayer` · `ToastLayer` 를 같은 Canvas 아래 **형제 순서**로 둔다. 시스템 창은 SystemLayer 에 붙으므로 나중에 열린 일반 창이 시스템 창을 덮을 수 없다.',
        '`Popup.cs` 를 창 프리팹 루트에 붙이고 `layer` · `closeOnBack` · `closeOnDim` · `priority` 를 정한다. 창은 처음에 한 번 만들어 두고 `SetActive` 로 재사용한다 (매번 Instantiate/Destroy 하면 GC 와 로딩 비용).',
        '`PopupManager.Open(popup)` 은 창을 해당 레이어의 맨 위(`SetAsLastSibling`)로 옮기고, 딤을 **맨 위 창 바로 아래**로 옮긴다. 딤을 그 레이어로 옮긴 뒤 `i = top.GetSiblingIndex()` — 딤이 이미 같은 부모의 앞쪽에 있으면 `i - 1` — 로 `SetSiblingIndex(i)`. `Close` 는 새 맨 위 창의 `firstSelected` 를 다시 선택한다.',
        '접속 팝업은 `Enqueue(popup)` 로 넣는다. 대기열은 `priority` 순 `List` 이고, 일반·시스템 창이 모두 닫혔을 때 `queueGap` 만큼 기다렸다가 하나 꺼낸다.',
        'Input System 의 **UI/Cancel** 액션을 `cancelAction` 에 연결한다. 안드로이드 뒤로 버튼은 Esc 키로 들어오므로 같은 액션 하나로 처리된다. `HandleBack()` 은 맨 위 창만 닫고, 창이 없으면 종료 확인 창을 연다.',
        '되돌릴 수 없는 행동의 버튼에 `HoldToConfirmButton.cs` 를 붙이고 `holdSeconds` 를 0.8 정도로. `onConfirmed` 에 실제 분해·판매를 연결한다.',
      ],
      pitfalls: [
        '딤 Image 의 **Raycast Target** 을 끄면 클릭이 관통한다. 반대로 투명(α 0)이어도 Raycast Target 이 켜져 있으면 입력은 막힌다 — 보이지 않는 벽이 되지 않게 α 를 0.4 이상으로.',
        '창 열림 연출 중에는 `CanvasGroup.interactable = false` 로 두어야 연타로 구매가 두 번 실행되지 않는다. 연출은 `Time.unscaledDeltaTime` 으로 — 일시정지(timeScale 0) 중에도 창은 움직여야 한다.',
        '창마다 별도 Canvas 를 쓰면 `sortingOrder` 를 직접 관리해야 하고 드로우콜이 늘어난다. 한 Canvas 안의 형제 순서로 충분한 경우가 많다.',
        '`Stack<Popup>` 은 중간 창을 먼저 닫을 수 없다(서버 응답으로 아래 창이 사라지는 경우). 이 예제는 `List` 로 두고 맨 뒤를 맨 위로 본다.',
      ],
    },
    uitk: {
      hierarchy: `UIDocument (Panel Settings: Scale With Screen Size 1920×1080 · Sort Order 100)
└─ PopupManager.uxml
   └─ #popup-root (.popup-root, picking-mode: Ignore)
      ├─ #normal-layer (.layer)
      │  └─ .popup (전체 화면 투명 틀, picking-mode: Ignore) — #notice · #buy · #dismantle · #reward
      │     └─ .popup__panel > Label.popup__title · Label.popup__body · .popup__buttons
      │        (분해 창: Button 취소 + VisualElement #hold > #hold-fill)
      ├─ #system-layer (.layer) — #offline · #quit
      └─ #dim (.dim)   ← 맨 위 창의 레이어로 옮겨 그 창 바로 아래(PlaceBehind)`,
      steps: [
        '`#normal-layer` · `#system-layer` 를 `#popup-root` 아래에 순서대로 둔다(토스트 레이어는 이 예제에서 생략). UI Toolkit 은 **뒤에 오는 형제가 위에 그려진다**. 레이어 안에서 창을 맨 위로 올릴 때는 `BringToFront()`. 창을 열면 `firstFocus`(위험한 창은 취소 버튼)에 `Focus()`.',
        '창은 UXML 에 미리 넣고 `.popup--open` 클래스로 연다. USS `transition` 으로 opacity·scale 연출을 주고, 닫힘은 클래스를 빼면 된다.',
        '딤은 `pickingMode = Position`(기본값) 이라 클릭을 받는다. 맨 위 창의 레이어로 옮긴 뒤(`layer.Add(dim)`) `dim.PlaceBehind(top)` 으로 그 창 바로 아래에 두고, `PointerDownEvent` 에서 바깥 탭 규칙을 처리한다.',
        '뒤로가기는 UGUI 판과 같은 Input System **UI/Cancel** 액션으로 받는다. 어느 요소에 포커스가 있든 상관없이 한 곳에서 처리하려는 것.',
        '길게 누르기는 `Button` 대신 일반 `VisualElement`(focusable) 에 `PointerDownEvent`(+ `CapturePointer`) · `PointerUpEvent` · `PointerCaptureOutEvent` 를 달고, `Update` 에서 채움 너비(`Length.Percent`)를 올린다. 포커스가 있을 때 Submit 액션을 누르고 있어도 같은 방식으로 채워진다.',
      ],
      pitfalls: [
        '`Button` 은 Clickable 이 포인터 이벤트를 먼저 소비해 길게 누르기를 만들기 어렵다. 일반 VisualElement + `CapturePointer` 가 단순하다.',
        '`display: none` 으로 숨긴 창에는 transition 이 동작하지 않는다. 닫힘 연출이 필요하면 `opacity` + `visibility`(또는 `picking-mode`) 로 숨기고, 다 끝난 뒤 display 를 끈다.',
        '레이어를 나누지 않고 `BringToFront()` 만 쓰면 늦게 열린 일반 창이 시스템 창 위로 올라온다. 항상 **자기 레이어 안에서** 올린다.',
      ],
    },
  },
  inspiredBy: [],
  original:
    '로비 화면(외곽 탐사대 궤도 정비 기지), 창 문구와 구성(점검 예고 · 7일 출석 · 통신탑 복구 주간 · 탐사 보상 · 보급 상점 · 분해), 레이어 3단(일반 · 시스템 · 토스트) 규칙, 대기열 간격, 늦게 도착한 보상 창 시나리오, 바깥 탭 3종 비교, 길게 누르기 링, 상태 패널은 모두 이 갤러리에서 새로 만들었다. 특정 게임의 화면을 재현하지 않고 모바일·라이브 서비스 게임 전반의 관례와 접근성 지침을 바탕으로 정리했다.',
  references: [
    { label: 'Xbox Accessibility Guideline 115 — 오류 메시지와 파괴적 행동', url: 'https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/115' },
    { label: 'Android Developers — 뒤로 탐색 (Back navigation)', url: 'https://developer.android.com/guide/navigation/custom-back' },
    { label: 'Unity 6.3 — CanvasGroup.blocksRaycasts', url: 'https://docs.unity3d.com/6000.3/Documentation/ScriptReference/CanvasGroup-blocksRaycasts.html' },
    { label: 'Unity 6.3 — VisualElement.pickingMode (UI Toolkit)', url: 'https://docs.unity3d.com/6000.3/Documentation/ScriptReference/UIElements.VisualElement-pickingMode.html' },
    { label: 'Unity 6.3 — VisualElement.PlaceBehind (UI Toolkit)', url: 'https://docs.unity3d.com/6000.3/Documentation/ScriptReference/UIElements.VisualElement.PlaceBehind.html' },
  ],
  related: [
    { id: 'main-pause-menu', why: '한 화면 안의 **메뉴 스택** — 포커스 복원과 전환 중 입력 버퍼는 그쪽에서. 이 표본은 여러 곳에서 열리는 창의 레이어·대기열' },
    { id: 'quest-tracker-toasts', why: '입력을 막지 않는 알림의 대기열 — 같은 "줄 세우기" 를 모달이 아닌 토스트로' },
    { id: 'settings-accessibility', why: '자동으로 닫히는 창의 시간 제한과 기본 포커스 "취소" 확인 창' },
  ],
}
