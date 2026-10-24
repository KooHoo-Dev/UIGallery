import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'virtual-joystick-touch-layout',
  title: '가상 조이스틱 + 터치 배치',
  titleEn: 'Virtual Joystick & Touch Layout',
  group: 'G',
  order: 2,
  paradigms: ['non-diegetic'],
  oneLiner: '엄지가 닿는 곳에 생기는 조이스틱, 손가락마다 따로 기억하는 멀티터치, 노치를 피하는 세이프 에어리어, 기기가 바뀌어도 유지되는 배치 편집',
  goals: [
    '고정 · 플로팅 · 따라오는 조이스틱의 차이를 설명하고 장르에 맞게 고를 수 있다',
    '**데드존 · 최대 반경 · 정규화 · 반응 곡선**으로 손가락 이동을 0~1 입력으로 바꿀 수 있다',
    '**포인터 ID** 별로 역할을 기억해 왼손 이동과 오른손 공격이 서로 끊지 않게 만들 수 있다',
    '**세이프 에어리어** 안에 HUD 를 두고, 배치 편집 결과를 **비율 좌표**로 저장해 기기가 바뀌어도 유지할 수 있다',
  ],
  principles: ['즉각 피드백', '어포던스', '접근성', '가독성', '일관성'],
  platforms: ['mobile'],
  inputs: ['touch', 'mouse', 'keyboard'],
  genres: ['액션 RPG', 'MOBA', '슈팅', '서바이버'],
  difficulty: 3,
  stage: { aspect: '16:9', backdrop: 'none' },
  params: [
    {
      key: 'stickMode',
      label: '조이스틱 방식',
      type: 'select',
      default: 'floating',
      options: [
        { value: 'fixed', label: '고정 (늘 같은 자리)' },
        { value: 'floating', label: '플로팅 (누른 곳에 생김)' },
        { value: 'dynamic', label: '따라오기 (끌면 받침이 따라옴)' },
      ],
      hint: '고정은 위치를 외우기 쉽지만 엄지가 조금만 벗어나도 놓친다. 플로팅은 왼쪽 아래 어디를 눌러도 시작된다. 따라오기는 멀리 끌어도 방향을 바로 바꿀 수 있다',
    },
    { key: 'deadzonePct', label: '데드존', type: 'range', min: 0, max: 40, step: 2, default: 12, unit: '%', hint: '이 안의 작은 흔들림은 0으로 본다. 0이면 엄지를 올려 두기만 해도 캐릭터가 미끄러지고, 크면 살짝 기울일 때 반응이 늦다 (그래프의 노란 점선)' },
    { key: 'radius', label: '최대 반경', type: 'range', min: 60, max: 200, step: 10, default: 120, unit: 'px', hint: '이만큼 밀면 입력 1. 작으면 미세 조정이 어렵고, 크면 엄지를 많이 움직여야 한다' },
    {
      key: 'curve',
      label: '반응 곡선',
      type: 'select',
      default: 'fine',
      options: [
        { value: 'fine', label: '섬세하게 (조금 밀면 천천히)' },
        { value: 'linear', label: '직선' },
      ],
      hint: '입력 → 출력 그래프 모양이 바뀐다. 섬세하게는 걷기·조준처럼 느린 움직임을 쉽게 한다',
    },
    { key: 'idleOpacity', label: '쉬는 동안 투명도', type: 'range', min: 0.1, max: 1, step: 0.05, default: 0.45, hint: '손을 떼고 있을 때 조이스틱이 얼마나 보이나. 너무 옅으면 처음 하는 사람이 어디를 눌러야 할지 모르고, 진하면 화면을 가린다' },
    { key: 'useSafeArea', label: '세이프 에어리어 적용', type: 'toggle', default: true, hint: '끄면 HUD 기준이 화면 전체가 된다. 플로팅 조이스틱으로 왼쪽 끝을 누르면 받침이 노치 밑에 생기고, 오른쪽 버튼은 둥근 모서리 쪽으로 붙는다' },
    {
      key: 'device',
      label: '기기',
      type: 'select',
      default: 'phone',
      options: [
        { value: 'phone', label: '19.5:9 노치 폰' },
        { value: 'tablet', label: '4:3 태블릿' },
      ],
      hint: '배치는 세이프 에어리어 안의 비율로 저장돼 있어 기기를 바꿔도 같은 자리에 온다. 효과를 끄면 폰에서 잰 픽셀로 저장돼 태블릿에서 오른쪽 버튼이 화면 밖으로 나간다',
    },
    { key: 'showGuides', label: '안내선', type: 'toggle', default: true, hint: '세이프 에어리어(노란 점선) · 플로팅 시작 영역(초록) · 엄지가 편하게 닿는 범위(아래 모서리의 큰 원)' },
  ],
  presets: [
    {
      id: 'action-rpg',
      name: '액션 RPG',
      look: '플로팅 조이스틱, 섬세한 곡선. 오른손은 큰 공격 버튼 주위에 스킬을 호로',
      values: { stickMode: 'floating', deadzonePct: 12, radius: 120, curve: 'fine', idleOpacity: 0.45, useSafeArea: true, device: 'phone', showGuides: true },
    },
    {
      id: 'moba',
      name: 'MOBA',
      look: '늘 같은 자리의 고정 조이스틱(손이 위치를 외운다). 데드존 작게, 직선 반응으로 즉각적',
      values: { stickMode: 'fixed', deadzonePct: 8, radius: 110, curve: 'linear', idleOpacity: 0.7, useSafeArea: true, device: 'phone', showGuides: true },
    },
    {
      id: 'survivor',
      name: '서바이버 (한 손)',
      look: '움직이기만 하는 게임. 따라오는 조이스틱으로 화면 어디서든 방향을 크게 바꾼다',
      values: { stickMode: 'dynamic', deadzonePct: 16, radius: 90, curve: 'linear', idleOpacity: 0.25, useSafeArea: true, device: 'phone', showGuides: true },
    },
  ],
  events: [
    { id: 'demo', label: '이동하며 공격 (멀티터치)' },
    { id: 'edit', label: '배치 편집 켜기 / 끄기' },
    { id: 'reset-layout', label: '기본 배치' },
  ],
  hotspots: [
    {
      n: 1,
      part: 'stick',
      title: '데드존 · 반경 · 정규화',
      body: '받침 가운데에서 손가락까지의 거리를 **최대 반경으로 나눠 0~1** 로 만든다. 데드존 안은 0, 그 밖은 0~1 로 다시 펼치고, 반응 곡선을 지난 값이 캐릭터 속도가 된다. 손잡이는 받침 밖으로 나가지 않는다. 효과를 끄면 손잡이가 손가락을 따라 받침을 벗어나고, 멀리 끌수록 1을 넘어 계속 빨라진다.',
      principle: '즉각 피드백',
    },
    {
      n: 2,
      part: 'zone',
      title: '엄지가 닿은 곳에 생긴다',
      body: '플로팅 조이스틱은 왼쪽 아래 넓은 영역 **어디를 눌러도** 그 자리에 받침이 생긴다. 화면을 보느라 엄지 위치가 조금 어긋나도 놓치지 않는다. 쉬는 동안 옅게 보이는 받침은 "여기쯤 누르면 된다" 는 안내다.',
      principle: '어포던스',
      pin: 'inside',
    },
    {
      n: 3,
      part: 'buttons',
      title: '오른손은 큰 버튼 하나를 중심으로',
      body: '가장 자주 누르는 공격은 크게(지름 약 200px), 엄지가 쉬는 자리에 둔다. 스킬·회피는 그 둘레에 호로 놓아 엄지를 굴리기만 하면 닿게 한다. 아래 모서리의 큰 원이 엄지가 편하게 닿는 범위다. 작은 버튼도 손가락 크기(약 9mm — 이 무대의 노치 폰에서 지름 120px)보다 작게 만들지 않는다. 배치 편집의 최소 크기도 여기에 맞췄다.',
      principle: '접근성',
    },
    {
      n: 4,
      part: 'safe',
      title: '노치와 모서리를 피한다',
      body: '배경은 화면 끝까지 칠하고, **누르고 읽어야 하는 것만** 세이프 에어리어(노란 점선) 안에 둔다. 가로로 든 노치 폰은 왼쪽에 노치, 아래에 홈 표시줄이 있다. "세이프 에어리어 적용" 을 끄고 왼쪽 끝을 눌러 보자 — 받침이 노치 밑에 생긴다.',
      principle: '가독성',
      pin: 'inside',
    },
    {
      n: 5,
      part: 'touches',
      title: '손가락마다 따로 기억한다',
      body: '터치는 손가락마다 **포인터 ID** 가 다르다. 처음 누른 자리로 역할(조이스틱 · 공격 …)을 정해 두고, 그 ID 의 움직임만 그 역할에 보낸다. 그래서 이동 중에 공격해도 이동이 끊기지 않는다. 효과를 끄고 "이동하며 공격" 을 보면 두 번째 손가락이 조이스틱을 빼앗아 캐릭터가 멈춘다.',
      principle: '일관성',
      pin: 'right',
    },
  ],
  mistakes: [
    {
      title: '손가락 하나만 기억',
      body: 'Input.mousePosition 이나 "지금 눌린 터치 하나" 로 조이스틱을 만들면, 오른손으로 버튼을 누르는 순간 조이스틱 입력이 끊겨 캐릭터가 멈추거나 그쪽으로 튄다. 터치마다 ID 를 보고 역할을 고정한다.',
    },
    {
      title: '데드존 없음 · 정규화 없음',
      body: '엄지를 얹기만 해도 캐릭터가 미끄러지고, 멀리 끌수록 1을 넘는 값이 들어가 대각선이나 먼 거리에서 더 빨라진다. 크기를 1로 자르고 데드존 밖을 다시 0~1 로 펼친다.',
    },
    {
      title: '그려진 원 안만 인식',
      body: '고정 조이스틱의 판정을 그림 크기와 똑같이 두면, 화면을 보며 누르는 엄지는 자주 원 밖을 누른다. 판정은 그림보다 넉넉하게(1.5배), 아니면 플로팅으로.',
    },
    {
      title: '세이프 에어리어 무시',
      body: '에디터의 16:9 화면에서 맞춘 HUD 는 노치 폰에서 노치·둥근 모서리에 잘린다. Screen.safeArea 로 HUD 루트를 줄인다(배경은 그대로).',
    },
    {
      title: '배치를 픽셀로 저장',
      body: '플레이어가 옮긴 버튼 위치를 픽셀로 저장하면 다른 기기·회전에서 화면 밖으로 나간다. 세이프 에어리어 안의 비율로 저장하고, 크기는 손가락 기준이라 비율로 키우지 않는다.',
    },
  ],
  juiceOff:
    '흔한 실수를 한꺼번에 재현한다. 조이스틱이 고정형이고 그려진 원 안을 정확히 눌러야 시작된다. 데드존과 정규화가 없어 손잡이가 받침을 벗어나고 멀리 끌수록 계속 빨라진다(그래프가 1을 넘어 이어진다). 손가락을 하나만 기억해서 이동 중 공격하면 캐릭터가 멈춘다. 세이프 에어리어를 무시하고, 배치를 픽셀로 저장해 태블릿에서 버튼이 화면 밖으로 나간다.',
  timings: [
    { event: '손잡이 따라오기', ms: 0, easing: '즉시', note: '보간하지 않는다 — 입력 지연은 조작감을 바로 망친다' },
    { event: '손 뗀 뒤 받침 복귀', ms: 0, easing: '즉시', note: '권장값. 플로팅은 홈 자리에 옅게 다시 보인다' },
    { event: '버튼 눌림 표시', ms: 120, easing: '—', note: '크기 90% + 밝게. 눌렸다는 걸 엄지 밑에서도 알 수 있게 (진동이 있으면 함께)' },
    { event: '회피 대시', ms: 180, easing: 'linear', note: '재사용 대기 1.2초 — 버튼 위 회색 부채꼴' },
  ],
  unity: {
    ugui: {
      hierarchy: `Canvas_TouchHUD (Screen Space - Overlay · Canvas Scaler 1920×1080 · Match 0.5)
└─ SafeArea   (RectTransform 전체 늘이기 · SafeAreaFitter.cs)
   ├─ StickZone   (Image α0 · Raycast Target 켬 · 왼쪽 아래 45% 영역 · VirtualJoystick.cs · TouchLayoutItem id="stick")
   │  └─ Base     (Image 원 · CanvasGroup — 쉬는 동안 투명도 · 크기 = 반경 × 2)
   │     └─ Knob  (Image 원)
   ├─ Attack      (Image · OnScreenButton: <Gamepad>/buttonSouth · TouchLayoutItem.cs id="attack")
   ├─ Skill1      (… <Gamepad>/buttonWest · TouchLayoutItem id="skill1")
   ├─ Skill2      (… <Gamepad>/buttonNorth)
   └─ Dodge       (… <Gamepad>/buttonEast)
PlayerInput (Actions: Move = <Gamepad>/leftStick · Attack = <Gamepad>/buttonSouth …)
TouchLayoutEditor (TouchLayoutEditor.cs — 편집 켜기 · 저장 · 기본값 버튼에 연결)`,
      steps: [
        '`VirtualJoystick` 은 Input System 의 `OnScreenControl` 을 상속하고 `controlPath` 를 `<Gamepad>/leftStick` 으로 둔다. 손가락 이동을 0~1 벡터로 바꿔 `SendValueToControl` 하면, 패드용으로 짠 이동 코드가 **그대로** 터치로도 동작한다.',
        '`OnPointerDown` 에서 `eventData.pointerId` 를 기억하고, `OnDrag` · `OnPointerUp` 은 그 ID 일 때만 처리한다. 버튼은 같은 Canvas 의 다른 오브젝트라 다른 손가락이 동시에 누를 수 있다 (멀티터치는 EventSystem 이 손가락마다 따로 보낸다).',
        '플로팅이면 누른 곳으로 `Base` 를 옮기고(StickZone 안으로 제한), 손을 떼면 홈 자리로 되돌려 옅게 보인다. 데드존 · 반경 · 곡선은 인스펙터 값.',
        '`SafeAreaFitter` 가 `Screen.safeArea`(픽셀, 왼쪽 아래 원점)를 0~1 앵커로 바꿔 `SafeArea` 의 `anchorMin/Max` 에 넣는다. 화면 크기·회전이 바뀌면 다시 계산한다.',
        '배치 편집: `TouchLayoutItem` 은 위치를 **앵커 자체에 비율로** 둔다(`anchorMin = anchorMax = (nx, ny)`, `anchoredPosition = 0`). 그래서 SafeArea 크기가 회전·폴더블로 바뀌어도 같은 비율 자리를 지킨다. 편집 중에만 `IDragHandler` 로 옮겨지고, `TouchLayoutEditor` 가 그동안 입력 컴포넌트를 끈 뒤 끝나면 비율과 크기를 JSON 으로 `PlayerPrefs` 에 저장한다.',
      ],
      pitfalls: [
        '구 Input Manager 의 `Input.mousePosition`·`Input.GetTouch(0)` 으로 조이스틱을 만들면 손가락 순서가 바뀔 때 입력이 튄다. EventSystem 의 `pointerId` 또는 EnhancedTouch 의 `Touch.finger` 를 쓴다.',
        '`StickZone` Image 의 알파를 0으로 두어도 Raycast Target 은 켜 둔다(투명한 판정 영역). 반대로 Base · Knob 그림은 Raycast Target 을 꺼야 판정을 가로막지 않는다.',
        'Canvas Scaler 의 Match 값에 따라 같은 지름이 기기마다 다른 실제 크기가 된다. 손가락 크기는 물리 크기(약 9mm)가 기준이라, 태블릿에서 버튼이 너무 커지면 `Screen.dpi` 로 보정한다.',
        'OnScreenControl 은 **가상 게임패드**에 값을 보낸다. 그래서 터치 스틱을 움직이기만 해도 `PlayerInput` 은 "게임패드로 바뀌었다" 고 본다. 진짜 패드가 연결됐을 때만 HUD 를 숨기려면 `device.native` 가 true 인 장치만 보거나, 터치스크린과 게임패드를 한 컨트롤 스킴에 넣는다.',
      ],
    },
    uitk: {
      hierarchy: `UIDocument (Panel Settings: Scale With Screen Size 1920×1080)
└─ TouchHud.uxml
   └─ #safe-area (.safe-area — C# 가 padding 으로 세이프 에어리어를 넣는다)
      └─ #hud (.hud)
         ├─ #stick-zone (.stick-zone)
         │  └─ #stick-base (.stick-base — 크기는 C# 가 반경 × 2 로) > #stick-knob (.stick-knob)
         ├─ #btn-attack (.touch-btn .touch-btn--big)
         ├─ #btn-skill1 (.touch-btn)
         └─ #btn-dodge (.touch-btn)
VirtualJoystickUITK.cs (OnScreenControl 상속 — UI Toolkit 포인터 이벤트로 값을 보낸다)`,
      steps: [
        '`VirtualJoystickUITK` 도 `OnScreenControl` 을 상속한다(MonoBehaviour 라 UI Toolkit 과 함께 쓸 수 있다). `#stick-zone` 에 `PointerDownEvent` 를 걸고 `CapturePointer(pointerId)` — 그 손가락의 `PointerMoveEvent` · `PointerUpEvent` 만 받는다.',
        '받침·손잡이는 `style.translate` 로 옮긴다(레이아웃을 다시 계산하지 않아 가볍다). UI Toolkit 은 y 가 아래로 커지므로 스틱 값의 y 를 뒤집어 `SendValueToControl(Vector2)`.',
        '세이프 에어리어: `Screen.safeArea` 는 **왼쪽 아래 원점 픽셀**, UI Toolkit 은 **왼쪽 위 원점 패널 좌표**다. `RuntimePanelUtils.ScreenToPanel` 로 바꾸되 y 를 `Screen.height - y` 로 뒤집고, `#safe-area` 의 padding 으로 넣는다.',
        '버튼은 각각 `PointerDownEvent` 로 다른 손가락을 받는다 (UI Toolkit 도 손가락마다 pointerId 가 다르다).',
      ],
      pitfalls: [
        '`Button` 의 `clicked` 는 손을 뗄 때 불린다. 공격처럼 누르는 순간 반응해야 하는 버튼은 `PointerDownEvent` 를 쓴다.',
        '`CapturePointer` 를 하지 않으면 손가락이 `#stick-zone` 밖으로 나가는 순간 이동 이벤트가 끊긴다.',
        '세이프 에어리어 y 축을 뒤집지 않으면 홈 표시줄 여백이 위쪽에 들어간다.',
      ],
    },
  },
  inspiredBy: [],
  original:
    '탐사대원 캐릭터와 지표 격자, 기기 프레임(노치 폰 · 태블릿), 버튼 배치와 크기, 플로팅 시작 영역, 엄지 범위 안내, 입력 → 출력 그래프, 손가락 번호 표시, 배치 편집 도구는 모두 이 갤러리에서 새로 만들었다. 특정 게임의 화면을 재현하지 않고 모바일 액션 장르의 관례와 공개된 사용성 연구·Unity 문서를 바탕으로 정리했다.',
  references: [
    { label: 'Unity Input System — On-Screen Controls (OnScreenStick · OnScreenButton)', url: 'https://docs.unity3d.com/Packages/com.unity.inputsystem@1.8/manual/OnScreen.html' },
    { label: 'Unity 6.3 — Screen.safeArea', url: 'https://docs.unity3d.com/6000.3/Documentation/ScriptReference/Screen-safeArea.html' },
    { label: 'Unity Input System — OnScreenControl (직접 만드는 화면 컨트롤의 기반 클래스)', url: 'https://docs.unity3d.com/Packages/com.unity.inputsystem@1.8/api/UnityEngine.InputSystem.OnScreen.OnScreenControl.html' },
    { label: 'AIT — Investigating On-Screen Gamepad Designs for Smartphone-Controlled Games (논문)', url: 'https://publications.ait.ac.at/de/publications/investigating-on-screen-gamepad-designs-for-smartphone-controlled/' },
    { label: 'Game Accessibility Guidelines — 전체 목록 (조작 재배치 · 크기)', url: 'https://gameaccessibilityguidelines.com/full-list/' },
  ],
  related: [
    { id: 'skill-cooldown-prompt', why: '버튼 위 재사용 대기 표시와 입력 장치별 안내 — 이 표본의 회색 부채꼴을 자세히' },
    { id: 'settings-accessibility', why: '배치 편집을 담는 설정 화면 — 버튼 크기 · 투명도를 접근성 옵션으로' },
    { id: 'popup-queue-stack', why: '같은 기기 프레임 문제 — 창과 버튼 모두 세이프 에어리어 안에' },
  ],
}
