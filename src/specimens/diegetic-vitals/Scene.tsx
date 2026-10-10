import { Grid } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointsMaterial,
  Quaternion,
  RingGeometry,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  Vector3,
} from 'three'
import { num, str } from '../../core/params'
import type { SpecimenProps } from '../../core/types'
import { ENERGY, FOV, hexPoints, layout, LINE_Z, MAX_CELLS, MINT, panelMatrix, PANEL_Y, poseCamera, RED, type Layout, type View } from './world'

/* ───── 캔버스 텍스처 (비트맵 파일 없이 런타임에 그린다) ───── */
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d')!)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}
const FONT = "'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif"

function glowTex() {
  return canvasTex(128, 128, g => {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    r.addColorStop(0, 'rgba(255,255,255,1)')
    r.addColorStop(0.35, 'rgba(255,255,255,0.45)')
    r.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = r
    g.fillRect(0, 0, 128, 128)
  })
}
function hatchTex() {
  return canvasTex(64, 64, g => {
    g.strokeStyle = 'rgba(4,6,10,0.9)'
    g.lineWidth = 9
    for (let i = -64; i < 128; i += 21) {
      g.beginPath()
      g.moveTo(i, 64)
      g.lineTo(i + 64, 0)
      g.stroke()
    }
  })
}
function glyphTex() {
  return canvasTex(128, 128, g => {
    g.translate(64, 64)
    g.scale(52, 52)
    g.strokeStyle = '#fff'
    g.lineJoin = 'round'
    g.lineCap = 'round'
    g.lineWidth = 0.13
    g.beginPath()
    g.moveTo(0, -0.95)
    g.bezierCurveTo(0.55, -0.28, 0.78, 0.12, 0.78, 0.36)
    g.ellipse(0, 0.36, 0.78, 0.62, 0, 0, Math.PI)
    g.bezierCurveTo(-0.78, 0.12, -0.55, -0.28, 0, -0.95)
    g.stroke()
    g.lineWidth = 0.1
    g.beginPath()
    g.arc(0, 0.42, 0.42, Math.PI, 0)
    g.stroke()
    g.lineWidth = 0.11
    g.beginPath()
    g.moveTo(0, 0.42)
    g.lineTo(0.24, 0.08)
    g.stroke()
  })
}
function signTex(lines: string[], accent: string, w = 512, h = 192) {
  return canvasTex(w, h, g => {
    g.fillStyle = '#0c1118'
    g.fillRect(0, 0, w, h)
    g.fillStyle = accent
    g.fillRect(0, 0, 14, h)
    g.fillStyle = '#e8eef6'
    g.font = `700 ${h * 0.34}px ${FONT}`
    g.textBaseline = 'middle'
    g.fillText(lines[0], 40, h * (lines.length > 1 ? 0.36 : 0.5))
    if (lines[1]) {
      g.fillStyle = accent
      g.font = `600 ${h * 0.2}px ${FONT}`
      g.fillText(lines[1], 40, h * 0.74)
    }
  })
}
function hazardTex() {
  const t = canvasTex(256, 32, g => {
    g.fillStyle = '#e0a020'
    g.fillRect(0, 0, 256, 32)
    g.fillStyle = '#121212'
    for (let i = -32; i < 256; i += 32) {
      g.beginPath()
      g.moveTo(i, 32)
      g.lineTo(i + 16, 32)
      g.lineTo(i + 48, 0)
      g.lineTo(i + 32, 0)
      g.fill()
    }
  })
  return t
}

/** 단위 육각형 — UV 를 0~1 로 맞춰 해칭 텍스처가 칸마다 같은 모양으로 붙게 한다 */
function hexGeometry(rot: number) {
  const sh = new Shape()
  hexPoints(rot).forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)))
  sh.closePath()
  const g = new ShapeGeometry(sh)
  const pos = g.attributes.position
  const uv = g.attributes.uv as BufferAttribute
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) * 0.5 + 0.5, pos.getY(i) * 0.5 + 0.5)
  return g
}

const SEG = 48
const tmpM = new Matrix4()
const tmpV = new Vector3()
const tmpV2 = new Vector3()
const WHITE = new Color(1, 1, 1)
const RED_C = new Color(RED[0], RED[1], RED[2])
const ENERGY_C = new Color(ENERGY[0], ENERGY[1], ENERGY[2])

