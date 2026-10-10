import hljs from 'highlight.js/lib/core'
import csharp from 'highlight.js/lib/languages/csharp'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml'
import { useMemo, useState } from 'react'
import { unityFiles } from '../core/registry'
import type { SpecimenMeta } from '../core/types'
import { Rich } from './Rich'

hljs.registerLanguage('csharp', csharp)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('css', css)

type Kind = 'ugui' | 'uitk'
const KIND_LABEL: Record<Kind, string> = { ugui: 'UGUI (Canvas)', uitk: 'UI Toolkit' }

export function UnityPanel({ id, unity }: { id: string; unity: SpecimenMeta['unity'] }) {
  const [kind, setKind] = useState<Kind>('ugui')
  const guide = unity[kind]
  const files = useMemo(() => unityFiles(id, kind), [id, kind])
  const [fileIdx, setFileIdx] = useState(0)
  const file = files[Math.min(fileIdx, files.length - 1)]

  return (
    <div className="unity">
      <div className="tabs" role="tablist" aria-label="Unity UI 시스템">
        {(['ugui', 'uitk'] as Kind[]).map(k => (
          <button
            key={k}
            role="tab"
            aria-selected={kind === k}
            onClick={() => {
              setKind(k)
              setFileIdx(0)
            }}
          >
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>
      <div className="unity-body">
        <div className="unity-guide">
          <h3>하이어라키</h3>
          <pre className="hierarchy">{guide.hierarchy}</pre>
          <h3>만드는 순서</h3>
          <ol>
            {guide.steps.map((s, i) => (
              <li key={i}>
                <Rich text={s} />
              </li>
            ))}
          </ol>
          <h3>주의할 점</h3>
          <ul className="pitfalls">
            {guide.pitfalls.map((s, i) => (
              <li key={i}>
                <Rich text={s} />
              </li>
            ))}
          </ul>
        </div>
        <div className="unity-code">
          {files.length === 0 ? (
            <p className="empty">코드 준비 중</p>
          ) : (
            <>
              <div className="file-tabs" role="tablist" aria-label="파일">
                {files.map((f, i) => (
                  <button key={f.name} role="tab" aria-selected={file === f} onClick={() => setFileIdx(i)}>
                    {f.name}
                  </button>
                ))}
              </div>
              <CodeBlock code={file.code} lang={file.lang} name={file.name} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function CodeBlock({ code, lang, name }: { code: string; lang: string; name: string }) {
  const html = useMemo(() => hljs.highlight(code.replace(/\r\n/g, '\n').trimEnd(), { language: lang }).value, [code, lang])
  const [copied, setCopied] = useState(false)
  return (
    <div className="code">
      <button
        className="btn btn-ghost code-copy"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code)
          } catch {
            const ta = document.createElement('textarea')
            ta.value = code
            document.body.append(ta)
            ta.select()
            document.execCommand('copy')
            ta.remove()
          }
          setCopied(true)
          setTimeout(() => setCopied(false), 1400)
        }}
        aria-label={`${name} 복사`}
      >
        {copied ? '복사됨' : '복사'}
      </button>
      <pre>
        <code className="hljs" dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  )
}
