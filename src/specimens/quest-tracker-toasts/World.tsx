import { memo } from 'react'
import { Silhouette } from '../../core/silhouettes'
import s from './style.module.css'

/**
 * 무대 배경 — 외곽 탐사대의 지표 탐사 구역 (해 질 녘 변방 행성).
 * HUD 를 읽기 쉽도록 채도와 대비를 낮게 둔다. 논리 해상도 좌표(1920×1080 / 1080×1920).
 */
export const World = memo(function World({ width: W, height: H, allyAside = false }: { width: number; height: number; allyAside?: boolean }) {
  const portrait = H > W
  const hz = portrait ? H * 0.5 : H * 0.6
  const towerX = portrait ? W * 0.3 : W * 0.6
  const towerBase = hz - (portrait ? 40 : 30)
  const tH = portrait ? 300 : 260
  return (
    <svg className={s.world} width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden preserveAspectRatio="none">
      <defs>
        <linearGradient id="qt-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#070d1a" />
          <stop offset="0.55" stopColor="#1a2440" />
          <stop offset="0.85" stopColor="#4a3550" />
          <stop offset="1" stopColor="#a35e46" />
        </linearGradient>
        <linearGradient id="qt-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d1a26" />
          <stop offset="1" stopColor="#07080e" />
        </linearGradient>
        <radialGradient id="qt-planet" cx="0.38" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#6f86b8" />
          <stop offset="1" stopColor="#1c2645" />
        </radialGradient>
        <radialGradient id="qt-glow" cx="0.5" cy="1" r="0.6">
          <stop offset="0" stopColor="#ff9a5c" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ff9a5c" stopOpacity="0" />
        </radialGradient>
        <clipPath id="qt-planet-clip">
          <circle cx={portrait ? W * 0.2 : W * 0.3} cy={portrait ? H * 0.075 : H * 0.2} r={portrait ? 130 : 170} />
        </clipPath>
      </defs>

      <rect width={W} height={hz} fill="url(#qt-sky)" />
      <rect y={hz - H * 0.3} width={W} height={H * 0.3} fill="url(#qt-glow)" />
      {/* 큰 행성 */}
      <g opacity="0.55">
        <circle cx={portrait ? W * 0.2 : W * 0.3} cy={portrait ? H * 0.075 : H * 0.2} r={portrait ? 130 : 170} fill="url(#qt-planet)" />
        <g clipPath="url(#qt-planet-clip)" stroke="#a9bde6" strokeOpacity="0.18" strokeWidth="10">
          {[-60, -10, 40, 90].map(d => (
            <line key={d} x1="0" x2={W} y1={(portrait ? H * 0.075 : H * 0.2) + d} y2={(portrait ? H * 0.075 : H * 0.2) + d - 60} />
          ))}
        </g>
      </g>
      {Array.from({ length: 50 }, (_, i) => (
        <circle key={i} cx={(i * 7919) % W} cy={((i * 104729) % (hz * 0.7)) + 6} r={(i % 3) * 0.8 + 1} fill="#fff" opacity={0.15 + (i % 4) * 0.08} />
      ))}

      {/* 먼 능선 · 가까운 능선 */}
      <path d={ridge(W, hz, H * 0.11, 6, 4)} fill="#2b2440" opacity="0.9" />
      <path d={ridge(W, hz + 10, H * 0.06, 9, 2)} fill="#191626" />

      {/* 북쪽 통신탑 (복구 대상) */}
      <g transform={`translate(${towerX} ${towerBase})`} stroke="#0c0b14" strokeWidth="5" fill="none" opacity="0.95">
        <path d={`M-46 0 L-8 ${-tH} L8 ${-tH} L46 0`} />
        {[0.2, 0.42, 0.62, 0.8].map(t => (
          <line key={t} x1={-46 + 38 * t} x2={46 - 38 * t} y1={-tH * t} y2={-tH * t} />
        ))}
        <path d={`M-40 ${-tH * 0.1} L30 ${-tH * 0.38} M40 ${-tH * 0.1} L-30 ${-tH * 0.38} M-26 ${-tH * 0.45} L20 ${-tH * 0.66} M26 ${-tH * 0.45} L-20 ${-tH * 0.66}`} strokeWidth="3" />
        <path d={`M0 ${-tH} V${-tH - 50}`} />
        <path d={`M-30 ${-tH + 30} a34 34 0 0 1 40 -40`} strokeWidth="6" />
      </g>
      <circle className={s.beacon} cx={towerX} cy={towerBase - tH - 52} r="7" fill="#ff5a4a" />
      {/* 목표 표식 */}
      <g transform={`translate(${towerX} ${towerBase - tH - 120})`}>
        <path d="M0 -22 L18 0 L0 22 L-18 0Z" fill="rgba(255,190,90,0.18)" stroke="#ffbe5a" strokeWidth="3.5" />
        <text y="62" textAnchor="middle" className={s.worldLabel}>
          214m
        </text>
      </g>

      {/* 지면 */}
      <rect y={hz} width={W} height={H - hz} fill="url(#qt-ground)" />
      {Array.from({ length: 13 }, (_, i) => {
        const x = (i / 12) * W
        return <line key={i} x1={W / 2 + (x - W / 2) * 0.1} y1={hz} x2={x * 1.8 - W * 0.4} y2={H} stroke="#9fb6ff" strokeOpacity="0.045" strokeWidth="3" />
      })}
      {[0.12, 0.3, 0.56, 0.9].map(t => (
        <line key={t} x1="0" x2={W} y1={hz + (H - hz) * t} y2={hz + (H - hz) * t} stroke="#9fb6ff" strokeOpacity="0.035" strokeWidth="3" />
      ))}
      {/* 바위 */}
      <path d={`M${W * 0.08} ${H * 0.8} l60 -70 l70 20 l40 50 Z`} fill="#0e0d16" />
      <path d={`M${W * 0.83} ${H * 0.74} l50 -55 l60 10 l30 45 Z`} fill="#0e0d16" />

      {/* 잔해 드론 (적 = 삼각) */}
      <g opacity="0.85">
        <Drone x={portrait ? W * 0.78 : W * 0.38} y={hz - (portrait ? 20 : 90)} s={0.9} />
        <Drone x={portrait ? W * 0.62 : W * 0.655} y={hz - (portrait ? 60 : 120)} s={0.6} />
        <Drone x={portrait ? W * 0.5 : W * 0.5} y={hz - (portrait ? 160 : 240)} s={0.45} />
      </g>

      {/* 탐사대원 (아군 = 캡슐, 뒷모습). 토스트가 아래 가운데에 쌓일 때는 카드 뒤로 비죽 나오지 않게 옆으로 비킨다 */}
      <Silhouette role="ally" x={allyAside ? W * 0.2 : portrait ? W * 0.5 : W * 0.36} y={portrait ? H * 0.72 : H * 0.93} height={portrait ? 210 : 170} />
    </svg>
  )
})

function Drone({ x, y, s: k }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <ellipse cx="0" cy="120" rx="40" ry="8" fill="#000" opacity="0.35" />
      <path d="M0 -44 L46 30 L-46 30 Z" fill="#c4544a" stroke="#2a0e10" strokeWidth="5" strokeLinejoin="round" />
      <circle cx="0" cy="8" r="9" fill="#ffd1a8" />
    </g>
  )
}

function ridge(w: number, base: number, amp: number, f1: number, f2: number) {
  const pts: string[] = [`M0 ${base}`]
  for (let i = 0; i <= 48; i++) {
    const x = (i / 48) * w
    const y = base - amp * (0.55 + 0.3 * Math.sin((i / 48) * f1 + 0.7) + 0.15 * Math.sin((i / 48) * f2 * 3.1))
    pts.push(`L${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  pts.push(`L${w} ${base + 4} L0 ${base + 4} Z`)
  return pts.join(' ')
}
