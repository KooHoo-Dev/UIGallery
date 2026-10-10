import type { ParamDef, ParamValues, Preset } from './types'

export function defaultParams(defs: ParamDef[]): ParamValues {
  return Object.fromEntries(defs.map(d => [d.key, d.default]))
}

/** 프리셋 값을 정의 범위 안으로 정리해서 적용 (잘못된 키는 무시) */
export function applyPreset(defs: ParamDef[], preset: Preset): ParamValues {
  const base = defaultParams(defs)
  for (const d of defs) {
    const v = preset.values[d.key]
    if (v === undefined) continue
    if (d.type === 'range' && typeof v === 'number') base[d.key] = Math.min(d.max, Math.max(d.min, v))
    else if (d.type === 'select' && d.options.some(o => o.value === v)) base[d.key] = v
    else if (d.type === 'toggle' && typeof v === 'boolean') base[d.key] = v
    else if (d.type === 'color' && typeof v === 'string') base[d.key] = v
  }
  return base
}

export const num = (p: ParamValues, k: string, fallback = 0) => (typeof p[k] === 'number' ? (p[k] as number) : fallback)
export const str = (p: ParamValues, k: string, fallback = '') => (typeof p[k] === 'string' ? (p[k] as string) : fallback)
export const bool = (p: ParamValues, k: string, fallback = false) => (typeof p[k] === 'boolean' ? (p[k] as boolean) : fallback)