/** 게이지 판 — 체력 육각 칸 · 동력 호 · 산소 표시. 등판(세로) 또는 손목(가로)에 붙는다 */
function VitalsPanel({ bus, lay }: { bus: SpecimenProps['bus']; lay: Layout }) {
  const camera = useThree(st => st.camera) as PerspectiveCamera
  const group = useRef<Group>(null)
  const sockets = useRef<(Mesh | null)[]>([])
  const cores = useRef<(Mesh | null)[]>([])
  const halos = useRef<(Mesh | null)[]>([])
  const hatches = useRef<(Mesh | null)[]>([])
  const arcFill = useRef<Mesh>(null)
  const arcHalo = useRef<Mesh>(null)
  const arcTrack = useRef<Mesh>(null)
  const dashes = useRef<Group>(null)
  const o2 = useRef<Group>(null)
  const o2Socket = useRef<Group>(null)
  const o2Glyph = useRef<Mesh>(null)
  const o2Num = useRef<Mesh>(null)
  const o2Plate = useRef<Mesh>(null)
  const bad = useRef<Mesh>(null)
  const badO2 = useRef<Mesh>(null)
  const bezel = useRef<Mesh>(null)
  const lastText = useRef('')

  const res = useMemo(() => {
    const a = lay.arc
    const numCanvas = document.createElement('canvas')
    numCanvas.width = 256
    numCanvas.height = 128
    const numTex = new CanvasTexture(numCanvas)
    numTex.colorSpace = SRGBColorSpace
    const arcGeo = new RingGeometry(a.R - a.w / 2, a.R + a.w / 2, SEG, 1, a.start, a.len)
    const arcHaloGeo = new RingGeometry(a.R - a.w * 1.5, a.R + a.w * 1.5, SEG, 1, a.start, a.len)
    const dashGeos = Array.from({ length: 12 }, (_, i) => new RingGeometry(a.R - a.w * 0.12, a.R + a.w * 0.12, 3, 1, a.start + (i + 0.25) * (a.len / 12), (a.len / 12) * 0.5))
    return { hex: hexGeometry(lay.hexRot), glow: glowTex(), hatch: hatchTex(), glyph: glyphTex(), numCanvas, numTex, arcGeo, arcHaloGeo, dashGeos }
  }, [lay])
  useEffect(
    () => () => {
      Object.values(res).forEach(v => {
        if (Array.isArray(v)) v.forEach(g => g.dispose())
        else if (v && typeof (v as { dispose?: () => void }).dispose === 'function') (v as { dispose: () => void }).dispose()
      })
    },
    [res],
  )

  const drawNumber = (text: string) => {
    const g = res.numCanvas.getContext('2d')!
    g.clearRect(0, 0, 256, 128)
    g.fillStyle = '#ffffff'
    g.textBaseline = 'alphabetic'
    g.textAlign = 'right'
    // 작은 라벨은 3인칭 거리에서 몇 픽셀로 뭉개진다 → 숫자 + 큰 '%' 만 (산소라는 뜻은 글리프가 맡는다)
    g.font = `700 104px 'Chakra Petch', ${FONT}`
    g.fillText(text, 196, 112)
    g.font = `700 56px 'Chakra Petch', ${FONT}`
    g.fillText('%', 252, 112)
    res.numTex.needsUpdate = true
  }

  useFrame(() => {
    const v = bus.view as View | undefined
    const gr = group.current
    if (!v || !gr) return
    panelMatrix(v.pose, camera, tmpM)
    gr.matrix.copy(tmpM)
    gr.matrixWorldNeedsUpdate = true
    gr.visible = v.pose.mode !== 'visor'
    if (bezel.current) bezel.current.visible = lay.orient === 'h'

    const j = v.juice
    // 자체발광 강도: 0 이면 조명을 받는 것처럼 어둡게, 높을수록 번짐(헤일로)이 커져 칸 경계가 뭉개진다
    const bright = v.gain <= 0.01 ? 0.22 : Math.min(1, 0.5 + 0.5 * v.gain)
    const over = Math.max(0, v.gain - 1.4) * 0.22
    const haloK = v.gain <= 0.01 ? 0 : Math.min(1, v.gain / 1.6)
    const haloSize = lay.r * (1.7 + v.gain * 0.75)
    for (let i = 0; i < MAX_CELLS; i++) {
      const c = v.cells[i]
      const core = cores.current[i]
      if (!core || !c) continue
      const used = i < v.n
      const m = core.material as MeshBasicMaterial
      core.visible = j && used
      m.color.setRGB(c.color[0] * bright, c.color[1] * bright, c.color[2] * bright).lerp(WHITE, Math.min(1, c.flash + over))
      m.opacity = c.level
      const h = halos.current[i]
      if (h) {
        h.visible = j && used && haloK > 0
        ;(h.material as MeshBasicMaterial).color.setRGB(c.color[0], c.color[1], c.color[2])
        ;(h.material as MeshBasicMaterial).opacity = c.level * haloK * 0.6 + c.flash * 0.4
        h.scale.set(haloSize * lay.cellScale[0], haloSize * lay.cellScale[1], 1)
      }
      const ht = hatches.current[i]
      if (ht) ht.visible = j && used && c.hatch && c.level > 0.05
      const so = sockets.current[i]
      if (so) so.visible = j && used
    }

    // 동력 호: 그릴 삼각형 수로 채움 비율 표현 (Image Filled Radial180 과 같은 개념)
    const count = Math.round(SEG * Math.max(0, Math.min(1, v.arc))) * 6
    if (arcFill.current) {
      arcFill.current.visible = j && count > 0
      arcFill.current.geometry.setDrawRange(0, count)
      const m = arcFill.current.material as MeshBasicMaterial
      m.color.setRGB(ENERGY[0] * bright, ENERGY[1] * bright, ENERGY[2] * bright).lerp(RED_C, v.arcDeny).lerp(WHITE, over)
    }
    if (arcHalo.current) {
      arcHalo.current.visible = j && count > 0 && haloK > 0
      arcHalo.current.geometry.setDrawRange(0, count)
      ;(arcHalo.current.material as MeshBasicMaterial).opacity = 0.35 * haloK
    }
    if (arcTrack.current) arcTrack.current.visible = j
    if (dashes.current) {
      dashes.current.visible = j
      dashes.current.children.forEach(d => (((d as Mesh).material as MeshBasicMaterial).opacity = v.arcEmpty ? 0.95 : 0.28))
    }

    // 산소: 조건부로 페이드 + 0.9→1 스케일
    if (o2Socket.current) o2Socket.current.visible = j
    if (o2.current) {
      o2.current.visible = j && v.o2Alpha > 0.01
      o2.current.scale.setScalar(0.9 + 0.1 * v.o2Alpha)
    }
    const col = v.o2Low ? RED : MINT
    if (o2Glyph.current) {
      const m = o2Glyph.current.material as MeshBasicMaterial
      m.color.setRGB(col[0] * bright, col[1] * bright, col[2] * bright)
      m.opacity = v.o2Alpha * (v.o2Low ? 0.3 + 0.7 * v.o2Blink : 1)
    }
    if (o2Num.current) {
      const m = o2Num.current.material as MeshBasicMaterial
      m.color.setRGB(v.o2Low ? 1 : 0.9 * bright, v.o2Low ? 0.42 : 0.97 * bright, v.o2Low ? 0.42 : bright)
      m.opacity = v.o2Alpha
    }
    if (o2Plate.current) (o2Plate.current.material as MeshBasicMaterial).opacity = 0.75 * v.o2Alpha
    if (lastText.current !== v.o2Text) {
      lastText.current = v.o2Text
      drawNumber(v.o2Text)
    }

    // 효과 끄기: 조명을 받는 회색 막대 + 늘 떠 있는 숫자
    const sp = lay.spineBox
    if (bad.current) {
      bad.current.visible = !j
      const f = Math.max(0.001, v.hp / 100)
      if (lay.orient === 'v') {
        bad.current.scale.set(1, f, 1)
        bad.current.position.set(0, sp.y0 + ((sp.y1 - sp.y0) * f) / 2, 0.004)
      } else {
        bad.current.scale.set(f, 1, 1)
        bad.current.position.set(sp.x0 + ((sp.x1 - sp.x0) * f) / 2, lay.cells[0].y, 0.004)
      }
    }
    if (badO2.current) badO2.current.visible = !j
  }, 0)

  const sp = lay.spineBox
  const a = lay.arc
  const o = lay.o2
  const barLen = lay.orient === 'v' ? sp.y1 - sp.y0 : sp.x1 - sp.x0
  return (
    <group ref={group} matrixAutoUpdate={false}>
      <mesh ref={bezel} position={[0.04, -0.01, -0.006]}>
        <planeGeometry args={[0.66, 0.34]} />
        <meshStandardMaterial color="#141b24" roughness={0.5} metalness={0.4} />
      </mesh>
      {lay.cells.map((c, i) => (
        <group key={i} position={[c.x, c.y, 0]}>
          <mesh ref={el => void (sockets.current[i] = el)} geometry={res.hex} scale={[lay.r * lay.cellScale[0], lay.r * lay.cellScale[1], 1]} position-z={-0.001}>
            <meshStandardMaterial color="#0c1016" roughness={0.6} />
          </mesh>
          <mesh ref={el => void (halos.current[i] = el)} position-z={0.0015}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={res.glow} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh ref={el => void (cores.current[i] = el)} geometry={res.hex} scale={[lay.r * 0.8 * lay.cellScale[0], lay.r * 0.8 * lay.cellScale[1], 1]} position-z={0.003}>
            <meshBasicMaterial transparent toneMapped={false} depthWrite={false} />
          </mesh>
          <mesh ref={el => void (hatches.current[i] = el)} geometry={res.hex} scale={[lay.r * 0.8 * lay.cellScale[0], lay.r * 0.8 * lay.cellScale[1], 1]} position-z={0.0045}>
            <meshBasicMaterial map={res.hatch} transparent depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      ))}

      <group position={[a.cx, a.cy, 0]}>
        <mesh ref={arcTrack} position-z={-0.001}>
          <ringGeometry args={[a.R - a.w / 2, a.R + a.w / 2, SEG, 1, a.start, a.len]} />
          <meshStandardMaterial color="#0c1016" roughness={0.6} />
        </mesh>
        <mesh ref={arcHalo} geometry={res.arcHaloGeo} position-z={0.0015}>
          <meshBasicMaterial color={ENERGY_C} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh ref={arcFill} geometry={res.arcGeo} position-z={0.003}>
          <meshBasicMaterial toneMapped={false} />
        </mesh>
        <group ref={dashes} position-z={0.004}>
          {res.dashGeos.map((g, i) => (
            <mesh key={i} geometry={g}>
              <meshBasicMaterial color="#9fc0ff" transparent depthWrite={false} toneMapped={false} />
            </mesh>
          ))}
        </group>
      </group>

      {/* 산소 소켓: 산소가 숨어 있어도 늘 보이는 어두운 빈 창 (조명 무관) — '나타날 자리'를 장비 일부로 보여 준다 */}
      <group ref={o2Socket} position={[o.x, o.y, 0.001]}>
        <mesh position-z={-0.0005}>
          <planeGeometry args={[o.w + 0.012, o.h + 0.012]} />
          <meshBasicMaterial color="#1c2530" />
        </mesh>
        <mesh>
          <planeGeometry args={[o.w + 0.004, o.h + 0.004]} />
          <meshBasicMaterial color="#05080b" />
        </mesh>
      </group>
      <group ref={o2} position={[o.x, o.y, 0.004]}>
        <mesh ref={o2Plate} position-z={-0.001}>
          <planeGeometry args={[o.w, o.h]} />
          <meshBasicMaterial color="#05080c" transparent depthWrite={false} />
        </mesh>
        <mesh ref={o2Glyph} position={[-o.w * 0.3, 0, 0.001]}>
          <planeGeometry args={[o.h * 0.8, o.h * 0.8]} />
          <meshBasicMaterial map={res.glyph} transparent depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh ref={o2Num} position={[o.w * 0.09, 0, 0.001]}>
          <planeGeometry args={[o.h * 1.5, o.h * 0.75]} />
          <meshBasicMaterial map={res.numTex} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      </group>

      {/* 효과 끄기 전용 */}
      <mesh ref={bad}>
        <boxGeometry args={lay.orient === 'v' ? [0.07, barLen, 0.008] : [barLen, 0.07, 0.008]} />
        <meshStandardMaterial color="#4c5056" roughness={0.9} />
      </mesh>
      <mesh ref={badO2} position={[o.x, o.y, 0.006]}>
        <planeGeometry args={[o.h * 1.5, o.h * 0.75]} />
        <meshStandardMaterial map={res.numTex} transparent roughness={1} />
      </mesh>
    </group>
  )
}

