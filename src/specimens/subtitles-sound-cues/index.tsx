import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { prefersReducedMotion } from '../../core/flash'
import { useGameLoop, useTrigger } from '../../core/hooks'
import { bool, num, str } from '../../core/params'
import type { SpecimenProps } from '../../core/types'
import { LINES, SCRIPT_LEN, SOUND_CUES, SPEAKERS, charsPerLine, chunk, durationOf, type Line, type Sound, type SpeakerId } from './script'
import s from './style.module.css'

export { meta } from './meta'

const SIZES: Record<string, number> = { small: 28, medium: 36, large: 46, xl: 58 }
const BOX_W = 1240
/** 대사가 대본에 들어오는 시각 (초) — 앞 대사가 길면 대기열에서 기다린다 */
const LINE_AT = [0.5, 5.5, 9.5, 18.5, 22, 25]
/** 이만큼 쉬었다가 같은 사람이 다시 말하면 이름을 다시 붙인다 */
const RELABEL_GAP = 4
const CAPTION_SEC = 2.6
const RING_SEC = 2.4
const PX = 960
const PY = 470
const RING_R = 230

interface Chunk {
  who: SpeakerId
  text: string
  showName: boolean
  /** 같은 대사의 이어지는 장 */
  cont: boolean
  more: boolean
}

interface Sim {
  t: number
  queue: Chunk[]
  cur: (Chunk & { start: number; dur: number }) | null
  lastWho: SpeakerId | null
  lastEnd: number
  captions: { id: number; sound: Sound; at: number }[]
  sounds: { id: number; sound: Sound; at: number }[]
  seq: number
  script: number
  lineNo: number
  version: number
}

/**
 * 자막 · 효과음 캡션 · 소리 방향 링.
 * 대사는 '최대 줄 수' 에 맞춰 장으로 나누고, 장마다 글자 수 ÷ 읽기 속도만큼 보여 준다.
 * 효과음은 [캡션] 과 링의 호로 동시에 — 소리를 못 듣는 플레이어에게 '무엇이 · 어디서' 를 함께 전한다.
 */
