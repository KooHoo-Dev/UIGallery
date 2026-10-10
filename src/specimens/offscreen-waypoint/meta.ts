import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'offscreen-waypoint',
  title: '화면 밖 목표 표시 + 나침반',
  titleEn: 'Off-screen Waypoint & Compass',
  group: 'B',
  order: 2,
  paradigms: ['spatial', 'non-diegetic'],
  oneLiner: '목표가 보이면 그 위에, 안 보이면 화면 가장자리에 붙잡아 두고, 나침반 띠로 주변 전체를 알려 주는 길안내',
  goals: [
    '월드 좌표를 화면 좌표로 바꾸고 **화면 안 · 화면 밖 · 카메라 뒤**를 구분하는 판정을 구현할 수 있다',
    '화면 밖 목표를 **여백 안쪽 사각형·타원**에 고정하고 화살표를 목표 방향으로 돌릴 수 있다',
    '카메라 정면 기준 각도를 **나침반 띠의 가로 위치**로 바꾸는 매핑을 이해한다',
    '안내 강도(풀 가이드 / 탐험 우선 / 환경 신호)가 플레이 경험을 어떻게 바꾸는지 비교해 설명할 수 있다',
  ],
  principles: ['즉각 피드백', '시각 위계', '인지 부하', '접근성'],
  platforms: ['pc', 'console'],
  inputs: ['mouse', 'keyboard', 'gamepad'],
  genres: ['오픈월드', '액션 어드벤처', 'FPS'],
  difficulty: 2,
  stage: { aspect: '16:9', three: true, backdrop: 'none' },
  params: [
    {
      key: 'guidance',
      label: '안내 강도',
      type: 'select',
      default: 'guided',
      options: [
        { value: 'guided', label: '풀 가이드' },
        { value: 'explorer', label: '탐험 우선' },
        { value: 'ambient', label: '환경 신호' },
      ],
      hint: '풀 가이드 = 마커+거리+나침반 / 탐험 우선 = 나침반만 / 환경 신호 = HUD 없이 바람 줄기로 방향만',
    },
    { key: 'edgeMargin', label: '가장자리 여백', type: 'range', min: 16, max: 220, step: 4, default: 64, unit: 'px', hint: '화살표가 붙는 경계를 화면 끝에서 얼마나 안쪽에 둘지. 너무 작으면 베젤·TV 오버스캔에 잘린다' },
    {
      key: 'clampShape',
      label: '경계 모양',
      type: 'select',
      default: 'rect',
      options: [
        { value: 'rect', label: '사각형' },
        { value: 'ellipse', label: '타원' },
      ],
      hint: '타원은 모서리에서 화살표가 튀지 않고 방향을 읽기 쉽다. 사각형은 화면을 넓게 쓴다',
    },
    { key: 'showDistance', label: '거리 표시', type: 'toggle', default: true },
    { key: 'compassFov', label: '나침반 범위', type: 'range', min: 90, max: 360, step: 15, default: 180, unit: '°', hint: '나침반 띠 전체가 보여 주는 각도. 좁을수록 정밀하지만 뒤쪽 목표는 띠 끝에 고정된다' },
    { key: 'compassObjective', label: '나침반에 목표 아이콘', type: 'toggle', default: true, hint: '끄면 나침반은 주변 관심 지점만, 목표는 월드 마커가 맡는다 (역할 분리)' },
    { key: 'backplate', label: '마커 배경판', type: 'toggle', default: true, hint: '아이콘·숫자 뒤 반투명 판. "눈밭·역광" 이벤트로 밝은 배경에서 차이를 확인해 보자' },
    { key: 'markerScale', label: '마커 크기', type: 'range', min: 0.75, max: 2, step: 0.25, default: 1, unit: '×', hint: '저시력 플레이어를 위한 크기 옵션' },
    { key: 'showGuide', label: '경계 가이드 보기', type: 'toggle', default: false, hint: '수업용: 화살표가 붙는 경계를 점선으로 표시' },
  ],
  presets: [
    {
      id: 'full-guide',
      name: '오픈월드 풀 가이드',
      look: '나침반은 주변 관심 지점만, 목표는 월드 마커+거리로. 타원 경계를 따라 화살표가 미끄러진다',
      values: { guidance: 'guided', edgeMargin: 64, clampShape: 'ellipse', showDistance: true, compassFov: 180, compassObjective: false, backplate: true, markerScale: 1 },
    },
    {
      id: 'explorer',
      name: '탐험 우선 미니멀',
      look: '월드 마커와 거리가 사라지고 좁은 나침반의 목표 아이콘만 방향을 알려 준다. 길은 스스로 찾는다',
      values: { guidance: 'explorer', edgeMargin: 64, clampShape: 'rect', showDistance: false, compassFov: 120, compassObjective: true, backplate: true, markerScale: 1 },
    },
    {
      id: 'ambient',
      name: '환경 신호 (HUD 없음)',
      look: 'HUD가 모두 사라지고 목표 쪽으로 흐르는 바람 줄기만 남는다. "HUD 잠깐 호출"로 필요할 때만 확인',
      values: { guidance: 'ambient', edgeMargin: 64, clampShape: 'ellipse', showDistance: false, compassFov: 180, compassObjective: false, backplate: false, markerScale: 1 },
    },
  ],
  events: [
    { id: 'turn', label: '뒤돌기 180°' },
    { id: 'next', label: '새 목표 지정' },
    { id: 'zone', label: '목표 구역 진입' },
    { id: 'arrive', label: '목표 도착' },
    { id: 'recall', label: 'HUD 잠깐 호출' },
    { id: 'bright', label: '눈밭·역광 전환' },
  ],
  hotspots: [
    { n: 1, part: 'edge-arrow', title: '화면 밖이어도 방향은 사라지지 않는다', body: '목표가 시야를 벗어나면 화면 중심에서 목표 쪽으로 뻗은 선이 **여백 경계**와 만나는 점에 붙잡아 둔다. 화살표가 바깥을 가리켜 "어느 쪽으로 돌면 되는지" 바로 안다. 여백은 TV 오버스캔·베젤에 잘리지 않을 만큼 둔다.', principle: '즉각 피드백' },
    { n: 2, part: 'compass-band', title: '나침반과 월드 마커의 역할 분리', body: '나침반은 **주변 관심 지점의 방향**을, 월드 마커는 **지금 목표**를 맡는다. 모든 아이콘을 한 곳에 몰지 않아 무엇이 "지금 할 일"인지 섞이지 않는다.', principle: '시각 위계' },
    { n: 3, part: 'compass-zone-glow', title: '구역 진입은 띠 색으로', body: '목표 구역에 들어오면 새 아이콘을 띄우는 대신 **기존 띠의 색**만 바꾼다. 정보량을 늘리지 않고 상태 변화를 전한다. "목표 구역 진입" 이벤트로 확인해 보자.', principle: '인지 부하' },
    { n: 4, part: 'marker-backplate', title: '배경판이 가독성을 지킨다', body: '얇은 글자와 배경 없는 아이콘은 밝은 장면에서 묻힌다. 반투명 **배경판**과 **크기 옵션**으로 막는다. "눈밭·역광 전환" 후 배경판을 껐다 켜 보자.', principle: '접근성' },
    { n: 5, part: 'ambient-cue', title: '안내 강도는 플레이어가 고른다', body: '풀 가이드부터 HUD 없는 **환경 신호**까지 선택지를 주면, 효율을 원하는 사람과 발견을 즐기는 사람이 같은 게임을 각자 방식으로 즐긴다.', principle: '몰입' },
  ],
  mistakes: [
    { title: '카메라 뒤 목표를 처리하지 않음', body: '`WorldToScreenPoint` 는 카메라 **뒤쪽** 점에도 좌표를 돌려주는데, 상하좌우가 뒤집혀 있다. `z < 0` 이면 중심 기준으로 뒤집어야 한다. "효과 끄기"로 동료 마커가 엉뚱하게 앞에 나타나는 버그를 직접 확인할 수 있다.' },
    { title: '화면 끝에 딱 붙여 잘리는 화살표', body: '`Screen.width/height` 로만 클램프하면 화살표 절반이 잘리고 노치·오버스캔에 숨는다. `Screen.safeArea` 와 여백을 기준으로 클램프한다.' },
    { title: '캔버스 좌표와 스크린 좌표 혼동', body: 'Canvas Scaler 가 있는데 스크린 픽셀을 `anchoredPosition` 에 그대로 넣으면 해상도마다 위치가 어긋난다. `RectTransformUtility` 로 캔버스 로컬 좌표로 바꾼다.' },
    { title: '매 프레임 떨리고 깜빡이는 마커', body: '카메라가 움직이기 전(`Update`)에 계산하면 한 프레임 늦어 떨린다. `LateUpdate` 에서 계산하고, 거리 글자는 정수가 바뀔 때만 갱신한다 (문자열 생성 = GC).' },
    { title: '나침반에 모든 아이콘을 몰아넣음', body: '목표·관심 지점·적·동료를 모두 띠에 올리면 겹쳐서 아무것도 안 읽힌다. 우선순위를 정하고 겹치면 묶거나 낮은 순위를 숨긴다.' },
  ],
  juiceOff: '화면 밖 판정·클램프·배경판·회전 보간·구역 강조를 모두 끈 상태. 화면 밖 목표는 **사라지고**, 뒤쪽 목표는 화면에 **거울상으로 잘못** 나타나며, 거리 숫자는 소수점까지 매 프레임 깜빡인다.',
  timings: [
    { event: '카메라 회전 보간', ms: 400, easing: '지수 감쇠 (λ=5)', note: '권장값. 시점이 튀지 않게' },
    { event: '화면 밖 마커 밝기 맥동', ms: 1400, easing: 'ease-in-out', note: '권장값. 주의를 끌되 시끄럽지 않게' },
    { event: '구역 진입 띠 강조', ms: 400, easing: 'ease', note: '권장값' },
    { event: 'HUD 잠깐 호출 유지', ms: 3000, easing: '—', note: '권장값. 환경 신호 모드에서만' },
    { event: '안내 모드 전환 페이드', ms: 300, easing: 'ease', note: '권장값' },
  ],
  unity: {
    ugui: {
      hierarchy: `Canvas_HUD (Screen Space - Overlay, Canvas Scaler 1920×1080)
├─ WaypointLayer (RectTransform, 전체 화면 Stretch, Pivot 0.5)
│  └─ WaypointMarker (프리팹: Plate · Icon · Arrow · DistanceText)
└─ CompassBar (RectMask2D, 상단 중앙)
   ├─ Ticks (RawImage, uvRect 로 스크롤)
   └─ CompassIcon (목표마다 1개)`,
      steps: [
        '목표 Transform 마다 `WaypointMarker` 프리팹을 하나씩 만든다.',
        '`Camera.WorldToScreenPoint` 로 화면 좌표를 얻고, **`z < 0` 이면 카메라 뒤쪽** — 로컬 좌표를 중심 기준으로 뒤집는다.',
        '`RectTransformUtility.ScreenPointToLocalPointInRectangle` 로 스크린 픽셀을 레이어 로컬 좌표로 바꾼다 (Overlay Canvas 는 카메라 인자 `null`).',
        '화면 밖이면 중심→목표 방향 벡터를 여백 사각형과 만나는 점까지 늘려 배치하고 화살표를 그 각도로 돌린다 (`ClampToEdge`).',
        '나침반은 `Vector3.SignedAngle(카메라 정면, 목표 방향, Vector3.up)` 으로 상대 각도를 구해 띠 위 x 위치로 바꾼다.',
      ],
      pitfalls: [
        '계산은 카메라가 움직인 뒤인 `LateUpdate` 에서 한다.',
        '마커 위치는 `anchoredPosition` 만 바꾼다. Layout Group 아래에 두면 매 프레임 레이아웃이 다시 계산된다.',
        '분할 화면에서는 `Screen.width` 대신 카메라의 `pixelRect` 를 기준으로 계산한다.',
      ],
    },
    uitk: {
      hierarchy: `UIDocument (Panel Settings 1920×1080)
└─ Waypoints.uxml
   ├─ #waypoint-layer (position: absolute, 전체)
   │  └─ .waypoint (C# 에서 목표마다 생성)
   │     ├─ .waypoint__arrow > .waypoint__arrow-shape
   │     ├─ .waypoint__icon
   │     └─ Label .waypoint__dist
   └─ #compass (overflow: hidden)`,
      steps: [
        '`RuntimePanelUtils.CameraTransformWorldToPanel(panel, 월드좌표, camera)` 로 월드 좌표를 **패널 좌표**로 바로 바꾼다 (Panel Settings 배율 반영).',
        '카메라 뒤쪽 판정은 `camera.WorldToViewportPoint(pos).z < 0` 으로 따로 한다.',
        '화면 밖이면 패널 크기(`layer.layout`)에서 여백을 뺀 사각형에 고정하고, 화살표는 `style.rotate` 로 돌린다.',
        '위치는 `style.translate` 로 바꾼다. `left/top` 보다 레이아웃 재계산이 적다.',
      ],
      pitfalls: [
        '`CameraTransformWorldToPanel` 도 카메라 뒤쪽 점을 반전된 좌표로 돌려준다. 뒤쪽 검사를 빼먹지 말 것.',
        '패널 크기는 첫 레이아웃 전에는 NaN 이다. 값이 생긴 뒤부터 계산한다.',
        'USS 에는 CSS 테두리 삼각형 같은 트릭이 없다. 화살표 모양은 스프라이트(background-image)로 넣는다.',
      ],
    },
  },
  inspiredBy: [
    {
      title: 'Horizon Forbidden West (2022)',
      credit: '© Sony Interactive Entertainment',
      borrowed: ['레이아웃 구조', '색 체계'],
      learned: '상단 나침반은 주변 관심 지점을, 켜고 끌 수 있는 웨이포인트는 목표와 거리를 맡는 **역할 분리**, 목표 구역에서 나침반이 강조되는 **상태 표시**, 안내 수준을 고르는 옵션 구조. 출시 당시 리뷰가 지적한 작은 아이콘·배경 없는 표시의 가독성 문제는 반면교사로 삼아 배경판과 크기 옵션을 더했다. 화면 밖 클램프 동작은 출처로 확인되지 않아 일반 패턴으로 재구성했다.',
      link: 'https://blog.playstation.com/2022/02/10/accessibility-features-in-horizon-forbidden-west/',
    },
    {
      title: 'Ghost of Tsushima (2020)',
      credit: '© Sony Interactive Entertainment',
      borrowed: ['모션 리듬'],
      learned: '비교 사례. 개발 초기에는 평범한 미니멀 나침반을 썼지만 플레이어가 UI만 쳐다보는 문제가 드러나 **바람으로 길을 안내하는 방식**으로 바꿨다고 개발자들이 회고했다. 정보량은 그대로 두고 화면의 군더더기만 줄인 결정. "환경 신호" 모드는 이 아이디어를 추상적인 선 흐름으로만 옮겼고, 원작의 풀·나뭇잎 연출은 재현하지 않았다.',
      link: 'https://www.gameinformer.com/2021/05/20/more-than-just-dots-on-a-map-the-challenges-behind-open-world-game-creation',
    },
  ],
  original: '마커(마름모·고리·화살촉)와 둥근 삼각형 화살표, 나침반 띠, 관심 지점 아이콘, 바람 줄기 표현, 3D 지형과 모든 색·문구는 이 갤러리에서 새로 만든 것이다. 구역 강조는 원작의 색 대신 청록색을 쓴다. 배경판·크기 배율·경계 모양 전환·경계 가이드는 원작에 없는 교육용 추가 기능이다.',
  references: [
    { label: 'PlayStation Blog — Horizon Forbidden West 접근성 기능 (2022)', url: 'https://blog.playstation.com/2022/02/10/accessibility-features-in-horizon-forbidden-west/' },
    { label: 'Can I Play That — Horizon Forbidden West 접근성 리뷰 (2022)', url: 'https://caniplaythat.com/2022/02/14/horizon-forbidden-west-accessibility-review-can-i-play-that/' },
    { label: 'Game Informer — 오픈월드 길찾기 설계의 어려움 (2021, 나침반 → 바람 교체 회고)', url: 'https://www.gameinformer.com/2021/05/20/more-than-just-dots-on-a-map-the-challenges-behind-open-world-game-creation' },
    { label: 'ESPN — How Sucker Punch made the world of Ghost of Tsushima (2020)', url: 'https://www.espn.com/esports/story/_/id/29524519/how-made-world-ghost-tsushima' },
    { label: 'Unity 6.3 — Camera.WorldToScreenPoint', url: 'https://docs.unity3d.com/6000.3/Documentation/ScriptReference/Camera.WorldToScreenPoint.html' },
    { label: 'Unity 6.3 — RuntimePanelUtils.CameraTransformWorldToPanel', url: 'https://docs.unity3d.com/6000.3/Documentation/ScriptReference/UIElements.RuntimePanelUtils.CameraTransformWorldToPanel.html' },
  ],
  related: [
    { id: 'circular-minimap', why: '같은 "어디로 가야 하나"를 **위에서 내려다본 지도**로 — 회전형과 북쪽 고정형, 범위 밖 아이콘' },
    { id: 'quest-tracker-toasts', why: '목표 마커가 "어디"라면 퀘스트 목록은 "무엇을" — 둘이 같은 목표를 가리키게 맞춘다' },
  ],
}
