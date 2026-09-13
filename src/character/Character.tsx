import { useFrame } from '@react-three/fiber'
import { useCallback, useRef } from 'react'
import type * as THREE from 'three'
import { BONE_NAMES, POSE_CLIPS, samplePose, type BoneName } from './poses'

const DEG = Math.PI / 180

/**
 * 튼튼이의 몸 치수(미터). 모든 y 값은 발바닥이 0 인 기준이다.
 *
 * 머리가 전체 키의 40% 가 넘는 통통한 비율로 잡았다. 관절 하나하나가 크게
 * 보여야 어떤 관절이 움직이는지 멀리서도 알아볼 수 있다.
 */
const RIG = {
  hipY: 0.62,
  hipX: 0.15,
  // 어깨는 몸통 구(중심 y=0.94, 반지름 0.3)의 표면 위, 수평에서 40° 지점에 둔다.
  // 구의 꼭대기에 얹으면 팔이 몸에 걸쳐 놓은 것처럼 떠 보인다.
  shoulderY: 1.13,
  shoulderX: 0.23,
  // 머리를 몸통에 살짝 파묻어 둘 사이에 틈이 생기지 않게 한다.
  neckY: 1.24,

  headR: 0.46,
  /** 목 기준 머리 중심 높이. */
  headOffsetY: 0.44,

  bodyR: 0.3,
  bodyH: 0.64,

  upperArm: 0.32,
  foreArm: 0.3,
  armR: 0.095,
  handR: 0.11,

  thigh: 0.32,
  shin: 0.3,
  legR: 0.115,
} as const

/** 발바닥(y=0)에서 새싹 끝까지의 키. 화면 잡는 데 쓴다. */
export const CHARACTER_HEIGHT = RIG.neckY + RIG.headOffsetY + RIG.headR + 0.15

const COLOR = {
  skin: '#fff1e0',
  shirt: '#2bb3a3',
  pants: '#ff9f5a',
  shoe: '#4a4a55',
  eye: '#2d2a26',
  blush: '#ff8fa3',
  sprout: '#6fcf6a',
} as const

/**
 * 관절과 관절 사이가 정확히 `length` 가 되는 capsuleGeometry 인자.
 *
 * capsuleGeometry 의 두 번째 인자는 양 끝 반구를 **뺀** 몸통 길이라,
 * 그냥 넘기면 실제 길이가 반지름의 두 배만큼 길어진다. 팔·다리·몸통이
 * 전부 조금씩 늘어나 비율이 무너지므로 여기서 한 번에 보정한다.
 */
function capsule(length: number, radius: number): [number, number, number, number] {
  return [radius, Math.max(0.01, length - radius * 2), 4, 16]
}

type BoneRefs = Partial<Record<BoneName, THREE.Group>>
type Bind = (n: BoneName) => (el: THREE.Group | null) => void

export type CharacterProps = {
  /** POSE_CLIPS 의 키. 없는 이름이면 idle 로 떨어진다. */
  clip?: string
  /** 한 사이클에 걸리는 시간(초). phaseRef 를 주면 무시된다. */
  tempoSec?: number
  /**
   * 재생 위치(0~1)를 담은 ref.
   *
   * 운동 화면은 세션 시계를 이 ref 로 넘겨서 캐릭터 동작과 횟수 카운트가
   * 어긋나지 않게 한다. state 가 아니라 ref 인 이유는, 초당 60번 바뀌는 값이
   * React 리렌더를 일으키면 안 되기 때문이다.
   */
  phaseRef?: { current: number }
  /** 좌우 반전. 안내 문구가 방향을 말하는 동작에서 켠다. */
  mirrored?: boolean
  paused?: boolean
}

