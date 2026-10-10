import type { SpecimenMeta } from '../../core/types'

export const meta: SpecimenMeta = {
  id: 'reticle-hitmarker',
  title: '조준점 + 적중 표시',
  titleEn: 'Reticle & Hitmarker',
  group: 'B',
  order: 1,
  paradigms: ['non-diegetic'],
  oneLiner: '조준점은 "지금 쏘면 어디로 얼마나 퍼지는지"를 정직하게, 적중 표시는 "맞았다 · 약점이다 · 쓰러뜨렸다"를 서로 다른 모양으로 알려 준다',
  goals: [
    '현재 퍼짐 값 **하나**를 탄 발사 방향과 조준점 팔 간격이 함께 쓰도록 설계할 수 있다',
    '조준 지점 아래에 적이 있는지 판정해 조준점의 색과 모양을 함께 바꾸는 흐름을 구현할 수 있다',
    '일반 적중 · 약점 적중 · 처치를 **색이 아니라 모양 · 크기 · 지속 시간**으로 위계 있게 구분할 수 있다',
    '화면 고정 조준점과 세계 안 레이저 조준을 같은 장면에서 바꿔 보고, 정보량과 몰입의 교환을 설명할 수 있다',
  ],
  principles: ['즉각 피드백', '시각 위계', '어포던스', '가독성'],
  platforms: ['pc', 'console'],
  inputs: ['mouse', 'gamepad', 'touch'],
  genres: ['FPS', 'TPS', '협동 슈터', '서바이벌 호러'],
  difficulty: 2,
  stage: { aspect: '16:9', backdrop: 'none' },
  params: [
    {
      key: 'reticleMode',
      label: '조준 방식',
      type: 'select',
      default: 'cross',
      options: [
        { value: 'cross', label: '4선 + 점' },
        { value: 'circle', label: '원 + 점' },
        { value: 'laser', label: '세계 안 레이저' },
      ],
      hint: '레이저는 화면 중앙 조준점 대신 총구에서 뻗는 선과 접촉점만 보인다. 퍼짐 표시가 사라지는 것 자체가 비교 포인트(왼쪽 아래 계기도 꺼진다)',
    },
    { key: 'baseSpread', label: '기본 퍼짐', type: 'range', min: 4, max: 60, step: 1, default: 16, unit: 'px', hint: '정지 상태의 팔 간격(원 모드에서는 원의 안쪽 반지름) = 실제 탄이 떨어지는 원의 반지름. 연사 상한은 이 값의 4배' },
    { key: 'moveSpreadScale', label: '이동 퍼짐 배율', type: 'range', min: 1, max: 3, step: 0.1, default: 1.6, unit: '×', hint: '이동 중 기본 퍼짐에 곱한다. 1이면 이동해도 조준점이 변하지 않는다' },
    { key: 'shotBloom', label: '사격당 퍼짐', type: 'range', min: 0, max: 30, step: 1, default: 8, unit: 'px', hint: '한 발 쏠 때마다 팔이 튀어 나가는 양. 연사하면 쌓인다' },
    { key: 'recoveryMs', label: '퍼짐 회복 시간', type: 'range', min: 80, max: 800, step: 20, default: 260, unit: 'ms', hint: '사격·이동이 끝난 뒤 기본 퍼짐으로 돌아오는 시간. 짧으면 경쾌, 길면 묵직' },
    { key: 'hostileColor', label: '적 조준 색', type: 'color', default: '#ff5a4f', hint: '적을 겨눴을 때 조준점(레이저는 접촉점) 색. 흰색으로 두면 적 조준 피드백이 사라진다' },
    { key: 'hitmarkerHoldMs', label: '적중 표시 유지 시간', type: 'range', min: 40, max: 500, step: 10, default: 120, unit: 'ms', hint: '일반 적중 표시가 완전히 보이는 시간. 약점은 1.4배, 처치는 1.8배. 길면 연사 중 한 발 한 발이 구분되지 않는다' },
    { key: 'critShapeDistinct', label: '약점 적중 모양 구분', type: 'toggle', default: true, hint: '끄면 약점 적중이 색만 다르다. 오른쪽 붉은 경고등 앞에서 구분이 사라지는 것을 확인해 보자' },
    { key: 'reticleOutline', label: '조준점 외곽선', type: 'toggle', default: true, hint: '어두운 테두리. 끄고 안쪽 밝은 격납문 앞을 겨눠 보자' },
  ],
  presets: [
    {
      id: 'precision',
      name: '정밀 사격 · 화면 고정',
      look: '좁고 절제된 4선. 적을 겨누면 붉어지며 점이 마름모로 돌고 적중 · 약점 · 처치가 모양으로 또렷이 나뉜다. 회복이 빨라 경쾌하다',
      values: { reticleMode: 'cross', baseSpread: 12, moveSpreadScale: 1.4, shotBloom: 6, recoveryMs: 220, hostileColor: '#ff5a4f', hitmarkerHoldMs: 110, critShapeDistinct: true, reticleOutline: true },
    },
    {
      id: 'immersive-laser',
      name: '몰입 우선 · 세계 안 레이저',
      look: '화면 중앙에 아무것도 없고 총구에서 뻗는 라임색 선과 접촉점만. 적에 닿으면 접촉점만 주황으로. 적중 표시는 작고 짧아 표적의 반응을 직접 봐야 한다',
      values: { reticleMode: 'laser', baseSpread: 6, moveSpreadScale: 1, shotBloom: 0, recoveryMs: 400, hostileColor: '#ff8a3d', hitmarkerHoldMs: 60, critShapeDistinct: false, reticleOutline: true },
    },
    {
      id: 'arcade',
      name: '과장된 피드백 · 아케이드',
      look: '큰 원이 이동 · 사격에 크게 출렁이고 적중 표시가 오래 머문다. 읽기 쉽지만 연사 중 중앙이 시끄럽다. 적 조준 색이 약점 색(노랑)과 같아 색만으로는 구분이 약해진다',
      values: { reticleMode: 'circle', baseSpread: 30, moveSpreadScale: 2.2, shotBloom: 18, recoveryMs: 500, hostileColor: '#ffd23f', hitmarkerHoldMs: 220, critShapeDistinct: true, reticleOutline: true },
    },
  ],
  events: [
    { id: 'move', label: '이동 시작/정지' },
    { id: 'aim', label: '적 조준 켜기/끄기' },
    { id: 'burst', label: '연사 6발' },
    { id: 'hit', label: '일반 적중' },
    { id: 'crit', label: '약점 적중' },
    { id: 'kill', label: '처치' },
  ],
  hotspots: [
    {
      n: 1,
      part: 'arms',
      title: '팔 간격 = 실제 탄 퍼짐',
      body: '번호가 붙은 영역이 지금 탄이 떨어지는 원이다. 팔이 중심에서 떨어진 거리가 곧 이 원의 반지름이다. 이동하거나 연사하면 벌어지고 멈추면 좁아진다. 작은 불꽃이 실제 탄착점 — 언제나 팔 안쪽에 떨어진다. 표시와 탄착이 **같은 값**에서 나와야 "지금 쏘면 맞을까"를 믿고 판단한다.',
      principle: '즉각 피드백',
    },
    {
      n: 2,
      part: 'reticle',
      title: '적을 겨누면 색과 모양이 바뀐다',
      body: '쏘기 전에 "이건 쏴도 되는 적"이라는 확인을 준다. 평소엔 무채색으로 두고 필요할 때만 드러낸다. **색 + 모양을 함께 바꾼다** — 중심 점이 마름모로 돌고 팔이 굵어진다. 적이 붉은 실루엣이라 붉은 조준점은 색만으로는 약하다. 바뀌는 데는 0.06초 — 느리면 적을 스쳐 지나갈 때 따라오지 못한다. 마우스를 드론 위로 옮겨 보자. (갤러리에서는 hover · click 시연을 위해 조준점이 마우스를 따라가지만, 실제 게임에서는 **화면 중앙에 고정**되고 시점이 돈다 — Unity 의 `TargetProbe` 가 화면 중앙 레이캐스트로 판정한다.)',
      principle: '어포던스',
    },
    {
      n: 3,
      part: 'hitmarker',
      title: '적중 < 약점 < 처치',
      body: '일반 적중은 가는 X, 약점은 **굵고 긴** X, 처치는 X 바깥으로 **퍼지는 원**이 더해진다. 등장 튐도 일반 1.3배, 약점 1.5배에서 시작해 1배로 돌아오고, 머무는 시간도 단계적으로 늘린다. 색을 빼도 순서가 읽혀야 한다 — "약점 적중 모양 구분"을 꺼서 비교해 보자.',
      principle: '시각 위계',
    },
    {
      n: 4,
      part: 'outline',
      title: '어떤 배경에서도 보이는 테두리',
      body: '이 밝은 격납문 앞으로 조준점을 옮긴 뒤 "조준점 외곽선"을 꺼 보자. 흰 조준점이 문에 녹아 사라진다. 어두운 조준점은 반대로 그림자 속에서 사라진다. 반대색 테두리 하나로 해결된다. 화면에서 가장 자주 보는 요소일수록 대비가 최우선이다.',
      principle: '가독성',
    },
    {
      n: 5,
      part: 'laser',
      title: '비교: 조준을 세계 안으로',
      body: '"세계 안 레이저"로 바꿔 보자. 총구에서 뻗는 선과 표면 위 접촉점이 조준점을 대신해 화면 위 덧칠이 사라지고 몰입이 커진다. 대신 퍼짐 정보가 없어지고, 표적의 반응이 피드백을 대신해야 한다. 표적의 **특정 부위**를 골라 맞히는 전투라면 표면 위 접촉점이 더 정확한 답이다.',
      principle: '몰입',
    },
  ],
  mistakes: [
    { title: '표시 퍼짐 ≠ 실제 탄 퍼짐', body: '조준점 크기를 연출용 애니메이션으로 따로 만들고 탄 퍼짐은 무기 코드에서 따로 계산하면, 조준점 안에 있는데 빗나간다. 효과 끄기 상태에서 연사해 보자 — 불꽃이 팔 바깥에 떨어진다. 같은 값을 읽기만 하게 만든다.' },
    { title: '적중 표시가 너무 오래 머문다', body: '300ms 이상 머물면 연사 중 표시가 계속 켜져 있어 몇 발이 맞았는지, 언제 빗나갔는지 알 수 없다. 새 적중마다 처음부터 다시 시작하고 유지는 짧게(80~150ms).' },
    { title: '약점 적중을 색으로만 구분', body: '흰색 대 노란색 차이만 두면 색각 이상 플레이어나 붉은 · 노란 배경 앞에서는 구분이 사라진다. 굵기 · 길이 · 튐 크기를 함께 바꾼다.' },
    { title: '처치와 적중이 똑같이 보인다', body: '처치 전용 모양이 없으면 이미 쓰러진 적에게 탄을 낭비하거나 다음 대상으로 늦게 넘어간다. 퍼지는 원처럼 별도 모양을 더한다.' },
    { title: '외곽선 없는 단색 조준점', body: '흰 조준점은 밝은 하늘 · 섬광 앞에서, 검은 조준점은 그림자 속에서 사라진다. 반대색 테두리나 그림자를 기본으로 넣는다.' },
  ],
  juiceOff: '조준점이 이동 · 사격과 무관하게 **고정 크기**로 멈춰 있고(실제 탄은 여전히 퍼져서 팔 바깥에 떨어진다), 적을 겨눠도 색이 바뀌지 않으며 외곽선도 없다. 적중 · 약점 · 처치 모두 같은 가는 X가 튐 없이 켜졌다 꺼진다. 맞았는지, 약점이었는지, 쓰러뜨렸는지 조준점만으로는 알 수 없다.',
  timings: [
    { event: '사격 → 팔 튀어 나감', ms: 50, easing: 'easeOutQuad', note: '권장값. 반동과 같은 프레임에 시작' },
    { event: '퍼짐 회복', ms: 260, easing: '지수 감쇠 (easeOutCubic 와 비슷)', note: '권장값. "퍼짐 회복 시간"으로 조절' },
    { event: '이동 퍼짐 전환', ms: 150, easing: 'easeOutQuad', note: '권장값. 즉시 튀면 이동 입력마다 조준점이 덜컥거린다' },
    { event: '적 조준 색 전환', ms: 60, easing: 'linear', note: '권장값. 0~80ms' },
    { event: '적중 표시 등장 (1.3배 → 1배)', ms: 40, easing: 'easeOutBack', note: '권장값. 판정 프레임에 바로 시작' },
    { event: '적중 표시 유지', ms: 120, easing: '—', note: '권장값. 연사 무기는 80~120ms' },
    { event: '적중 표시 사라짐', ms: 120, easing: 'easeInQuad', note: '권장값. 새 적중이 오면 취소하고 등장부터 다시' },
    { event: '약점 적중 등장 (1.5배 → 1배)', ms: 60, easing: 'easeOutBack', note: '권장값. 튐과 유지(1.4배)를 키워 위계를 만든다' },
    { event: '처치 원 퍼짐 · 사라짐', ms: 320, easing: 'easeOutCubic', note: '권장값. 반지름 1배 → 2배. 가장 큰 사건이라 가장 길게' },
  ],
  unity: {
    ugui: {
      hierarchy: `HUDCanvas (Canvas: Screen Space - Overlay, Canvas Scaler 1920×1080)
└─ ReticleCanvas (하위 Canvas — 매 프레임 바뀌는 조준점만 분리)
   └─ ReticleRoot (RectTransform 중앙, ReticleView)
      ├─ CenterDot  (Image 8×8, Outline)
      ├─ ArmTop     (Image 5×30, pivot (0.5, 0), Outline)
      ├─ ArmBottom  (Image 5×30, pivot (0.5, 1), Outline)
      ├─ ArmLeft    (Image 30×5, pivot (1, 0.5), Outline)
      ├─ ArmRight   (Image 30×5, pivot (0, 0.5), Outline)
      └─ Hitmarker  (HitmarkerView)
         ├─ Lines   (RectTransform + CanvasGroup — 튐 · 사라짐은 이것만 바꾼다)
         │  └─ LineTL / LineTR / LineBL / LineBR (Image, pivot (0, 0.5), Z 회전 135 · 45 · 225 · 315°, Outline)
         └─ KillRing (Image 원형 테두리 스프라이트 92×92)
Player (WeaponSpread, TargetProbe, ReticleDemo)
Drone (Collider · 적 레이어, DroneHealth)
└─ WeakPoint (Collider, 태그 "WeakPoint")
├─ Main Camera
└─ Weapon
   ├─ Muzzle    (빈 Transform, LaserSight + LineRenderer — 비교 모드에서만 켠다)
   └─ LaserDot  (작은 Quad + Renderer, 접촉점)`,
      steps: [
        '`Canvas Scaler` 를 Scale With Screen Size · `1920×1080` 으로. 조준점만 담는 **하위 Canvas** 를 따로 만들어 매 프레임 움직여도 나머지 HUD 가 다시 그려지지 않게 한다.',
        '네 팔의 **pivot 을 중심 쪽 끝**으로 맞춘다. 그러면 `anchoredPosition` 이 곧 "중심에서의 간격"이 된다. 각 Image 에 `Outline` 컴포넌트를 붙이고 Raycast Target 은 끈다.',
        '`WeaponSpread.cs` 가 `CurrentSpread`(px) 를 **소유**한다. 사격 시 `Fire()` 가 이 값 안에서 탄 방향을 뽑고 퍼짐을 키운다. `ReticleView.cs` 는 이 값을 **읽기만** 해서 팔 위치에 반영한다.',
        '`TargetProbe.cs` 가 화면 중앙 레이캐스트(`ViewportPointToRay(0.5, 0.5)`)로 적 레이어를 검사해 `ReticleView.SetHostile()` 을 부른다.',
        '`HitmarkerView.Play(HitKind, kill)` 은 실행 중인 코루틴을 멈추고 처음부터 다시 시작한다: 등장(튐) → 유지 → 사라짐. 처치면 `KillRing` 코루틴을 함께 돌린다.',
        '처치 원은 **테두리만 있는 원 스프라이트**가 필요하다(Unity 기본 리소스의 Knob 은 속이 찬 원). 투명 PNG 128px 에 흰 고리를 그려 Sprite 로 가져온다(9-slice 불필요). 또는 UITK 버전의 border-radius 원을 쓴다.',
        '적 조준 모양 변화: `ReticleView` 가 적 조준일 때 중심 점을 45° 돌리고(마름모) 팔 굵기를 5 → 7px 로 바꾼다. 색만 바꾸지 않는다.',
        '적에 `DroneHealth.cs`(체력 4, 약점 2 데미지)를 붙이면 `ReticleDemo` 의 마우스 사격이 처치까지 판정해 `kill` 플래그로 처치 원을 띄운다.',
        '`ReticleDemo.cs` 를 붙이면 갤러리와 같은 숫자키(1 이동 · 2 적 조준 · 3 연사 · 4 적중 · 5 약점 · 6 처치)와 마우스 왼쪽 버튼으로 시험할 수 있다.',
      ],
      pitfalls: [
        '**코루틴 겹침**: 연사 중 `Play` 를 여러 번 부르면 사라짐 코루틴이 겹쳐 깜빡인다. 핸들을 저장해 두고 `StopCoroutine` 후 다시 시작한다.',
        '`Time.timeScale = 0` (일시정지 · 히트스톱) 중에도 표시가 끝까지 사라지게 하려면 `Time.unscaledDeltaTime` 을 쓴다. `Time.deltaTime` 이면 화면에 얼어붙은 채 남는다.',
        '퍼짐 표시를 UI 에서 따로 트윈하면 실제 탄착과 어긋난다. UI 는 `WeaponSpread.CurrentSpread` 를 읽기만 한다.',
        '`Outline` 은 정점 수를 늘린다. 조준점처럼 작은 요소에만 쓰고 HUD 전체에 남발하지 않는다.',
        '화면 넓은 영역의 번쩍임(처치 강조)은 초당 3회 이하로 쿨다운을 둔다. 중앙의 작은 적중 표시는 괜찮다.',
      ],
    },
    uitk: {
      hierarchy: `UIDocument (Panel Settings: Scale With Screen Size, 1920×1080)
└─ Reticle.uxml
   └─ #hud-root (.hud-root, picking-mode: Ignore)
      └─ #reticle (.reticle)
         ├─ #dot (.reticle__dot)
         ├─ #arm-top / #arm-bottom / #arm-left / #arm-right (.reticle__arm)
         └─ #hitmarker (.hm)
            ├─ #hm-lines (.hm__lines)
            │  └─ .hm__arm ×4 (--tl --tr --bl --br, 회전만) → .hm__line
            └─ #kill-ring (.hm__ring)
+ 같은 GameObject 에 ReticleUITK.cs, 시험용 ReticleUITKDemo.cs`,
      steps: [
        'Panel Settings 를 `Scale With Screen Size` · `1920×1080` 으로 — UGUI 와 같게 해야 두 방식의 크기가 같다.',
        '`ReticleUITK.cs` 의 `OnEnable` 에서 팔 · 적중 표시를 `Q()` 로 캐시하고 `usageHints = UsageHints.DynamicTransform` 을 지정한다.',
        '`Update` 에서 퍼짐 값을 계산해 `arm.style.translate = new Translate(0, -spread)` 처럼 **translate 만** 바꾼다 (left/top 은 레이아웃을 다시 계산한다).',
        '적 조준은 `reticle.EnableInClassList("reticle--hostile", on)` 으로 클래스만 바꾸고, 색 전환 0.06초는 USS `transition` 에 맡긴다. 같은 클래스에서 점을 `rotate: 45deg`(마름모)로, 팔을 굵게 바꿔 **모양**도 함께 바꾼다.',
        '적중 표시의 튐 · 유지 · 사라짐은 C# 에서 시간으로 계산해 `style.scale` · `style.opacity` 에 넣는다. 종류(일반/약점)는 `hm--crit` 클래스로 굵기 · 길이 · 색을 바꾼다.',
        'X 의 대각선은 **회전만 하는 0×0 팔(`.hm__arm`) 안에 선을 `left: 16px` 로 밀어 넣어** 만든다. USS 는 translate 를 회전 전에 적용하므로 "돌린 방향으로 밀기"를 한 요소로는 할 수 없다.',
      ],
      pitfalls: [
        'USS `transition` 은 시작 · 끝 두 값뿐이라 "1.3배로 튀었다 돌아옴", "보였다가 퍼지며 사라짐" 같은 단계 연출은 C# 에서 직접 보간하는 편이 예측 가능하다.',
        '같은 프레임에 클래스를 뺐다 다시 넣으면 값 변화가 없어 transition 이 다시 시작되지 않는다. 연사 중 매번 튀게 하려면 시간 값을 0 으로 되돌리는 방식(C#)이 안전하다.',
        '`picking-mode="Ignore"` 를 루트뿐 아니라 자식에도 지정한다. 아니면 화면 중앙의 다른 UI 클릭을 가로챈다.',
        'USS 에는 `box-shadow` 가 없다. 외곽선은 `border-width` + `border-color` 로 만든다.',
        'USS transition 은 `Time.timeScale` 과 무관하게 진행된다. 일시정지 중 동작이 C# 계산 부분과 다를 수 있다.',
      ],
    },
  },
  inspiredBy: [
    {
      title: 'Destiny 2 (2017)',
      credit: '© Bungie, Inc.',
      borrowed: ['색 체계'],
      learned: '2023년 개발사 예고를 다룬 기사(T2, Dexerto 2023-05-18)에서 한 무기의 실험적 정조준 조준점이 "적이 아래에 있으면 색이 바뀐다"고 소개됐다. 근거는 그 범위(한 무기 · 실험적 조준점)에 한정되므로, "조준 지점 아래 적 → 조준점 색 변화"라는 흐름만 참고해 장르 관례로 일반화했다. 평소 조준점 색 · 경고색 값 · 조준점 모양 · 적중 표시 모양은 원작을 따르지 않는다.',
      link: 'https://www.bungie.net/7/en/Destiny',
    },
    {
      title: 'Dead Space (2008)',
      credit: '© Electronic Arts Inc.',
      borrowed: ['레이아웃 구조'],
      learned: '비교 사례. 조준 정보를 화면 중앙이 아니라 **무기에서 뻗는 세계 안의 선**으로 옮겨 화면 덧칠을 줄이는 배치를 "세계 안 레이저" 모드로 가져왔다(레이저 존재는 리메이크 관련 Steam 커뮤니티 스레드(T3) 기반이라 확신도 낮음). Wikipedia 게임플레이 절(T2)이 핵심 전투 설계로 적은, 머리가 아니라 특정 부위를 골라 맞히는 전투 설계가 정밀한 접촉점 조준을 뒷받침한다는 점을 "조준 UI 는 전투 설계에 맞춘다"로 정리했다. 레이저의 색 · 모양과 신체 손상 모티프는 가져오지 않았다.',
      link: 'https://www.ea.com/games/dead-space',
    },
  ],
  original: '4선 · 원 조준점과 X 적중 표시는 장르 관례 모양을 새로 그린 도형이다. 약점 적중의 "굵기 9px · 길이 38px · 노랑", 처치의 "원이 0.32초 동안 2배로 퍼지며 사라짐", 실제 탄착 불꽃으로 퍼짐을 검증하는 장치, 라임색 레이저, 1점 투시 격납 복도 배경, 잔해 드론(삼각 실루엣)과 원형 약점 패치, 화면 문구는 모두 이 갤러리에서 새로 만든 것이다.',
  references: [
    { label: 'GDC Vault — Crafting Destruction: The Evolution of the Dead Space User Interface (2013)', url: 'https://gdcvault.com/play/1017723/Crafting-Destruction-The-Evolution-of' },
    { label: 'Destiny 공식 사이트 (Bungie)', url: 'https://www.bungie.net/7/en/Destiny' },
    { label: 'Dexerto — Destiny 2 조준점 개편 예고 기사 (2023-05-18)', url: 'https://www.dexerto.com/destiny/destiny-2-devs-reveal-major-reticle-overhaul-coming-in-season-of-the-deep-2148770/' },
    { label: 'Wikipedia — Dead Space (2008) 게임플레이', url: 'https://en.wikipedia.org/wiki/Dead_Space_(2008_video_game)' },
    { label: 'Steam 커뮤니티 — 리메이크 레이저 조준선 논의 (T3)', url: 'https://steamcommunity.com/app/1693980/discussions/0/3770110614216861045/' },
    { label: 'Dead Space 공식 사이트 (EA)', url: 'https://www.ea.com/games/dead-space' },
    { label: 'W3C — WCAG 2.3.1 번쩍임 기준 (초당 3회 이하)', url: 'https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold' },
    { label: 'Unity Manual — USS transitions', url: 'https://docs.unity3d.com/6000.3/Documentation/Manual/UIE-Transitions.html' },
    { label: 'Unity Scripting API — UsageHints', url: 'https://docs.unity3d.com/6000.3/Documentation/ScriptReference/UIElements.UsageHints.html' },
  ],
  related: [
    { id: 'health-bar-trail', why: '맞은 쪽의 피드백. 같은 "즉시 + 잠깐 남김" 문법을 체력 바에서 본다' },
    { id: 'settings-accessibility', why: '색각 보정 · 조준점 크기 같은 옵션이 이 표본의 "색만으로 전달하지 않기"와 이어진다' },
  ],
  flashes: true,
}
