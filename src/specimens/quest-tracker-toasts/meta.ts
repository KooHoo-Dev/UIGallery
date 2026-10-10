import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'quest-tracker-toasts',
  title: '퀘스트 트래커 + 알림 큐',
  titleEn: 'Quest Tracker & Toast Queue',
  group: 'C',
  order: 1,
  paradigms: ['non-diegetic'],
  oneLiner: '추적 중인 목표는 한자리에 고정하고, 몰려드는 획득 알림은 큐에 넣어 슬롯·병합·우선순위 규칙대로 차례로 보여 준다',
  goals: [
    '고정 정보(트래커)와 일시 정보(토스트)를 **화면 영역과 수명**으로 나누는 이유를 설명할 수 있다',
    '알림을 바로 그리지 않고 **큐**에 넣은 뒤 **슬롯 수 · 표시 시간 · 우선순위 · 같은 키 병합** 네 규칙으로 꺼내는 로직을 설계할 수 있다',
    '목표 진행(3/5 → 4/5)을 숫자만 바꾸지 않고 **바뀐 행만 짧게 강조**해 알릴 수 있다',
    '큐 로직을 뷰와 분리해 Unity **UGUI와 UI Toolkit에서 같은 큐 클래스**를 재사용할 수 있다',
  ],
  principles: ['인지 부하', '시각 위계', '즉각 피드백', '일관성', '접근성'],
  platforms: ['pc', 'console', 'mobile'],
  inputs: ['keyboard', 'gamepad', 'touch'],
  genres: ['루트 슈터', '오픈월드 RPG', '액션 RPG', '공통'],
  difficulty: 2,
  stage: { aspect: 'both', backdrop: 'none' },
  params: [
    { key: 'maxVisible', label: '동시 표시 슬롯 수', type: 'range', min: 1, max: 5, step: 1, default: 3, unit: '개', hint: '한 번에 보이는 토스트 수. 줄이면 화면은 덜 가리지만 "+N 대기"가 길어진다' },
    { key: 'displayMs', label: '기본 표시 시간', type: 'range', min: 1500, max: 15000, step: 500, default: 3500, unit: 'ms', hint: '카드 한 장이 머무는 시간 (카드 아래 막대가 줄어든다). 희귀는 ×1.3, 전설은 ×1.6. 읽는 속도가 느린 사람을 위해 크게 늘릴 수 있게 둔다' },
    { key: 'mergeWindowMs', label: '병합 창', type: 'range', min: 0, max: 3000, step: 250, default: 1500, unit: 'ms', hint: '같은 아이템 알림을 한 장으로 합치는 시간 창. 0이면 병합하지 않아 같은 문구가 줄줄이 쌓인다' },
    {
      key: 'priorityMode',
      label: '큐 정렬 방식',
      type: 'select',
      default: 'priority',
      options: [
        { value: 'fifo', label: '도착 순' },
        { value: 'priority', label: '등급 순' },
        { value: 'priority-preempt', label: '등급 순 + 선점' },
      ],
      hint: '도착 순: 온 순서대로. 등급 순: 대기열에서 높은 등급부터. 선점: 표시 중인 낮은 등급 카드를 밀어내고 바로 끼어든다',
    },
    {
      key: 'trackerMode',
      label: '트래커 형태',
      type: 'select',
      default: 'multi-list',
      options: [
        { value: 'multi-list', label: '목록형 (우상단)' },
        { value: 'single-focus', label: '단일 목표형 (좌상단)' },
      ],
      hint: '목록형은 추적 중인 임무와 목표를 모두 펼친다. 단일 목표형은 지금 할 일 한 줄만 남겨 화면을 덜 가린다',
    },
    {
      key: 'stackAnchor',
      label: '토스트 위치·방향',
      type: 'select',
      default: 'left-up',
      options: [
        { value: 'left-up', label: '왼쪽 · 위로 쌓기' },
        { value: 'right-down', label: '오른쪽 · 아래로 쌓기' },
        { value: 'bottom-center-up', label: '아래 가운데 · 위로 쌓기' },
      ],
      hint: '16:9에서 목록형 트래커와 "오른쪽"을 함께 고르면 둘이 겹치는 나쁜 예를 볼 수 있다',
    },
    { key: 'progressFlash', label: '진행 갱신 하이라이트', type: 'toggle', default: true, hint: '끄면 목표 수치가 연출 없이 숫자만 바뀐다. "잔해 드론 처치"를 눌러 비교해 보자' },
    { key: 'freezeOnPause', label: '일시정지 중 알림 멈춤', type: 'toggle', default: true, hint: '끄면 일시정지 메뉴 뒤에서도 타이머가 흘러, 돌아왔을 때 알림이 이미 사라져 있다' },
  ],
  presets: [
    {
      id: 'dense-looter',
      name: '고밀도 루트 슈터형',
      look: '여러 임무를 펼친 목록이 우상단에 고정되고, 왼쪽에서는 획득 알림 4장이 빠르게 흐른다. 병합과 등급 정렬 덕분에 중요한 것이 먼저 보인다',
      values: { maxVisible: 4, displayMs: 3000, mergeWindowMs: 1500, priorityMode: 'priority', trackerMode: 'multi-list', stackAnchor: 'left-up', progressFlash: true, freezeOnPause: true },
    },
    {
      id: 'narrow-single-focus',
      name: '좁은 화면 단일 목표형',
      look: '지금 할 일 한 줄만 좌상단에, 알림은 오른쪽에 2장만 짧게. 병합 창을 넓혀 연달아 줍는 재료를 한 장으로 묶는다. 9:16 무대에서 차이가 가장 잘 보인다',
      values: { maxVisible: 2, displayMs: 2500, mergeWindowMs: 2000, priorityMode: 'priority', trackerMode: 'single-focus', stackAnchor: 'right-down', progressFlash: true, freezeOnPause: true },
    },
    {
      id: 'relaxed-readable',
      name: '읽기 여유형 (접근성)',
      look: '표시 시간을 크게 늘리고 슬롯을 줄여 한 장씩 천천히 읽게 한다. 대기열이 길어지는 만큼 병합 창을 넓히고, 중요한 알림은 선점으로 바로 띄운다',
      values: { maxVisible: 2, displayMs: 9000, mergeWindowMs: 3000, priorityMode: 'priority-preempt', trackerMode: 'multi-list', stackAnchor: 'bottom-center-up', progressFlash: true, freezeOnPause: true },
    },
  ],
  events: [
    { id: 'kill-enemy', label: '잔해 드론 처치 (목표 +1)' },
    { id: 'loot-burst', label: '전리품 몰림 (10건)' },
    { id: 'loot-same-item', label: '같은 재료 연속 획득' },
    { id: 'loot-legendary', label: '전설 등급 획득' },
    { id: 'quest-complete', label: '임무 완료 (우선 배너)' },
    { id: 'pause-toggle', label: '일시정지 켜기/끄기' },
  ],
  hotspots: [
    {
      n: 1,
      part: 'toast-count-badge',
      title: '같은 알림은 한 장으로 합친다',
      body: '같은 키(아이템)의 알림이 **병합 창** 안에 다시 오면 새 카드를 만들지 않고 수량만 올린 뒤 표시 시간을 다시 채운다. 카드 6장 대신 `×6` 한 장이면 화면을 덜 가리고 다른 알림도 묻히지 않는다. 병합 창을 0으로 바꾸고 "같은 재료 연속 획득"을 눌러 비교해 보자.',
      principle: '인지 부하',
    },
    {
      n: 2,
      part: 'toast-rarity-stripe',
      title: '높은 등급은 먼저, 오래',
      body: '대기열은 등급 순으로 꺼내고 높은 등급은 표시 시간을 늘린다(희귀 ×1.3, 전설 ×1.6). 등급 띠는 **색 + 굵기 + Ⅰ~Ⅳ 표기**를 함께 써서 색을 구분하기 어려워도 읽힌다. 정렬 방식을 "도착 순"으로 바꾸고 "전리품 몰림" 다음에 "전설 등급 획득"을 눌러 보자 — 전설 카드가 줄 맨 뒤에서 기다린다.',
      principle: '시각 위계',
    },
    {
      n: 3,
      part: 'tracker-progress',
      title: '숫자만 바꾸지 말고 "방금 올랐다"를 보여 준다',
      body: '전투 중에는 트래커 숫자를 읽을 여유가 없다. **바뀐 행만** 0.6초 밝아지고 바가 채워지며 `+1`이 떠오르면 곁눈으로도 진행을 알아챈다. 바뀌지 않은 행은 조용히 둔다. "진행 갱신 하이라이트"를 끄고 비교해 보자.',
      principle: '즉각 피드백',
    },
    {
      n: 4,
      part: 'toast-stack',
      title: '늘 같은 곳, 같은 방향으로 쌓는다',
      body: '트래커(고정 정보)와 토스트(일시 정보)는 **서로 반대쪽 가장자리**에 두고, 쌓이는 방향을 바꾸지 않는다. 그래야 어디를 보면 무엇이 있는지 몸에 익는다. 슬롯이 차면 넘치는 알림은 **+N 대기**로 표시한다 — 사라진 게 아니라 순서를 기다린다는 약속이다. 화면이 좁으면 트래커를 단일 목표형으로 줄인다.',
      principle: '일관성',
    },
    {
      n: 5,
      part: 'toast-timer',
      title: '읽을 시간은 사용자가 정한다',
      body: '카드 아래 막대가 남은 표시 시간이다. 자동으로 사라지는 알림은 **시간 제한**이므로 끄거나 길게 늘릴 수 있게 한다([설정 · 접근성](#/s/settings-accessibility) 표본 참조). 일시정지 중에는 타이머를 멈출지 의도적으로 정한다 — "일시정지 중 알림 멈춤"을 끈 채 일시정지를 걸어 보자.',
      principle: '접근성',
    },
  ],
  mistakes: [
    { title: '오는 대로 전부 바로 띄우기', body: '큐 없이 카드를 바로 만들면 이미 떠 있는 카드 위에 전리품 10건이 그대로 10장 더해져 화면 한쪽을 덮고, 위쪽 카드는 화면 밖으로 밀려난다. 슬롯 수를 정하고 넘치는 알림은 대기시킨다.' },
    { title: '같은 알림을 병합하지 않기', body: '"냉각 셀 ×1"이 여섯 줄 쌓이면 그 사이에 들어온 희귀 획득이 묻혀 지나간다. 키(아이템 ID) 기준으로 병합하고 표시 시간을 연장한다.' },
    { title: '모두 도착 순으로 처리하기', body: '전설 획득이 일반 재료 알림 10개 뒤에 줄을 서면 몇 초 늦게 뜨고 감흥이 사라진다. 대기열은 등급 순으로 정렬하고, 임무 완료 같은 최상위 알림은 별도 배너 채널로 뺀다.' },
    { title: '카드가 사라질 때 나머지가 순간이동', body: '높이 보간 없이 목록만 다시 계산하면 남은 카드가 한 칸씩 툭 튀어 읽던 문구를 놓친다. 슬롯 높이를 0 ↔ 카드 높이로 보간한다.' },
    { title: '표시 시간을 짧게 고정하고 일시정지와 무관하게 흘리기', body: '2초로 고정하면 읽는 속도가 느린 사람은 내용을 놓치고, 메뉴를 보는 사이 알림이 다 지나간다. 표시 시간을 늘릴 수 있게 하고, 일시정지 중 타이머 동작을 일부러 고른다.' },
  ],
  juiceOff:
    '큐가 없는 구현. 슬롯 제한·병합·등급 정렬·우선 배너·연출이 모두 없다. 첫 화면부터 카드가 화면 위로 넘쳐 있고, "전리품 몰림"을 누르면 10건이 모두 새 카드로 더해져 같은 재료가 줄줄이 반복된다. 카드는 툭 나타났다 툭 사라지며 남은 카드가 위치를 건너뛴다. 임무 완료도 일반 토스트 한 줄로 묻히고, 목표 수치는 강조 없이 숫자만 바뀌며, 일시정지 중에도 알림이 흘러가 버린다.',
  timings: [
    { event: '토스트 들어오기 (슬라이드 24px + 페이드)', ms: 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1) · USS ease-out-cubic', note: '권장값' },
    { event: '토스트 나가기 (페이드 + 높이 접기)', ms: 180, easing: 'cubic-bezier(0.55, 0, 1, 0.45) · USS ease-in-cubic', note: '권장값. 들어오기보다 짧게 — 선점으로 밀려날 때도 같다' },
    { event: '남은 카드 재배치 (슬롯 높이 보간)', ms: 200, easing: 'ease-out', note: '권장값. 순간이동을 막는 핵심' },
    { event: '병합 수량 배지 튀기 (1 → 1.15 → 1)', ms: 160, easing: 'ease-out-back', note: '권장값' },
    { event: '목표 진행 바 채움', ms: 400, easing: 'ease-out', note: '권장값' },
    { event: '목표 행 하이라이트 복귀', ms: 600, easing: 'ease-in-out', note: '권장값' },
    { event: '임무 완료 블록 유지 → 접기', ms: 1500, easing: '유지 1250 + 접기 250 ease-in-out', note: '권장값' },
    { event: '우선 배너 (들어오기 250 · 나가기 300)', ms: 2500, easing: 'ease-out / ease-in', note: '권장값. 떠 있는 동안 일반 토스트 타이머를 멈춘다' },
  ],
  unity: {
    ugui: {
      hierarchy: `HUDCanvas (Screen Space - Overlay · Canvas Scaler 1920×1080 · GraphicRaycaster 없음)
├─ TrackerCanvas (하위 Canvas)
│  └─ QuestTracker (우상단 앵커 · VerticalLayoutGroup · ContentSizeFitter)        ← QuestTrackerView
│     └─ QuestEntry [Prefab] (LayoutElement · CanvasGroup · RectMask2D)          ← QuestEntryView
│        ├─ Kind · Title (TMP) · DoneTag · TitleHighlight (Image)
│        └─ Objectives (VerticalLayoutGroup)
│           └─ ObjectiveRow [Prefab] (CanvasGroup · Image 하이라이트)            ← ObjectiveRowView
│              ├─ Check (Image)  ├─ Label (TMP)  ├─ Count (TMP)
│              └─ ProgressBar └─ ProgressFill (Image · Filled · Horizontal)
├─ ToastCanvas (하위 Canvas · 자주 바뀌는 요소 격리)
│  ├─ ToastStack (VerticalLayoutGroup · Control Child Size Height 켬)            ← ToastStackView (NotificationQueue 생성)
│  │  └─ ToastSlot [Prefab · 풀링] (LayoutElement)                                ← ToastCardView
│  │     └─ Card (CanvasGroup · Image)  ← 슬라이드는 이 자식만 움직인다
│  │        ├─ RarityStripe (Image + LayoutElement) ├─ Numeral (TMP) ├─ Icon (Image)
│  │        ├─ Message (TMP) ├─ CountBadge (TMP) └─ TimerFill (Image · Filled)
│  ├─ OverflowLabel (TMP "+N 대기")
│  └─ PriorityBanner (CanvasGroup · 상단 중앙)                                     ← PriorityBanner
└─ PauseOverlay (Image · 기본 비활성)
HudSystems (Canvas 밖)
└─ QuestToastsDemo (테스트 입력 1~6)
※ NotificationQueue.cs 는 MonoBehaviour 가 아닌 순수 C# 클래스`,
      steps: [
        '`NotificationQueue.cs` 는 엔진과 무관한 순수 C# 클래스다. 갤러리의 `queue.ts` 와 같은 구조(`Enqueue` · `Tick(dt, frozen)` · `Reconfigure` · `OnShow/OnUpdate/OnHide`)라 줄 단위로 비교하며 읽을 수 있다. 이름은 C# 관례에 맞춰 조금 다르다: 시간은 초 단위(`displayMs` → `displaySeconds`), `unit` → `plusUnit`, `icon` → `iconId`, `changed` → `OnChanged`.',
        '모든 스크립트는 `UIGallery.QuestToasts` 네임스페이스 안에 있다. `Rarity` · `Toast` 같은 흔한 이름이 다른 표본 코드와 한 프로젝트에서 부딪히지 않게 하기 위해서다.',
        '`ToastStackView` 가 큐를 만들고 이벤트를 구독한다. `Update` 에서 `queue.Tick(dt, frozen)` 을 부른다 — 일시정지 중 멈추려면 `Time.deltaTime`, 계속 흐르게 하려면 `Time.unscaledDeltaTime`(`freezeOnPause` 로 선택).',
        '`OnShow`: 풀에서 `ToastSlot` 을 꺼내 `SetAsLastSibling` → 코루틴으로 `LayoutElement.preferredHeight` 0 → 66(200ms), 카드 `anchoredPosition.x` −24 → 0 과 `CanvasGroup.alpha` 0 → 1(220ms).',
        '`OnHide`: alpha 1 → 0 과 preferredHeight 66 → 0 을 함께(180ms) 진행한 뒤 풀에 반환한다. `OnUpdate`: 배지 텍스트를 바꾸고 `localScale` 1 → 1.15 → 1(160ms).',
        '`QuestCompleted` 를 받으면 큐가 아니라 `PriorityBanner.Show()` 로 보낸다(보상 크레딧만 토스트). 배너가 떠 있는 동안 `ToastStackView.Frozen` 이 true 가 되어 토스트 타이머가 멈춘다.',
        '게임 쪽은 `QuestTrackerView.AddProgress("kill")` 처럼 일어난 일만 알린다. 해당 `ObjectiveRowView` 만 숫자 교체 → fillAmount 보간(400ms) → 하이라이트 페이드(600ms). 모든 목표가 차면 `QuestCompleted` 이벤트가 나가고 블록은 1.25초 뒤 접힌다.',
        '플레이 중 인스펙터에서 표시 시간·슬롯 수를 바꾸면 `OnValidate` → `Reconfigure` 가 이미 떠 있는 카드의 길이도 바꾼다 (남은 비율은 유지).',
        '`QuestToastsDemo` 를 붙이면 갤러리와 같은 숫자키 1~6 으로 시험할 수 있다 (새 Input System).',
      ],
      pitfalls: [
        'LayoutGroup 자식의 위치를 직접 움직이면 다음 레이아웃 계산 때 덮어써진다. **슬롯(레이아웃 담당) / 카드(애니메이션 담당)** 두 단계로 나눈다.',
        '토스트마다 `Instantiate/Destroy` 하면 알림이 몰릴 때 GC 스파이크가 생긴다. 슬롯 수 + 여유분만큼 미리 만들어 풀링한다.',
        '`Time.timeScale = 0` 이면 `deltaTime` 과 `WaitForSeconds` 는 멈추고 `unscaledDeltaTime` 과 `WaitForSecondsRealtime` 은 흐른다. 연출 코루틴과 큐 타이머가 같은 시간을 쓰는지 확인한다.',
        '대기열 정렬은 `Enqueue` 마다 하지 말고 "정렬 필요" 표시만 한 뒤 `Tick` 에서 한 번만 한다 — 한 프레임에 10건이 와도 정렬은 1회.',
        'HUD 의 Image·TMP 는 **Raycast Target 을 끈다**. 켜 두면 아래쪽 UI 클릭을 가로챈다.',
        '기본 TMP 폰트(LiberationSans SDF)에는 한글과 Ⅰ~Ⅳ 글리프가 없어 □ 로 나온다. 한글 TMP 폰트 에셋을 쓰거나 Fallback 에 넣고, Ⅰ~Ⅳ(U+2160~) 글리프가 들어 있는지 확인한다.',
      ],
    },
    uitk: {
      hierarchy: `UIDocument (Panel Settings: Scale With Screen Size 1920×1080)
└─ QuestToasts.uxml  (#hud · picking-mode Ignore)
   ├─ #tracker > #quest-list          ← .quest / .objective 행은 C# 에서 생성
   ├─ #toast-dock (.toast-dock--left-up | --right-down | --bottom-center-up)
   │  ├─ #toast-stack
   │  │  └─ #toast (Toast.uxml 에서 Q("toast") 로 꺼낸 카드 · 슬롯 = 높이 담당)
   │  │     └─ #card (.toast__card · 슬라이드 담당)
   │  │        ├─ #stripe ├─ #numeral ├─ #icon ├─ #message ├─ #count
   │  │        └─ .toast__timer > #timer-fill
   │  └─ #toast-overflow (Label "+N 대기")
   ├─ #priority-banner (.banner--hidden 토글)
   └─ #pause (.pause--hidden 토글)
QuestToastsUITK.cs     ← ugui/NotificationQueue.cs 를 그대로 재사용 (뷰만 다르다)
QuestToastsUITKDemo.cs ← 테스트 입력 1~6`,
      steps: [
        '`NotificationQueue.cs`(ugui 폴더)를 함께 프로젝트에 둔다. UI Toolkit 쪽은 **뷰만** 새로 구현한다 — 같은 규칙을 두 UI 시스템에서 재사용하는 것이 이 표본의 핵심이다.',
        '`OnShow`: `toastTemplate.Instantiate()` 가 돌려준 TemplateContainer 에서 `Q("toast")` 로 카드를 꺼내 `toast--enter` 클래스를 붙인 채 스택에 넣고, **한 프레임 뒤** 클래스를 떼어 USS transition 을 시작한다.',
        '`OnHide`: `toast--exit` 클래스를 붙이고(선점이면 `toast--kicked` 도 붙여 들어온 쪽으로 밀어낸다) `schedule.Execute(...).StartingIn(200)` 뒤 제거한다. (TransitionEndEvent 는 속성마다 따로 와서 중복 제거가 나기 쉽다.)',
        '쌓이는 방향은 클래스 교체만으로 바꾼다: `--left-up` 은 `bottom` 고정 + `column`, `--right-down` 은 `top` 고정 + `column-reverse`.',
        '타이머 막대는 `style.scale` 이 아니라 `style.width = Length.Percent(남은 비율 × 100)` 로 매 프레임 갱신한다.',
        '트래커는 UGUI 판과 같은 규칙이다: 행을 `임무 + 목표` 쌍으로 들고 있어서 두 임무가 같은 feed(예: `kill`)를 써도 덮어쓰지 않는다. 모든 목표가 차면 `QuestCompleted` 를 내고 `quest--done`(완료 태그)을 붙인 뒤, 1.25초(게임 시간) 뒤 지금 높이를 px 로 고정하고 한 프레임 뒤 0 으로 바꿔 접는다. 주 임무면 사슬의 다음 임무가 `quest--enter` 로 목록 맨 위에 들어온다.',
        '`QuestToastsUITKDemo` 는 `QuestCompleted` 를 구독해 임무 완료를 배너 채널로, 보상 크레딧만 토스트로 보낸다 (5번 키 = `CompleteCurrentMain`).',
      ],
      pitfalls: [
        'USS transition 은 `height: auto` 를 보간하지 못한다. 카드 높이를 `66px` 고정값으로 두고 0 ↔ 66px 로 바꾼다.',
        '요소를 추가한 같은 프레임에 클래스를 바꾸면 시작 스타일이 계산되기 전이라 transition 없이 최종 상태로 튄다. 한 프레임 미룬다.',
        '`schedule.Execute` 지연은 `Time.timeScale` 을 따르지 않는다. 표시 시간 계산은 큐의 `Tick` 에만 맡긴다.',
        'USS 에는 gradient·box-shadow 가 없다. 전설 카드 강조는 테두리 색과 두꺼운 등급 띠로 한다.',
        '기본 폰트에는 한글이 없어 □ 로 나온다. Panel Settings → Text Settings 에 한글 FontAsset 을 지정한다 (Ⅰ~Ⅳ 글리프 포함 확인).',
      ],
    },
  },
  inspiredBy: [
    {
      title: 'Destiny 2 (2017)',
      credit: '© Bungie, Inc.',
      borrowed: ['레이아웃 구조'],
      learned:
        '빌린 것은 구조 하나 — **한정된 행 수의 HUD 알림 스택에서 정보 종류끼리 우선순위로 자리를 다툰다**는 점이다. 근거는 제3자 재설계 분석(T3)이고, 그 분석은 이 서열 때문에 중요한 정보가 밀려나는 한계도 지적한다. 화면의 색·형태·전환 연출은 확인하지 못했다(미확인). 분석 대상: 라이브 서비스(2017~).',
      link: 'https://www.bungie.net/7/en/Destiny',
    },
    {
      title: 'Genshin Impact (2020)',
      credit: '©miHoYo ©HoYoverse',
      borrowed: [],
      learned:
        '비교 사례. 빌린 것은 없다. "단일 목표형" 트래커는 모바일 RPG의 장르 관례로 만들었다. 이 게임의 실제 목표 표시 형태와 알림 큐의 위치·표시 시간은 공개 자료로 확인하지 못했다(미확인).',
      link: 'https://genshin.hoyoverse.com/en/home',
    },
  ],
  original:
    '외곽 탐사대 세계관의 임무·아이템 문구, 육각 회로·냉각 셀·산소 캔·별 코어 같은 기하 아이콘, 자체 등급색(회청·청록·자홍·호박)과 띠 굵기(4/6/9/12px)·Ⅰ~Ⅳ 표기, 카드 아래 남은 시간 막대, "+N 대기" 표시, 팔각 메달 배너, 무대 아래 큐 상태 표시, 일시정지 동결 비교는 이 갤러리에서 새로 만든 것이다.',
  references: [
    { label: 'Destiny 2 공식 사이트 (Bungie)', url: 'https://www.bungie.net/7/en/Destiny' },
    { label: 'Genshin Impact 공식 사이트 (HoYoverse)', url: 'https://genshin.hoyoverse.com/en/home' },
    { label: 'Unity 6.3 Manual — USS transition (이징 키워드, auto 값 보간 불가)', url: 'https://docs.unity3d.com/6000.3/Documentation/Manual/UIE-Transitions.html' },
    { label: 'Unity UI 2.0 — Vertical Layout Group', url: 'https://docs.unity3d.com/Packages/com.unity.ugui@2.0/manual/script-VerticalLayoutGroup.html' },
    { label: 'Unity 6.3 Scripting API — CanvasGroup', url: 'https://docs.unity3d.com/6000.3/Documentation/ScriptReference/CanvasGroup.html' },
    { label: 'W3C — WCAG 2.2 Understanding 2.2.1 Timing Adjustable', url: 'https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html' },
    { label: 'Joel Kiraly — Destiny 2 UI 재설계 케이스 스터디 (T3, 제3자 분석)', url: 'https://www.joelkiraly.com/project/destiny2ui/' },
  ],
  related: [{ id: 'settings-accessibility', why: '시간 제한(자동으로 사라지는 알림)을 끄거나 늘리는 옵션의 기준' }],
}