export function Character({
  clip = 'idle',
  tempoSec = 4,
  phaseRef,
  mirrored = false,
  paused = false,
}: CharacterProps) {
  const bones = useRef<BoneRefs>({})
  const root = useRef<THREE.Group>(null)
  const localClock = useRef(0)

  const bind = useCallback(
    (name: BoneName) => (el: THREE.Group | null) => {
      if (el) bones.current[name] = el
      else delete bones.current[name]
    },
    [],
  )

  useFrame((_, delta) => {
    const active = POSE_CLIPS[clip] ?? POSE_CLIPS.idle

    let t: number
    if (phaseRef) {
      t = phaseRef.current
    } else {
      if (!paused) localClock.current = (localClock.current + delta / tempoSec) % 1
      t = localClock.current
    }

    const sampled = samplePose(active, t, mirrored)

    // 목표 자세로 바로 튀지 않고 부드럽게 따라간다.
    // 클립이 바뀌는 순간의 끊김을 없애고, 동작 전체를 한결 부드럽게 만든다.
    const k = Math.min(1, delta * 14)

    for (const name of BONE_NAMES) {
      const g = bones.current[name]
      if (!g) continue
      const [x, y, z] = sampled.bones[name]
      g.rotation.x += (x * DEG - g.rotation.x) * k
      g.rotation.y += (y * DEG - g.rotation.y) * k
      g.rotation.z += (z * DEG - g.rotation.z) * k
    }

    if (root.current) {
      root.current.position.y += (sampled.rootY - root.current.position.y) * k
    }
  })

  return (
    <group ref={root}>
      {/* 다리는 몸통 바깥에 둔다. 몸통을 기울여도 다리는 바닥에 붙어 있어야 한다. */}
      <Leg side="left" bind={bind} />
      <Leg side="right" bind={bind} />

      <group ref={bind('torso')} position={[0, RIG.hipY, 0]}>
        <mesh position={[0, RIG.bodyH / 2, 0]}>
          <capsuleGeometry args={capsule(RIG.bodyH, RIG.bodyR)} />
          <meshStandardMaterial color={COLOR.shirt} roughness={0.75} />
        </mesh>

        <Head bind={bind} />
        <Arm side="left" bind={bind} />
        <Arm side="right" bind={bind} />
      </group>
    </group>
  )
}

