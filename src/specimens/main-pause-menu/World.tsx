import type { Ref } from 'react'
import { Silhouette } from '../../core/silhouettes'
import s from './style.module.css'

/* ──────────────────────────────────────────────────────────────
 * 무대 배경 — 메뉴 뒤에서 멈추는 '게임 화면'과 타이틀 화면 배경. 모두 SVG 로 새로 그렸다.
 * 드론·탐사대장의 움직임은 부모가 ref 로 직접 갱신한다 (메뉴가 열리면 게임 시간이 멈춰 함께 멈춘다).
 * ────────────────────────────────────────────────────────────── */

export function GameWorld({ droneA, droneB, player }: { droneA: Ref<SVGGElement>; droneB: Ref<SVGGElement>; player: Ref<SVGGElement> }) {
  return (
    <svg className={s.world} viewBox="0 0 1920 1080" aria-hidden preserveAspectRatio="none">
      <defs>
        <linearGradient id="mpm-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a1426" />
          <stop offset="0.5" stopColor="#24395a" />
          <stop offset="0.82" stopColor="#c8775a" />
          <stop offset="1" stopColor="#f0b07a" />
        </linearGradient>
        <linearGradient id="mpm-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b2533" />
          <stop offset="1" stopColor="#090e16" />
        </linearGradient>
        <radialGradient id="mpm-planet" cx="0.35" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#e9d7ff" />
          <stop offset="0.6" stopColor="#8f7bc4" />
          <stop offset="1" stopColor="#3b3266" />
        </radialGradient>
        <radialGradient id="mpm-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffb27a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffb27a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1920" height="720" fill="url(#mpm-sky)" />
      {Array.from({ length: 46 }, (_, i) => (
        <circle key={i} cx={(i * 7919) % 1920} cy={((i * 3571) % 380) + 10} r={(i % 3) * 0.8 + 1} fill="#fff" opacity={0.2 + (i % 4) * 0.12} />
      ))}
      <g transform="translate(1420 230)">
        <ellipse rx="300" ry="54" transform="rotate(-14)" fill="none" stroke="#cdbdf2" strokeOpacity="0.35" strokeWidth="10" />
        <circle r="150" fill="url(#mpm-planet)" />
        <path d="M-300 0 A300 54 0 0 0 300 0" transform="rotate(-14)" fill="none" stroke="#e4d9ff" strokeOpacity="0.6" strokeWidth="10" />
      </g>
      <ellipse cx="960" cy="720" rx="900" ry="120" fill="url(#mpm-glow)" />
      <path d="M0 640 L140 590 L260 615 L410 548 L560 600 L700 560 L860 612 L1010 570 L1180 620 L1320 575 L1500 612 L1660 560 L1800 600 L1920 580 V720 H0 Z" fill="#3a3f5e" opacity="0.8" />
      <path d="M0 690 L180 660 L330 676 L520 640 L700 672 L900 650 L1100 680 L1300 652 L1520 676 L1720 648 L1920 668 V720 H0 Z" fill="#232a40" />
      <rect y="700" width="1920" height="380" fill="url(#mpm-ground)" />
      {Array.from({ length: 13 }, (_, i) => {
        const x = (i / 12) * 1920
        return <line key={i} x1={960 + (x - 960) * 0.12} y1="700" x2={x * 1.8 - 768} y2="1080" stroke="#7fb2ff" strokeOpacity="0.07" strokeWidth="2" />
      })}
      {[0.12, 0.3, 0.55, 0.85].map(t => (
        <line key={t} x1="0" x2="1920" y1={700 + 380 * t * t} y2={700 + 380 * t * t} stroke="#7fb2ff" strokeOpacity="0.06" strokeWidth="2" />
      ))}
      {/* 정비 기지 (왼쪽) */}
      <g transform="translate(150 700)" fill="#121a26" stroke="#3d4d66" strokeWidth="3">
        <path d="M0 0 A150 120 0 0 1 300 0 Z" />
        <rect x="290" y="-70" width="180" height="70" />
        <rect x="330" y="-150" width="16" height="80" />
        <circle cx="338" cy="-160" r="10" fill="#ffd36b" stroke="none" />
      </g>
      {/* 북쪽 통신탑 (오른쪽) */}
      <g transform="translate(1600 700)" stroke="#4d5d7a" strokeWidth="4" fill="none">
        <path d="M-60 0 L0 -330 L60 0 M-45 -80 L45 -80 M-30 -165 L30 -165 M-16 -250 L16 -250 M-45 -80 L30 -165 M45 -80 L-30 -165 M-30 -165 L16 -250 M30 -165 L-16 -250" />
        <circle className={s.beacon} cx="0" cy="-338" r="11" fill="#ff5d5d" stroke="none" />
      </g>
      {/* 화물 상자 */}
      <g fill="#1a2433" stroke="#46587a" strokeWidth="3">
        <rect x="560" y="780" width="110" height="80" />
        <rect x="610" y="730" width="80" height="50" />
        <rect x="1330" y="760" width="90" height="70" />
      </g>
      <g ref={player}>
        <Silhouette role="ally" x={840} y={900} height={190} />
      </g>
      <g ref={droneA}>
        <Silhouette role="enemy" x={1130} y={650} height={96} />
      </g>
      <g ref={droneB}>
        <Silhouette role="enemy" x={1300} y={735} height={84} />
      </g>
    </svg>
  )
}

