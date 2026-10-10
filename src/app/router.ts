import { useEffect, useState } from 'react'
import { ALIASES } from '../core/registry'

/* 해시 라우터 — file:// 와 GitHub Pages 모두에서 동작.
 *   #/            갤러리
 *   #/s/<id>      표본 상세 (?preset=<presetId>)
 *   #/about       크레딧 · 정책
 */
export type Route =
  | { name: 'home' }
  | { name: 'specimen'; id: string; preset?: string }
  | { name: 'about' }

export function parseHash(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#/, '').split('?')
  const parts = path.split('/').filter(Boolean)
  const params = new URLSearchParams(query)
  if (parts[0] === 's' && parts[1]) {
    const id = ALIASES[parts[1]] ?? parts[1]
    return { name: 'specimen', id, preset: params.get('preset') ?? undefined }
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