/** 정비사 '도윤' — 캡슐·원기둥으로 조립한 오리지널 마네킹 (뒤로 걸어가며 -Z 를 바라본다) */
function Character({ bus }: { bus: SpecimenProps['bus'] }) {
  const camera = useThree(st => st.camera)
  const root = useRef<Group>(null)
  const legL = useRef<Group>(null)
  const legR = useRef<Group>(null)
  const torso = useRef<Group>(null)
  const rim = useRef<Mesh>(null)
  const prevZ = useRef(0)
  const phase = useRef(0)
  const t = useRef(0)
  const suit = useMemo(() => new MeshStandardMaterial({ color: '#8b96a3', roughness: 0.55, metalness: 0.25 }), [])
  const dark = useMemo(() => new MeshStandardMaterial({ color: '#363e4a', roughness: 0.7, metalness: 0.3 }), [])
  const pack = useMemo(() => new MeshStandardMaterial({ color: '#4a535f', roughness: 0.6, metalness: 0.35 }), [])
  const glow = useMemo(() => glowTex(), [])
  useEffect(
    () => () => {
      suit.dispose()
      dark.dispose()
      pack.dispose()
      glow.dispose()
    },
    [suit, dark, pack, glow],
  )

  useFrame((_, dt) => {
    const v = bus.view as View | undefined
    const r = root.current
    if (!v || !r) return
    t.current += dt
    r.visible = v.pose.mode === 'spine'
    r.position.z = v.pose.charZ
    const moving = Math.abs(v.pose.charZ - prevZ.current) > 1e-4
    prevZ.current = v.pose.charZ
    phase.current = moving ? phase.current + dt * 9 : phase.current * 0.85
    const sw = Math.sin(phase.current) * (moving ? 0.45 : 0)
    if (legL.current) legL.current.rotation.x = sw
    if (legR.current) legR.current.rotation.x = -sw
    if (torso.current) torso.current.position.y = Math.sin(t.current * 2.2) * 0.004
    suit.emissive.setRGB(v.hit * 0.45, v.hit * 0.05, v.hit * 0.06)
    pack.emissive.setRGB(v.hit * 0.3, v.hit * 0.04, v.hit * 0.05)
    // 치명 상태 림 글로우: 캐릭터 너머(카메라 반대쪽)에 붉은 빛판을 두어 실루엣 둘레가 붉게 번진다
    if (rim.current) {
      tmpV.set(0, 1.2, v.pose.charZ)
      tmpV2.copy(tmpV).sub(camera.position).setY(0).normalize()
      rim.current.position.copy(tmpV).addScaledVector(tmpV2, 0.45)
      rim.current.quaternion.copy(camera.quaternion)
      rim.current.visible = v.rim > 0.01
      ;(rim.current.material as MeshBasicMaterial).opacity = v.rim * 0.55
    }
  })

  return (
    <>
      <mesh ref={rim}>
        <planeGeometry args={[1.5, 2.4]} />
        <meshBasicMaterial map={glow} color="#ff2a2a" transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <group ref={root}>
        <group ref={legL} position={[-0.12, 0.8, 0]}>
          <mesh material={suit} position-y={-0.38}>
            <capsuleGeometry args={[0.1, 0.56, 4, 10]} />
          </mesh>
          <mesh material={dark} position={[0, -0.76, -0.05]}>
            <boxGeometry args={[0.18, 0.1, 0.3]} />
          </mesh>
        </group>
        <group ref={legR} position={[0.12, 0.8, 0]}>
          <mesh material={suit} position-y={-0.38}>
            <capsuleGeometry args={[0.1, 0.56, 4, 10]} />
          </mesh>
          <mesh material={dark} position={[0, -0.76, -0.05]}>
            <boxGeometry args={[0.18, 0.1, 0.3]} />
          </mesh>
        </group>
        <group ref={torso}>
          <mesh material={dark} position-y={0.86}>
            <boxGeometry args={[0.4, 0.16, 0.26]} />
          </mesh>
          <mesh material={suit} position-y={1.2} scale={[1.18, 1, 0.82]}>
            <capsuleGeometry args={[0.24, 0.36, 4, 12]} />
          </mesh>
          {[-1, 1].map(sx => (
            <group key={sx}>
              <mesh material={suit} position={[sx * 0.33, 1.42, 0]}>
                <sphereGeometry args={[0.12, 12, 8]} />
              </mesh>
              <mesh material={suit} position={[sx * 0.39, 1.12, -0.02]} rotation-z={sx * 0.1}>
                <capsuleGeometry args={[0.075, 0.46, 4, 8]} />
              </mesh>
              <mesh material={dark} position={[sx * 0.42, 0.83, -0.04]}>
                <sphereGeometry args={[0.085, 10, 8]} />
              </mesh>
              {/* 생명 유지 장치 옆 산소 탱크 */}
              <mesh material={dark} position={[sx * 0.27, PANEL_Y, 0.24]}>
                <cylinderGeometry args={[0.055, 0.055, 0.56, 10]} />
              </mesh>
            </group>
          ))}
          <mesh material={dark} position-y={1.52} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.13, 0.035, 8, 16]} />
          </mesh>
          <mesh material={suit} position-y={1.68}>
            <sphereGeometry args={[0.19, 16, 12]} />
          </mesh>
          <mesh position={[0, 1.67, -0.06]} scale={[1, 0.78, 0.9]}>
            <sphereGeometry args={[0.165, 16, 10, Math.PI * 1.2, Math.PI * 0.6, 0.6, 1.6]} />
            <meshStandardMaterial color="#0a1620" roughness={0.15} metalness={0.6} emissive="#0d3a48" emissiveIntensity={0.6} />
          </mesh>
          {/* 등판: 생명 유지 장치 — 앞면(z=+0.335)에 게이지 판이 붙는다 */}
          <mesh material={pack} position={[0, PANEL_Y, 0.235]}>
            <boxGeometry args={[0.5, 0.72, 0.2]} />
          </mesh>
          <mesh material={dark} position={[0, PANEL_Y + 0.39, 0.22]}>
            <boxGeometry args={[0.34, 0.06, 0.16]} />
          </mesh>
        </group>
      </group>
    </>
  )
}

