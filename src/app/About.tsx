const LIBS: [string, string, string][] = [
  ['React · React DOM', 'MIT', 'https://github.com/facebook/react'],
  ['three.js', 'MIT', 'https://github.com/mrdoob/three.js'],
  ['React Three Fiber · drei', 'MIT', 'https://github.com/pmndrs/react-three-fiber'],
  ['Motion', 'MIT', 'https://github.com/motiondivision/motion'],
  ['highlight.js', 'BSD-3-Clause', 'https://github.com/highlightjs/highlight.js'],
  ['Chakra Petch (글꼴)', 'SIL OFL 1.1', 'https://github.com/cadsondemak/chakra-petch'],
  ['JetBrains Mono (글꼴)', 'SIL OFL 1.1', 'https://github.com/JetBrains/JetBrainsMono'],
  ['Vite · vite-plugin-singlefile (빌드 도구)', 'MIT', 'https://github.com/vitejs/vite'],
]

export function About() {
  return (
    <div className="about">
      <h1>크레딧 · 정책</h1>

      <section className="sec">
        <h2>이 갤러리는 무엇인가</h2>
        <p>
          유니티 개발자 양성과정 수업을 위해 만든 게임 UI 패턴 갤러리입니다. 잘 만든 게임 UI를 분석해 <b>원리</b>를 정리하고, 그 원리를 <b>새 코드로 다시 만들어</b> 직접 조작해 볼 수 있게 했습니다. 표본마다 Unity의 UGUI와 UI Toolkit으로 구현하는 방법을 함께 실었습니다.
        </p>
      </section>

      <section className="sec">
        <h2>콘텐츠 원칙 — 패턴은 배우고, 표현은 새로</h2>
        <ul>
          <li>원작 게임의 이미지·스크린샷·폰트·사운드·로고·캐릭터는 하나도 포함하지 않습니다. 모든 그래픽은 SVG·CSS·three.js로 새로 그렸습니다.</li>
          <li>원작에서 빌려 온 시각 요소는 표본마다 최대 두 가지(예: 색 체계, 레이아웃 구조)로 제한하고, 무엇을 빌렸는지 표본 페이지에 밝혔습니다.</li>
          <li>표본과 프리셋의 이름은 게임명이 아니라 패턴·장르 이름으로 지었습니다. 게임명은 'Inspired by' 표기에만 씁니다.</li>
          <li>원작 화면은 공식 사이트·공식 영상 등 외부 링크로 확인하세요.</li>
        </ul>
        <p className="notice">
          언급된 게임명과 상표는 각 권리자의 소유이며, 이 프로젝트는 해당 권리자와 제휴하거나 보증받지 않았습니다. 권리 관련 요청은 저장소의 Issues로 보내 주시면 지체 없이 조치합니다.
          <br />
          <span lang="en">All UI in this gallery are original re-creations for education. No game assets are included. Game titles and trademarks belong to their respective owners; this project is not affiliated with or endorsed by them.</span>
        </p>
      </section>

      <section className="sec">
        <h2>수강생 여러분께</h2>
        <p>
          여기 있는 코드는 MIT 라이선스로 자유롭게 써도 됩니다. 하지만 상용 게임의 화면을 그대로 베끼는 일은 저작권 문제가 될 수 있습니다. 이 갤러리처럼 <b>원리를 이해한 뒤 자기만의 표현</b>으로 만드세요.
        </p>
      </section>

      <section className="sec">
        <h2>사용한 라이브러리 · 글꼴</h2>
        <table className="licenses">
          <thead>
            <tr>
              <th>이름</th>
              <th>라이선스</th>
            </tr>
          </thead>
          <tbody>
            {LIBS.map(([name, lic, url]) => (
              <tr key={name}>
                <td>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {name}
                  </a>
                </td>
                <td className="mono">{lic}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted">한글 본문은 각 PC의 시스템 글꼴(맑은 고딕 등)로 표시합니다.</p>
      </section>
    </div>
  )
}
