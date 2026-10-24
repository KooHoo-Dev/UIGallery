import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'red-dot-badge-tree',
  title: '레드닷 알림 배지 트리',
  titleEn: 'Red-Dot Notification Badge Tree',
  group: 'C',
  order: 2,
  paradigms: ['non-diegetic'],
  oneLiner: '로비 → 메뉴 → 탭 → 항목으로 이어지는 빨간 점. 부모는 자식에서 계산해 절대 어긋나지 않게, 할 일과 소식과 홍보는 다르게 꺼지게',
  goals: [
    '빨간 점 데이터는 **항목(잎)** 에만 두고, 메뉴·탭 배지는 자식에서 **계산**해 부모와 자식이 어긋나지 않게 설계할 수 있다',
    '데이터 트리와 배지 UI 를 나누고, 배지가 노드의 변경을 **구독(옵저버)** 하게 만들 수 있다',
    '할 일(받아야 꺼짐) · 소식(보면 꺼짐) · 홍보(약하게) 처럼 **꺼지는 규칙과 무게**를 종류별로 정할 수 있다',
    '점 · 숫자 · 상한(99+) 표시를 화면 단계에 맞게 고를 수 있다',
  ],
  principles: ['시각 위계', '어포던스', '즉각 피드백', '인지 부하', '일관성'],
  platforms: ['mobile', 'pc'],
  inputs: ['touch', 'mouse', 'keyboard'],
  genres: ['모바일 수집형 RPG', '라이브 서비스', 'MMORPG', '공통'],
  difficulty: 2,
  stage: { aspect: 'both', backdrop: 'none' },
  params: [
    {
      key: 'badgeStyle',
      label: '배지 표시',
      type: 'select',
      default: 'auto',
      options: [
        { value: 'auto', label: '자동 (할 일은 숫자, 나머지는 점)' },
        { value: 'count', label: '항상 숫자' },
        { value: 'dot', label: '항상 점' },
      ],
      hint: '숫자는 "몇 개 남았나" 가 의미 있을 때만. 소식·홍보까지 숫자로 세면 숫자가 부풀어 할 일이 묻힌다',
    },
    {
      key: 'countCap',
      label: '숫자 상한',
      type: 'select',
      default: '99',
      options: [
        { value: '9', label: '9+' },
        { value: '99', label: '99+' },
        { value: 'none', label: '없음' },
      ],
      hint: '"우편 대량 도착" 으로 비교. 작은 배지에 세 자리 숫자가 들어가면 배지가 버튼 글자를 덮는다',
    },
    {
      key: 'clearRule',
      label: '점이 꺼지는 때',
      type: 'select',
      default: 'by-type',
      options: [
        { value: 'by-type', label: '종류별 (할 일=받으면, 소식·홍보=보면)' },
        { value: 'on-view', label: '탭을 보기만 하면 전부' },
        { value: 'on-action', label: '항목마다 눌러야 전부' },
      ],
      hint: '보기만 해도 다 꺼지면 받을 보상이 남았는지 모른다. 하나하나 눌러야 꺼지면 소식 점이 끝없이 남아 피로해진다',
    },
    {
      key: 'promoDots',
      label: '홍보 점',
      type: 'select',
      default: 'subtle',
      options: [
        { value: 'subtle', label: '작은 회색 점 (권장)' },
        { value: 'red', label: '다른 점과 똑같이 빨강' },
        { value: 'off', label: '표시 안 함' },
      ],
      hint: '상점 패키지 같은 홍보까지 빨갛게 부르면, 플레이어는 곧 모든 빨간 점을 무시한다',
    },
    { key: 'openToLit', label: '점 있는 탭으로 열기', type: 'toggle', default: true, hint: '메뉴를 열면 빨간 점이 있는 첫 탭을 바로 보여 준다. 끄면 늘 첫 탭이 열려 다시 찾아 들어가야 한다' },
    { key: 'pulseOnNew', label: '새 항목 경로 번쩍임', type: 'toggle', default: true, hint: '새 항목이 생기면 항목 → 탭 → 메뉴 → 로비 순서로 배지가 한 번 튄다. 전파 경로를 눈으로 따라가는 수업용 연출' },
    { key: 'showTree', label: '트리 패널', type: 'toggle', default: true, hint: '데이터 트리와 기록. 실제 게임에는 없는 수업용 패널' },
  ],
  presets: [
    {
      id: 'collector-rpg',
      name: '모바일 수집형 RPG',
      look: '할 일은 숫자, 소식은 점, 홍보는 회색. 메뉴를 열면 점 있는 탭으로',
      values: { badgeStyle: 'auto', countCap: '99', clearRule: 'by-type', promoDots: 'subtle', openToLit: true, pulseOnNew: true, showTree: true },
    },
    {
      id: 'minimal-casual',
      name: '미니멀 캐주얼',
      look: '숫자 없이 점만, 홍보 점은 아예 끈다. 화면이 조용하다',
      values: { badgeStyle: 'dot', countCap: '9', clearRule: 'by-type', promoDots: 'off', openToLit: true, pulseOnNew: false, showTree: true },
    },
    {
      id: 'mmo-heavy',
      name: 'MMORPG 메뉴',
      look: '메뉴가 깊고 많아 숫자로 남은 양을 알려 준다. 상한은 99+',
      values: { badgeStyle: 'count', countCap: '99', clearRule: 'by-type', promoDots: 'subtle', openToLit: true, pulseOnNew: true, showTree: true },
    },
  ],
  events: [
    { id: 'new-mail', label: '새 우편 도착' },
    { id: 'claim-all', label: '모두 받기 (지금 메뉴)' },
    { id: 'next-day', label: '하루 지남' },
    { id: 'promo', label: '홍보 추가' },
    { id: 'mail-flood', label: '우편 대량 도착 (+120)' },
    { id: 'reset', label: '처음부터' },
  ],
  hotspots: [
    {
      n: 1,
      part: 'nav-badge',
      title: '부모는 자식의 합 — 지어내지 않는다',
      body: '우편 버튼의 숫자를 직접 고치는 코드는 어디에도 없다. 그 아래 항목의 점에서 **계산**될 뿐이다(Unity 판은 잎이 켜지고 꺼질 때 +1 · −1 을 조상에게 전한다). 그래서 "새 우편 도착" 을 누르면 항목 → 탭 → 메뉴 → 로비가 차례로 켜지고, 마지막 보상을 받으면 위쪽이 저절로 꺼진다. 할 일은 숫자, 그 외는 점으로 무게를 나눈다.',
      principle: '시각 위계',
      pin: 'right',
    },
    {
      n: 2,
      part: 'tab-badge',
      title: '점을 따라가면 도착한다',
      body: '메뉴의 점은 "여기 안에 있다", 탭의 점은 "이 탭에 있다" 를 말한다. 메뉴를 열면 **점이 있는 탭을 바로** 보여 주면 한 번 더 찾지 않아도 된다. 점이 있는데 들어가 보니 아무것도 없으면(유령 레드닷) 그다음부터 점을 믿지 않는다.',
      principle: '어포던스',
    },
    {
      n: 3,
      part: 'leaf',
      title: '할 일은 해야, 소식은 보면 꺼진다',
      body: '보상(할 일)은 **받아야** 점이 꺼지고, 공지·새 기술(소식)은 **보면** 꺼진다. 보기만 해도 보상 점까지 꺼지면 받을 게 남았는지 모르고, 소식까지 일일이 눌러야 꺼지면 점이 끝없이 남는다. "점이 꺼지는 때" 를 바꿔 비교하자.',
      principle: '즉각 피드백',
    },
    {
      n: 4,
      part: 'promo',
      title: '홍보는 약하게',
      body: '상점 패키지 같은 홍보는 플레이어의 할 일이 아니다. 같은 빨강으로 부르면 "빨간 점 = 무시해도 되는 것" 으로 학습돼 진짜 할 일까지 놓친다. 작은 회색 점으로 낮추거나 아예 끈다.',
      principle: '인지 부하',
      pin: 'right',
    },
    {
      n: 5,
      part: 'tree',
      title: '데이터 트리와 배지 UI 를 나눈다',
      body: '왼쪽 화면은 트리를 **보여 주기만** 한다. 경로 키(`mail/reward/…`)로 만든 노드 트리가 개수를 갖고, 바뀌면 이벤트를 내고, 배지가 그 이벤트를 구독한다(옵저버). 효과를 끄면 화면마다 따로 든 플래그가 실제 개수와 **어긋나는 줄**이 빨갛게 표시된다.',
      principle: '일관성',
    },
  ],
  mistakes: [
    {
      title: '화면마다 따로 bool 플래그',
      body: '"우편 점 켜기" 를 우편 화면 코드가, "탭 점 켜기" 를 탭 코드가 따로 관리하면 반드시 어긋난다. 메뉴를 열면 끄는 코드 때문에 받을 보상이 남았는데 점이 사라지고(사라진 레드닷), "모두 받기" 가 항목만 지워 탭 점이 남는다(유령 레드닷).',
    },
    {
      title: '보기만 하면 전부 끄기',
      body: '구현이 가장 쉽지만 할 일과 소식을 구분하지 않는다. 보상을 받지 않고 나간 플레이어는 다시 찾아 들어갈 단서를 잃는다.',
    },
    {
      title: '모든 것에 빨간 점',
      body: '홍보·이벤트 배너·새 아이템까지 같은 빨강이면 로비가 빨간 점으로 덮인다. 점이 많을수록 점 하나의 의미는 작아진다.',
    },
    {
      title: '숫자 상한 없음',
      body: '작은 원 안에 "137" 을 넣으면 글자가 작아지거나 배지가 버튼 글자를 덮는다. 상한(9+ · 99+)을 두고 정확한 수는 안쪽 화면에서 보여 준다.',
    },
    {
      title: '점 상태를 저장하지 않음',
      body: '"본 적 있음" 을 저장하지 않으면 재접속할 때마다 모든 소식 점이 다시 켜진다. 기기 하나면 PlayerPrefs, 여러 기기면 서버에 둔다 (보상의 받음 여부는 늘 서버가 정답).',
    },
  ],
  juiceOff:
    '흔한 실수인 **화면별 플래그** 방식이다. 항목이 생기면 그 메뉴·탭 플래그를 켜고, 그 화면을 열면 끈다. 그래서 메뉴를 열기만 해도 받을 보상이 남은 채 메뉴 점이 사라지고, "모두 받기" 뒤에도 열어 보지 않은 탭의 점은 남는다(트리 패널의 빨간 줄). 숫자 상한이 없고, 홍보도 똑같이 빨간 점이고, 경로 번쩍임도 없다.',
  timings: [
    { event: '배지 켜짐 (0 → 1 크기)', ms: 160, easing: 'ease-out', note: '권장값. 꺼질 때도 같은 시간' },
    { event: '새 항목 경로 번쩍임 (단계마다)', ms: 150, easing: '—', note: '항목 → 탭 → 메뉴 → 로비, 각 0.5초 튐. 한 번만' },
  ],
  unity: {
    ugui: {
      hierarchy: `RedDotTree (순수 C# 클래스 · MonoBehaviour 아님 — RedDotTree.Instance)
Canvas_Lobby (Canvas Scaler 1920×1080)
├─ Nav
│  ├─ Btn_Mail   (Button)
│  │  └─ RedDot   (RedDotBadge.cs · path="mail" · Image 원 · TextMeshProUGUI Count)
│  ├─ Btn_Mission …   (path="mission")
│  └─ Btn_Shop  …     (path="shop")
└─ MailWindow
   ├─ Tab_Reward (Button) └─ RedDot (path="mail/reward")
   ├─ Tab_Notice (Button) └─ RedDot (path="mail/notice")
   └─ List > Row (TextMeshProUGUI · Button 받기) └─ RedDot (path="mail/reward/item-12")
RedDotDemo (RedDotDemo.cs — 숫자키로 시험)`,
      steps: [
        '`RedDotTree` 는 경로 키(`"mail/reward/item-12"`)로 노드를 만든다. 점은 `SetLeaf(path, on)` 으로 그 노드 자신에만 켜고, 트리는 +1 · −1 을 **조상에게만** 전하며 바뀐 노드마다 `Changed` 이벤트를 낸다. 늘 `Count = 자신 + 자식 합` 이 유지된다.',
        '배지 프리팹에 `RedDotBadge` 를 붙이고 `path` 만 적는다. `OnEnable` 에서 `RedDotTree.Instance.Get(path).Changed` 를 구독하고 `OnDisable` 에서 해제한다. 배지는 **트리를 읽기만** 한다.',
        '보상은 받았을 때 `Remove(path)`(점을 끄고 노드를 뗀다), 공지 같은 소식은 그 탭을 열었을 때 `ClearChildren("mail/notice")` 처럼 종류에 따라 끈다.',
        '표시 방식(`Dot` · `Count`)과 상한(`cap`)은 배지마다 정한다. 메뉴는 점, 탭·목록은 숫자처럼 단계마다 다르게 쓸 수 있다.',
      ],
      pitfalls: [
        '`OnDisable` 에서 구독을 풀지 않으면 꺼진(또는 파괴된) 배지가 이벤트를 받다가 `MissingReferenceException` 이 난다. 창을 열고 닫을 때마다 구독이 쌓이기도 한다.',
        '부모 개수를 매번 자식 전체를 다시 세지 않고 **+1 · −1 만 조상에게** 전한다. 우편이 수천 통이어도 경로 길이(3~4)만큼만 일한다. 받은 우편은 `Remove` 로 떼어 노드가 쌓이지 않게 한다.',
        '`static` 싱글턴은 \'Enter Play Mode Options\' 로 도메인 리로드를 끄면 지난 플레이의 점을 들고 있다. `[RuntimeInitializeOnLoadMethod(SubsystemRegistration)]` 에서 새로 만든다.',
        '"본 적 있음" 은 기기 하나면 `PlayerPrefs`, 여러 기기면 서버에 둔다. 보상을 받았는지는 늘 서버 기준 — 클라이언트 점은 표시일 뿐이다.',
      ],
    },
    uitk: {
      hierarchy: `UIDocument (Panel Settings: Scale With Screen Size 1920×1080)
└─ RedDot.uxml
   ├─ #nav
   │  ├─ Button #nav-mail    > VisualElement .red-dot > Label .red-dot__count   (경로 "mail")
   │  ├─ Button #nav-mission > .red-dot …                                       (경로 "mission")
   │  └─ Button #nav-shop    > .red-dot …                                       (경로 "shop")
   └─ #mail-window
      ├─ Button #tab-reward > .red-dot …   (경로 "mail/reward")
      ├─ Button #tab-notice > .red-dot …   (경로 "mail/notice")
      └─ ScrollView #list (C# 가 보상 행을 만든다)
RedDotUITK.cs (UIDocument 와 같은 오브젝트) + RedDotTree.cs (UGUI 폴더의 것을 그대로)`,
      steps: [
        'UGUI 판의 `RedDotTree.cs`(순수 C#)를 그대로 쓴다. 트리는 UI 기술과 무관하다 — 같은 데이터를 두 UI 가 구독할 수 있다.',
        '배지는 `.red-dot` 요소 하나에 `Label` 하나. 어느 노드를 볼지는 C# 의 **요소 이름 → 경로 표**(`Bindings`)로 정하고, 노드 `Changed` 에서 `EnableInClassList("red-dot--on", n > 0)` 와 글자를 바꾼다.',
        '숫자 배지는 `.red-dot--count` 클래스로 크기를 키운다. 홍보처럼 약한 점이 필요하면 `.red-dot--subtle` 을 함께 켠다(USS 에 준비만 해 두었고, 이 예제에는 홍보 잎이 없다).',
        '`OnDisable` 에서 구독을 모두 푼다 (구독할 때 노드와 핸들러를 목록에 적어 둔다). 창(UIDocument)을 껐다 켜면 UXML 트리가 새로 만들어지므로, 목록 행은 데이터(받지 않은 우편 목록)에서 다시 만든다.',
      ],
      pitfalls: [
        'UXML 에 임의 속성(`data-path`)을 적어도 C# 에서 읽을 수 없다(커스텀 컨트롤 속성으로 선언하지 않으면 무시된다). 이 예제는 C# 의 요소 이름 → 경로 표로 붙인다.',
        '`display: none` 으로 숨긴 배지에는 `transition` 이 동작하지 않는다. 이 예제는 늘 보이게 두고 `scale` 0 ↔ 1 로만 켜고 끈다(배지는 `picking-mode: Ignore`).',
      ],
    },
  },
  inspiredBy: [],
  original:
    '로비 구성(우편 · 임무 · 탐사대 · 상점과 그 탭), 항목 문구, 할 일 · 소식 · 홍보 세 종류의 꺼짐 규칙, 회색 홍보 점, 점 있는 탭으로 열기, 경로 번쩍임, 화면별 플래그와 계산 트리를 나란히 보여 주는 트리 패널은 모두 이 갤러리에서 새로 만들었다. 특정 게임의 화면을 재현하지 않고 모바일·라이브 서비스 게임 전반의 관례를 정리했다.',
  references: [
    { label: 'Refactoring Guru — 옵저버 패턴 (한국어)', url: 'https://refactoring.guru/ko/design-patterns/observer' },
    { label: 'Nielsen Norman Group — Indicators, Validations, and Notifications', url: 'https://www.nngroup.com/articles/indicators-validations-notifications/' },
    { label: 'Unity 6.3 — PlayerPrefs', url: 'https://docs.unity3d.com/6000.3/Documentation/ScriptReference/PlayerPrefs.html' },
    { label: 'Unity 6.3 — VisualElement.EnableInClassList', url: 'https://docs.unity3d.com/6000.3/Documentation/ScriptReference/UIElements.VisualElement.EnableInClassList.html' },
  ],
  related: [
    { id: 'quest-tracker-toasts', why: '한 번 알리고 사라지는 알림(토스트) — 레드닷은 확인할 때까지 남는 "할 일 표시"' },
    { id: 'popup-queue-stack', why: '로비 진입 때 쏟아지는 창 — 점으로 알릴 것과 창으로 띄울 것을 나누는 기준' },
    { id: 'inventory-grid-tooltip', why: '새 아이템 표시가 툴팁을 열면 사라지는 "보면 꺼지는" 점의 예' },
  ],
}
