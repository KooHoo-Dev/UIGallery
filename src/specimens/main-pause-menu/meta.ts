import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'main-pause-menu',
  title: '메뉴 스택 + 포커스 이동 (메인 · 일시정지 메뉴)',
  titleEn: 'Focus-Navigated Menu Stack',
  group: 'D',
  order: 1,
  paradigms: ['menu'],
  oneLiner: '키보드·게임패드만으로 메뉴를 열고, 한 칸씩 들어갔다가 같은 버튼 하나로 한 칸씩 돌아오는 메뉴 스택. 연출 중 입력도 잃지 않는다',
  goals: [
    '메뉴를 **스택(push · pop · 맨 위 교체)** 으로 관리하고, 돌아왔을 때 **직전 포커스를 복원**할 수 있다',
    '화면에 포커스가 **늘 정확히 하나** 있도록 마우스 클릭·패널 전환·장치 교체 뒤에도 선택 대상을 지킬 수 있다',
    '전환 연출 중 들어온 입력을 **입력 버퍼**에 담았다가 하나씩 **소비**해, 연타해도 한 칸 이상 넘어가지 않게 만들 수 있다',
    '하단 안내 바를 **마지막 입력 장치**에 맞춰 바꾸고, 숙련자용 단축키는 기본 경로를 줄여 주는 덤으로만 둘 수 있다',
  ],
  principles: ['일관성', '즉각 피드백', '시각 위계', '인지 부하', '어포던스', '접근성'],
  platforms: ['pc', 'console'],
  inputs: ['keyboard', 'gamepad', 'mouse'],
  genres: ['액션 RPG', 'JRPG', '액션', '공통'],
  difficulty: 2,
  stage: { aspect: '16:9', backdrop: 'none' },
  params: [
    {
      key: 'transitionStyle',
      label: '전환 방식',
      type: 'select',
      default: 'slide',
      options: [
        { value: 'slide', label: '밀어 넣기' },
        { value: 'fade', label: '제자리 교체 (페이드)' },
        { value: 'cut', label: '즉시 (컷)' },
      ],
      hint: '하위 메뉴 진입·복귀 연출. 밀어 넣기는 들어온 방향의 반대로 빠진다. 컷이면 전환 시간은 무시된다',
    },
    { key: 'transitionMs', label: '전환 시간', type: 'range', min: 0, max: 600, step: 20, default: 220, unit: 'ms', hint: '하위 패널 push 길이. 뒤로(pop)는 70%, 열기는 90%, 페이지 전환은 65%. 400ms 를 넘기면 연타할 때 버퍼가 쌓이는 게 보인다' },
    { key: 'skewDeg', label: '패널 기울기', type: 'range', min: 0, max: 20, step: 1, default: 12, unit: '°', hint: '패널·포커스 막대의 사선 각도. 글자는 기울이지 않는다 (스타일은 틀에만, 본문은 반듯하게)' },
    {
      key: 'focusStyle',
      label: '포커스 표시',
      type: 'select',
      default: 'guide-line',
      options: [
        { value: 'guide-line', label: '반전 막대 + 시선 유도선' },
        { value: 'highlight-bar', label: '배경 막대만' },
        { value: 'weight-only', label: '글자 굵기만' },
      ],
    },
    {
      key: 'panelTheme',
      label: '패널 배색',
      type: 'select',
      default: 'dark',
      options: [
        { value: 'dark', label: '짙은 남색' },
        { value: 'paper', label: '저채도 종이' },
        { value: 'mono', label: '흑백 고대비' },
      ],
      hint: '흑백 고대비는 강조색도 흰색으로 고정한다',
    },
    { key: 'accentColor', label: '강조색', type: 'color', default: '#c6ff3d', hint: '포커스 막대·유도선·브레드크럼 끝 칸. 대화창·결과 화면 표본과 같은 이름' },
    {
      key: 'inputDevice',
      label: '입력 안내',
      type: 'select',
      default: 'auto',
      options: [
        { value: 'auto', label: '자동 (마지막 입력 장치)' },
        { value: 'keyboard', label: '키보드 고정' },
        { value: 'gamepad', label: '게임패드 고정' },
      ],
    },
    { key: 'rememberFocus', label: '뒤로가기 때 포커스 기억', type: 'toggle', default: true, hint: '끄면 하위 메뉴에서 돌아올 때마다 첫 항목으로 돌아가는 나쁜 예' },
    {
      key: 'busyInput',
      label: '전환 중 입력',
      type: 'select',
      default: 'buffer',
      options: [
        { value: 'buffer', label: '버퍼 후 적용 (권장)' },
        { value: 'drop', label: '버림' },
        { value: 'leak', label: '이전 패널이 받음 (버그)' },
      ],
      hint: '"깊이 3에서 뒤로가기 4연타"로 비교. 버림은 눌렀는데 안 먹고, 이전 패널이 받으면 같은 패널이 두 번 열리거나 닫힌 메뉴가 다시 열린다',
    },
  ],
  presets: [
    {
      id: 'stylish-guided',
      name: '스타일리시 시선 유도형',
      look: '기울어진 패널이 밀려 들어오고, 반전 막대에서 뻗은 유도선이 다음 볼 곳을 가리킨다. 메뉴 자체가 연출의 주인공',
      values: { transitionStyle: 'slide', transitionMs: 220, skewDeg: 14, focusStyle: 'guide-line', panelTheme: 'dark', accentColor: '#c6ff3d', inputDevice: 'auto', rememberFocus: true, busyInput: 'buffer' },
    },
    {
      id: 'quiet-system',
      name: '절제된 시스템 화면형',
      look: '반듯한 저채도 종이색 화면에서 내용만 제자리에서 바뀌고, 색 대신 글자 굵기로 포커스와 위계를 나눈다',
      values: { transitionStyle: 'fade', transitionMs: 140, skewDeg: 0, focusStyle: 'weight-only', panelTheme: 'paper', accentColor: '#a4533a', inputDevice: 'auto', rememberFocus: true, busyInput: 'buffer' },
    },
    {
      id: 'instant-accessible',
      name: '즉시 반응 접근성형',
      look: '모션 없이 즉시 바뀌고 굵은 흑백 막대로 포커스를 보여 준다. 모션 감소 설정 사용자를 위한 기준선 — 컷이어도 위치 표시·포커스 복원으로 길을 잃지 않는다',
      values: { transitionStyle: 'cut', transitionMs: 0, skewDeg: 0, focusStyle: 'highlight-bar', panelTheme: 'mono', accentColor: '#ffffff', inputDevice: 'auto', rememberFocus: true, busyInput: 'buffer' },
    },
  ],
  events: [
    { id: 'move_focus', label: '포커스 아래로' },
    { id: 'confirm', label: '확인 (한 칸 들어가기)' },
    { id: 'page_next', label: '단축키 Q/E: 옆 카테고리' },
    { id: 'mash_back', label: '깊이 3에서 뒤로가기 4연타' },
    { id: 'click_empty', label: '빈 곳 클릭 → 방향 입력' },
    { id: 'to_title', label: '타이틀로 (확인 두 번 연타)' },
  ],
  hotspots: [
    {
      n: 1,
      part: 'guide-line',
      title: '선과 기울기로 "다음에 볼 곳"을 가리킨다',
      body: '포커스 막대에서 출발한 선이 꺾여서 다음 정보(루트에서는 하위 패널 미리보기, 하위 메뉴에서는 설명 카드)로 이어진다. 선은 장식이 아니라 내비게이션 단서라서 **늘 포커스 항목에서 출발**한다. 패널은 기울여도 글자는 반듯하게 둔다. 포커스 표시를 "글자 굵기만"으로 바꿔 보면 색과 선 없이도 굵기·진하기만으로 위계가 읽히는지 비교할 수 있다.',
      principle: '시각 위계',
    },
    {
      n: 2,
      part: 'breadcrumb',
      title: '뒤로가기는 한 입력, 한 칸',
      body: '어느 깊이에서든 **같은 입력 하나(Esc · 오른쪽 버튼)** 가 스택에서 딱 한 칸만 꺼내고, 스택 바닥에서만 메뉴를 닫는다. 돌아오면 **들어가기 전 항목에 포커스**가 있고, 패널은 들어온 반대 방향으로 빠진다. 위치 표시(일시정지 › 장비 › 주 무기)가 "지금 누르면 어디로 가는지"를 미리 알려 준다. "뒤로가기 때 포커스 기억"을 끄고 비교해 보자.',
      principle: '일관성',
    },
    {
      n: 3,
      part: 'input-buffer',
      title: '반응이 먼저, 연출 중 입력은 버퍼로',
      body: '첫 입력은 **누른 그 프레임**에 감광막·패널 골격으로 반응한다. 연출(약 0.2초) 중에 들어온 입력은 버리지 않고 **입력 버퍼**에 담았다가 연출이 끝나면 하나씩 적용한다 — **한 입력은 한 단계만 소비**. 메뉴가 닫히면 남은 입력은 버리고 0.25초 **입력 잠금**을 걸어, 연타하던 Esc 가 메뉴를 다시 여는 일을 막는다. "깊이 3에서 뒤로가기 4연타"를 "전환 중 입력"의 세 값으로 비교해 보자.',
      principle: '즉각 피드백',
    },
    {
      n: 4,
      part: 'page-tabs',
      title: '두 버튼이면 다 되고, 단축키는 덤',
      body: '방향 입력과 확인·뒤로 두 버튼만으로 모든 패널에 갈 수 있다. **Q/E(숄더 버튼)** 는 깊이를 그대로 둔 채 맨 위 패널만 옆 카테고리로 바꿔 "뒤로 → 아래 → 확인" 세 번을 한 번으로 줄여 준다. 단축키로만 갈 수 있는 화면을 만들면 단축키를 모르는 초심자는 영영 못 간다.',
      principle: '인지 부하',
    },
    {
      n: 5,
      part: 'hint-bar',
      title: '손에 든 장치의 말로 안내한다',
      body: '키보드를 만지면 키캡, 게임패드를 만지면 패드 버튼 위치 도식으로 안내 바가 **바로** 바뀐다. 포커스와 메뉴 위치는 그대로, 글리프만 짧게 크로스페이드한다. 글리프 자리는 폭을 고정해 안내 문구가 옆으로 튀지 않게 한다. 버튼은 특정 콘솔 기호 대신 **위치(아래·오른쪽)** 로만 표기한다. (두 참고 게임의 출처로 확인한 것이 아니라 업계에서 흔히 쓰는 패턴)',
      principle: '어포던스',
    },
  ],
  mistakes: [
    { title: '마우스 클릭 뒤 키보드·패드가 먹통', body: '빈 곳을 클릭하면 선택이 풀려(`EventSystem` 의 선택 대상이 null) 그 뒤 방향 입력이 갈 곳을 잃는다. 선택이 풀리거나 장치가 바뀌면 **마지막으로 선택했던 항목을 다시 선택**한다. "빈 곳 클릭 → 방향 입력"을 효과 끄기 상태에서 눌러 보자.' },
    { title: '연타한 뒤로가기가 메뉴를 다시 연다 (입력 관통)', body: '닫힘 연출 중에 들어온 Esc 가 게임 쪽 "일시정지"로 처리돼 메뉴가 닫히자마자 다시 열린다. 메뉴가 닫히면 **남은 입력은 버리고 짧게 잠근다**. 일시정지(Player 맵)와 뒤로(UI 맵)를 액션 맵으로 나눠 한 입력이 두 곳에서 처리되지 않게 한다.' },
    { title: '돌아오면 포커스가 맨 위로', body: '하위 메뉴에서 나올 때마다 첫 항목으로 가면 다시 내려가야 한다. 스택 칸마다 마지막 포커스를 들고 있다가 pop 할 때 복원한다.' },
    { title: '전환 중 입력을 버리거나, 이전 패널이 받는다', body: '버리면 "눌렀는데 안 먹는" 답답함이 생기고, 막지 않으면 사라지는 중인 이전 패널이 확정을 받아 **같은 패널이 두 번 push** 된다. 전환 중에는 이전 패널의 상호작용을 끄고 입력은 버퍼에 담는다.' },
    { title: '위험한 확인 창의 기본 포커스가 "확인"', body: '확정 버튼을 습관적으로 두 번 누르면 진행이 날아간다. 되돌릴 수 없는 일을 묻는 창은 **기본 포커스를 취소**에 두고, 창이 뜬 직후 0.3초는 확정 입력을 잠근다.' },
  ],
  juiceOff:
    '모든 전환이 즉시 컷이고 기울기·유도선·순차 등장·엠블럼·위치 표시가 사라진다. 맨 위 패널 하나만 보여 **어디서 왔는지** 알 수 없고, 포커스는 글자색이 아주 살짝 바뀔 뿐이다. 돌아오면 포커스가 맨 위로 가고, 빈 곳을 클릭하면 선택이 풀려 방향키가 먹지 않는다. 안내 바는 "Enter: 확인"으로 고정돼 게임패드를 잡아도 그대로다. 닫힌 직후 입력 잠금이 없어 **뒤로가기 연타가 메뉴를 다시 열고**, 확인 창의 기본 포커스가 "타이틀로"라 확인 연타 한 번에 진행이 날아간다.',
  timings: [
    { event: '일시정지 입력 → 첫 시각 반응', ms: 0, easing: 'none', note: '누른 프레임에 감광막·패널 골격. 메뉴 GUI 데이터를 상주 메모리에 두어 지연 없이 띄웠다는 개발자 발언의 원리' },
    { event: '메뉴 열림 (패널 + 항목 순차 등장)', ms: 200, easing: 'easeOutCubic', note: '권장값. 전환 시간 × 0.9. 항목 간격 30ms' },
    { event: '엠블럼 회전 후 정지', ms: 360, easing: 'easeOutBack', note: '권장값. 입력을 막지 않는 장식 레이어' },
    { event: '포커스 이동 (막대·유도선)', ms: 90, easing: 'easeOutQuart', note: '권장값. 길게 누를 때 반복 간격(0.12초)보다 짧게. 포커스 이동은 전환으로 치지 않아 버퍼를 거치지 않는다' },
    { event: '하위 메뉴 push', ms: 220, easing: 'easeOutCubic', note: '권장값(전환 시간 기본값). 이 동안 들어온 입력은 버퍼' },
    { event: '옆 카테고리 (페이지 전환)', ms: 140, easing: 'easeOutCubic', note: '권장값. 같은 깊이 안의 교체라 push 보다 짧게' },
    { event: '뒤로가기 pop', ms: 154, easing: 'easeInCubic', note: '권장값(전환 시간 × 0.7). 돌아갈 때는 들어갈 때보다 짧게' },
    { event: '메뉴 닫힘 + 입력 잠금', ms: 143, easing: 'easeInQuad', note: '권장값(× 0.65). 닫힌 뒤 250ms 입력 잠금' },
    { event: '확인 창 확정 입력 잠금', ms: 300, easing: '—', note: '권장값. 공통 용어 "입력 잠금" (0.2~0.4초)' },
    { event: '안내 바 글리프 교체', ms: 120, easing: 'linear', note: '권장값. 크로스페이드, 고정 폭 자리' },
  ],
  unity: {
    ugui: {
      hierarchy: `PauseCanvas (Canvas: Overlay · Sort Order 100 · CanvasScaler 1920×1080 · GraphicRaycaster · CanvasGroup)
│  └ PauseController.cs · MenuStack.cs · MenuInputBuffer.cs · MainPauseMenuDemo.cs
├─ BackdropDim (Image 검정 α0.6 — 뒤 게임 클릭 차단)
├─ Emblem (Image · EmblemSpin.cs · Raycast Target 끔)
├─ Panels
│  ├─ RootPanel (CanvasGroup · MenuPanel.cs)
│  │  ├─ PanelShape (Image: 사선 모서리 Sprite)
│  │  ├─ FocusBar (Image)            ← Items 의 형제 (레이아웃 밖)
│  │  └─ Items (VerticalLayoutGroup)
│  │     └─ Item_Resume … Item_Title (Button · MenuItemView.cs)
│  │        └─ Content (CanvasGroup · TextMeshProUGUI)   ← 순차 등장 대상
│  ├─ EquipPanel · RecordsPanel · SettingsPanel (같은 구조 · 처음엔 꺼짐)
│  └─ ConfirmDialog (CanvasGroup · MenuPanel.cs[overlay] · ConfirmDialog.cs · 버튼: 취소 · 타이틀로)
├─ InfoCard (Image · TextMeshProUGUI)
├─ GuideLine (GuideLine.cs) · SegA · SegB · SegC · EndMark (Image · Raycast Target 끔)
└─ HintBar (InputHintBar.cs)
   ├─ Breadcrumb (TextMeshProUGUI)
   ├─ KeyboardHints (CanvasGroup · HorizontalLayoutGroup · 글리프 자리 폭 고정)
   └─ GamepadHints (CanvasGroup · HorizontalLayoutGroup)
TitleCanvas (CanvasGroup · MenuStack.cs — 버퍼는 PauseCanvas 의 것 하나를 바꿔 끼움) └─ TitlePanel (MenuPanel.cs · 이어하기 · 새 탐사 · 나가기)
EventSystem (EventSystem · InputSystemUIInputModule)`,
      steps: [
        'Project Settings › Player › Active Input Handling 을 **Input System Package (New)** 로 둔다. InputActionAsset 에 **Player 맵**(Pause: Esc · Start)과 **UI 맵**(Navigate · Submit · Cancel · Close · PrevPage/NextPage: Q/E · 숄더)을 만든다.',
        'EventSystem 의 StandaloneInputModule 을 **InputSystemUIInputModule** 로 바꾸고 위 에셋을 연결한다.',
        '각 패널에 `MenuPanel` (CanvasGroup + firstSelected) 을 붙인다. Button 의 Navigation 은 **Vertical + Wrap Around** 로 — 기울어진 배치에서 Automatic 은 엉뚱한 이웃을 고른다.',
        '`MenuStack.Push(panel)` 은 지금 선택을 스택 칸에 저장하고 이전 패널의 `interactable` 을 끈 뒤 새 패널을 연다. `Pop()` 은 반대로 저장해 둔 선택을 복원한다. `ReplaceTop()` 은 깊이를 그대로 두고 맨 위만 바꾼다 (Q/E).',
        '입력은 버튼마다 흩지 말고 `MenuInputBuffer` 한 곳으로 모은다. 전환 중(`MenuStack.IsBusy`)이면 큐에 넣고, 전환이 끝난 프레임에 하나만 꺼내 적용한다.',
        '`PauseController` 가 열 때 `Time.timeScale = 0` + 액션 맵을 UI 로, 닫을 때 반대로 바꾼다. 닫힐 때 버퍼를 비우고 0.25초 잠근다.',
        '`InputHintBar` 는 `InputSystem.onActionChange` 에서 마지막 장치를 읽어 글리프 묶음을 바꾸고, 이때 선택이 null 이면 마지막 항목을 다시 선택한다. 브레드크럼도 `MenuStack.Changed` 에서 갱신한다.',
        '확인 창은 `MenuPanel.overlay` 를 켠 스택 한 칸이다. `firstSelected` 를 **취소** 버튼에 두고, `ConfirmDialog.onConfirmed` 에 `PauseController.GoToTitle` 을 연결한다. 타이틀의 이어하기는 `ContinueFromTitle`.',
        '`MainPauseMenuDemo.cs` 를 붙이면 갤러리와 같은 숫자키(1~6)로 이벤트를 시험할 수 있다.',
      ],
      pitfalls: [
        '`Time.timeScale = 0` 이면 `WaitForSeconds` · `Time.deltaTime` 기반 연출이 멈춘다. 메뉴 연출은 `unscaledDeltaTime` · `WaitForSecondsRealtime`, Animator 는 Update Mode 를 **Unscaled Time** 으로.',
        '`SetActive(true)` 직후 같은 프레임에 `Select()` 하면 하이라이트가 안 보일 때가 있다. `yield return null` 뒤에 선택한다.',
        'Esc 가 Player 맵 Pause 와 UI 맵 Cancel 에 함께 있으면 열자마자 닫히거나 두 칸씩 pop 된다. 열고 닫을 때 **액션 맵을 바꿔** 한쪽만 켠다.',
        'LayoutGroup 자식의 위치를 코드로 움직이면 다음 레이아웃 갱신 때 덮어써진다. 포커스 막대·유도선은 레이아웃 밖 형제로, 순차 등장은 안쪽 Content 에 건다.',
        '패널 CanvasGroup 의 `interactable` 을 끄지 않으면 뒤에 깔린 패널로 포커스가 샌다 — 전환 중 "같은 패널 두 번 push" 버그의 원인.',
        '같은 액션(submit)을 구독하는 `MenuInputBuffer` 가 **둘이면 한 입력이 두 번 소비**된다 — 확인 창 "타이틀로"의 Enter 가 막 열린 타이틀의 "이어하기"까지 실행해 곧바로 되돌아온다. 버퍼는 하나만 두고 `SetStack` 으로 대상 메뉴를 바꾼다. 막 연 프레임의 입력도 버린다(`OpenedFrame`).',
        '`MenuInputBuffer` 가 방향·확정을 직접 처리하므로 `EventSystem.sendNavigationEvents` 를 끈다. 켜 두면 모듈과 스크립트가 같은 입력을 **두 번** 처리해 한 번 누름에 두 칸 움직인다.',
        '`FindObjectOfType` 는 6.3 에서 obsolete. 참조는 인스펙터로 연결하고, 꼭 찾아야 하면 `FindAnyObjectByType` 을 Awake 에서 한 번만.',
      ],
    },
    uitk: {
      hierarchy: `UIDocument (Panel Settings: Scale With Screen Size 1920×1080) + PauseMenuUITK.cs (+ PauseMenuUITKDemo.cs)
└─ PauseMenu.uxml
   ├─ #pause-root.pause-root  (← .hidden · .device-gamepad · .pause-root--popping)
   │  ├─ #backdrop · Label #breadcrumb · #emblem (picking-mode Ignore)
   │  ├─ #panel-root.menu-panel      > Label.panel-title · Button.menu-item ×5
   │  ├─ #panel-equip · #panel-records · #panel-settings (.menu-panel--offscreen) > Button.menu-item ×4
   │  ├─ #dialog.dialog-scrim.hidden > Button #dlg-cancel · Button #dlg-ok
   │  └─ #hint-bar > .hint ×4 (Label.glyph.key-only · Label.glyph.pad-only · Label.hint-text)
   └─ #title-root.title-root.hidden > 로고 · .menu-panel--title > #title-continue · #title-new · #title-quit`,
      steps: [
        'PanelSettings 를 Scale With Screen Size 1920×1080 으로 두고 UIDocument 에 연결한다. Unity 6 에서는 **프로젝트 전역 액션의 UI 맵**이 UI Toolkit 내비게이션(Navigate · Submit · Cancel)으로 바로 들어온다.',
        '`OnEnable` 에서 `Q()` 로 패널과 버튼을 찾고, `Button.clicked` 에 Push 를 연결한다 (Submit 입력에도 clicked 가 발생한다).',
        '루트에 `RegisterCallback<NavigationCancelEvent>` 로 Pop 을 한 곳에만 연결한다. 버튼마다 따로 두지 않는다.',
        'Push 할 때 `focusController.focusedElement` 를 스택 칸에 저장하고, 새 패널의 `.offscreen` 클래스를 뗀 뒤 `schedule.Execute` 로 **다음 프레임에** 대상 항목 `Focus()`.',
        '전환 중에는 이전 패널에 `SetEnabled(false)` 를 걸고, Submit · Cancel 은 큐에 담았다가 전환이 끝나면 하나씩 처리한다.',
        'Q/E 는 내비게이션 이벤트에 없으므로 `InputAction.performed` 를 구독해 맨 위 패널만 교체한다.',
        '마지막 장치는 `InputSystem.onActionChange` 로 읽어 루트의 `.device-keyboard` / `.device-gamepad` 클래스를 바꾼다. 글리프는 USS 에서 클래스별로 보인다.',
      ],
      pitfalls: [
        'USS 변형은 translate · rotate · scale 뿐이고 **skew 가 없다**. 사선 패널은 사선 모양 배경 이미지나 `generateVisualContent` + `Painter2D` 로 그린다.',
        '`display: none` 은 트랜지션되지 않는다. 숨길 때는 `opacity` + `visibility`, 마우스 통과는 UXML `picking-mode="Ignore"` (USS 속성이 아니다).',
        '방금 보이게 만든 요소의 클래스를 같은 프레임에 바꾸면 트랜지션 없이 튄다. 한 프레임 뒤(`schedule.Execute`)에 바꾼다.',
        '숨겨진 패널 안 Button 의 `Focus()` 는 무시된다. 보이게 만든 다음 프레임에 부른다.',
        'Unity 6 의 UI 맵 Cancel(Esc)은 늘 켜져 있다. 일시정지용 `pauseAction`(Esc)도 켜 두면 연 순간의 Esc 가 Cancel 로도 들어가 곧바로 닫힐 수 있다. 열 때 `pauseAction` 을 끄고 닫은 **다음 프레임**에 켜며, 연 프레임의 입력은 버린다.',
        '포커스 계산에 `focusController.focusedElement` 를 쓰면 `Focus()` 가 다음 프레임에 반영되는 탓에 같은 프레임의 두 번째 방향 입력이 같은 칸을 고른다. 스택 칸에 적어 둔 인덱스를 기준으로 삼는다.',
        '빈 곳 클릭으로 포커스가 사라지면 패드 입력이 갈 곳을 잃는다. 루트의 `PointerDownEvent` 에서 마지막 포커스를 다시 `Focus()` 한다.',
        'USS 트랜지션이 `Time.timeScale` 의 영향을 받는지는 매뉴얼에 적혀 있지 않다. 일시정지 중 동작을 **강사가 Play 모드에서 직접 확인**한다.',
      ],
    },
  },
  inspiredBy: [
    {
      title: 'Persona 5 Royal (2019)',
      credit: '© ATLUS © SEGA',
      borrowed: ['형태 · 기울기', '모션 리듬'],
      learned:
        '메뉴를 조용한 배경이 아니라 **주인공**으로 끌어올리면서도, 메뉴 데이터를 상주 메모리에 둬 **입력 즉시** 뜨게 해 연출과 반응성을 함께 잡은 사례. 선과 각도 변화로 탐색 중 시선과 현재 위치를 안내한다는 개발자 패널 설명을 "포커스에서 다음 볼 곳으로 꺾이는 유도선"으로 일반화했다. 근거는 원작(2016) 개발자 발언이며 Royal 판이 같은 체계를 잇는다는 전제다. 실제 화면의 선 위치·전환 방향은 확인하지 못했다(미확인). 빨강·흑백 배색, 오려 붙인 글자, 캐릭터 포즈, 긴 삼각형 버튼은 빌리지 않았다.',
      link: 'https://personacentral.com/persona-5-panel-concept-development-ui/',
    },
    {
      title: 'NieR:Automata (2017)',
      credit: '© 2017 SQUARE ENIX CO., LTD. All Rights Reserved. / PlatinumGames Inc.',
      borrowed: ['색 체계', '타이포 성격'],
      learned:
        '저채도 단색 바탕에서 색 대신 **글자 굵기·진하기**로 위계를 나누고, 모든 기능을 스틱 + 두 버튼으로 쓰게 한 뒤 숙련자용 단축키(카테고리 이동)를 따로 둔 해법 — 디자이너 본인의 공식 블로그 기준. "절제된 시스템 화면형" 프리셋에 반영했다. 볼록 모니터 왜곡·격자 질감, 악보 기호 장식, 원작 레이아웃은 빌리지 않았다.',
      link: 'https://www.platinumgames.com/official-blog/article/9624',
    },
  ],
  original:
    '메뉴 문구(이어하기·장비·기록·설정·타이틀로)와 하위 구성(장비 4종·기록·설정 4종, 깊이 3 선택 목록), 세계관(외곽 탐사대·정비 기지·통신탑), 짧은 타이틀 화면, 짙은 남색 + 형광 라임 배색, SVG 다면체 엠블럼은 모두 새로 만들었다. 유도선은 화면 중심선이 아니라 **포커스 항목에서 다음 정보로 꺾여 이어지는 선**으로 다시 설계했고, 패널이 깊어질수록 왼쪽으로 한 칸씩 밀리고 바닥 칸은 세로 띠로 남는 **공간 지도**, 브레드크럼, 포커스 기억 토글, 전환 중 입력 처리 3종 비교(버퍼·버림·새어 나감), 닫힌 뒤 입력 잠금, 확인 창 기본 포커스, 빈 곳 클릭 뒤 포커스 유지, 상태 디버그 오버레이는 교육용으로 새로 넣었다. 입력 글리프는 갤러리 공통 중립 도식이다.',
  references: [
    { label: 'Persona 5 개발자 패널: 콘셉트와 UI (CEDEC+KYUSHU 2017 보도, Persona Central)', url: 'https://personacentral.com/persona-5-panel-concept-development-ui/' },
    { label: 'Persona 5 아트 디렉터 인터뷰: UI 디자인 (Famitsu 번역, Persona Central)', url: 'https://personacentral.com/persona-5-interview-ui-design-sound-music/' },
    { label: 'UI Design in NieR:Automata (PlatinumGames 공식 블로그)', url: 'https://www.platinumgames.com/official-blog/article/9624' },
    { label: '『NieR:Automata』のUIデザイン (PlatinumGames 일본어 개발 블로그)', url: 'https://www.platinumgames.co.jp/dev-nier-automata/article/183' },
    { label: 'Unity Input System — UI support (InputSystemUIInputModule)', url: 'https://docs.unity3d.com/Packages/com.unity.inputsystem@1.14/manual/UISupport.html' },
    { label: 'uGUI 2.0 — Navigation (wrapAround)', url: 'https://docs.unity3d.com/Packages/com.unity.ugui@2.0/api/UnityEngine.UI.Navigation.html' },
    { label: 'Unity 6.3 Manual — UI Toolkit focus order', url: 'https://docs.unity3d.com/6000.3/Documentation/Manual/UIE-focus-order.html' },
    { label: 'Unity 6.3 Manual — USS transitions', url: 'https://docs.unity3d.com/6000.3/Documentation/Manual/UIE-Transitions.html' },
  ],
  related: [
    { id: 'settings-accessibility', why: '스택 위에 올라가는 설정 화면 — 좌우 값 변경과 기본 포커스 "취소" 확인 창을 같은 규칙으로' },
  ],
}