/** 손목 모드: 카메라를 따라다니는 팔과 장갑 */
function Forearm({ bus }: { bus: SpecimenProps['bus'] }) {
  const camera = useThree(st => st.camera)
  const g = useRef<Group>(null)
  const arm = useMemo(() => {
    const a = new Vector3(0.4, -0.58, -0.26)
    const b = new Vector3(0.13, -0.22, -0.68)
    const dir = b.clone().sub(a)
    const len = dir.length()
    const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.normalize())
    return { mid: a.clone().add(b).multiplyScalar(0.5), len, q, end: b }
  }, [])
  useFrame(() => {
    const v = bus.view as View | undefined
    if (!v || !g.current) return
    g.current.visible = v.pose.mode === 'wrist'
    g.current.matrix.copy(camera.matrixWorld)
    g.current.matrixWorldNeedsUpdate = true
  })
  return (
    <group ref={g} matrixAutoUpdate={false}>
      <mesh position={arm.mid} quaternion={arm.q}>
        <capsuleGeometry args={[0.065, arm.len, 4, 10]} />
        <meshStandardMaterial color="#7f8a97" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={arm.end} scale={[1, 0.8, 1.2]}>
        <sphereGeometry args={[0.07, 10, 8]} />
        <meshStandardMaterial color="#353d48" roughness={0.7} />
      </mesh>
    </group>
  )
}