export default function SubtitlesSoundCues(p: SpecimenProps) {
  const juice = p.juice
  const fontPx = juice ? (SIZES[str(p.params, 'textSize', 'medium')] ?? 36) : 26
  const bgOpacity = juice ? num(p.params, 'bgOpacity', 0.65) : 0
  const maxLines = juice ? num(p.params, 'maxLines', 2) : 99
  const cps = num(p.params, 'readingCps', 13)
  const speakerStyle = juice ? str(p.params, 'speakerStyle', 'name-color') : 'none'
  const captionsOn = juice && bool(p.params, 'captions', true)
  const ringOn = juice && bool(p.params, 'soundRing', true)
  const reduce = prefersReducedMotion()

  const cfg = { juice, fontPx, maxLines, cps }
  const cfgRef = useRef(cfg)
  cfgRef.current = cfg

  /** 대사 하나 → 장들. 나쁜 예는 나누지 않는다(4줄짜리 덩어리) */
  const toChunks = (line: Line, now: number, lastWho: SpeakerId | null, lastEnd: number): Chunk[] => {
    const c = cfgRef.current
    const parts = c.juice ? chunk(line.text, charsPerLine(BOX_W - 80, c.fontPx) * c.maxLines) : [line.text]
    const relabel = lastWho !== line.who || now - lastEnd > RELABEL_GAP
    return parts.map((text, i) => ({ who: line.who, text, showName: i === 0 && relabel, cont: i > 0, more: i < parts.length - 1 }))
  }

  const simRef = useRef<Sim | null>(null)
  if (!simRef.current) {
    // 첫 화면(썸네일 포함): 첫 대사(무전) + 오른쪽 드론 소리 — 대본은 그 다음 대사부터 이어진다
    const [first, ...rest] = toChunks(LINES[0], 0, null, 0)
    const drone = SOUND_CUES[0].sound
    simRef.current = {
      t: 0,
      queue: rest, // 큰 글씨 · 한 줄이면 첫 대사도 여러 장 — 나머지 장을 대기열에
      cur: { ...first, start: 0, dur: juice ? durationOf(first.text, cps) : 2 },
      lastWho: 'sera',
      lastEnd: 0,
      captions: [{ id: 1, sound: drone, at: 0 }],
      sounds: [{ id: 2, sound: drone, at: 0 }],
      seq: 2,
      script: LINE_AT[0] + 0.1,
      lineNo: 1,
      version: 0,
    }
  }
  const S = simRef.current
  const [, setVersion] = useState(0)
  const shown = useRef(S.version)
  const sync = () => {
    if (S.version !== shown.current) {
      shown.current = S.version
      setVersion(S.version)
    }
  }
  const touch = () => S.version++

  const say = (line: Line) => {
    const lastWho = S.queue.at(-1)?.who ?? S.cur?.who ?? S.lastWho
    S.queue.push(...toChunks(line, S.t, lastWho, S.cur ? S.t : S.lastEnd))
    touch()
  }
  const play = (sound: Sound) => {
    S.captions.push({ id: ++S.seq, sound, at: S.t })
    if (S.captions.length > 3) S.captions.shift() // 캡션은 최대 3개 — 넘치면 오래된 것부터
    S.sounds.push({ id: ++S.seq, sound, at: S.t })
    touch()
  }

  const handle = (id: string) => {
    if (id === 'line') {
      const i = S.lineNo % LINES.length
      say(LINES[i])
      S.lineNo = i + 1
      // 대본도 그 대사 다음으로 건너뛴다 — 안 그러면 잠시 뒤 대본이 같은 대사를 또 말한다
      if (p.autoplay) S.script = LINE_AT[i] + 0.05
    }
    else if (id === 'explosion') play({ label: '폭발음', deg: -100, kind: 'danger', dist: 0.25 })
    else if (id === 'drone') play({ label: '드론 접근', deg: 80, kind: 'danger', dist: 0.6 })
    else if (id === 'restart') {
      S.queue = []
      S.cur = null
      S.captions = []
      S.sounds = []
      S.script = 0
      S.lineNo = 0
      S.lastWho = null // 처음부터면 첫 대사에도 이름이 붙어야 한다
      S.lastEnd = -Infinity
      touch()
    }
    sync()
  }
  useTrigger(p.trigger, handle)

  useGameLoop(p.playing, p.timeScale, dt => {
    S.t += dt
    const c = cfgRef.current
    // 대본 (자동 데모일 때만 흐른다)
    if (p.autoplay && !p.thumbnail) {
      const prev = S.script
      S.script += dt
      LINE_AT.forEach((at, i) => {
        if (prev < at && S.script >= at) {
          say(LINES[i])
          S.lineNo = i + 1
        }
      })
      for (const cue of SOUND_CUES) if (prev < cue.at && S.script >= cue.at) play(cue.sound)
      if (S.script >= SCRIPT_LEN) S.script = 0
    }
    // 자막 진행: 지금 장이 끝나면 0.25초 쉬고 다음 장
    if (S.cur && S.t >= S.cur.start + S.cur.dur) {
      S.lastWho = S.cur.who
      S.lastEnd = S.t
      S.cur = null
      touch()
    }
    if (!S.cur && S.queue.length && S.t - S.lastEnd >= 0.25) {
      const next = S.queue.shift()!
      // 나쁜 예: 글자 수와 상관없이 2초
      const dur = c.juice ? durationOf(next.text, c.cps) : 2
      S.cur = { ...next, start: S.t, dur }
      touch()
    }
    const before = S.captions.length + S.sounds.length
    S.captions = S.captions.filter(x => S.t - x.at < CAPTION_SEC)
    S.sounds = S.sounds.filter(x => S.t - x.at < RING_SEC)
    if (S.captions.length + S.sounds.length !== before) touch()
    paint()
    sync()
  })

  const barRef = useRef<HTMLDivElement>(null)
  const paint = () => {
    const cur = S.cur
    if (barRef.current) barRef.current.style.transform = `scaleX(${cur ? Math.max(0, 1 - (S.t - cur.start) / cur.dur) : 0})`
  }
  useLayoutEffect(paint)

  /* ───── 렌더 ───── */
  const cur = S.cur
  const sp = cur ? SPEAKERS[cur.who] : null
  const ts = Math.max(0.05, p.timeScale)
  const rootStyle = { '--ts': ts, '--font': `${fontPx}px`, '--bg': bgOpacity, '--lines': maxLines } as CSSProperties
  const arrow = (deg: number) => (
    <svg className={s.dir} viewBox="-12 -12 24 24" style={{ rotate: `${deg}deg` }} aria-hidden>
      <path d="M0 -9 L7 5 L0 2 L-7 5 Z" />
    </svg>
  )

  return (
    <div className={s.root} data-juice={juice || undefined} data-paused={!p.playing || undefined} data-reduce={reduce || undefined} style={rootStyle}>
      <Scene />

      {/* 소리 방향 링 (플레이어 주위) */}
      <svg className={s.ring} viewBox="0 0 1920 1080" aria-hidden data-part="ring" data-on={ringOn || undefined}>
        <circle cx={PX} cy={PY} r={RING_R} className={s.ringBase} />
        {ringOn &&
          S.sounds.map(x => {
            const w = 34
            const a0 = ((x.sound.deg - w / 2 - 90) * Math.PI) / 180
            const a1 = ((x.sound.deg + w / 2 - 90) * Math.PI) / 180
            const thick = 26 - x.sound.dist * 14 // 가까울수록 두껍게
            const p0 = [PX + Math.cos(a0) * RING_R, PY + Math.sin(a0) * RING_R]
            const p1 = [PX + Math.cos(a1) * RING_R, PY + Math.sin(a1) * RING_R]
            const mid = ((x.sound.deg - 90) * Math.PI) / 180
            const ix = PX + Math.cos(mid) * (RING_R + 52)
            const iy = PY + Math.sin(mid) * (RING_R + 52)
            return (
              <g key={x.id} className={s.cue} data-kind={x.sound.kind} style={{ '--near': 1 - x.sound.dist } as CSSProperties}>
                <path d={`M${p0[0]} ${p0[1]} A${RING_R} ${RING_R} 0 0 1 ${p1[0]} ${p1[1]}`} strokeWidth={thick} />
                {x.sound.kind === 'danger' ? <path d={`M${ix} ${iy - 18} L${ix + 17} ${iy + 13} L${ix - 17} ${iy + 13} Z`} className={s.mark} /> : <circle cx={ix} cy={iy} r={13} className={s.mark} />}
              </g>
            )
          })}
      </svg>

      {/* 효과음 캡션 */}
      <div className={s.captions} data-part="captions" data-on={captionsOn || undefined}>
        {captionsOn &&
          S.captions.map(x => (
            <div key={x.id} className={s.caption} data-kind={x.sound.kind}>
              {arrow(x.sound.deg)}[{x.sound.label}]
            </div>
          ))}
      </div>

      {/* 자막 */}
      <div className={s.sub} data-part="box" data-on={!!cur || undefined} key={cur ? `${cur.text}-${cur.start}` : 'none'}>
        {sp && (
          <span className={s.speaker} data-part="speaker" data-style={speakerStyle} data-show={(cur?.showName && speakerStyle !== 'none') || undefined} style={{ color: speakerStyle === 'name-color' ? sp.color : undefined }}>
            {speakerStyle === 'name-color' && <i className={s.shape} data-shape={sp.shape} style={{ background: sp.color }} />}
            {sp.name}
            {sp.radio && <em className={s.tag}>무전</em>}
            {sp.offscreenDeg !== undefined && <em className={s.tag}>{arrow(sp.offscreenDeg)}화면 밖</em>}
          </span>
        )}
        {!sp && <span className={s.speaker} data-part="speaker" />}
        <p className={s.text}>
          {cur?.cont && '…'}
          {cur?.text}
          {cur?.more && ' …'}
        </p>
        <div className={s.timing} data-part="timing">
          <div ref={barRef} className={s.bar} />
        </div>
      </div>
    </div>
  )
}

/** 밤의 기지 바깥 — 자막이 놓이는 아래쪽은 일부러 밝은 눈밭 (대비 시험) */
function Scene() {
  return (
    <svg className={s.scene} viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="sub-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1626" />
          <stop offset="0.55" stopColor="#1d3550" />
          <stop offset="0.75" stopColor="#c9d8e6" />
          <stop offset="1" stopColor="#eef4fa" />
        </linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#sub-sky)" />
      <path d="M0 620 L260 540 L520 600 L820 520 L1120 590 L1420 510 L1700 570 L1920 530 L1920 760 L0 760 Z" fill="#2a4560" />
      <rect x="1500" y="300" width="26" height="320" fill="#13253a" />
      <path d="M1470 300 h86 l-43 -60 z" fill="#13253a" />
      <rect x="1780" y="560" width="140" height="160" fill="#22384f" />
      <rect x="940" y="420" width="40" height="110" rx="20" fill="#5ee6c9" />
      <circle cx="960" cy="400" r="24" fill="#5ee6c9" />
    </svg>
  )
}
