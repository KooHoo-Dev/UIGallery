import { Fragment } from 'react'

/**
 * 해설 문자열의 간단한 서식: **굵게**, `코드`, [링크](https://...), [다른 표본](#/s/<id>?preset=...)
 * (강사가 meta.ts 의 문자열만 고쳐도 서식이 유지되도록 최소한만 지원)
 */
export function Rich({ text }: { text: string }) {
  const out: React.ReactNode[] = []
  const re = /\*\*(.+?)\*\*|`(.+?)`|\[(.+?)\]\(((?:https?:\/\/|#\/)[^)\s]+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(<Fragment key={i++}>{text.slice(last, m.index)}</Fragment>)
    if (m[1]) out.push(<strong key={i++}>{m[1]}</strong>)
    else if (m[2]) out.push(<code key={i++}>{m[2]}</code>)
    else if (m[3] && m[4].startsWith('#/')) out.push(<a key={i++} href={m[4]}>{m[3]}</a>)
    else if (m[3]) out.push(<a key={i++} href={m[4]} target="_blank" rel="noopener noreferrer">{m[3]}</a>)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(<Fragment key={i++}>{text.slice(last)}</Fragment>)
  return <>{out}</>
}
