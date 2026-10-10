import { Grid } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { Color, type Fog, type Group, type MeshStandardMaterial, type PerspectiveCamera } from 'three'
import type { SpecimenProps } from '../../core/types'
import { FOV, OBJECTIVES, POIS, PROPS, syncCamera, type CamState } from './world'

const NORMAL = { sky: new Color('#9fc4dc'), fog: new Color('#b9d3e2'), ground: new Color('#5d7a4a') }
const BRIGHT = { sky: new Color('#f4f8fc'), fog: new Color('#ffffff'), ground: new Color('#eef2f4') }

/** 3D 무대 — 카메라는 HUD 가 계산한 bus.cam 을 그대로 따른다. bus.bright 면 눈밭·역광 장면 */
export function WaypointScene(p: SpecimenProps) {
  const camera = useThree(s => s.camera) as PerspectiveCamera
  const scene = useThree(s => s.scene)
  const beacons = useRef<Group>(null)
  const groundMat = useRef<MeshStandardMaterial>(null)

  useFrame((_, dt) => {
    const c = p.bus.cam as CamState | undefined
    if (camera.fov !== FOV) {
      camera.fov = FOV
      camera.updateProjectionMatrix()
    }
    if (c) syncCamera(camera, c)
    const pal = p.bus.bright ? BRIGHT : NORMAL
    if (scene.background instanceof Color) scene.background.lerp(pal.sky, 0.1)
    if (scene.fog) (scene.fog as Fog).color.lerp(pal.fog, 0.1)
    groundMat.current?.color.lerp(pal.ground, 0.1)
    beacons.current?.children.forEach((g, i) => (g.children[1].rotation.y += dt * (0.8 + i * 0.2) * p.timeScale))
  })

  return (
    <>
      <color attach="background" args={['#9fc4dc']} />
      <fog attach="fog" args={['#b9d3e2', 30, 170]} />
      <hemisphereLight args={['#dff1ff', '#4c6a3c', 1.1]} />
      <directionalLight position={[40, 60, 20]} intensity={1.6} color="#fff3dc" />

      <mesh rotation-x={-Math.PI / 2} position-y={-0.01}>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial ref={groundMat} color="#5d7a4a" roughness={1} />
      </mesh>
      <Grid position-y={0.01} args={[400, 400]} cellSize={4} cellThickness={0.6} cellColor="#6f8f5a" sectionSize={20} sectionThickness={1} sectionColor="#86a96d" fadeDistance={150} fadeStrength={1.5} infiniteGrid />

      {PROPS.map((pr, i) =>
        pr.kind === 'pillar' ? (
          <mesh key={i} position={[pr.pos[0], 2.2 * pr.s, pr.pos[2]]}>
            <boxGeometry args={[1.4 * pr.s, 4.4 * pr.s, 1.4 * pr.s]} />
            <meshStandardMaterial color="#8a8f99" roughness={0.9} />
          </mesh>
        ) : (
          <mesh key={i} position={[pr.pos[0], 0.5 * pr.s, pr.pos[2]]} rotation={[i, i * 0.7, 0]}>
            <dodecahedronGeometry args={[1.1 * pr.s, 0]} />
            <meshStandardMaterial color="#7b7466" roughness={1} flatShading />
          </mesh>
        ),
      )}

      {/* 관심 지점(POI) — 나침반에만 아이콘이 있고 세계에는 지형지물로 존재 */}
      {POIS.map(poi => (
        <group key={poi.id} position={poi.pos}>
          {poi.glyph === 'tent' && (
            <mesh position-y={1.4}>
              <coneGeometry args={[2.2, 2.8, 4]} />
              <meshStandardMaterial color="#b0603a" roughness={0.9} flatShading />
            </mesh>
          )}
          {poi.glyph === 'tower' && (
            <mesh position-y={6}>
              <cylinderGeometry args={[1.2, 1.8, 12, 6]} />
              <meshStandardMaterial color="#9a8f7c" roughness={0.9} flatShading />
            </mesh>
          )}
          {poi.glyph === 'spring' && (
            <mesh rotation-x={-Math.PI / 2} position-y={0.05}>
              <circleGeometry args={[4, 24]} />
              <meshStandardMaterial color="#4a90b8" roughness={0.2} />
            </mesh>
          )}
        </group>
      ))}

      <group ref={beacons}>
        {OBJECTIVES.map(o => (
          <group key={o.id} position={o.pos}>
            <mesh position-y={10}>
              <cylinderGeometry args={[0.35, 0.6, 20, 12, 1, true]} />
              <meshBasicMaterial color={o.color} transparent opacity={0.35} depthWrite={false} />
            </mesh>
            <mesh position-y={2.4}>
              <octahedronGeometry args={[0.7, 0]} />
              <meshStandardMaterial color={o.color} emissive={o.color} emissiveIntensity={0.6} />
            </mesh>
            <mesh rotation-x={-Math.PI / 2} position-y={0.03}>
              <ringGeometry args={[1.6, 2.1, 32]} />
              <meshBasicMaterial color={o.color} transparent opacity={0.7} />
            </mesh>
          </group>
        ))}
      </group>
    </>
  )
}
