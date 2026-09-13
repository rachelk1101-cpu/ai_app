import { ContactShadows } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { CHARACTER_HEIGHT, Character, type CharacterProps } from './Character'

export type StageProps = CharacterProps & {
  /**
   * full — 전신. 따라 하기 화면 기본값.
   * card — 얼굴·상반신 위주. 작은 영역에 쓴다.
   */
  framing?: 'full' | 'card'
  /**
   * 캐릭터를 Y축으로 돌려 비스듬히 보여 준다(도).
   *
   * 정면에서는 앞뒤로 움직이는 동작이 카메라 쪽으로 단축되어 거의 멈춰
   * 보인다. 손뼉처럼 앞으로 뻗는 동작은 20~35° 쯤 돌려야 팔이 움직이는 게
   * 보인다. 옆으로 벌리는 동작은 0°(정면)이 가장 잘 읽히므로 기본값은 0 이다.
   */
  turnDeg?: number
  className?: string
}

const FRAMING = {
  /** 발끝부터 새싹까지 다 담고 위아래로 여유를 조금 둔다. */
  full: { center: CHARACTER_HEIGHT / 2, visibleHeight: CHARACTER_HEIGHT * 1.25 },
  card: { center: CHARACTER_HEIGHT * 0.76, visibleHeight: CHARACTER_HEIGHT * 0.6 },
} as const

const FOV = 32

/**
 * 캐릭터를 담는 3D 무대.
 *
 * 배경에 무늬나 물체를 두지 않는 것은 의도적이다 — 화면에서 움직이는 것이
 * 캐릭터 하나뿐이어야 어디를 봐야 할지 헷갈리지 않는다. 배경을 투명하게 두어
 * 페이지의 크림색이 그대로 비친다.
 */
export function CharacterStage({
  framing = 'full',
  turnDeg = 0,
  className,
  ...character
}: StageProps) {
  const view = FRAMING[framing]

  // R3F 기본 카메라는 항상 원점을 바라본다. 카메라를 위로 올려도 시선이
  // 따라오지 않으므로, 반대로 캐릭터를 내려서 보고 싶은 높이를 원점에 맞춘다.
  const lift = -view.center
  const distance = view.visibleHeight / (2 * Math.tan(((FOV / 2) * Math.PI) / 180))

  return (
    <Canvas
      className={className}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0, distance], fov: FOV, near: 0.1, far: 40 }}
    >
      {/* 그림자가 짙지 않은 부드러운 조명. 눈부심과 강한 대비를 피한다. */}
      <ambientLight intensity={1.15} />
      <directionalLight position={[3.5, 6, 5]} intensity={1.5} />
      <directionalLight position={[-4, 2.5, 3]} intensity={0.45} color="#cfe9ff" />

      <group position={[0, lift, 0]}>
        {/* 그림자는 같이 돌지 않도록 캐릭터만 회전시킨다. */}
        <group rotation={[0, (turnDeg * Math.PI) / 180, 0]}>
          <Character {...character} />
        </group>
        <ContactShadows
          position={[0, 0.001, 0]}
          opacity={0.26}
          scale={5}
          blur={2.6}
          far={2.5}
          color="#8a6a4a"
        />
      </group>
    </Canvas>
  )
}
