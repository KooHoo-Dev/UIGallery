import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'damage-numbers',
  title: '데미지 숫자: 범주 위계 + 겹침 방지',
  titleEn: 'Damage Numbers',
  group: 'A',
  order: 2,
  paradigms: ['spatial'],
  oneLiner: '타격 지점에서 떠오르는 숫자로 "얼마나, 어떤 종류의" 결과가 났는지 0.5초 안에 읽히게 만든다',
  goals: [
    '일반 · 치명 · 가드 파괴 · 회복 · 막힘 다섯 범주를 **크기 · 색 · 형태(배지·기호)** 세 단서로 구분하는 스타일 표를 설계할 수 있다',
    '다단 히트 숫자를 **밀어 올리기 · 흩뿌리기 · 병합** 중 하나로 겹치지 않게 하고, 누적 합계를 따로 보여 줄 수 있다',
    'Unity 코드에서 대상의 월드 좌표를 화면 좌표로 바꿔 숫자의 출발점(앵커)으로 쓰고, 카메라 뒤 대상은 걸러 낼 수 있다 (웹 무대는 2D 고정 좌표라 Unity 탭 UGUI 4단계 `Spawn` 에서 확인한다)',
    '숫자를 매번 만들고 지우지 않고 **오브젝트 풀**로 재사용해 프레임 드랍을 막을 수 있다',
  ],
  principles: ['시각 위계', '즉각 피드백', '가독성', '접근성', '일관성'],
  platforms: ['pc', 'console', 'mobile'],
  inputs: ['mouse', 'keyboard', 'gamepad', 'touch'],
  genres: ['턴제 RPG', '액션 RPG', '핵앤슬래시', 'MMO'],
  difficulty: 2,
  stage: { aspect: 'both', backdrop: 'none' },
  params: [
    { key: 'critScale', label: '치명타 크기 배율', type: 'range', min: 1, max: 2, step: 0.1, default: 1.5, unit: '×', hint: '치명타 숫자가 일반 숫자보다 얼마나 큰지. 1.0 이면 크기로는 위계가 사라진다' },
    {
      key: 'stackMode',
      label: '겹침 처리',
      type: 'select',
      default: 'lane',
      options: [
        { value: 'lane', label: '위로 밀어 올리기' },
        { value: 'scatter', label: '방사 흩뿌리기' },
        { value: 'merge', label: '같은 범주 병합' },
        { value: 'overlap', label: '겹침 허용 (나쁜 예)' },
      ],
      hint: '같은 대상에 연달아 숫자가 생길 때의 배치 규칙. "5연타"를 눌러 비교해 보자. 겹침 허용이면 숫자가 한 점에 포개진다',
    },
    { key: 'showTotal', label: '누적 합계', type: 'toggle', default: true, hint: '2타 이상 묶음이 끝나면(200ms 조용) 합계를 카운트업으로 크게 한 번 보여 준다' },
    { key: 'hitIntervalMs', label: '다단 히트 간격', type: 'range', min: 60, max: 400, step: 20, default: 120, unit: 'ms', hint: '5연타 사이 간격. 짧으면 리듬이 빠르고, 길면 숫자를 하나씩 읽을 시간이 생긴다. 병합 판정 창도 이 값을 따른다' },
    { key: 'floatDistance', label: '상승 거리', type: 'range', min: 0, max: 120, step: 10, default: 50, unit: 'px', hint: '숫자가 사라질 때까지 떠오르는 거리(1920×1080 기준). 크면 위쪽 UI 를 가린다' },
    { key: 'lifetimeMs', label: '표시 시간', type: 'range', min: 400, max: 2000, step: 100, default: 900, unit: 'ms', hint: '숫자 하나가 머무는 시간. 짧으면 깔끔하지만 놓치기 쉽고, 길면 화면이 붐빈다 (풀 사용 칸 수를 보자)' },
    { key: 'shapeCue', label: '형태 단서 (배지·기호)', type: 'toggle', default: true, hint: '"치명 · 파괴 · 막힘" 배지, 회복의 "+" 기호, 치명타 기울기와 두꺼운 외곽선. 끄면 범주를 색으로만 구분해야 한다' },
    {
      key: 'damageColorMap',
      label: '피해 종류 색',
      type: 'select',
      default: 'category',
      options: [
        { value: 'category', label: '범주별 색 (회백·호박·자주·청록·회색)' },
        { value: 'redGreen', label: '빨강 = 피해, 초록 = 회복' },
        { value: 'mono', label: '모두 흰색' },
      ],
      hint: '범주 → 색 매핑. "빨강·초록"은 흔한 실수: 흑백 미리보기를 켜면 두 색의 밝기가 거의 같다',
    },
    {
      key: 'numberFormat',
      label: '숫자 표기',
      type: 'select',
      default: 'grouped',
      options: [
        { value: 'full', label: '전체 자릿수 (3912)' },
        { value: 'grouped', label: '천 단위 구분 (3,912)' },
        { value: 'short', label: '축약 (3.9K)' },
      ],
      hint: '축약은 빨리 읽히지만 정밀한 비교가 어렵다',
    },
    { key: 'monoPreview', label: '흑백 미리보기', type: 'toggle', default: false, hint: '무대 전체를 흑백으로 본다(수업용 확인 도구, Unity 구현 대상 아님). 형태 단서를 껐다 켜며 색 없이도 범주가 읽히는지 확인한다' },
  ],
  presets: [
    {
      id: 'turn-based-hierarchy',
      name: '턴제 전술형 · 범주 위계',
      look: '숫자가 또렷한 줄로 밀려 올라가고, 치명·가드 파괴·막힘이 크기·색·배지로 분명히 갈린다. 행동이 끝나면 합계가 크게 한 번 뜬다. 턴 사이에 결과를 해석할 시간이 있는 장르',
      values: { critScale: 1.6, stackMode: 'lane', showTotal: true, hitIntervalMs: 160, floatDistance: 40, lifetimeMs: 1200, shapeCue: true, damageColorMap: 'category', numberFormat: 'grouped', monoPreview: false },
    },
    {
      id: 'action-scatter',
      name: '실시간 난타형 · 흩뿌리기',
      look: '짧게 살다 사라지는 숫자가 위쪽 부채꼴로 튀어 리듬감을 만든다. 정확한 수치보다 "많이 때리고 있다"는 감각. 큰 수는 K 로 줄인다',
      values: { critScale: 1.4, stackMode: 'scatter', showTotal: false, hitIntervalMs: 60, floatDistance: 90, lifetimeMs: 600, shapeCue: true, damageColorMap: 'category', numberFormat: 'short', monoPreview: false },
    },
    {
      id: 'rapid-merge',
      name: '고속 연타형 · 한 숫자로 병합',
      look: '같은 대상·같은 범주의 연타가 숫자 하나로 합쳐져 커지고 "×5" 처럼 타수가 붙는다. 화면에 숫자 개수가 늘지 않아 수십 타가 쏟아지는 전투에서도 깔끔하다',
      values: { critScale: 1.3, stackMode: 'merge', showTotal: false, hitIntervalMs: 80, floatDistance: 30, lifetimeMs: 1100, shapeCue: true, damageColorMap: 'category', numberFormat: 'grouped', monoPreview: false },
    },
  ],
  events: [
    { id: 'hit_normal', label: '일반 타격' },
    { id: 'hit_crit', label: '치명타' },
    { id: 'hit_break', label: '가드 파괴' },
    { id: 'multi_hit_5', label: '5연타' },
    { id: 'heal_ally', label: '아군 회복' },
    { id: 'hit_blocked', label: '방어막에 막힘' },
  ],
  hotspots: [
    {
      n: 1,
      part: 'crit-number',
      title: '크기 · 색 · 형태를 한 세트로 바꾸는 치명타',
      body: '치명타는 **크기(1.5배) · 호박색 · 두꺼운 외곽선 · 기울기 · "치명" 배지**를 한꺼번에 바꾼다. 세 단서가 같은 방향을 가리키므로 곁눈으로 봐도 "큰 한 방"이 바로 구분된다. 등장도 더 세게 튄다(0.5 → 1.3 → 1.0, 180ms). `치명타 크기 배율`을 1.0 으로 내려 위계가 얼마나 무너지는지 보자.',
      principle: '시각 위계',
    },
    {
      n: 2,
      part: 'guard-bar',
      title: '가드 파괴는 "더 큰 치명타"가 아니다',
      body: '방어 게이지를 다 깎았을 때의 피해를 별도 범주로 두는 턴제 RPG가 있다. 이런 피해를 치명타처럼 꾸미면 플레이어가 결과를 잘못 읽는다. 그래서 **가드 칸이 먼저 깨지고(220ms) 약 80ms 뒤** 자주색 "파괴" 숫자를 띄워 원인 → 결과 순서를 보여 준다. 범주마다 정한 배지와 색은 게임 내내 똑같이 쓴다.',
      principle: '일관성',
    },
    {
      n: 3,
      part: 'shape-cue',
      title: '색 말고도 기호로 읽힌다',
      body: '"치명 · 파괴 · 막힘" 배지와 회복의 **"+" 기호**가 있으면 빨강·초록을 구분하기 어려운 사람도 범주를 읽는다. `흑백 미리보기`를 켠 채 `형태 단서`를 껐다 켜 보자. 배지가 없으면 흑백 화면에서 회복과 피해를 밝기 차이로만 짐작해야 한다. `피해 종류 색`을 "빨강·초록"으로 바꾸면 그 차이마저 사라진다.',
      principle: '접근성',
    },
    {
      n: 4,
      part: 'stack-lane',
      title: '새 숫자가 오면 이전 숫자를 밀어 올린다',
      body: '같은 앵커에서 같은 궤적으로 띄우면 숫자가 포개져 덩어리가 된다. 이 표본은 새 숫자를 앵커에 두고 **살아 있는 이전 숫자를 새 숫자 높이만큼 위로 민다**. 그래서 가장 최근 숫자가 늘 대상 가까이에 있다. 빠른 액션은 **흩뿌리기**, 수십 타가 쏟아지면 같은 범주를 **병합**한다. `겹침 처리`를 바꿔 "5연타"를 비교해 보자.',
      principle: '가독성',
    },
    {
      n: 5,
      part: 'total-counter',
      title: '합계 하나로 끝내는 다단 히트',
      body: '숫자 다섯 개를 머릿속으로 더하게 하지 말고 합계를 따로 크게 보여 준다. 마지막 히트 뒤 **200ms** 조용하면 400ms 카운트업, 800ms 유지 후 사라진다. 개별 숫자는 리듬을 전하고, 합계는 다음 행동을 고르는 근거가 된다. 단계별 정산(기본 × 배율 = 결과)처럼 더 긴 설명은 [결과 · 보상 화면](#/s/results-reward)에서 다룬다.',
      principle: '인지 부하',
    },
  ],
  mistakes: [
    { title: '모든 숫자가 같은 크기 · 같은 색', body: '치명타 · 회복 · 가드 파괴가 일반 피해와 똑같아 보이면 플레이어는 결과를 해석하지 못하고, 결국 숫자를 보지 않게 된다.' },
    { title: '다단 히트가 한 점에 겹침', body: '같은 앵커에서 같은 궤적으로 띄우면 숫자가 포개져 읽을 수 없다. 밀어 올리기 · 흩뿌리기 · 병합 중 하나와 합계 표시가 필요하다.' },
    { title: '빨강 = 피해, 초록 = 회복만으로 구분', body: '적록 색각 이상이 있는 플레이어에게는 두 숫자가 같아 보인다. "+" 기호 · 배지 · 움직임 차이(회복은 느리고 부드럽게)를 함께 쓴다.' },
    { title: '타격마다 새로 만들고 지우기', body: '연타가 많은 전투에서 메모리 정리(GC) 때문에 프레임이 튄다. 미리 만들어 둔 풀에서 꺼내 쓰고, 숫자 글자도 새 문자열을 만들지 않고 갱신한다. 효과 끄기에서 풀 상태 표시의 생성 횟수가 계속 느는 것을 보자.' },
    { title: '숫자가 체력 바 · 얼굴 · 위쪽 HUD 를 덮음', body: '체력 바를 머리 위에 두고 숫자도 머리 위에서 띄우면 숫자가 바를 가린다. 이 표본은 바를 발 아래로 내렸다. 카메라 뒤에 있는 대상은 화면 좌표가 뒤집히므로 숫자를 띄우지 않는다(Unity 탭 UGUI 4단계 `Spawn`, 웹에서는 [화면 밖 목표 표시](#/s/offscreen-waypoint)에서 시연).' },
  ],
  juiceOff:
    '모든 숫자가 **같은 크기의 흰 글자**로 팝 없이 그 자리에 "툭" 나타났다가 표시 시간이 끝나면 갑자기 사라진다. 5연타는 한 점에 포개져 덩어리가 되고 **합계도 없다**. 치명타 · 가드 파괴 · 막힘은 일반 피해와 구별되지 않고, 회복도 "+" 없는 흰 숫자라 아군이 맞은 것처럼 보인다. 가드 칸은 깨지는 연출 없이 그냥 사라지고, 풀 상태 표시에는 숫자를 **매번 새로 만들고 지운 횟수**가 쌓인다.',
  timings: [
    { event: '숫자 등장 팝 (0.6 → 1.15 → 1.0)', ms: 140, easing: '2구간 팝 (easeOutCubic → easeInOutSine)', note: '권장값. 처음 100~150ms 안에 커져야 "맞았다"가 즉시 전달된다' },
    { event: '숫자 상승 (상승 거리만큼)', ms: 900, easing: 'easeOutCubic', note: '권장값. 표시 시간과 같다. 초반에 빨리, 끝에서 느리게' },
    { event: '숫자 페이드아웃 (수명 마지막 구간)', ms: 250, easing: 'easeInQuad', note: '권장값. 처음부터 흐려지면 읽을 시간이 줄어든다' },
    { event: '치명타 팝 (0.5 → 1.3 → 1.0) + 흔들림', ms: 180, easing: '2구간 팝 (easeOutCubic → easeInOutSine)', note: '권장값. 흔들림은 120ms, 진폭 5px(1920 기준)' },
    { event: '가드 파괴: 칸이 깨진 뒤 숫자 등장', ms: 300, easing: 'ease-out', note: '권장값. 깨짐 220ms + 약 80ms 뒤 숫자 — 원인 → 결과 순서' },
    { event: '밀어 올림 (이전 숫자가 새 숫자 높이만큼 위로)', ms: 120, easing: '지수 감쇠', note: '권장값. 새 숫자가 나오는 순간 자리를 비켜 준다' },
    { event: '합계 대기 → 카운트업 → 유지', ms: 400, easing: 'easeOutQuart', note: '권장값. 마지막 히트 후 200ms 조용하면 시작, 끝나면 800ms 유지. 결과 화면 표본과 같은 카운트업 유틸' },
    { event: '회복 숫자 상승', ms: 1125, easing: 'easeOutSine', note: '권장값. 피해보다 1.25배 느리고 부드럽게 — 좋은 결과라는 성격 차이를 움직임으로도 보여 준다' },
  ],
  unity: {
    ugui: {
      hierarchy: `Main Camera
BattleField
├─ Enemy_Boss
│  └─ HitAnchor (빈 Transform, 몸통 위쪽)
├─ Enemy_Drone ×2
│  └─ HitAnchor
└─ Ally_Doyun
   └─ HitAnchor (머리 위)
DamageNumberSystem (DamageNumberSpawner · DamageNumbersDemo)
Canvas_Numbers (Screen Space - Overlay · Sort Order 10 · CanvasScaler 1920×1080 · GraphicRaycaster 없음)
├─ NumberLayer (RectTransform, 전체 스트레치, Pivot 0.5/0.5)
│  └─ [풀링] DamageNumber.prefab (앵커 0.5/0.5 한 점 · Pivot 0.5/0 · CanvasGroup · DamageNumberView)
│     ├─ Badge (Image)
│     │  └─ BadgeText (TextMeshProUGUI)
│     └─ Label (TextMeshProUGUI)
└─ TotalCounter (CanvasGroup · TotalCounterView)
   ├─ Caption (TextMeshProUGUI "합계")
   ├─ Value (TextMeshProUGUI)
   └─ Hits (TextMeshProUGUI "5타")
Assets: DamageStyle_Normal / Crit / Break / Heal / Block.asset (DamageCategoryStyle)`,
      steps: [
        '`Canvas_Numbers` 를 HUD(체력 바 등)와 **별도 Canvas** 로 만든다. 숫자가 움직일 때 HUD 까지 다시 배칭되지 않는다. Canvas Scaler 는 `Scale With Screen Size`, 1920×1080.',
        '`DamageNumber` 프리팹의 앵커를 (0.5, 0.5) 한 점, 피벗을 (0.5, 0) 으로 둔다. 그래야 변환한 로컬 좌표를 `anchoredPosition` 에 그대로 넣을 수 있다. 모든 Graphic 의 Raycast Target 을 끈다.',
        '`DamageCategoryStyle` 에셋 다섯 개(Normal · Crit · Break · Heal · Block)에 크기 배율 · 색 · 배지 글자 · 기울기 · 팝 커브 · 수명 배율을 넣는다. Break 에는 "치명" 배지를 넣지 않는다.',
        '`DamageNumberSpawner.Spawn(anchor, value, category)` 가 `Camera.WorldToScreenPoint` 로 화면 좌표를 얻고, **z ≤ 0(카메라 뒤)이면 띄우지 않는다**. 그다음 `RectTransformUtility.ScreenPointToLocalPointInRectangle(numberLayer, sp, null, out local)` (Overlay 이므로 카메라 null).',
        '숫자는 `UnityEngine.Pool.ObjectPool<DamageNumberView>` 에서 꺼낸다. 같은 앵커의 살아 있는 숫자는 새 숫자 높이만큼 `PushUp()` 해서 겹치지 않게 한다. 병합 모드면 같은 범주의 최근 숫자에 `AddValue()` 한다.',
        '`DamageNumberView` 는 `Update` 에서 팝(AnimationCurve) → 상승(easeOutCubic) → 마지막 250ms `CanvasGroup.alpha` 페이드를 처리하고, 끝나면 **한 번만** `pool.Release(this)` 한다.',
        '`TotalCounterView` 는 같은 대상 피해를 묶어 두었다가 200ms 조용하면 400ms 카운트업, 800ms 유지 후 숨긴다.',
        '`DamageNumbersDemo.cs` 를 붙이면 갤러리와 같은 숫자키 1~6 으로 일반 · 치명 · 가드 파괴 · 5연타 · 회복 · 막힘을 시험할 수 있다.',
      ],
      pitfalls: [
        '`WorldToScreenPoint` 결과의 z 가 0 이하인 대상을 그대로 변환하면 좌표가 뒤집혀 화면 반대편에 숫자가 뜬다.',
        'Canvas 를 `Screen Space - Camera` 로 바꾸면 `ScreenPointToLocalPointInRectangle` 에 그 Canvas 의 worldCamera 를 넘겨야 한다. null 이면 위치가 어긋난다.',
        '같은 객체를 두 번 `Release` 하면 풀이 오염된다. `collectionCheck` 를 켜고, 수명이 끝날 때 한 번만 반환한다.',
        '숫자 글자를 `label.text = value.ToString("N0")` 로 바꾸면 매번 문자열이 생긴다. 이 예제처럼 미리 만든 `char[]` 에 직접 써서 `SetCharArray` 로 넘기면 할당이 없다.',
        '히트스톱으로 `Time.timeScale = 0` 을 쓰면 숫자도 멈춘다. 숫자만 계속 움직이게 하려면 `Time.unscaledDeltaTime` 을 쓴다.',
        'TMP 폰트 에셋에 "+", ",", "K", "M", "×" 와 배지의 한글 글리프가 없으면 네모(□)로 나온다.',
        '움직이는 대상을 따라가게 하려면 매 프레임 다시 변환해야 하고, 카메라가 움직인 뒤(`LateUpdate`)에 해야 떨리지 않는다. 이 예제는 생성 위치에 고정한다.',
      ],
    },
    uitk: {
      hierarchy: `UIDocument (Panel Settings: Scale With Screen Size 1920×1080 · Sort Order 를 HUD 패널보다 크게) + DamageNumbersUITK.cs
└─ DamageNumbers.uxml
   ├─ #number-layer (.number-layer, picking-mode: Ignore)
   │  └─ [풀링 · C# 에서 생성] .dmg (+ .dmg--crit / --break / --heal / --block / --no-cue)
   │     ├─ Label .dmg__badge   ← "치명 · 파괴 · 막힘"
   │     └─ Label .dmg__value   ← 숫자 (+ 회복의 "+", 병합의 "×N")
   └─ #total-counter (.total-counter .total-counter--hidden)
      ├─ Label #total-caption "합계"
      └─ .total-counter__row
         ├─ Label #total-value
         └─ Label #total-hits "5타"
(DamageCategory · DamageNumberSettings · IDamageNumberSink · DamageNumbersDemo 는 ugui 폴더의 것을 함께 쓴다)`,
      steps: [
        '`DamageNumbers.uxml` · `.uss` 를 UIDocument 에 연결한다. Panel Settings 는 `Scale With Screen Size`, 1920×1080.',
        '`DamageNumbersUITK` 도 `IDamageNumberSink` 를 구현하므로 ugui 폴더의 `DamageNumbersDemo` 의 target 에 넣으면 숫자키 1~6 으로 같은 시험을 할 수 있다.',
        '`OnEnable` 에서 `#number-layer` 를 찾고 `ObjectPool<Item>` 을 만든다. Item 은 `.dmg` 컨테이너와 자식 Label 두 개(배지 · 값)에 애니메이션 상태를 묶은 클래스다. createFunc 에서 요소마다 **`pickingMode = PickingMode.Ignore`** 를 주고 layer 에 Add 한다.',
        'Spawn: 먼저 `cam.WorldToScreenPoint(pos).z > 0` 인지 확인하고, `RuntimePanelUtils.CameraTransformWorldToPanel(layer.panel, pos, cam)` 로 패널 좌표를 얻어 `style.left / top` 에 넣는다.',
        '범주는 수정자 클래스(`dmg--crit` 등)로 바꾼다. 색 · 크기 · 기울기는 USS 에 있고, 배지 숨김은 `.dmg--no-cue`.',
        '팝 · 상승 · 페이드는 C# `Update` 에서 `style.scale`, `style.translate`, `style.opacity` 로 넣는다. 밀어 올림 오프셋은 translate 에 더한다.',
        '수명이 끝나면 범주 클래스를 **모두 지우고** `style.display = None` 으로 숨긴 뒤 `pool.Release` 한다.',
      ],
      pitfalls: [
        '`CameraTransformWorldToPanel` 은 카메라 뒤 대상에도 값을 돌려준다. z 판정은 따로 해야 한다.',
        'USS 에는 `calc()` 가 없다. 가운데 정렬은 고정 크기 + 음수 margin 으로 하고, translate 는 움직임 전용으로 남긴다.',
        '풀에서 꺼낸 요소에 이전 범주 클래스가 남아 있으면 일반 피해가 치명타 색으로 나온다. Release 때 `RemoveFromClassList` 로 모두 지운다.',
        '`picking-mode` 는 자식에게 상속되지 않는다. C# 에서 만든 요소마다 Ignore 를 주지 않으면 숫자가 아래 UI 의 클릭을 가로챈다.',
        'USS 는 text-shadow 를 지원하지만 box-shadow · gradient · filter 는 없다. 외곽선은 `-unity-text-outline-width` 로 준다.',
        'style.left/top 을 매 프레임 바꾸면 레이아웃이 다시 계산된다. 생성 때 한 번만 넣고, 움직임은 `style.translate` 로 한다.',
      ],
    },
  },
  inspiredBy: [
    {
      title: 'Honkai: Star Rail (2023)',
      credit: '© COGNOSPHERE PTE. LTD. / HoYoverse',
      borrowed: [],
      learned:
        '방어 게이지가 0이 될 때 생기는 피해가 **치명타가 적용되지 않는 별도 범주**이고 행동 지연 · 상태이상을 함께 준다는 점(2차 가이드로 확인)에서, 일반 · 치명 · 가드 파괴를 따로 구분하고 "게이지가 깨진 뒤 숫자"라는 원인 → 결과 순서를 정했다. 실제 화면의 숫자 색 · 크기 · 위치 · 움직임은 확인하지 못해 시각 축은 빌리지 않았다. 원작 용어도 쓰지 않고 "가드 게이지 · 가드 파괴"로 바꿨다.',
      link: 'https://hsr.hoyoverse.com',
    },
    {
      title: 'Balatro (2024)',
      credit: '© Playstack · LocalThunk',
      borrowed: [],
      learned:
        '비교 사례. 점수가 **칩 × 배수** 구조로 계산된다는 사실(위키백과로 확인)에서 "결과 숫자만이 아니라 계산 근거를 보여 주는" 반대쪽 해법을 짚는다. 원작의 점수 연출 방식은 확인하지 못해 가져오지 않았다. 이 표본은 공간 숫자와 합계까지만 다루고, 단계별 정산은 결과 · 보상 화면 표본으로 넘긴다.',
      link: 'https://www.playstack.com/games/balatro/',
    },
  ],
  original:
    '표적은 갤러리 공통 실루엣(적 = 삼각 "잔해 드론", 아군 = 캡슐 하린 · 도윤 · 세라)이고, 이름표 · 체력 바 · 칸식 가드 게이지 · 방어막 육각형은 새로 그렸다. 범주 색(회백 · 호박 · 자주 · 청록 · 회색), 배지 문구("치명 · 파괴 · 막힘")와 배지 기호(별 · 금 간 마름모 · 방패), 밀어 올림 · 흩뿌리기 · 병합 규칙, 합계 카운트업, 풀 상태 표시, 흑백 미리보기와 모든 타이밍 값은 학습용으로 새로 정한 것이다. 바를 발 아래에 둬 숫자가 바를 가리지 않게 한 배치도 이 갤러리의 선택이다.',
  references: [
    { label: 'Honkai: Star Rail 공식 사이트', url: 'https://hsr.hoyoverse.com' },
    { label: 'Playstack — Balatro 공식 게임 페이지', url: 'https://www.playstack.com/games/balatro/' },
    { label: 'Wikipedia — Balatro (칩 × 배수 점수 구조, 출시 정보)', url: 'https://en.wikipedia.org/wiki/Balatro' },
    { label: 'Game Accessibility Guidelines — 색만으로 핵심 정보를 전달하지 않기', url: 'https://gameaccessibilityguidelines.com/ensure-no-essential-information-is-conveyed-by-a-colour-alone/' },
    { label: 'Unity 6.3 — Pool.ObjectPool<T>', url: 'https://docs.unity3d.com/6000.3/Documentation/ScriptReference/Pool.ObjectPool_1.html' },
    { label: 'Unity 6.3 — RectTransformUtility.ScreenPointToLocalPointInRectangle', url: 'https://docs.unity3d.com/6000.3/Documentation/ScriptReference/RectTransformUtility.ScreenPointToLocalPointInRectangle.html' },
    { label: 'Unity 6.3 — RuntimePanelUtils.CameraTransformWorldToPanel', url: 'https://docs.unity3d.com/6000.3/Documentation/ScriptReference/UIElements.RuntimePanelUtils.CameraTransformWorldToPanel.html' },
    { label: 'Unity 6.3 — Camera.WorldToScreenPoint', url: 'https://docs.unity3d.com/6000.3/Documentation/ScriptReference/Camera.WorldToScreenPoint.html' },
  ],
  related: [
    { id: 'results-reward', why: '단계별 정산(기본 × 배율 = 결과)과 긴 카운트업은 결과 화면에서 다룬다. 같은 카운트업 유틸을 써서 리듬이 같다' },
    { id: 'reticle-hitmarker', why: '숫자보다 먼저 오는 "맞았다" 신호 — 조준점의 적중 · 치명 표시와 짝을 이룬다' },
    { id: 'health-bar-trail', why: '숫자가 "얼마나"를, 바의 잔상이 "얼마나 남았나"를 맡는다. 연타 합계를 바에서 묶는 방법도 비교해 보자' },
    { id: 'settings-accessibility', why: '형태 단서 · 색 매핑은 설정의 색각 보정과 함께 동작해야 한다' },
    { id: 'offscreen-waypoint', why: '월드 좌표 → 화면 좌표 변환과 카메라 뒤 판정을 3D 무대에서 직접 시연한다. 숫자의 앵커 계산과 같은 원리다' },
  ],
  flashes: true,
}