function Head({ bind }: { bind: Bind }) {
  const { headR, headOffsetY, neckY, hipY } = RIG
  const cy = headOffsetY

  // 얼굴 부품은 머리 구 표면에 얹는다. z 는 구의 반지름에서 역산한 값이라
  // 머리 크기를 바꿔도 파묻히거나 떠 있지 않는다.
  const surfaceZ = (x: number, y: number) => Math.sqrt(Math.max(0.01, headR * headR - x * x - y * y))

  return (
    <group ref={bind('head')} position={[0, neckY - hipY, 0]}>
      <mesh position={[0, cy, 0]}>
        <sphereGeometry args={[headR, 40, 32]} />
        <meshStandardMaterial color={COLOR.skin} roughness={0.85} />
      </mesh>

      {/* 눈 */}
      {[-1, 1].map((s) => (
        <mesh
          key={`eye${s}`}
          position={[s * 0.18, cy + 0.04, surfaceZ(0.18, 0.04) - 0.02]}
          scale={[1, 1.25, 0.6]}
        >
          <sphereGeometry args={[0.075, 20, 16]} />
          <meshStandardMaterial color={COLOR.eye} roughness={0.35} />
        </mesh>
      ))}
      {/* 눈 하이라이트 — 이것 하나로 표정이 살아난다 */}
      {[-1, 1].map((s) => (
        <mesh key={`glint${s}`} position={[s * 0.155, cy + 0.085, surfaceZ(0.155, 0.085)]}>
          <sphereGeometry args={[0.026, 12, 10]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
      ))}

      {/* 볼터치 */}
      {[-1, 1].map((s) => (
        <mesh
          key={`blush${s}`}
          position={[s * 0.31, cy - 0.12, surfaceZ(0.31, 0.12) - 0.03]}
          scale={[1, 0.62, 0.3]}
        >
          <sphereGeometry args={[0.095, 16, 14]} />
          <meshStandardMaterial color={COLOR.blush} roughness={0.9} />
        </mesh>
      ))}

      {/* 웃는 입 — 반 토러스를 뒤집어 올린다 */}
      <mesh position={[0, cy - 0.16, surfaceZ(0, 0.16) - 0.02]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.082, 0.02, 12, 28, Math.PI]} />
        <meshStandardMaterial color={COLOR.eye} roughness={0.5} />
      </mesh>

      {/* 머리 위 새싹 — 사람의 머리 모양이나 성별을 연상시키지 않는 중립적인 표식 */}
      <mesh position={[0, cy + headR - 0.01, 0]}>
        <cylinderGeometry args={[0.022, 0.03, 0.12, 10]} />
        <meshStandardMaterial color={COLOR.sprout} roughness={0.8} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh
          key={`leaf${s}`}
          position={[s * 0.08, cy + headR + 0.08, 0]}
          rotation={[0, 0, s * 0.7]}
          scale={[1, 0.5, 0.42]}
        >
          <sphereGeometry args={[0.095, 16, 12]} />
          <meshStandardMaterial color={COLOR.sprout} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

function Arm({ side, bind }: { side: 'left' | 'right'; bind: Bind }) {
  const dir = side === 'left' ? 1 : -1
  const { shoulderX, shoulderY, hipY, upperArm, foreArm, armR, handR } = RIG

  return (
    // 바깥쪽으로 살짝 벌어진 기본 각도. 차렷 자세에서 팔이 몸통·반바지에 파묻히지
    // 않게 하는 몸의 생김새이지 동작이 아니므로, 자세 데이터가 아니라 여기에 둔다.
    <group position={[dir * shoulderX, shoulderY - hipY, 0]} rotation={[0, 0, dir * 0.16]}>
      <group ref={bind(`${side}Shoulder` as BoneName)}>
        {/* 반팔 소매. 몸통 표면에 걸치게 두어 팔이 몸에서 이어져 나온 것처럼 보이게 한다. */}
        <mesh position={[0, -0.02, 0]}>
          <sphereGeometry args={[armR + 0.045, 18, 14]} />
          <meshStandardMaterial color={COLOR.shirt} roughness={0.75} />
        </mesh>
        <mesh position={[0, -upperArm / 2, 0]}>
          <capsuleGeometry args={capsule(upperArm, armR)} />
          <meshStandardMaterial color={COLOR.skin} roughness={0.85} />
        </mesh>

        <group ref={bind(`${side}Elbow` as BoneName)} position={[0, -upperArm, 0]}>
          <mesh position={[0, -foreArm / 2, 0]}>
            <capsuleGeometry args={capsule(foreArm, armR * 0.92)} />
            <meshStandardMaterial color={COLOR.skin} roughness={0.85} />
          </mesh>
          {/* 손 — 동그랗게. 어느 쪽 손이 어디 있는지 눈에 잘 띄어야 한다. */}
          <mesh position={[0, -foreArm - 0.03, 0]}>
            <sphereGeometry args={[handR, 20, 16]} />
            <meshStandardMaterial color={COLOR.skin} roughness={0.85} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

function Leg({ side, bind }: { side: 'left' | 'right'; bind: Bind }) {
  const dir = side === 'left' ? 1 : -1
  const { hipX, hipY, thigh, shin, legR } = RIG

  return (
    <group ref={bind(`${side}Hip` as BoneName)} position={[dir * hipX, hipY, 0]}>
      {/* 반바지 */}
      <mesh position={[0, -0.06, 0]}>
        <capsuleGeometry args={capsule(0.2, legR + 0.05)} />
        <meshStandardMaterial color={COLOR.pants} roughness={0.8} />
      </mesh>
      <mesh position={[0, -thigh / 2, 0]}>
        <capsuleGeometry args={capsule(thigh, legR)} />
        <meshStandardMaterial color={COLOR.skin} roughness={0.85} />
      </mesh>

      <group ref={bind(`${side}Knee` as BoneName)} position={[0, -thigh, 0]}>
        <mesh position={[0, -shin / 2, 0]}>
          <capsuleGeometry args={capsule(shin, legR * 0.9)} />
          <meshStandardMaterial color={COLOR.skin} roughness={0.85} />
        </mesh>
        <mesh position={[0, -shin - 0.01, 0.04]} scale={[1, 0.7, 1.4]}>
          <sphereGeometry args={[legR + 0.02, 18, 14]} />
          <meshStandardMaterial color={COLOR.shoe} roughness={0.6} />
        </mesh>
      </group>
    </group>
  )
}
