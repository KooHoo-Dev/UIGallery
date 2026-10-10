import type { Aspect, StageEvent } from '../core/types'

export function PlayBar(p: {
  playing: boolean
  onPlaying: (v: boolean) => void
  speed: number
  speeds: number[]
  onSpeed: (v: number) => void
  juice: boolean
  onJuice: (v: boolean) => void
  autoplay: boolean
  onAutoplay: (v: boolean) => void
  events: StageEvent[]
  onEvent: (id: string) => void
  showSpots: boolean
  onShowSpots: (v: boolean) => void
  onStep: (dir: 1 | -1) => void
  spotLabel: string
  aspect: Aspect
  aspects: Aspect[] | null
  onAspect: (a: Aspect) => void
}) {
  return (
    <div className="playbar" role="toolbar" aria-label="무대 조작">
      <div className="pb-group">
        <button className="btn btn-icon btn-primary" onClick={() => p.onPlaying(!p.playing)} aria-label={p.playing ? '일시정지 (Space)' : '재생 (Space)'} title="Space">
          {p.playing ? '❚❚' : '▶'}
        </button>
        <div className="seg seg-sm" role="radiogroup" aria-label="배속 (S)">
          {[...p.speeds].sort((a, b) => a - b).map(s => (
            <button key={s} role="radio" aria-checked={p.speed === s} onClick={() => p.onSpeed(s)} title="S">
              {s}×
            </button>
          ))}
        </div>
      </div>

      {p.events.length > 0 && (
        <div className="pb-group pb-events" role="group" aria-label="이벤트">
          {p.events.map((e, i) => (
            <button key={e.id} className="btn btn-event" onClick={() => p.onEvent(e.id)} title={`단축키 ${i + 1}`}>
              <kbd>{i + 1}</kbd> {e.label}
            </button>
          ))}
        </div>
      )}

      <div className="pb-group">
        <button className="btn btn-toggle" aria-pressed={!p.juice} data-bad={!p.juice || undefined} onClick={() => p.onJuice(!p.juice)} title="J — 연출을 모두 끈 나쁜 예와 비교">
          {p.juice ? '효과 켜짐' : '효과 꺼짐'} <kbd>J</kbd>
        </button>
        <button className="btn btn-toggle" aria-pressed={p.autoplay} onClick={() => p.onAutoplay(!p.autoplay)} title="A — 입력이 없어도 데모 이벤트를 자동으로 발생">
          자동 데모 <kbd>A</kbd>
        </button>
        {p.aspects && (
          <div className="seg seg-sm" role="radiogroup" aria-label="화면비">
            {p.aspects.map(a => (
              <button key={a} role="radio" aria-checked={p.aspect === a} onClick={() => p.onAspect(a)}>
                {a === '16:9' ? '가로 16:9' : '세로 9:16'}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pb-group pb-spots">
        <button className="btn btn-toggle" aria-pressed={p.showSpots} onClick={() => p.onShowSpots(!p.showSpots)} title="H — 무대 위 해설 번호">
          해설 번호 <kbd>H</kbd>
        </button>
        <button className="btn btn-icon" onClick={() => p.onStep(-1)} aria-label="이전 해설 (←)">
          ‹
        </button>
        <span className="pb-spot-label" aria-live="polite">
          {p.spotLabel}
        </span>
        <button className="btn btn-icon" onClick={() => p.onStep(1)} aria-label="다음 해설 (→)">
          ›
        </button>
      </div>
    </div>
  )
}
