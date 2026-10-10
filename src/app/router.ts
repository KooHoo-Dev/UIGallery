import { useEffect, useState } from 'react'
import { ALIASES } from '../core/registry'

/* 해시 라우터 — file:// 와 GitHub Pages 모두에서 동작.
 *   #/            갤러리
 *   #/s/<id>      표본 상세 (?preset=<presetId>)
 *   #/about       크레딧 · 정책
 */
export type Route =
  | { name: 'home' }
  | { name: 'specimen'; id: string; preset?: string; opts: SpecimenUrlOptions }
  | { name: 'about' }

/** 수업 자료·자동 검사용 딥링크 옵션: #/s/<id>?preset=x&juice=0&speed=0.25&event=heavy&spot=2&spots=0&auto=0&aspect=9:16&p.fovDeg=120&webgl=0 */
export interface SpecimenUrlOptions {
  juice?: boolean
  speed?: number
  event?: string
  spot?: number
  spots?: boolean
  auto?: boolean
  aspect?: '16:9' | '9:16'
  /** p.<key>=<값> — 프리셋 위에 덮어쓰는 개별 조절 값 */
  params?: Record<string, string>
  /** webgl=0 — 3D 표본을 2D 대체 화면으로 (저사양 PC 시연·검사용) */
  webgl?: boolean
}

export function parseHash(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#/, '').split('?')
  const parts = path.split('/').filter(Boolean)
  const params = new URLSearchParams(query)
  if (parts[0] === 's' && parts[1]) {
    const id = ALIASES[parts[1]] ?? parts[1]
    const flag = (k: string) => (params.has(k) ? params.get(k) !== '0' : undefined)
    const speed = Number(params.get('speed'))
    const spot = Number(params.get('spot'))
    const aspect = params.get('aspect')
    const overrides = Object.fromEntries([...params].filter(([k]) => k.startsWith('p.')).map(([k, v]) => [k.slice(2), v]))
    return {
      name: 'specimen',
      id,
      preset: params.get('preset') ?? undefined,
      opts: {
        juice: flag('juice'),
        speed: [0.25, 0.5, 1].includes(speed) ? speed : undefined,
        event: params.get('event') ?? undefined,
        spot: spot > 0 ? spot : undefined,
        spots: flag('spots'),
        auto: flag('auto'),
        aspect: aspect === '9:16' || aspect === '16:9' ? aspect : undefined,
        params: Object.keys(overrides).length ? overrides : undefined,
        webgl: flag('webgl'),
      },
    }
  }
  if (parts[0] === 'about') return { name: 'about' }
  return { name: 'home' }
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(location.hash))
  useEffect(() => {
    const on = () => {
      setRoute(parseHash(location.hash))
      window.scrollTo({ top: 0 })
    }
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  return route
}

export const hrefSpecimen = (id: string, preset?: string) => `#/s/${id}${preset ? `?preset=${preset}` : ''}`
