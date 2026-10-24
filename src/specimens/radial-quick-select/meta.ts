import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'radial-quick-select',
  title: '방사형 선택 휠',
  titleEn: 'Radial Quick-Select Wheel',
  group: 'G',
  order: 3,
  paradigms: ['non-diegetic'],
  oneLiner: '누르고 있는 동안 열리고, 방향으로 고르고, 놓으면 확정. 가운데 데드존과 경계 히스테리시스로 손 떨림에 흔들리지 않는 도구 휠',
  goals: [
    '스틱·마우스 방향을 **Atan2 각도 → 칸 번호**로 바꿀 수 있다',
    '가운데 **데드존**(마우스는 취소, 스틱은 마지막 선택 유지)과 칸 경계 **히스테리시스**로 떨림을 막을 수 있다',
    '휠이 열린 동안 세계 시간을 늦추고, UI 는 **실제 시간**으로 움직이게 할 수 있다',
    '누르고 있기 대신 **토글** 방식을 고를 수 있게 해 오래 누르기 어려운 플레이어를 배려할 수 있다',
  ],
  principles: ['즉각 피드백', '어포던스', '일관성', '인지 부하', '가독성'],
  platforms: ['pc', 'console'],
  inputs: ['gamepad', 'mouse', 'keyboard', 'touch'],
  genres: ['액션 어드벤처', 'TPS', '오픈월드', '공통'],
  difficulty: 2,
  stage: { aspect: '16:9', backdrop: 'none' },
  params: [
    { key: 'slots', label: '칸 수', type: 'range', min: 4, max: 12, step: 1, default: 8, unit: '칸', hint: '8칸(45°)이 스틱 8방향과 맞아 가장 고르기 쉽다. 12칸(30°)부터는 경계 실수가 늘어나 히스테리시스가 더 중요해진다' },
    { key: 'deadzonePct', label: '가운데 데드존', type: 'range', min: 0, max: 50, step: 2, default: 30, unit: '%', hint: '반지름의 이 비율 안은 아무 칸도 아니다. 마우스는 여기서 놓으면 취소, 스틱은 손을 떼서 돌아와도 마지막 선택을 유지한다' },
    { key: 'hysteresisDeg', label: '경계 히스테리시스', type: 'range', min: 0, max: 15, step: 1, default: 6, unit: '°', hint: '지금 칸의 경계를 이만큼 더 넘어야 옆 칸으로 바뀐다(노란 띠). 0이면 경계 위에서 손이 떨릴 때 선택이 깜빡이고, 그 순간 놓은 칸이 확정된다' },
    { key: 'slowmo', label: '열린 동안 세계 시간', type: 'range', min: 0.1, max: 1, step: 0.05, default: 0.3, unit: '×', hint: '휠을 여는 동안 적이 느려진다. 1이면 고르는 사이에 맞는다. 0에 가까우면 사실상 일시정지(전투 긴장이 사라진다)' },
    {
      key: 'openMode',
      label: '여는 방식',
      type: 'select',
      default: 'hold',
      options: [
        { value: 'hold', label: '누르고 있기 → 놓으면 확정' },
        { value: 'toggle', label: '토글 (한 번 눌러 열고 다시 눌러 확정)' },
      ],
      hint: '오래 누르기 어려운 플레이어를 위한 접근성 옵션. 토글이면 Esc 로 취소',
    },
    { key: 'showGuides', label: '안내선', type: 'toggle', default: true, hint: '입력 방향 화살표 · 각도 · 데드존 점선 · 히스테리시스 띠' },
  ],
  presets: [
    {
      id: 'action-adventure',
      name: '액션 어드벤처',
      look: '8칸, 열면 세계가 크게 느려진다. 경계를 넉넉하게',
      values: { slots: 8, deadzonePct: 30, hysteresisDeg: 6, slowmo: 0.25, openMode: 'hold', showGuides: true },
    },
    {
      id: 'shooter-quick',
      name: '슈터 무기 교체',
      look: '4칸만, 시간은 거의 그대로. 손에 익으면 보지 않고 방향만으로 바꾼다',
      values: { slots: 4, deadzonePct: 35, hysteresisDeg: 4, slowmo: 0.8, openMode: 'hold', showGuides: true },
    },
    {
      id: 'many-tools',
      name: '도구 많은 생존',
      look: '12칸이라 경계가 좁다. 히스테리시스를 크게, 토글로 천천히',
      values: { slots: 12, deadzonePct: 28, hysteresisDeg: 10, slowmo: 0.15, openMode: 'toggle', showGuides: true },
    },
  ],
  events: [
    { id: 'demo', label: '시연: 훑기 · 경계 떨림 · 놓기' },
    { id: 'open', label: '열기 / 확정' },
    { id: 'cancel', label: '가운데에서 놓기 (취소)' },
  ],
  hotspots: [
    {
      n: 1,
      part: 'sector',
      title: '방향 = 각도 = 칸',
      body: '가운데에서 입력까지의 벡터를 `Atan2` 로 각도로 바꾸고, 칸 폭(360° ÷ 칸 수)으로 나눠 반올림하면 칸 번호다. 고른 칸은 색이 바뀌고 바깥으로 살짝 나와, 화면을 보지 않아도 엄지 방향과 결과가 바로 이어진다.',
      principle: '즉각 피드백',
    },
    {
      n: 2,
      part: 'deadzone',
      title: '가운데는 아무 칸도 아니다',
      body: '가운데 원(데드존) 안에서는 칸을 고르지 않는다. 마우스는 여기서 놓으면 **취소**, 스틱은 손을 떼면 저절로 가운데로 돌아오므로 **마지막 선택을 유지**한다. 데드존이 없으면 가운데의 아주 작은 흔들림도 엉뚱한 칸을 고른다.',
      principle: '어포던스',
    },
    {
      n: 3,
      part: 'hysteresis',
      title: '경계에서 떨리지 않게',
      body: '지금 고른 칸의 경계를 **몇 도 더** 넘어야 옆 칸으로 바뀐다(노란 띠). "시연" 은 칸 경계 위에서 손이 ±4° 떨리는 도중에 놓는다 — 히스테리시스가 있으면 처음 칸이 그대로 확정되고, 효과를 끄면 놓는 순간 깜빡이던 칸이 확정된다.',
      principle: '일관성',
    },
    {
      n: 4,
      part: 'slowmo',
      title: '고를 시간을 준다',
      body: '휠이 열리면 세계가 느려진다(드론을 보자). 휠 · 안내 · 입력은 **실제 시간**으로 움직여야 느려진 세계에서도 손에 바로 반응한다. Unity 에서는 `Time.timeScale` 을 낮추고 UI 는 `unscaledDeltaTime` 으로.',
      principle: '인지 부하',
      pin: 'below',
    },
    {
      n: 5,
      part: 'label',
      title: '이름과 효과는 가운데에',
      body: '아이콘만으로 모르는 도구도 있다. 시선이 모이는 가운데에 **이름 + 한 줄 효과**를 띄운다. 장착 중인 칸은 테두리로 따로 표시해 "지금 것" 과 "고르는 것" 을 구분한다.',
      principle: '가독성',
      pin: 'below',
    },
  ],
  mistakes: [
    {
      title: '데드존 없음',
      body: '마우스를 가운데 두고 놓았는데 손 떨림 1px 이 어떤 칸을 고른 상태라 원하지 않는 도구로 바뀐다. 가운데는 "취소" 로 남겨 둔다.',
    },
    {
      title: '경계 히스테리시스 없음',
      body: '두 칸 경계 위에서 선택이 깜빡이고, 놓는 순간의 깜빡임 상태가 확정된다. 지금 칸의 경계를 조금 넓게 본다.',
    },
    {
      title: 'UI 까지 느려짐',
      body: '`Time.timeScale` 을 0.3 으로 낮추고 휠 애니메이션도 `deltaTime` 으로 돌리면 휠까지 느려져 답답하다. UI 는 `unscaledDeltaTime`, 코루틴 대기는 `WaitForSecondsRealtime`.',
    },
    {
      title: '칸이 너무 많음',
      body: '12칸을 넘기면 한 칸이 30° 보다 좁아져 스틱으로 정확히 고르기 어렵다. 그 이상은 두 겹 고리, 페이지 넘기기(어깨 버튼), 즐겨찾기 링처럼 나눈다.',
    },
    {
      title: '누르고 있기만 지원',
      body: '오래 누르기 어려운 플레이어는 휠을 연 채로 방향을 고르지 못한다. 토글 방식을 옵션으로 둔다.',
    },
  ],
  juiceOff:
    '흔한 실수를 한꺼번에 재현한다. 가운데 데드존과 히스테리시스가 없어 가운데의 작은 흔들림이 칸을 고르고 경계 위에서 선택이 깜빡인다. 열어도 세계가 느려지지 않고, 고른 칸 표시가 약하며 바깥으로 나오지도 않는다. 열기 · 닫기 연출이 없다.',
  timings: [
    { event: '휠 열기 (크기 85% → 100% + 페이드)', ms: 160, easing: 'easeOutCubic', note: '권장값. 실제 시간 기준 — 세계가 느려져도 휠은 그대로 빠르다' },
    { event: '세계 감속 전환', ms: 150, easing: '지수 감쇠', note: '갑자기 멈추지 않고 부드럽게 느려진다' },
    { event: '고른 칸 튀어나오기', ms: 110, easing: 'ease-out', note: '14px 바깥으로' },
    { event: '장착 표시 튐', ms: 400, easing: 'ease-out', note: '확정했다는 피드백' },
  ],
  unity: {
    ugui: {
      hierarchy: `Canvas_Wheel (Screen Space - Overlay · Canvas Scaler 1920×1080)
└─ Wheel (CanvasGroup · RadialMenu.cs)
   ├─ Sectors (빈 오브젝트 — 칸은 RadialMenu 가 Sector 프리팹으로 만든다)
   │  └─ Sector 프리팹: Image (Type Filled · Radial 360 · Origin Top · Clockwise) + Icon (Image)
   ├─ Hub   (Image 원 — 가운데 데드존)
   ├─ NameText (TextMeshProUGUI)
   └─ DescText (TextMeshProUGUI)
   (Sector 프리팹: 원 스프라이트 필요 — 스프라이트가 없으면 Filled 가 무시되고 사각형 전체가 그려진다. 크기 = 반지름 × 2,
    Icon 은 앵커·피벗 가운데)
Input Actions 에셋 (RadialMenu 에 InputActionReference 로 연결 — 스크립트가 직접 Enable):
   Wheel  = <Gamepad>/leftShoulder · <Keyboard>/tab · <Mouse>/rightButton (Button)
   Aim    = <Gamepad>/rightStick (Vector2) · Point = <Pointer>/position (Vector2)
   Cancel = <Keyboard>/escape · <Gamepad>/buttonEast (Button)`,
      steps: [
        '`RadialMenu` 의 `slots` 배열(이름 · 아이콘)로 칸을 만든다. 칸 하나는 Filled Radial 360 Image 의 `fillAmount = 1 / 칸 수` 를 `-(i × 칸 폭 − 칸 폭 / 2)` 만큼 Z 회전한 것이다.',
        'Wheel 액션의 `started` 에서 열고(`Time.timeScale = slowmo`), `canceled` 에서 확정하고 닫는다. 토글 옵션이면 `performed` 마다 열기·확정을 번갈아.',
        '매 프레임 입력 벡터를 고른다: 스틱이 데드존 밖이면 스틱, 아니면 마우스 위치 − 휠 가운데(반지름으로 나눔). `RadialSelection.Sector(각도, 칸 수, 지금 칸, 히스테리시스)` 가 칸 번호를 준다.',
        '연출(열기 크기 · 칸 튀어나오기)은 `Time.unscaledDeltaTime` 으로. 닫을 때 `Time.timeScale` 을 원래 값으로 되돌린다.',
      ],
      pitfalls: [
        '`Mathf.Atan2(y, x)` 는 오른쪽 = 0°, 반시계 + 다. 위 = 0°, 시계 + 로 쓰려면 `Atan2(x, y)` 로 인자를 바꾼다(UGUI 는 y 가 위로 +).',
        '`Time.timeScale` 을 바꾸면 `FixedUpdate` 횟수도 줄어든다. 물리가 끊겨 보이면 `Time.fixedDeltaTime` 도 같은 비율로 줄였다가 되돌린다. 일시정지(`timeScale = 0`) 중에는 휠을 열지 않고, 닫을 때는 **휠이 바꾼 값 그대로일 때만** 되돌린다 — 그 사이 일시정지 메뉴가 0 으로 바꿨다면 건드리지 않는다.',
        '3인칭 게임은 보통 커서가 잠겨 있어(`Cursor.lockState = Locked`) 마우스 위치가 변하지 않는다. 휠을 여는 동안 잠금을 풀고 커서를 휠 가운데로 옮겼다가(`Mouse.current.WarpCursorPosition`), 닫을 때 되돌린다.',
        '휠이 열린 동안 오른쪽 스틱이 카메라도 돌리지 않게, 카메라 회전 **액션만** 끈다. 휠의 Aim 과 같은 맵에 있다면 맵 전체를 끄면 휠 입력까지 꺼진다.',
      ],
    },
    uitk: {
      hierarchy: `UIDocument (Panel Settings: Scale With Screen Size 1920×1080)
└─ RadialMenu.uxml
   └─ #wheel-root (.wheel-root)
      └─ #wheel (.wheel — 열리면 .wheel--open)
         ├─ (C# 가 넣는 RadialWheelElement — generateVisualContent 로 칸을 그린다)
         └─ #wheel__label > Label #name · Label #desc
RadialMenuUITK.cs (열기 · 선택 · 확정 — RadialSelection.cs 를 그대로 쓴다)`,
      steps: [
        '칸 모양은 `VisualElement` 를 상속한 작은 요소의 `generateVisualContent` 에서 `Painter2D` 로 그린다: `Arc` 두 번(바깥 시계, 안쪽 반시계)으로 고리 조각을 만들고 `Fill`. 고른 칸만 색 · 반지름을 바꾸고 `MarkDirtyRepaint()`.',
        '각도 · 칸 계산은 UGUI 판과 같은 `RadialSelection.cs` 를 쓴다 — 그리기 기술과 상관없는 순수 계산.',
        '마우스 위치는 `RuntimePanelUtils.ScreenToPanel` 로 패널 좌표로 바꾼 뒤 휠 가운데를 빼고 반지름으로 나눈다 (UI Toolkit 은 y 가 아래로 +).',
        '열기 연출은 USS `transition`(scale · opacity). 패널의 transition 은 `Time.timeScale` 의 영향을 받지 않는다.',
      ],
      pitfalls: [
        'Painter2D 의 `Arc` 각도는 오른쪽 = 0°, **시계 방향 +** 다(y 가 아래로). 위 = 0° 기준 각도에서 90° 를 빼서 넘긴다.',
        '`generateVisualContent` 는 칠할 때만 불린다. 선택이 바뀌면 `MarkDirtyRepaint()` 를 불러야 다시 그려진다.',
      ],
    },
  },
  inspiredBy: [],
  original:
    '탐사 도구 열두 가지와 아이콘, 휠 모양과 배색, 히스테리시스 띠 · 데드존 점선 · 입력 화살표 안내, 세계만 느려지는 표시, 장착 패널은 모두 이 갤러리에서 새로 만들었다. 특정 게임의 휠을 재현하지 않고, 공개된 디자인 분석 글과 접근성 지침에서 정리한 원리로 만들었다.',
  references: [
    { label: 'GMTK — Can I fix Zelda’s UI using Unity? (방사형 메뉴 재구현 글)', url: 'https://gmtk.substack.com/p/can-i-fix-zeldas-ui-using-unity' },
    { label: '300Mind — Radial Menus in Game Design', url: 'https://300mind.studio/blog/radial-menus-in-game-design/' },
    { label: 'Game Accessibility Guidelines — 전체 목록 (누르고 있기 대신 토글)', url: 'https://gameaccessibilityguidelines.com/full-list/' },
    { label: 'Unity 6.3 — Time.unscaledDeltaTime', url: 'https://docs.unity3d.com/6000.3/Documentation/ScriptReference/Time-unscaledDeltaTime.html' },
    { label: 'Unity 6.3 — Painter2D.Arc (UI Toolkit)', url: 'https://docs.unity3d.com/6000.3/Documentation/ScriptReference/UIElements.Painter2D.Arc.html' },
  ],
  related: [
    { id: 'virtual-joystick-touch-layout', why: '같은 "벡터 → 데드존 → 정규화" 입력 처리를 이동에 쓰면' },
    { id: 'skill-cooldown-prompt', why: '고른 도구가 들어가는 버튼 슬롯 — 재사용 대기와 입력 장치별 글리프' },
    { id: 'main-pause-menu', why: '세계를 아예 멈추는 메뉴 — 느리게만 하는 휠과의 선택 기준' },
  ],
}
