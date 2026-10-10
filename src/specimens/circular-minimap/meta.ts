import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'circular-minimap',
  title: '원형 미니맵',
  titleEn: 'Circular Minimap',
  group: 'B',
  order: 3,
  paradigms: ['non-diegetic'],
  oneLiner: '화면 구석의 원 하나에 "내 주변"을 담는다 — 회전형이냐 북쪽 고정이냐, 범위 밖 목표를 어떻게 남기느냐',
  goals: [
    '**회전형**(지도가 돎)과 **북쪽 고정형**(화살표가 돎)의 차이를 설명하고, 둘을 설정에서 고르게 하는 이유를 말할 수 있다',
    '월드 좌표를 미니맵 좌표로 바꾸는 식(**오프셋 × 축척 → 회전**)을 구현하고, 범위 밖 목표를 원 가장자리에 고정할 수 있다',
    '아이콘을 **크기·모양·그리기 순서**로 3단계 위계로 나누고, 색은 보조로만 쓰는 이유를 말할 수 있다',
    'Unity UGUI 에서 원형 클리핑에 `RectMask2D` 가 아니라 `Mask`(스텐실)가 필요한 이유를 설명할 수 있다',
  ],
  principles: ['접근성', '즉각 피드백', '시각 위계', '인지 부하', '일관성'],
  platforms: ['pc', 'console', 'mobile'],
  inputs: ['mouse', 'keyboard', 'gamepad', 'touch'],
  genres: ['오픈월드', '액션 RPG', '전술 슈터', 'MMO'],
  difficulty: 2,
  stage: { aspect: 'both', backdrop: 'none' },
  params: [
    {
      key: 'orientation',
      label: '방향 방식',
      type: 'select',
      default: 'rotate',
      options: [
        { value: 'rotate', label: '회전형 (지도가 돎)' },
        { value: 'north-up', label: '북쪽 고정 (화살표가 돎)' },
        { value: 'none', label: '미니맵 없음 (비교)' },
      ],
      hint: '회전형은 "앞 = 위", 북쪽 고정은 지도가 그대로라 아이콘 위치를 외우기 쉽다. 미니맵 없음은 짧은 비교용 — 무대 안에서는 M 키나 링 아래 버튼으로도 바꾼다',
    },
    { key: 'zoomScale', label: '축척', type: 'range', min: 0.5, max: 3, step: 0.1, default: 1, unit: '×', hint: '원 안에 담기는 월드 범위. 높이면 주변이 자세해지지만 목표가 쉽게 범위 밖으로 나가 가장자리에 붙는다' },
    { key: 'mapSize', label: '미니맵 지름', type: 'range', min: 220, max: 420, step: 10, default: 300, unit: 'px', hint: '화면 점유율과 판독성의 균형. 아이콘 크기는 그대로라, 작게 하면 아이콘이 뭉친다' },
    { key: 'edgeClamp', label: '범위 밖 목표 가장자리 표시', type: 'toggle', default: true, hint: '끄면 원 밖의 목표가 그냥 잘려 사라진다' },
    { key: 'edgeMargin', label: '가장자리 여백', type: 'range', min: 0, max: 44, step: 2, default: 18, unit: 'px', hint: '범위 밖 아이콘을 테두리에서 얼마나 안쪽에 붙일지. 0 이면 아이콘이 테두리 선에 걸쳐 읽기 어렵다' },
    {
      key: 'iconHierarchy',
      label: '아이콘 위계',
      type: 'select',
      default: 'three-tier',
      options: [
        { value: 'three-tier', label: '3단계 (크기·모양·순서)' },
        { value: 'flat', label: '평면 (모두 같은 핀)' },
      ],
      hint: '3단계 = 주요 목표(큰 앰버 과녁) · 위험(코랄 삼각형) · 주변 정보(작은 회청색 사각). 평면 = 모두 같은 흰 핀',
    },
    { key: 'viewCone', label: '시야 원뿔', type: 'toggle', default: true, hint: '카메라가 보는 방향과 범위. 북쪽 고정형에서 "지금 어느 쪽을 보는지"를 특히 많이 돕는다' },
    { key: 'fovDeg', label: '시야각', type: 'range', min: 40, max: 120, step: 5, default: 70, unit: '°', hint: '시야 원뿔의 벌어진 각도. 실제 게임에서는 카메라 시야각 값을 그대로 넣는다' },
    { key: 'bgOpacity', label: '지도 불투명도', type: 'range', min: 0.2, max: 1, step: 0.05, default: 0.75, hint: '낮추면 게임 화면이 비쳐 몰입감이 늘지만, 밝은 장면에서 아이콘 대비가 떨어진다. 아이콘은 불투명도와 상관없이 늘 또렷하게' },
  ],
  presets: [
    {
      id: 'explore-rotate',
      name: '오픈월드 탐험 · 플레이어 중심 회전',
      look: '중형 원. 지도가 카메라를 따라 돌아 "앞 = 위"가 늘 성립하고, 테두리의 N 이 움직인다. 주요 목표는 범위 밖으로 나가면 가장자리에 붙는다',
      values: { orientation: 'rotate', zoomScale: 1.2, mapSize: 300, edgeClamp: true, edgeMargin: 18, iconHierarchy: 'three-tier', viewCone: true, fovDeg: 70, bgOpacity: 0.75 },
    },
    {
      id: 'tactical-north-up',
      name: '전술 작전 · 북쪽 고정 광역',
      look: '큰 원에 넓은 범위. 지도는 고정되고 화살표와 시야 원뿔만 돈다. "북동쪽 창고"처럼 절대 방위로 팀원과 말하기 좋다',
      values: { orientation: 'north-up', zoomScale: 0.7, mapSize: 400, edgeClamp: true, edgeMargin: 18, iconHierarchy: 'three-tier', viewCone: true, fovDeg: 90, bgOpacity: 0.9 },
    },
    {
      id: 'no-minimap',
      name: '몰입 우선 · 미니맵 없음',
      look: '원이 사라지고 바닥의 앰버 점열이 목표 방향만 알려 준다. 정확한 거리와 여러 목표를 함께 보는 능력은 포기한다',
      values: { orientation: 'none', zoomScale: 1, mapSize: 300, edgeClamp: false, edgeMargin: 18, iconHierarchy: 'three-tier', viewCone: false, fovDeg: 70, bgOpacity: 0.2 },
    },
  ],
  events: [
    { id: 'turn', label: '카메라 오른쪽 90°' },
    { id: 'far-objective', label: '먼 목표 지정 (범위 밖)' },
    { id: 'zoom-step', label: '축척 단계 (0.7 → 1.2 → 2.5×)' },
    { id: 'enemy-ping', label: '잔해 드론 감지' },
    { id: 'arrive', label: '목표 도착' },
  ],
  hotspots: [
    {
      n: 1,
      part: 'orientation-setting',
      title: '회전형이냐 북쪽 고정이냐 — 플레이어가 고르게 한다',
      body: '**회전형**은 플레이어 화살표를 고정하고 지도를 카메라 반대로 돌린다. "앞 = 위"라 길 찾기가 직관적이다. **북쪽 고정형**은 지도를 그대로 두고 화살표와 시야 원뿔만 돌린다. 아이콘 위치가 늘 같아 외우기 쉽고 "북동쪽"처럼 말하기 좋다. 선호가 갈리므로 장르에 맞는 기본값을 정하고 **설정에서 바꾸게** 한다. M 키로 번갈아 보자. 미니맵을 아예 빼고 월드 안 신호로 안내하는 선택지는 [화면 밖 목표 표시 — 환경 신호](#/s/offscreen-waypoint?preset=ambient) 에서 다룬다.',
      principle: '접근성',
    },
    {
      n: 2,
      part: 'edge-marker',
      title: '범위 밖 목표는 버리지 말고 가장자리에 붙이고 모양을 바꾼다',
      body: '목표가 축척 밖으로 나가면 원 중심→목표 방향으로 **테두리 안쪽에 고정**하고, 바깥을 가리키는 쐐기와 거리(m)를 붙인다. 아이콘은 작아지고 속이 빈 고리로 바뀌어 "원 안의 실제 위치"와 구분된다. 이 표시는 **마스크 바깥 레이어**에 둬야 잘리지 않는다. "축척 단계"를 눌러 목표가 원 안팎을 오가는 순간을 보자.',
      principle: '즉각 피드백',
    },
    {
      n: 3,
      part: 'icon-tier',
      title: '아이콘 위계는 크기·모양·그리기 순서로, 색은 보조로',
      body: '주요 목표는 가장 큰 **과녁**을 맨 위에, 위험은 중간 크기 **삼각형**, 채집·보급 같은 주변 정보는 작은 **사각 점**을 맨 아래에 그린다. 모양이 다르면 아이콘이 겹쳐도 빨리 훑을 수 있고, 색을 구분하기 어려운 사람도 읽는다. 위험만 원 밖에서도 경보 중일 때 가장자리에 붙인다. "평면"으로 바꿔 비교해 보자.',
      principle: '시각 위계',
    },
    {
      n: 4,
      part: 'north-indicator',
      title: '회전형에서도 N 은 테두리에 붙여 둔다',
      body: '지도가 돌면 절대 방위를 잃기 쉽다. **N 표시를 테두리를 따라 움직이게** 하되 글자는 늘 바로 세운다. 북쪽 고정인 전체 지도를 열었을 때 머릿속에서 방향을 다시 맞추는 수고가 줄어든다. "카메라 오른쪽 90°"를 누르면 지도와 N 이 함께 반시계로 돈다.',
      principle: '인지 부하',
    },
    {
      n: 5,
      part: 'view-cone',
      title: '시야 원뿔은 게임 화면을 그린 카메라 방위로 계산한다',
      body: '원뿔은 캐릭터 몸 방향이 아니라 **월드 뷰를 돌린 것과 같은 카메라 방위 값**에서 계산한다. 그래야 미니맵의 부채꼴과 화면에 보이는 장면이 일치한다. 카메라가 이미 스무딩된다면 지도에서 **한 번 더 거르지 않는다** — 두 번 거르면 지도가 화면보다 늦게 돈다. 효과를 끄면 지도가 달리기 동작으로 흔들리는 몸 방향을 그대로 따라가 덜덜 떨리고, 회전 때 화면보다 먼저 툭 꺾인다.',
      principle: '일관성',
    },
  ],
  mistakes: [
    { title: '아이콘까지 지도와 함께 회전', body: '회전형에서 아이콘을 회전하는 지도 레이어의 **자식**으로 두면 아이콘과 글자가 기울고 거꾸로 선다. 아이콘은 회전하지 않는 형제 레이어에 두고, **위치만** 같은 각도로 돌린 오프셋으로 계산한다. 효과 끄기에서 핀이 기우는 모습을 확인하자.' },
    { title: '범위 밖 목표가 그냥 사라짐', body: '축척을 키우거나 멀리 이동하면 목표가 마스크에 잘려 없어진다. 그러면 전체 지도를 열어야만 방향을 안다. 가장자리 표시는 마스크 **바깥** 레이어에 둔다.' },
    { title: '모든 아이콘이 같은 크기·색·모양', body: '보급 상자·적·목표가 똑같이 그려지면 원 안이 "아이콘 수프"가 된다. 주요 목표 하나만 가장 강하게, 나머지는 단계적으로 약하게. 색만 바꾸면 색각 이상인 사람에게는 여전히 같아 보이므로 **모양**도 나눈다.' },
    { title: '방향 방식을 하나로 강제', body: '회전형만, 또는 북쪽 고정만 제공하면 반대쪽이 편한 플레이어는 계속 헷갈린다. 두 방식이 **같은 변환 함수**(오프셋 × 축척 → 회전 각도만 다름)를 쓰게 처음부터 설계하면 설정 하나로 바꿀 수 있다.' },
    { title: '원형인데 RectMask2D 사용', body: 'Unity UGUI 의 `RectMask2D` 는 사각형만 자른다. 원형 이미지 위에 붙여도 모서리 바깥이 그대로 보인다. 원형 클리핑은 `Mask`(스텐실)로 처리하고, 마스크는 한 단계로 유지한다.' },
  ],
  juiceOff:
    '스무딩·위계·가장자리 표시·N·시야 원뿔을 모두 끈 나쁜 예. 지도가 **몸 방향 원값**을 그대로 따라가 덜덜 떨리고 회전 때 화면보다 먼저 툭 꺾인다. 아이콘은 지도 레이어의 자식이라 함께 돌아 **기울고**, 모두 같은 흰 핀이라 무엇이 목표인지 모른다. 범위 밖 목표는 잘려 사라지고, 확대·축소는 한 프레임에 바뀌며, 드론 감지에도 파동이 없다. 미니맵 없음 모드에서는 점열이 모두 같은 밝기라 어느 쪽 끝이 목표인지 읽기 어렵다.',
  timings: [
    { event: '카메라 방위 스무딩 (월드 뷰·회전형 지도·시야 원뿔 공통)', ms: 310, easing: '지수 스무딩 λ = 3.2 (시간 상수 약 0.31초, 각도 차이는 -180~180° 로 감싼다)', note: '갤러리 자체 권장값. 이 값 하나로 게임 화면과 미니맵을 함께 돌린다 — 지도는 스무딩된 카메라 방위를 그대로 쓴다' },
    { event: '지도 쪽 방위 추종 (카메라가 스무딩되지 않는 게임만)', ms: 120, easing: '지수 스무딩 τ = 0.12초', note: '권장값. 카메라 방위가 이미 스무딩된다면 0 으로 둔다(이중 스무딩 금지). 몸 방향·흔들림이 섞인 원값을 쓸 때만 두고, 300ms 를 넘으면 방향이 늦게 따라와 헷갈린다' },
    { event: '확대·축소 축척 보간', ms: 250, easing: 'ease-out-cubic', note: '권장값. 즉시 바뀌면 아이콘이 순간이동해 위치 관계를 놓친다' },
    { event: '원 안 ↔ 가장자리 전환', ms: 150, easing: 'ease-out', note: '권장값. 크기와 쐐기 표시만 짧게 전환하고, 위치는 매 프레임 계산하므로 보간하지 않는다' },
    { event: '드론 감지 파동', ms: 600, easing: 'ease-out-quad (크기 0.4→1.6, 투명도 1→0)', note: '권장값. 한 번만 재생한다 — 반복 깜박임은 인지 부하를 키운다' },
    { event: '새 목표 아이콘 등장', ms: 300, easing: 'ease-out-back (최대 약 1.15배)', note: '권장값. 살짝 튀어나오며 "새로 생김"을 알린다' },
    { event: '완료한 목표 아이콘 소멸', ms: 200, easing: 'ease-in-quad (크기 1→1.3, 투명도 1→0)', note: '권장값' },
    { event: '미니맵 없음: 점열 순차 점등 한 주기', ms: 1200, easing: '가우스 파형 (가까운 점부터)', note: '갤러리 자체 권장값. 동작 줄이기 설정이면 정지된 점열로 대체' },
  ],
  unity: {
    ugui: {
      hierarchy: `Canvas_HUD (Screen Space - Overlay, Canvas Scaler 1920×1080)
└─ MinimapCanvas (하위 Canvas — 매 프레임 갱신을 메인 HUD 와 분리)
   └─ MinimapRoot (RectTransform, 앵커 좌상단, 300×300)   ← CircularMinimap.cs · MinimapDemo.cs
      ├─ MaskCircle (Image: 원형 스프라이트 + Mask, Show Mask Graphic 끔)
      │  ├─ MapPivot (RectTransform, pivot 0.5 — 회전형이면 Z 회전, localScale = 축척)
      │  │  └─ MapImage (RawImage: 북쪽이 위인 지도 텍스처)
      │  ├─ ViewCone (Image · Filled · Radial 360 · Origin Top)
      │  └─ InRangeIcons (회전하지 않음 · Raycast Target 끔)
      │     ├─ Icon_Minor… / Icon_Danger… / Icon_Primary (위계 순서로 정렬)
      │     └─ PingWave (Image 링 + CanvasGroup)
      ├─ Ring (Image: 테두리 링)
      ├─ PlayerArrow (Image)
      ├─ EdgeMarkers (마스크 바깥!)
      │  ├─ Edge_Primary (Image 고리) ─ Wedge (Image)
      │  ├─ Edge_Danger… (Image 삼각형) ─ Wedge (Image)
      │  └─ Distance (TextMeshProUGUI)
      └─ North (TextMeshProUGUI "N")`,

      steps: [
        '원형 스프라이트로 **MaskCircle** 을 만들고 `Mask` 를 붙인 뒤 Show Mask Graphic 을 끈다. 미니맵은 **하위 Canvas** 에 둬서 매 프레임 갱신이 다른 HUD 를 다시 그리지 않게 한다.',
        '`CircularMinimap.cs` 를 MinimapRoot 에 붙이고 플레이어·카메라 Transform, MapPivot, MapImage, 아이콘 목록을 인스펙터에서 연결한다 (Find 계열 검색 금지).',
        '변환 함수 하나: `offset = (target.xz - player.xz) × pixelsPerMeter × zoom`. UGUI 는 y 가 위로 증가하므로 월드 z 를 그대로 y 로 쓴다.',
        '**회전형**: 카메라 yaw(위에서 볼 때 시계 +)를 `MapPivot.localEulerAngles = (0, 0, yaw)` 로 준다(카메라가 이미 스무딩되면 `yawTau = 0` 으로 그대로, 아니면 0.12초로 스무딩) — UI 의 +Z 는 화면 반시계라 지도가 반대로 돈다. 아이콘 위치도 `Quaternion.Euler(0, 0, yaw) * offset` 으로 돌리되 아이콘 자체는 회전하지 않는 InRangeIcons 아래에 둔다.',
        '**북쪽 고정**: 지도·아이콘은 돌리지 않고 PlayerArrow 와 ViewCone 에만 `Z = -yaw` 를 준다. 두 방식은 enum 하나로 분기하고 변환 함수는 공유한다.',
        '범위 밖이면(`offset.magnitude > radius - edgeMargin`) EdgeMarkers 쪽 표시를 켜고 `offset.normalized × (radius - edgeMargin)` 에 둔다. 쐐기(Wedge)는 Pivot 을 기본값 (0.5, 0.5) 로 두고 코드에서 `anchoredPosition = dir × 30` 으로 바깥쪽에 옮긴 뒤 `Atan2` 각도로 돌린다. 거리 글자는 정수가 바뀔 때만 갱신한다.',
        '모든 갱신은 **LateUpdate** 에서 한다 — 카메라와 플레이어가 움직인 뒤라야 1프레임 늦은 떨림이 없다. `MinimapDemo.cs` 로 갤러리와 같은 숫자키를 눌러 확인한다.',
      ],
      pitfalls: [
        '원형에 `RectMask2D` 를 쓰면 사각형으로 잘린다. 원형은 `Mask`(스텐실). Mask 를 여러 겹 중첩하면 스텐실 단계와 드로우콜이 는다.',
        'EdgeMarkers 를 MaskCircle 안에 두면 테두리 표시가 반쯤 잘린다. 반드시 마스크 **바깥 형제**로 둔다.',
        '회전 부호: 월드 yaw 는 위에서 볼 때 시계 +, UI 의 Z 회전은 화면 반시계 +. 그래서 회전형 지도는 `+yaw`, 북쪽 고정 화살표는 `-yaw` 다. Play 모드에서 오른쪽으로 돌 때 지도가 반시계로 도는지 꼭 확인한다.',
        '카메라 흔들림(피격 쉐이크)을 더한 yaw 를 그대로 넣으면 지도도 떨린다. 흔들림을 더하기 **전** 값을 쓰고 스무딩한다.',
        '아이콘 Image 의 Raycast Target 을 끄지 않으면 미니맵이 클릭을 가로챈다.',
      ],
    },
    uitk: {
      hierarchy: `UIDocument (Panel Settings: Scale With Screen Size, 1920×1080)
└─ CircularMinimap.uxml
   └─ #minimap-root (.minimap, picking-mode Ignore)   ← CircularMinimapUITK.cs
      ├─ #mask (.minimap__mask — border-radius 50% + overflow hidden)
      │  ├─ #map-pivot (.minimap__pivot — 회전형이면 rotate, 축척은 scale)
      │  │  └─ #map-image (.minimap__map — 북쪽이 위인 지도)
      │  ├─ #view-cone (Painter2D 부채꼴)
      │  └─ #icons-in (회전하지 않음 · .icon--minor/danger/primary 를 C# 에서 위계 순서로 생성)
      ├─ #ring · #ring-inner (단색 두 겹 링) · #player
      ├─ #icons-edge (마스크 바깥)
      │  └─ #edge-primary > #edge-wedge · .edge__ring · Label #edge-dist
      └─ Label #north`,
      steps: [
        '**Panel Settings** 를 Scale With Screen Size, 1920×1080 으로 맞추고 UIDocument 에 `CircularMinimap.uxml` 을 연결한다.',
        '`#mask` 에 `border-radius: 50%` 와 `overflow: hidden` 을 함께 준다 (USS 참고). 둥근 마스크는 스텐실로 처리된다.',
        '`CircularMinimapUITK.cs` 의 `OnEnable` 에서 `Q<VisualElement>("map-pivot")` 등으로 요소를 찾아 캐싱한다.',
        'UGUI 와 같은 식으로 y-up 오프셋을 계산하고 **화면에 놓을 때만 y 를 뒤집는다**(UITK 는 y 가 아래로 증가). 위치는 `style.translate`, 회전은 `style.rotate` 로 준다.',
        '회전형: UITK `rotate` 는 화면 **시계 방향이 +** 라서 지도는 `new Rotate(-yaw)`. 북쪽 고정은 `#player` 와 `#view-cone` 에 `new Rotate(yaw)`.',
        '시야 원뿔은 `generateVisualContent` 에서 `Painter2D.Arc` 로 부채꼴을 그리고, 시야각이 바뀌면 `MarkDirtyRepaint()` 를 부른다.',
      ],
      pitfalls: [
        '`overflow: hidden` 만 주고 `border-radius` 를 빠뜨리면 사각형으로 잘린다.',
        'UGUI 식을 그대로 옮기면 y 와 회전 방향이 뒤집힌다. UITK 는 y 아래 +, rotate 시계 + 다.',
        '`style.left/top` 으로 매 프레임 옮기면 레이아웃 재계산이 늘어난다. `translate`·`rotate`·`scale` 을 쓴다.',
        '`picking-mode` 는 USS 속성이 아니다. UXML 속성이나 C# `pickingMode` 로 지정해 게임 입력을 가로채지 않게 한다.',
        '이 UITK 예제는 핵심만 담았다 — 위험 아이콘의 경보 중 가장자리 고정·감지 파동·링 눈금은 UGUI 버전을 참고해 같은 방식으로 붙인다. 축척 보간(250ms ease-out-cubic)과 두 겹 링은 두 버전이 같다.',
        'Player Settings 의 Depth and Stencil Buffers 가 꺼져 있으면 둥근 마스크가 플랫폼에 따라 제대로 그려지지 않을 수 있다.',
      ],
    },
  },
  inspiredBy: [
    {
      title: 'Genshin Impact (2020)',
      credit: '© miHoYo / © HoYoverse',
      borrowed: [],
      learned:
        '확인된 근거는 하나다 — 설정의 **기타(Other)** 메뉴에서 미니맵을 **고정형과 회전형 중 고를 수 있다**(v1.5 기준, 접근성 메뉴 분석 기사). 여기서 "방향 방식은 플레이어가 고르게 한다"는 설계를 배워 `orientation` 과 해설 1번으로 옮겼다. 원작 미니맵의 위치·모양·아이콘·회전 보간은 출처로 확인하지 못해(미확인) 시각 축은 빌리지 않았다. 원작의 퀘스트 아이콘·색·장식도 쓰지 않는다.',
      link: 'https://caniplaythat.com/2021/05/06/genshin-impact-accessibility-menu-deep-dive/',
    },
    {
      title: 'Ghost of Tsushima (2020)',
      credit: '© Sony Interactive Entertainment',
      borrowed: [],
      learned:
        '비교 사례. 개발 중 쓰던 나침반을 지우고 화면 구석에 상시 미니맵을 두지 않는 쪽을 택했다는 회고(기사 요약 기준)에서 "미니맵을 아예 빼는 것도 선택지"라는 대조점만 가져왔다. 이 표본의 "미니맵 없음"은 짧은 비교이며, 환경 신호 안내는 [화면 밖 목표 표시 — 환경 신호](#/s/offscreen-waypoint?preset=ambient) 표본에서 자세히 다룬다.',
      link: 'https://www.gameinformer.com/2021/05/20/more-than-just-dots-on-a-map-the-challenges-behind-open-world-game-creation',
    },
  ],
  original:
    '절차 생성한 지형(이끼 들판·호수·흙길·숲·정비 기지), 과녁형 주요 목표·삼각형 위험·사각 점 주변 정보 아이콘, 쐐기형 가장자리 표시, 단색 두 겹 링과 N 표시, 링 아래 방향 방식 토글, 앰버 바닥 점열과 모든 문구·색은 이 갤러리에서 새로 만든 것이다. 다이아몬드(마름모) 계열 목표 아이콘과 자연물 바람 연출은 쓰지 않는다. 같은 화면에서 회전형·북쪽 고정·미니맵 없음을 즉시 바꿔 보는 비교 무대는 교육용 장치다.',
  references: [
    { label: 'Can I Play That — Genshin Impact 접근성 메뉴 분석 (v1.5, 미니맵 고정/회전 옵션)', url: 'https://caniplaythat.com/2021/05/06/genshin-impact-accessibility-menu-deep-dive/' },
    { label: 'Genshin Impact 공식 사이트', url: 'https://genshin.hoyoverse.com/en/home' },
    { label: 'Game Informer — 오픈월드 길찾기 설계의 어려움 (2021)', url: 'https://www.gameinformer.com/2021/05/20/more-than-just-dots-on-a-map-the-challenges-behind-open-world-game-creation' },
    { label: 'Unity UGUI — Mask', url: 'https://docs.unity3d.com/Packages/com.unity.ugui@2.0/manual/script-Mask.html' },
    { label: 'Unity UGUI — RectMask2D', url: 'https://docs.unity3d.com/Packages/com.unity.ugui@2.0/manual/script-RectMask2D.html' },
    { label: 'Unity 6.3 — UI Toolkit 마스킹', url: 'https://docs.unity3d.com/6000.3/Documentation/Manual/UIE-masking.html' },
    { label: 'Unity 6.3 — USS transform (rotate 부호·성능)', url: 'https://docs.unity3d.com/6000.3/Documentation/Manual/UIE-Transform.html' },
    { label: 'Unity 6.3 — Painter2D.Arc', url: 'https://docs.unity3d.com/6000.3/Documentation/ScriptReference/UIElements.Painter2D.Arc.html' },
  ],
  related: [
    { id: 'offscreen-waypoint', why: 'HUD 없이 환경 신호로 길을 안내하는 방식과, 화면 가장자리에 목표를 붙잡는 같은 원리(edgeMargin)를 3D 로 다룬다' },
    { id: 'settings-accessibility', why: '미니맵 방향 방식 같은 선택지를 설정 화면에서 어떻게 보여 주고 바꾸게 하는지' },
  ],
}
