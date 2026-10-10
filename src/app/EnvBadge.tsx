import { useEffect, useRef, useState } from 'react'
import { getEnv } from '../core/env'
import { prefersReducedMotion } from '../core/flash'

/** 수업 전 30초 점검용 — WebGL, GPU, 화면 크기, 모션 줄이기 설정 */
export function EnvBadge() {
  const [open, setOpen] = useState(false)
  const [size, setSize] = useState({ w: innerWidth, h: innerHeight, dpr: devicePixelRatio })
  const ref = useRef<HTMLDivElement>(null)
  const env = getEnv()

  useEffect(() => {
    const on = () => setSize({ w: innerWidth, h: innerHeight, dpr: devicePixelRatio })
    addEventListener('resize', on)
    return () => removeEventListener('resize', on)
  }, [])
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    addEventListener('pointerdown', close)
    return () => removeEventListener('pointerdown', close)
  }, [open])

  const ok = env.webgl
  return (
    <div className="env" ref={ref}>
      <button className="btn btn-ghost" onClick={() => setOpen(v => !v)} aria-expanded={open} title="이 PC의 실행 환경 점검">
        <span className={`dot ${ok ? 'dot-ok' : 'dot-warn'}`} aria-hidden /> 환경 점검
      </button>
      {open && (
        <div className="env-pop" role="dialog" aria-label="환경 점검 결과">
          <dl>
            <dt>3D (WebGL)</dt>
            <dd>{ok ? '사용 가능' : '사용 불가 — 3D 표본은 2D 대체 화면으로 표시됩니다'}</dd>
            <dt>그래픽</dt>
            <dd className="mono">{env.renderer}</dd>
            <dt>창 크기</dt>
            <dd>
              {size.w} × {size.h} (배율 {size.dpr})
              {size.w < 1280 && <em> — 1280 이상 권장</em>}
            </dd>
            <dt>모션 줄이기</dt>
            <dd>{prefersReducedMotion() ? '켜짐 — 자동 재생을 끕니다' : '꺼짐'}</dd>
            <dt>실행 방식</dt>
            <dd>{location.protocol === 'file:' ? '오프라인 파일' : '웹 (GitHub Pages)'}</dd>
          </dl>
          {!ok && <p className="env-tip">GPU 가속이 꺼진 PC·원격 데스크톱에서는 WebGL이 동작하지 않을 수 있습니다. 브라우저 설정 → 시스템 → '그래픽 가속 사용'을 확인하세요.</p>}
        </div>
      )}
    </div>
  )
}