/** 타이틀 화면 배경 — 궤도에서 내려다본 행성 */
export function TitleWorld() {
  return (
    <svg className={s.world} viewBox="0 0 1920 1080" aria-hidden preserveAspectRatio="none">
      <defs>
        <radialGradient id="mpm-space" cx="0.7" cy="0.2" r="1">
          <stop offset="0" stopColor="#1c2346" />
          <stop offset="1" stopColor="#05070f" />
        </radialGradient>
        <radialGradient id="mpm-big" cx="0.4" cy="0.2" r="0.8">
          <stop offset="0" stopColor="#f4b57e" />
          <stop offset="0.45" stopColor="#8a4f4a" />
          <stop offset="1" stopColor="#1b1426" />
        </radialGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#mpm-space)" />
      {Array.from({ length: 90 }, (_, i) => (
        <circle key={i} cx={(i * 7919) % 1920} cy={(i * 104729) % 1080} r={(i % 3) * 0.7 + 0.8} fill="#fff" opacity={0.15 + (i % 5) * 0.1} />
      ))}
      <circle cx="1500" cy="1620" r="1050" fill="url(#mpm-big)" />
      <circle cx="1500" cy="1620" r="1062" fill="none" stroke="#ffc994" strokeOpacity="0.35" strokeWidth="14" />
      {/* 궤도 정비 기지 */}
      <g transform="translate(1500 300) rotate(-18)" fill="#121a2b" stroke="#6a7aa0" strokeWidth="3">
        <rect x="-140" y="-10" width="280" height="20" />
        <rect x="-30" y="-40" width="60" height="80" />
        <rect x="-200" y="-34" width="56" height="68" />
        <rect x="144" y="-34" width="56" height="68" />
        <circle cx="0" cy="0" r="9" fill="#ffd36b" stroke="none" />
      </g>
    </svg>
  )
}

/** 회전 엠블럼 — 메뉴가 열릴 때 짧게 돌다 멈추는 추상 다면체 (입력을 막지 않는 장식 레이어) */
export function Emblem() {
  const R = 70
  const hex = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2
    return [Math.cos(a) * R, Math.sin(a) * R]
  })
  const tri = [0, 2, 4].map(i => {
    const a = (Math.PI / 3) * i - Math.PI / 2 + Math.PI / 3
    return [Math.cos(a) * R * 0.48, Math.sin(a) * R * 0.48]
  })
  const facets: [number[], number[], number[], number][] = [
    [hex[0], hex[1], tri[0], 0.9],
    [hex[1], hex[2], tri[0], 0.55],
    [hex[2], hex[3], tri[1], 0.35],
    [hex[3], hex[4], tri[1], 0.2],
    [hex[4], hex[5], tri[2], 0.45],
    [hex[5], hex[0], tri[2], 0.75],
    [hex[1], tri[0], tri[1], 0.3],
    [hex[3], tri[1], tri[2], 0.15],
    [hex[5], tri[2], tri[0], 0.6],
    [tri[0], tri[1], tri[2], 1],
  ]
  return (
    <svg viewBox="-80 -80 160 160" className={s.emblemSvg} aria-hidden>
      {facets.map(([a, b, c, o], i) => (
        <path key={i} d={`M${a[0]} ${a[1]} L${b[0]} ${b[1]} L${c[0]} ${c[1]} Z`} fill="var(--accent)" fillOpacity={o * 0.85} stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
      ))}
    </svg>
  )
}
