import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'offscreen-waypoint',
  title: '화면 밖 목표 표시 + 나침반',
  titleEn: 'Off-screen Waypoint & Compass',
  group: 'B',
  order: 2,
  paradigms: ['spatial', 'non-diegetic'],
  oneLiner: '화면 안에서는 목표 위에, 화면 밖으로 나가면 가장자리에 붙잡아 두는 길안내 표시',
  goals: [
    '월드 좌표를 화면 좌표로 바꾸는 **투영(WorldToScreenPoint)** 과정을 설명할 수 있다',
    '카메라 **뒤쪽** 목표가 화면에 거울상으로 나타나는 버그의 원인과 해결법을 안다',
    '화면 밖 목표를 **여백 안쪽 사각형·타원**에 고정하는 계산을 구현할 수 있다',
    '나침반 띠가 화면 밖 표시와 어떻게 역할을 나누는지 설명할 수 있다',
  ],
  principles: ['가독성', '인지 부하', '일관성'],
  platforms: ['pc', 'console'],
  inputs: ['mouse', 'keyboard', 'gamepad'],
  genres: ['오픈월드', 'FPS', '액션 어드벤처'],
  difficulty: 2,
  stage: { aspect: '16:9', three: true, backdrop: 'none' },
  params: [
    { key: 'edgeMargin', label: '가장자리 여백', type: 'range', min: 20, max: 220, step: 10, default: 80, unit: 'px', hint: '화면 밖 표시가 붙는 경계를 화면 끝에서 얼마나 안쪽에 둘지. 너무 작으면 모니터 베젤·TV 오버스캔에 가려진다' },
    {
      key: 'clampShape',
      label: '경계 모양',
      type: 'select',
      default: 'rect',
      options: [
        { value: 'rect', label: '사각형' },
        { value: 'ellipse', label: '타원' },
      ],
      hint: '타원은 모서리로 몰리지 않아 방향을 읽기 쉽고, 사각형은 화면을 넓게 쓴다',
    },
    { key: 'showDistance', label: '거리 표시', type: 'toggle', default: true },
    { key: 'compass', label: '나침반 띠', type: 'toggle', default: true },
    { key: 'compassFov', label: '나침반 범위', type: 'range', min: 90, max: 360, step: 15, default: 180, unit: '°', hint: '나침반 띠 전체가 보여 주는 각도. 넓을수록 뒤쪽 목표까지 보인다' },
    { key: 'fadeNear', label: '가까우면 흐리게', type: 'range', min: 0, max: 30, step: 1, default: 8, unit: 'm', hint: '목표에 다가가면 표시가 목표 자체를 가리지 않도록 흐려진다 (0 = 끔)' },
    { key: 'showGuide', label: '경계 가이드 보기', type: 'toggle', default: false, hint: '수업용: 클램프 경계를 점선으로 표시' },
  ],
  presets: [
    {
      id: 'open-world',
      name: '오픈월드 탐험',
      look: '나침반 띠가 주인공. 넓은 범위로 주변 목표를 한눈에, 화면 밖 표시는 보조',
      values: { edgeMargin: 90, clampShape: 'rect', showDistance: true, compass: true, compassFov: 210, fadeNear: 10 },
    },
    {
      id: 'tactical-shooter',
      name: '전술 슈터',
      look: '나침반은 좁게, 화면 밖 표시는 타원에 붙여 시선 이동을 줄인다',
      values: { edgeMargin: 140, clampShape: 'ellipse', showDistance: true, compass: true, compassFov: 120, fadeNear: 4 },
    },
    {
      id: 'minimal',
      name: '미니멀 시네마틱',
      look: 'HUD를 최소화. 거리·나침반 없이 방향만 알려 준다',
      values: { edgeMargin: 180, clampShape: 'ellipse', showDistance: false, compass: false, compassFov: 180, fadeNear: 15 },
    },
  ],
  events: [
    { id: 'left', label: '왼쪽으로 60°' },
    { id: 'right', label: '오른쪽으로 60°' },
    { id: 'next', label: '추적 목표 전환' },
    { id: 'walk', label: '앞으로 이동' },
  ],
  hotspots: [
    { n: 1, part: 'marker-on', title: '화면 안: 목표 바로 위', body: '목표의 월드 좌표를 화면 좌표로 투영해 그 위에 표시한다. 3D 공간에 붙어 있지만 캐릭터는 볼 수 없는 **Spatial UI** 다.', principle: '가독성' },
    { n: 2, part: 'marker-off', title: '화면 밖: 가장자리에 고정 + 화살표', body: '목표가 화면을 벗어나면 화면 중심에서 목표 방향으로 뻗은 선이 **여백 경계**와 만나는 점에 붙잡아 둔다. 화살표가 바깥을 가리켜 "어느 쪽으로 돌면 되는지" 알려 준다.', principle: '인지 부하' },
    { n: 3, part: 'margin', title: '여백: 베젤과 오버스캔 대비', body: 'TV는 화면 가장자리가 잘려 보일 수 있다(오버스캔). 콘솔 게임은 보통 화면의 바깥 5~10%를 **세이프 영역**으로 비워 둔다. "경계 가이드 보기"를 켜서 확인해 보자.', principle: '가독성' },
    { n: 4, part: 'compass', title: '나침반 띠: 주변 전체를 한 줄로', body: '화면 밖 표시는 "방향"만 알려 주지만, 나침반은 **여러 목표의 상대 위치**를 한 줄에 정렬해 보여 준다. 둘을 함께 쓰면 역할이 나뉜다.', principle: '시각 위계' },
    { n: 5, part: 'distance', title: '거리 숫자', body: '거리는 "지금 갈 만한가"를 판단하게 해 준다. 가까워지면 표시를 흐리게 해서 목표 자체를 가리지 않게 한다.', principle: '인지 부하' },
  ],
  mistakes: [
    { title: '카메라 뒤쪽 목표가 거울상으로 나타남', body: '`WorldToScreenPoint` 결과는 카메라 **뒤쪽** 점도 화면 안 좌표로 돌려준다(좌우·상하 반전). `z < 0` 인지 먼저 검사해야 한다. "효과 끄기"로 이 버그를 직접 확인할 수 있다.' },
    { title: '화면 밖 목표를 그냥 숨김', body: '보이지 않는 목표는 존재하지 않는 것과 같다. 플레이어가 길을 잃고 지도를 계속 열게 된다.' },
    { title: '화면 끝에 딱 붙임', body: '여백 없이 붙이면 모니터 베젤·TV 오버스캔에 가려지고, 다른 HUD(체력·미니맵)와 겹친다.' },
    { title: '거리와 상관없이 같은 크기', body: '가까운 목표 표시가 목표를 통째로 가린다. 가까울수록 흐리거나 작게 만든다.' },
  ],
  juiceOff: '경계 고정·화살표·회전 보간을 끄고 단순 투영만 한 상태. 화면 밖 목표는 **사라지고**, 카메라 뒤쪽 목표는 화면 반대편에 **거울상으로 잘못** 나타난다.',
  timings: [
    { event: '카메라 회전 보간', ms: 400, easing: '지수 감쇠 (λ=5)', note: '시점이 튀지 않게' },
    { event: '화면 밖 표시 깜빡임 주기', ms: 1400, easing: 'ease-in-out', note: '밝기만 살짝 — 주의를 끌되 시끄럽지 않게' },
    { event: '가까이 갈 때 흐려짐', ms: 0, easing: '거리 비례', note: '시간이 아니라 거리로 제어' },
  ],
  unity: {
    ugui: {
      hierarchy: `Canvas_HUD (Screen Space - Overlay, Canvas Scaler 1920×1080)
├─ WaypointLayer (RectTransform, 전체 화면 Stretch)
│  └─ WaypointMarker (프리팹: Icon · Arrow · DistanceText)
└─ CompassBar (RectMask2D, 상단 중앙)
   ├─ Ticks (RawImage, uvRect 로 스크롤)
   └─ CompassIcon (목표마다 1개)`,
      steps: [
        '목표 Transform 마다 `WaypointMarker` 프리팹을 하나씩 만든다.',
        '`Camera.WorldToScreenPoint` 로 화면 좌표를 얻고, **`z < 0` 이면 카메라 뒤쪽**으로 판단한다.',
        '화면 안이면 그대로, 밖이면 중심→목표 방향 벡터를 여백 사각형과 만나는 점까지 늘려 배치한다 (`WaypointMarker.cs` 의 `ClampToEdge`).',
        'Overlay Canvas 라도 Canvas Scaler 가 있으면 픽셀 좌표 ≠ 캔버스 좌표다. `RectTransformUtility.ScreenPointToLocalPointInRectangle` 로 변환한다.',
        '나침반은 `Vector3.SignedAngle(카메라 정면, 목표 방향, Vector3.up)` 으로 상대 각도를 구해 띠 위 x 위치로 바꾼다.',
      ],
      pitfalls: [
        'Screen Space - Overlay 에서는 `ScreenPointToLocalPointInRectangle` 의 카메라 인자로 **null** 을 넘긴다. Screen Space - Camera 면 그 카메라를 넘긴다.',
        '마커가 많으면 매 프레임 레이아웃이 다시 계산되지 않도록 Layout Group 을 쓰지 말고 `anchoredPosition` 만 바꾼다.',
        '분할 화면(멀티플레이)에서는 `Screen.width` 대신 카메라의 `pixelRect` 를 기준으로 계산해야 한다.',
      ],
    },
    uitk: {
      hierarchy: `UIDocument (Panel Settings 1920×1080)
└─ Waypoints.uxml
   ├─ #waypoint-layer (position: absolute, 전체)
   │  └─ .waypoint (C# 에서 목표마다 생성)
   │     ├─ .waypoint__arrow
   │     ├─ .waypoint__icon
   │     └─ Label .waypoint__dist
   └─ #compass (overflow: hidden)`,
      steps: [
        '`RuntimePanelUtils.CameraTransformWorldToPanel(panel, 월드좌표, camera)` 로 월드 좌표를 **패널 좌표**로 바로 바꾼다 (Panel Settings 의 배율이 반영됨).',
        '카메라 뒤쪽 판정은 `camera.WorldToViewportPoint(pos).z < 0` 으로 따로 한다.',
        '화면 밖이면 패널 크기(`panel.visualTree.layout`)에서 여백을 뺀 사각형에 고정하고, 화살표는 `style.rotate = new Rotate(각도)` 로 돌린다.',
        '위치는 `style.translate = new Translate(x, y)` 로 바꾼다. `left/top` 보다 레이아웃 재계산이 적다.',
      ],
      pitfalls: [
        '`CameraTransformWorldToPanel` 도 카메라 뒤쪽 점을 반전된 좌표로 돌려준다. 뒤쪽 검사를 빼먹지 말 것.',
        '패널 크기는 첫 레이아웃 전에는 NaN 이다. `GeometryChangedEvent` 이후부터 계산한다.',
      ],
    },
  },
  inspiredBy: [],
  original: '마커 모양(마름모·고리·화살촉), 나침반 띠 디자인, 3D 장면과 지형, 색 구성은 모두 이 갤러리에서 새로 만든 것이다.',
  references: [],
}
