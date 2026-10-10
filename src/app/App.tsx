import { useEffect, useState } from 'react'
import { load, save } from '../core/storage'
import { About } from './About'
import { EnvBadge } from './EnvBadge'
import { Home } from './Home'
import { useRoute } from './router'
import { SpecimenPage } from './SpecimenPage'

type Theme = 'dark' | 'light'

export function App() {
  const route = useRoute()
  const [theme, setTheme] = useState<Theme>(() =>
    load<Theme>('theme', matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'),
  )
  // ?present=1 이면 발표 모드로 시작 (수업 자료 링크용)
  const [presenter, setPresenter] = useState(() => /[?&]present=1\b/.test(location.hash))

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    save('theme', theme)
  }, [theme])
  useEffect(() => {
    document.documentElement.dataset.presenter = String(presenter)
  }, [presenter])

  // P: 발표 모드, Esc: 해제 (입력창에서는 무시)
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (isTyping(e)) return
      if (e.key === 'p' || e.key === 'P') setPresenter(v => !v)
      if (e.key === 'Escape') setPresenter(false)
    }
    addEventListener('keydown', on)
    return () => removeEventListener('keydown', on)
  }, [])

  const isFile = location.protocol === 'file:'

  return (
    <div className="app">
      <a className="skip-link" href="#main">본문으로 건너뛰기</a>
      <header className="topbar">
        <a className="brand" href="#/" aria-label="UI Gallery 홈">
          <span className="brand-mark" aria-hidden />
          <span className="brand-text">
            <b>UI GALLERY</b>
            <small>게임 UI 패턴 · 해부 · 재현 · Unity 구현</small>
          </span>
        </a>
        <nav className="topnav" aria-label="주 메뉴">
          <a href="#/" aria-current={route.name === 'home' ? 'page' : undefined}>갤러리</a>
          <a href="#/about" aria-current={route.name === 'about' ? 'page' : undefined}>크레딧 · 정책</a>
        </nav>
        <div className="topbar-tools">
          <EnvBadge />
          {!isFile && (
            <a className="btn btn-ghost" href="./index.html" download="UIGallery.html" title="이 갤러리 전체를 HTML 파일 하나로 내려받아 인터넷 없이 실행">
              오프라인용 HTML 받기
            </a>
          )}
          <button className="btn btn-ghost hide-sm" onClick={() => setPresenter(v => !v)} aria-pressed={presenter} title="발표 모드 (P)">
            발표 모드 <kbd>P</kbd>
          </button>
          <button
            className="btn btn-icon"
            onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
            aria-label={theme === 'dark' ? '밝은 테마로' : '어두운 테마로'}
            title="테마 전환"
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </header>

      <main id="main" className="main" tabIndex={-1}>
        {route.name === 'home' && <Home />}
        {route.name === 'specimen' && <SpecimenPage key={route.id} id={route.id} presetId={route.preset} opts={route.opts} presenter={presenter} />}
        {route.name === 'about' && <About />}
      </main>

      <footer className="footer">
        <p>
          모든 UI는 학습용으로 새로 만든 재해석이며 원작 게임의 이미지·폰트·사운드·로고를 포함하지 않습니다. 게임명과 상표는 각 권리자의 소유입니다.
        </p>
        <p className="footer-meta">
          v{__APP_VERSION__} · {__BUILD_DATE__} · <a href="#/about">크레딧 · 라이선스</a>
        </p>
      </footer>
    </div>
  )
}

export function isTyping(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null
  if (!t) return false
  if (t.isContentEditable || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') return true
  if (t.tagName === 'INPUT') return !['range', 'checkbox', 'radio', 'color', 'button'].includes((t as HTMLInputElement).type)
  return false
}
