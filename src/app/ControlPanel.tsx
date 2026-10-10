import type { ParamDef, ParamValue, ParamValues, Preset } from '../core/types'

export function ControlPanel({
  defs,
  presets,
  values,
  activePreset,
  onChange,
  onPreset,
  onReset,
}: {
  defs: ParamDef[]
  presets: Preset[]
  values: ParamValues
  activePreset: string | null
  onChange: (key: string, v: ParamValue) => void
  onPreset: (p: Preset) => void
  onReset: () => void
}) {
  return (
    <div className="controls">
      {presets.length > 0 && (
        <div className="presets" role="group" aria-label="프리셋">
          <span className="ctl-label">프리셋</span>
          <div className="preset-list">
            {presets.map(p => (
              <button key={p.id} className="preset" aria-pressed={activePreset === p.id} onClick={() => onPreset(p)} title={p.look}>
                {p.name}
              </button>
            ))}
          </div>
          {activePreset && <p className="preset-look">{presets.find(p => p.id === activePreset)?.look}</p>}
        </div>
      )}
      {defs.map(d => (
        <Control key={d.key} def={d} value={values[d.key]} onChange={v => onChange(d.key, v)} />
      ))}
      <button className="btn btn-ghost btn-block" onClick={onReset}>
        기본값으로
      </button>
    </div>
  )
}

function Control({ def, value, onChange }: { def: ParamDef; value: ParamValue; onChange: (v: ParamValue) => void }) {
  const id = `ctl-${def.key}`
  if (def.type === 'range') {
    const v = typeof value === 'number' ? value : def.default
    return (
      <div className="ctl">
        <label htmlFor={id} className="ctl-label" title={def.hint}>
          {def.label}
          <output htmlFor={id} className="ctl-value">
            {fmt(v, def.step)}
            {def.unit}
          </output>
        </label>
        <input id={id} type="range" min={def.min} max={def.max} step={def.step} value={v} onChange={e => onChange(Number(e.target.value))} />
        {def.hint && <p className="ctl-hint">{def.hint}</p>}
      </div>
    )
  }
  if (def.type === 'select') {
    return (
      <div className="ctl">
        <span className="ctl-label" title={def.hint}>
          {def.label}
        </span>
        <div className="seg" role="radiogroup" aria-label={def.label}>
          {def.options.map(o => (
            <button key={o.value} role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
        {def.hint && <p className="ctl-hint">{def.hint}</p>}
      </div>
    )
  }
  if (def.type === 'toggle') {
    return (
      <div className="ctl ctl-row">
        <label htmlFor={id} className="ctl-label" title={def.hint}>
          {def.label}
        </label>
        <input id={id} type="checkbox" className="switch" checked={Boolean(value)} onChange={e => onChange(e.target.checked)} />
        {def.hint && <p className="ctl-hint">{def.hint}</p>}
      </div>
    )
  }
  return (
    <div className="ctl ctl-row">
      <label htmlFor={id} className="ctl-label">
        {def.label}
      </label>
      <input id={id} type="color" value={String(value)} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

const fmt = (v: number, step: number) => (step >= 1 ? String(Math.round(v)) : v.toFixed(String(step).split('.')[1]?.length ?? 2))
