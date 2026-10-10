import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'health-bar-trail',
  title: '체력 바: 잔상 + 저체력 화면 효과',
  titleEn: 'Health Bar with Damage Trail',
  group: 'A',
  order: 1,
  paradigms: ['non-diegetic', 'meta'],
  oneLiner: '방금 얼마나 맞았는지, 지금 얼마나 위험한지를 한눈에 보이게 하는 체력 바',
  goals: [
    '체력 바를 **메인 바 · 잔상 바 · 회복 미리보기** 세 겹으로 나눠 설계할 수 있다',
    '잔상이 줄어들기 전 **대기 시간**과 **감소 속도**가 플레이어의 체감에 주는 영향을 설명할 수 있다',
    '저체력 상태를 바 밖의 **화면 효과(Meta UI)** 로 알리는 이유를 말할 수 있다',
    'Unity에서 `Image` 의 **Filled** 타입 두 장으로 잔상 바를 구현할 수 있다',
  ],
  principles: ['즉각 피드백', '시각 위계', '가독성'],
  platforms: ['pc', 'console', 'mobile'],
  inputs: ['mouse', 'keyboard', 'gamepad', 'touch'],
  genres: ['액션', 'RPG', '소울라이크', 'FPS'],
  difficulty: 1,
  stage: { aspect: '16:9', backdrop: 'field' },
  params: [
    { key: 'trailDelay', label: '잔상 대기 시간', type: 'range', min: 0, max: 1500, step: 50, default: 450, unit: 'ms', hint: '맞은 뒤 잔상이 줄어들기 시작할 때까지 기다리는 시간. 길수록 피해량을 오래 보여 준다' },
    { key: 'trailSpeed', label: '잔상 감소 속도', type: 'range', min: 10, max: 200, step: 5, default: 55, unit: '%/초', hint: '대기 후 잔상이 메인 바를 따라잡는 속도' },
    { key: 'lowThreshold', label: '저체력 기준', type: 'range', min: 0, max: 50, step: 5, default: 30, unit: '%', hint: '이 아래로 떨어지면 화면 테두리와 바가 경고를 시작한다' },
    { key: 'vignette', label: '화면 테두리 세기', type: 'range', min: 0, max: 1, step: 0.05, default: 0.7, hint: '저체력 테두리와 큰 피격 번쩍임의 세기' },
    { key: 'segments', label: '칸 나누기', type: 'range', min: 0, max: 20, step: 1, default: 10, unit: '칸', hint: '눈금으로 나누면 "몇 대 더 맞으면 위험한지" 세기 쉬워진다 (0 = 없음)' },
    {
      key: 'shape',
      label: '바 모양',
      type: 'select',
      default: 'slanted',
      options: [
        { value: 'slanted', label: '사선' },
        { value: 'rounded', label: '둥근' },
        { value: 'thin', label: '얇은' },
      ],
    },
    {
      key: 'numberMode',
      label: '숫자 표시',
      type: 'select',
      default: 'value',
      options: [
        { value: 'none', label: '없음' },
        { value: 'value', label: '72 / 100' },
        { value: 'percent', label: '72%' },
      ],
    },
    { key: 'colorShift', label: '체력에 따라 색 변화', type: 'toggle', default: true, hint: '초록 → 노랑 → 빨강. 색만으로 상태를 전달하지 않도록 길이·숫자와 함께 쓴다' },
  ],
  presets: [
    {
      id: 'soulslike',
      name: '소울라이크',
      look: '얇은 바에 긴 잔상. 숫자 없이 "방금 크게 맞았다"는 감각을 오래 남긴다',
      values: { trailDelay: 800, trailSpeed: 30, lowThreshold: 20, vignette: 0.3, segments: 0, shape: 'thin', numberMode: 'none', colorShift: false },
    },
    {
      id: 'tactical-fps',
      name: '택티컬 FPS',
      look: '바는 보조, 화면 테두리와 숫자가 주인공. 잔상은 짧게',
      values: { trailDelay: 150, trailSpeed: 140, lowThreshold: 40, vignette: 1, segments: 0, shape: 'thin', numberMode: 'value', colorShift: true },
    },
    {
      id: 'party-rpg',
      name: '파티 RPG',
      look: '칸 눈금과 숫자로 정확한 수치 관리. 화면 효과는 약하게',
      values: { trailDelay: 400, trailSpeed: 60, lowThreshold: 25, vignette: 0.35, segments: 10, shape: 'rounded', numberMode: 'value', colorShift: true },
    },
  ],
  events: [
    { id: 'hit', label: '피격' },
    { id: 'heavy', label: '강한 피격' },
    { id: 'heal', label: '회복' },
  ],
  hotspots: [
    { n: 1, part: 'fill', title: '메인 바는 즉시 줄어든다', body: '현재 체력은 거의 바로(약 60ms) 반영해야 한다. 늦게 줄어들면 "아직 괜찮은 줄" 착각하게 된다.', principle: '즉각 피드백' },
    { n: 2, part: 'trail', title: '잔상이 피해량을 보여 준다', body: '잃은 만큼 밝은 색으로 잠시 남겨 두었다가 따라 줄인다. 플레이어는 숫자를 읽지 않고도 **방금 얼마나 크게 맞았는지** 안다. 연타 중에는 대기 시간을 다시 채워 피해가 쌓여 보이게 한다.', principle: '즉각 피드백' },
    { n: 3, part: 'heal', title: '회복은 천천히, 미리보기와 함께', body: '회복량을 줄무늬로 먼저 보여 주고 메인 바가 그 안을 채워 간다. 감소(빠름)와 증가(느림)의 속도 차이 자체가 "좋은 일/나쁜 일"을 구분해 준다.', principle: '시각 위계' },
    { n: 4, part: 'vignette', title: '위험은 바 밖에서 알린다', body: '전투 중 시선은 화면 중앙에 있다. 구석의 바를 보지 않아도 **화면 테두리**가 붉어지고 맥박처럼 뛰면 위험을 느낀다. 맥박은 체력이 낮을수록 빨라진다(최대 2Hz).', principle: '몰입' },
    { n: 5, part: 'number', title: '숫자와 눈금은 장르에 맞게', body: '정확한 계산이 필요한 RPG는 숫자·눈금이 도움이 되고, 감각이 중요한 액션은 오히려 방해가 된다. 프리셋을 바꿔 비교해 보자.', principle: '인지 부하' },
  ],
  mistakes: [
    { title: '잔상 없이 즉시 감소', body: '바가 한 번에 줄면 "얼마나 맞았는지"를 기억에 의존해야 한다. 특히 여러 번 연달아 맞을 때 피해가 구분되지 않는다.' },
    { title: '메인 바까지 천천히 감소', body: '부드럽게 보이려고 메인 바를 트윈하면 실제 체력과 화면이 어긋난다. 느린 것은 잔상뿐이어야 한다.' },
    { title: '색만으로 위험 표시', body: '적록 색각이상은 남성에게 드물지 않다(약 5~8%). 이런 플레이어는 색 변화를 못 느낀다. 길이·맥동·테두리처럼 색 외의 신호를 함께 쓴다.' },
    { title: '화면 전체를 크게 번쩍임', body: '피격마다 화면 전체가 번쩍이면 눈이 피로하고 광과민성 발작 위험이 있다. 초당 3회 이하로 제한하고, 큰 피격에만 약하게 쓴다.' },
    { title: '동적인 바를 정적 UI와 같은 Canvas에', body: 'Unity UGUI에서 매 프레임 바뀌는 바가 메뉴·아이콘과 같은 Canvas에 있으면 Canvas 전체가 다시 그려진다. 자주 바뀌는 HUD는 별도 Canvas로 분리한다.' },
  ],
  juiceOff: '잔상·회복 미리보기·흔들림·화면 테두리·색 변화를 모두 끈 상태. 바가 한 번에 줄고 늘어 **얼마나 맞았는지, 지금 위험한지** 알기 어렵다.',
  timings: [
    { event: '피격 → 메인 바 감소', ms: 60, easing: '지수 감쇠 (거의 즉시)', note: '실제 체력과 화면이 어긋나지 않게' },
    { event: '피격 → 잔상 대기', ms: 450, easing: '정지', note: '권장값. 연타 시 다시 채움' },
    { event: '잔상 감소', ms: 800, easing: 'linear (55%/초)', note: '권장값. 피해량에 비례해 길어진다' },
    { event: '회복 → 메인 바 채움', ms: 600, easing: 'linear (60%/초)', note: '감소보다 느리게' },
    { event: '피격 흔들림', ms: 250, easing: 'ease-out (감쇠 사인)', note: '피해량에 비례한 진폭' },
    { event: '저체력 맥동 주기', ms: 1000, easing: 'sine', note: '체력이 0에 가까울수록 500ms(2Hz)까지 빨라짐' },
  ],
  unity: {
    ugui: {
      hierarchy: `Canvas_HUD (Screen Space - Overlay, Canvas Scaler: 1920×1080)
└─ HealthBar (RectTransform, 앵커: 좌하단)
   ├─ Background   (Image)
   ├─ Trail        (Image · Type: Filled · Horizontal · Origin Left)
   ├─ HealPreview  (Image · Type: Filled · Horizontal)
   ├─ Fill         (Image · Type: Filled · Horizontal · Origin Left)
   └─ Label        (TextMeshProUGUI)
Canvas_Overlay (Sort Order 높게)
└─ LowHealthVignette (Image + CanvasGroup, Raycast Target 끔)`,
      steps: [
        '**Canvas Scaler** 를 `Scale With Screen Size`, Reference Resolution `1920×1080` 으로 설정한다. 이 갤러리의 무대도 같은 기준으로 그려져 있다.',
        'Trail·HealPreview·Fill 세 Image 를 같은 크기로 겹치고, 모두 **Image Type = Filled, Fill Method = Horizontal** 로 바꾼다. 그리는 순서는 Trail → HealPreview → Fill (아래 → 위).',
        '`HealthBarTrail.cs` 를 HealthBar 에 붙이고 세 Image 와 CanvasGroup, TextMeshProUGUI 를 연결한다.',
        '피격 시 `TakeDamage()` 를, 회복 시 `Heal()` 을 호출한다. 잔상 대기와 감소는 `Update` 에서 처리된다.',
        '저체력 테두리는 화면 전체를 덮는 Image 에 가장자리만 불투명한 스프라이트를 쓰고, **Raycast Target 을 꺼서** 클릭을 막지 않게 한다.',
      ],
      pitfalls: [
        'Fill 값은 `fillAmount` (0~1) 이다. `RectTransform` 크기를 바꾸는 방식보다 레이아웃 재계산이 적다.',
        '자주 바뀌는 HUD 는 **별도 Canvas** 로 분리한다. 같은 Canvas 의 다른 UI 까지 다시 그려진다.',
        '일시정지 메뉴에서 시간을 멈출 때(`Time.timeScale = 0`) 잔상도 멈추게 하려면 `Time.deltaTime`, 계속 움직이게 하려면 `Time.unscaledDeltaTime` 을 쓴다.',
      ],
    },
    uitk: {
      hierarchy: `UIDocument (Panel Settings: Scale With Screen Size, 1920×1080)
└─ HealthBarTrail.uxml
   └─ #health-bar (.hb)
      ├─ #trail        (.hb__trail)
      ├─ #heal-preview (.hb__heal)
      ├─ #fill         (.hb__fill)
      └─ #label        (Label)
   └─ #vignette (.vignette, picking-mode: Ignore)`,
      steps: [
        '**Panel Settings** 의 Scale Mode 를 `Scale With Screen Size`, Reference Resolution 을 `1920×1080` 으로 맞춘다.',
        'UXML 에서 trail · heal-preview · fill 을 `position: absolute` 로 겹친다 (USS 참고).',
        '`HealthBarTrailUITK.cs` 에서 `style.width = Length.Percent(값)` 으로 각 막대 길이를 바꾼다.',
        '테두리 효과는 `#vignette` 의 `style.opacity` 로 조절하고, `pickingMode = PickingMode.Ignore` 로 입력을 통과시킨다.',
      ],
      pitfalls: [
        'UI Toolkit 은 **Filled 이미지 타입이 없다**. 막대는 `width` 퍼센트로, 원형 채움은 `Painter2D` 로 직접 그린다.',
        'USS `transition` 으로도 감소 애니메이션을 만들 수 있지만, "대기 후 감소" 같은 단계가 있는 동작은 C# 에서 값으로 제어하는 편이 예측 가능하다.',
        'radial-gradient 는 USS 에서 지원되지 않는다. 테두리 효과는 가장자리가 불투명한 이미지(background-image)를 쓴다.',
      ],
    },
  },
  inspiredBy: [],
  original: '사선형 바 모양, 십자 아이콘, 줄무늬 회복 미리보기, 맥박 속도 규칙, 모든 색과 글꼴은 이 갤러리에서 새로 만든 것이다.',
  references: [],
  flashes: true,
}