/** 결정론적 점 집합 (무작위 없음 → 매번 같은 장면) */
function pointsGeo(count: number, f: (i: number) => [number, number, number]) {
  const arr = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) arr.set(f(i), i * 3)
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(arr, 3))
  return g
}
const fr = (i: number, k: number) => ((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1

/** 궤도 정비 기지 격납고 — 저사양 PC 를 위해 그림자 없이 상자·평면만 */
function Hangar({ bus }: { bus: SpecimenProps['bus'] }) {
  const dust = useRef<PointsMaterial>(null)
  const dustGroup = useRef<Group>(null)
  const warn = useRef<MeshBasicMaterial>(null)
  const t = useRef(0)
  const res = useMemo(
    () => ({
      dust: pointsGeo(170, i => [(fr(i, 1) - 0.5) * 5.6, 0.2 + fr(i, 2) * 3.4, LINE_Z + 0.3 + fr(i, 3) * 7]),
      stars: pointsGeo(420, i => [(fr(i, 4) - 0.5) * 70, -14 + fr(i, 5) * 40, -42 - fr(i, 6) * 6]),
      hangarSign: signTex(['B-3 정비 격납고', '가압 구역 · 외피 수리'], '#3df5c8'),
      vacSign: signTex(['진공 구역', '헬멧 밀폐 확인 후 통과'], '#ffb43d'),
      hazard: hazardTex(),
    }),
    [],
  )
  useEffect(() => () => Object.values(res).forEach(r => r.dispose()), [res])

  useFrame((_, dt) => {
    const v = bus.view as View | undefined
    if (!v) return
    t.current += dt
    if (dust.current) dust.current.opacity = 0.75 * v.dust
    if (dustGroup.current) {
      dustGroup.current.position.y = Math.sin(t.current * 0.3) * 0.12
      dustGroup.current.rotation.y = Math.sin(t.current * 0.1) * 0.03
    }
    // 진공 구역 경고등: 느리게 숨쉬듯 (번쩍임 아님, 0.5Hz)
    if (warn.current) warn.current.color.setRGB(1, 0.55 + 0.2 * Math.sin(t.current * Math.PI), 0.15)
  })

  const ribs = [5, 3, 1, -1, -3, -5.4, -7.6, -9.8, -12, -14.2]
  return (
    <>
      <color attach="background" args={['#04060a']} />
      <fog attach="fog" args={['#04060a', 9, 30]} />
      <hemisphereLight args={['#5d7088', '#0b0d11', 0.55]} />
      <pointLight position={[0, 3.6, 2.6]} intensity={10} distance={11} decay={1.6} color="#bcd4f0" />
      <pointLight position={[0.4, 3.4, -1.2]} intensity={9} distance={8} decay={1.6} color="#a8c8ee" />
      <pointLight position={[-2.4, 2.2, -0.4]} intensity={4} distance={7} decay={1.6} color="#4fb7c8" />
      <pointLight position={[0, 3.2, -10.5]} intensity={11} distance={12} decay={1.6} color="#ff8a45" />

      {/* 바닥 · 벽 · 천장 */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -5]}>
        <planeGeometry args={[6.8, 24]} />
        <meshStandardMaterial color="#151a21" roughness={0.85} metalness={0.3} />
      </mesh>
      <Grid position={[0, 0.005, -5]} args={[6.6, 24]} cellSize={0.5} cellThickness={0.5} cellColor="#1f2833" sectionSize={2} sectionThickness={1} sectionColor="#2a3a48" fadeDistance={26} fadeStrength={1.2} />
      {[-1, 1].map(sx => (
        <mesh key={sx} position={[sx * 3.4, 2.1, -5]}>
          <boxGeometry args={[0.2, 4.2, 24]} />
          <meshStandardMaterial color="#1b222b" roughness={0.8} metalness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, 4.25, -5]}>
        <boxGeometry args={[6.8, 0.1, 24]} />
        <meshStandardMaterial color="#10141a" roughness={0.9} />
      </mesh>
      {ribs.map(z => (
        <group key={z} position-z={z}>
          {[-1, 1].map(sx => (
            <mesh key={sx} position={[sx * 3.18, 2.1, 0]}>
              <boxGeometry args={[0.26, 4.2, 0.32]} />
              <meshStandardMaterial color="#29323d" roughness={0.7} metalness={0.4} />
            </mesh>
          ))}
          <mesh position={[0, 4.05, 0]}>
            <boxGeometry args={[6.4, 0.3, 0.32]} />
            <meshStandardMaterial color="#29323d" roughness={0.7} metalness={0.4} />
          </mesh>
          {/* 천장 조명 띠 */}
          <mesh position={[0, 3.88, 0.6]}>
            <boxGeometry args={[1.4, 0.04, 0.14]} />
            <meshBasicMaterial color={z > LINE_Z ? '#b9d2ee' : '#ff7a4a'} />
          </mesh>
        </group>
      ))}

      {/* 소품: 상자 · 작업대 */}
      <mesh position={[-2.55, 0.4, 1.4]} rotation-y={0.2}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#3a3f36" roughness={0.9} />
      </mesh>
      <mesh position={[-2.6, 0.3, 0.4]} rotation-y={-0.1}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#454034" roughness={0.9} />
      </mesh>
      <mesh position={[2.65, 0.5, 1.8]}>
        <boxGeometry args={[0.9, 1, 2.2]} />
        <meshStandardMaterial color="#232b35" roughness={0.7} metalness={0.4} />
      </mesh>
      <mesh position={[-3.27, 2.3, 2.2]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[1.6, 0.6]} />
        <meshBasicMaterial map={res.hangarSign} toneMapped={false} color="#9aa6b4" />
      </mesh>

      {/* 진공 구역 경계: 바닥 줄무늬 + 문틀 + 표지 */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, LINE_Z]}>
        <planeGeometry args={[5.2, 0.32]} />
        <meshBasicMaterial map={res.hazard} color="#8a8a8a" />
      </mesh>
      {[-1, 1].map(sx => (
        <mesh key={sx} position={[sx * 2.55, 1.8, LINE_Z]}>
          <boxGeometry args={[0.4, 3.6, 0.5]} />
          <meshStandardMaterial color="#2c3440" roughness={0.6} metalness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 3.65, LINE_Z]}>
        <boxGeometry args={[5.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#2c3440" roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh position={[0, 3.65, LINE_Z + 0.26]}>
        <planeGeometry args={[1.9, 0.42]} />
        <meshBasicMaterial map={res.vacSign} toneMapped={false} color="#c8c8c8" />
      </mesh>
      {[-1, 1].map(sx => (
        <mesh key={sx} position={[sx * 2.55, 3.2, LINE_Z + 0.26]}>
          <sphereGeometry args={[0.07, 10, 8]} />
          <meshBasicMaterial ref={sx === 1 ? warn : undefined} color="#ffb43d" />
        </mesh>
      ))}

      {/* 열린 격납고 문 너머: 별과 행성 */}
      <mesh position={[0, 2.1, -17]}>
        <boxGeometry args={[6.8, 0.3, 0.4]} />
        <meshStandardMaterial color="#2c3440" />
      </mesh>
      <points geometry={res.stars}>
        <pointsMaterial color="#dfe8ff" size={0.12} sizeAttenuation fog={false} />
      </points>
      <mesh position={[-14, -16, -48]}>
        <sphereGeometry args={[18, 32, 16]} />
        <meshBasicMaterial color="#3a1d14" fog={false} />
      </mesh>

      {/* 공기 중 먼지 — 진공에 들어가면 사라진다 */}
      <group ref={dustGroup}>
        <points geometry={res.dust}>
          <pointsMaterial ref={dust} color="#a9c4d6" size={0.016} sizeAttenuation transparent depthWrite={false} />
        </points>
      </group>
    </>
  )
}

/** 3D 무대 — 카메라·캐릭터·게이지는 HUD 가 계산한 bus.view 를 그대로 따른다 */
export function VitalsScene(p: SpecimenProps) {
  const camera = useThree(st => st.camera) as PerspectiveCamera
  const n = Math.min(MAX_CELLS, Math.max(3, Math.round(num(p.params, 'segmentCount', 10))))
  const orient = str(p.params, 'mountMode', 'spine') === 'wrist' ? 'h' : 'v'
  const lay = useMemo(() => layout(n, orient), [n, orient])

  // 정지 중(frameloop=demand)에도 HUD 가 값을 바꾸면 한 프레임 다시 그리도록 invalidate 를 넘긴다
  const invalidate = useThree(st => st.invalidate)
  useEffect(() => {
    p.bus.invalidate = invalidate
    invalidate()
    return () => {
      if (p.bus.invalidate === invalidate) delete p.bus.invalidate
    }
  }, [p.bus, invalidate])

  // 카메라는 다른 useFrame 보다 먼저 (손목 패널이 카메라 행렬을 쓴다)
  useFrame(() => {
    const v = p.bus.view as View | undefined
    if (!v) return
    if (camera.fov !== FOV || camera.near !== 0.05) {
      camera.fov = FOV
      camera.near = 0.05
      camera.updateProjectionMatrix()
    }
    poseCamera(camera, v.pose)
  }, -1)

  return (
    <>
      <Hangar bus={p.bus} />
      <Character bus={p.bus} />
      <Forearm bus={p.bus} />
      <VitalsPanel key={`${n}-${orient}`} bus={p.bus} lay={lay} />
    </>
  )
}
