import { useMemo, useState } from 'react'
import { prefersReducedMotion } from '../core/flash'
import { defaultParams } from '../core/params'
import { GROUPS, PARADIGMS } from '../core/taxonomy'
import type { PlannedSpecimen, SpecimenModule } from '../core/types'
import { hrefSpecimen } from './router'
import { Stage } from './Stage'

/** 갤러리 카드 — 평소엔 정지, 마우스를 올리거나 포커스하면 자동 데모 재생 */
export function SpecimenCard({ mod }: { mod: SpecimenModule }) {
  const m = mod.meta
  const [hover, setHover] = useState(false)
  const params = useMemo(() => defaultParams(m.params), [m.params])
  const aspect = m.stage.aspect === '9:16' ? '9:16' : '16:9'
  const play = hover && !prefersReducedMotion()
  return (
    <a
      className="card"
      href={hrefSpecimen(m.id)}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <div className="card-stage" data-aspect={aspect}>
        <Stage mod={mod} params={params} juice playing={play} timeScale={1} trigger={null} autoplay aspect={aspect} thumbnail />
      </div>
      <div className="card-body">
        <div className="card-tags">
          {m.paradigms.map(p => (
            <span key={p} className="chip chip-sm" data-p={p}>
              {PARADIGMS[p].short}
            </span>
          ))}
          <span className="stars" aria-label={`Unity 난이도 ${m.difficulty}`}>
            {'★'.repeat(m.difficulty)}
            <span aria-hidden className="stars-off">
              {'★'.repeat(3 - m.difficulty)}
            </span>
          </span>
        </div>
        <h3>{m.title}</h3>
        <p>{m.oneLiner}</p>
        {m.inspiredBy.length > 0 && <p className="card-inspired">Inspired by {m.inspiredBy.map(i => i.title).join(' · ')}</p>}
      </div>
    </a>
  )
}

export function PlannedCard({ p }: { p: PlannedSpecimen }) {
  return (
    <div className="card card-planned" aria-label={`${p.title} (제작 중)`}>
      <div className="card-stage card-stage-planned" data-aspect="16:9">
        <span className="planned-label">제작 중</span>
        <span className="planned-group" aria-hidden>
          {p.group} · {GROUPS[p.group].name}
        </span>
      </div>
      <div className="card-body">
        <div className="card-tags">
          {p.paradigms.map(x => (
            <span key={x} className="chip chip-sm" data-p={x}>
              {PARADIGMS[x].short}
            </span>
          ))}
        </div>
        <h3>{p.title}</h3>
        <p>{p.oneLiner}</p>
      </div>
    </div>
  )
}
