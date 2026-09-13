/**
 * 캐릭터 동작을 관절 회전 키프레임으로 직접 정의한다.
 *
 * GLB 애니메이션 에셋 없이도 전체 앱이 돌아가게 하려는 목적이다.
 * 스트레칭은 움직이는 관절이 몇 개 되지 않아 손으로 정의해도 충분하고,
 * 무엇보다 속도·거울 반전·중간 정지를 코드에서 완전히 통제할 수 있다.
 *
 * ── 회전 규약 ─────────────────────────────────────────────
 * 캐릭터는 +Z(카메라) 를 바라보고 선다. 캐릭터의 왼쪽이 +X 이므로,
 * 화면에서 캐릭터의 왼팔은 보는 사람의 오른쪽에 나타난다.
 *
 * 팔은 기본 자세에서 관절의 로컬 -Y 방향으로 뻗어 있다.
 *   · 어깨 Z 회전 : 왼팔은 +각도로, 오른팔은 -각도로 올라간다.
 *                   ±90° = 옆으로 수평(T자), ±180° = 머리 위로 곧게.
 *   · 어깨 X 회전 : 음수가 앞으로, 양수가 뒤로.
 *   · 팔꿈치 X 회전: 음수가 굽힘(손이 앞·위로 접힌다). 좌우 부호가 같다.
 *   · 몸통 Z 회전 : 음수가 캐릭터의 왼쪽으로 기울임.
 *   · 머리 Y 회전 : 양수가 캐릭터의 왼쪽을 바라봄.
 *
 * 키프레임에 적지 않은 관절은 기본 자세(0,0,0)로 간주한다.
 * 덕분에 `bones: {}` 한 줄이 곧 '차렷' 자세가 된다.
 *
 * ── 이 체형에서 지켜야 할 한계 ──────────────────────────
 * 튼튼이는 머리가 키의 40% 가 넘는다. 그래서 팔을 160° 이상 들어 올리면
 * 팔이 머리 뒤로 숨어 정면에서 아예 보이지 않는다. '만세'는 곧게 위가 아니라
 * **125~140° 의 V자**로 만든다. 실루엣도 이쪽이 훨씬 또렷하다.
 *
 * 같은 이유로 머리 위에서 두 손을 맞대는 동작은 만들 수 없다. 팔 길이(0.73)로는
 * 두 손이 만나는 지점이 머리 안쪽이 되어 버린다. 손뼉은 가슴 앞에서 친다.
 */

export type BoneName =
  | 'torso'
  | 'head'
  | 'leftShoulder'
  | 'rightShoulder'
  | 'leftElbow'
  | 'rightElbow'
  | 'leftHip'
  | 'rightHip'
  | 'leftKnee'
  | 'rightKnee'

export const BONE_NAMES: readonly BoneName[] = [
  'torso',
  'head',
  'leftShoulder',
  'rightShoulder',
  'leftElbow',
  'rightElbow',
  'leftHip',
  'rightHip',
  'leftKnee',
  'rightKnee',
]

/** [x, y, z] 오일러 회전, 단위는 도(degree). */
export type Euler3 = readonly [number, number, number]

export type BonePose = Partial<Record<BoneName, Euler3>>

export type PoseKey = {
  /** 클립 안에서의 위치, 0 ~ 1. */
  t: number
  bones: BonePose
  /** 전신 위아래 이동(미터). 제자리 점프·들썩임 표현용. */
  rootY?: number
}

export type PoseClip = {
  id: string
  keys: PoseKey[]
}

const REST: PoseKey = { t: 0, bones: {} }

/**
 * 동작 사전.
 *
 * 각 클립은 t=0 과 t=1 이 같은 자세여야 자연스럽게 반복된다.
 * '홀드' 구간(같은 자세를 담은 연속된 두 키)은 자세 인식이 통과 판정을
 * 내릴 시간을 벌어 주는 역할도 한다 — 사용자가 따라올 여유를 준다.
 */
export const POSE_CLIPS: Record<string, PoseClip> = {
  /** 가만히 서서 숨쉬기. 화면이 정지한 것처럼 보이지 않게 하는 용도. */
  idle: {
    id: 'idle',
    keys: [
      { t: 0, bones: { leftShoulder: [0, 0, 4], rightShoulder: [0, 0, -4] }, rootY: 0 },
      { t: 0.5, bones: { leftShoulder: [0, 0, 7], rightShoulder: [0, 0, -7] }, rootY: 0.02 },
      { t: 1, bones: { leftShoulder: [0, 0, 4], rightShoulder: [0, 0, -4] }, rootY: 0 },
    ],
  },

  /** 손 흔들며 인사. 시작 화면용. */
  wave: {
    id: 'wave',
    keys: [
      { t: 0, bones: { leftShoulder: [0, 0, 4], rightShoulder: [0, 0, -4] } },
      { t: 0.15, bones: { leftShoulder: [0, 0, 4], rightShoulder: [0, 0, -110], rightElbow: [-35, 0, 0] } },
      { t: 0.35, bones: { leftShoulder: [0, 0, 4], rightShoulder: [0, 0, -138], rightElbow: [-35, 0, 0] } },
      { t: 0.5, bones: { leftShoulder: [0, 0, 4], rightShoulder: [0, 0, -112], rightElbow: [-35, 0, 0] } },
      { t: 0.65, bones: { leftShoulder: [0, 0, 4], rightShoulder: [0, 0, -138], rightElbow: [-35, 0, 0] } },
      { t: 0.8, bones: { leftShoulder: [0, 0, 4], rightShoulder: [0, 0, -110], rightElbow: [-35, 0, 0] } },
      { t: 1, bones: { leftShoulder: [0, 0, 4], rightShoulder: [0, 0, -4] } },
    ],
  },

  /** 축하. 칭찬 화면용 — 양팔 번쩍 들고 제자리 들썩. */
  cheer: {
    id: 'cheer',
    keys: [
      { t: 0, bones: { leftShoulder: [0, 0, 118], rightShoulder: [0, 0, -118] }, rootY: 0 },
      { t: 0.25, bones: { leftShoulder: [0, 0, 140], rightShoulder: [0, 0, -140] }, rootY: 0.16 },
      { t: 0.5, bones: { leftShoulder: [0, 0, 118], rightShoulder: [0, 0, -118] }, rootY: 0 },
      { t: 0.75, bones: { leftShoulder: [0, 0, 140], rightShoulder: [0, 0, -140] }, rootY: 0.16 },
      { t: 1, bones: { leftShoulder: [0, 0, 118], rightShoulder: [0, 0, -118] }, rootY: 0 },
    ],
  },

  /** 팔 위로 쭉 — V자 만세를 했다가 천천히 내리기. */
  armsUp: {
    id: 'armsUp',
    keys: [
      REST,
      { t: 0.3, bones: { leftShoulder: [0, 0, 128], rightShoulder: [0, 0, -128] } },
      // 홀드: 사용자가 따라 올릴 시간
      { t: 0.6, bones: { leftShoulder: [0, 0, 134], rightShoulder: [0, 0, -134] } },
      { t: 0.9, bones: {} },
      { t: 1, bones: {} },
    ],
  },

  /** 옆구리 늘리기 — 한 팔 올리고 반대쪽으로 기울인다. 한 사이클에 양쪽 모두. */
  sideStretch: {
    id: 'sideStretch',
    keys: [
      REST,
      { t: 0.12, bones: { rightShoulder: [0, 0, -125] } },
      { t: 0.25, bones: { rightShoulder: [0, 0, -138], torso: [0, 0, -20], head: [0, 0, -8] } },
      { t: 0.4, bones: { rightShoulder: [0, 0, -138], torso: [0, 0, -20], head: [0, 0, -8] } },
      { t: 0.5, bones: {} },
      { t: 0.62, bones: { leftShoulder: [0, 0, 125] } },
      { t: 0.75, bones: { leftShoulder: [0, 0, 138], torso: [0, 0, 20], head: [0, 0, 8] } },
      { t: 0.9, bones: { leftShoulder: [0, 0, 138], torso: [0, 0, 20], head: [0, 0, 8] } },
      { t: 1, bones: {} },
    ],
  },

  /**
   * 제자리 걷기 — 무릎을 하나씩 들어 올린다. 팔은 반대쪽이 앞으로 나간다.
   *
   * 이 앱에서 유일하게 하체를 쓰는 동작이다. 앉아서 무릎만 들어도 똑같이
   * 되므로, 서기가 어려운 사용자도 같은 동작을 할 수 있다.
   *
   * 무릎을 드는 방향은 앞이라 정면에서는 단축되어 보인다. 그래서 이 동작은
   * viewAngle 로 비스듬히 돌려서 보여 준다(exercises.ts 참고).
   */
  march: {
    id: 'march',
    keys: [
      REST,
      {
        t: 0.2,
        bones: {
          leftHip: [-82, 0, 0],
          leftKnee: [-78, 0, 0],
          rightShoulder: [-28, 0, -6],
          leftShoulder: [18, 0, 6],
        },
      },
      {
        t: 0.35,
        bones: {
          leftHip: [-82, 0, 0],
          leftKnee: [-78, 0, 0],
          rightShoulder: [-28, 0, -6],
          leftShoulder: [18, 0, 6],
        },
      },
      { t: 0.5, bones: {} },
      {
        t: 0.7,
        bones: {
          rightHip: [-82, 0, 0],
          rightKnee: [-78, 0, 0],
          leftShoulder: [-28, 0, 6],
          rightShoulder: [18, 0, -6],
        },
      },
      {
        t: 0.85,
        bones: {
          rightHip: [-82, 0, 0],
          rightKnee: [-78, 0, 0],
          leftShoulder: [-28, 0, 6],
          rightShoulder: [18, 0, -6],
        },
      },
      { t: 1, bones: {} },
    ],
  },

  /**
   * 손뼉 치기 — 팔을 활짝 벌렸다가 앞으로 모아 친다.
   *
   * 손을 앞에서 맞대는 동작만 넣으면 정면 카메라에서는 팔이 이쪽을 향해
   * 단축되어 거의 움직이지 않는 것처럼 보인다. 그래서 벌리는 구간을 크게 넣어,
   * '넓게 → 좁게' 라는 실루엣의 변화로 동작을 읽게 한다.
   */
  clapFront: {
    id: 'clapFront',
    keys: [
      REST,
      { t: 0.15, bones: { leftShoulder: [-15, 0, 85], rightShoulder: [-15, 0, -85] } },
      { t: 0.3, bones: { leftShoulder: [-80, 0, -25], rightShoulder: [-80, 0, 25] } },
      { t: 0.45, bones: { leftShoulder: [-15, 0, 85], rightShoulder: [-15, 0, -85] } },
      { t: 0.6, bones: { leftShoulder: [-80, 0, -25], rightShoulder: [-80, 0, 25] } },
      { t: 0.75, bones: { leftShoulder: [-15, 0, 85], rightShoulder: [-15, 0, -85] } },
      { t: 0.92, bones: {} },
      { t: 1, bones: {} },
    ],
  },

  /**
   * 팔 옆으로 벌리기 — T자.
   *
   * 정면 카메라에서 가장 잘 읽히는 동작이다. 팔이 화면 좌우로 길게 뻗으므로
   * 실루엣 변화가 가장 크고, 멀리서도 따라 할 수 있다.
   */
  armsOut: {
    id: 'armsOut',
    keys: [
      REST,
      { t: 0.3, bones: { leftShoulder: [0, 0, 80], rightShoulder: [0, 0, -80] } },
      { t: 0.6, bones: { leftShoulder: [0, 0, 84], rightShoulder: [0, 0, -84] } },
      { t: 0.9, bones: {} },
      { t: 1, bones: {} },
    ],
  },

  /**
   * 알통 만들기 — 팔을 옆으로 벌린 채 팔꿈치를 위로 접는다.
   *
   * 팔을 몸에 붙이고 앞으로 접으면 정면 카메라에서 전완이 단축되어 거의
   * 보이지 않는다. 옆으로 벌린 상태에서 접으면 접히는 과정이 화면 안에서
   * 그대로 보인다.
   *
   * 이 자세에서 팔꿈치는 X 가 아니라 **Z** 로 접어야 한다. 어깨를 Z 로 90°
   * 돌려 놓으면 팔꿈치의 로컬 축도 같이 돌아가서, X 회전은 앞뒤 방향이
   * 되어 버리기 때문이다.
   */
  elbowBend: {
    id: 'elbowBend',
    keys: [
      { t: 0, bones: { leftShoulder: [0, 0, 85], rightShoulder: [0, 0, -85] } },
      {
        t: 0.35,
        bones: {
          leftShoulder: [0, 0, 85],
          rightShoulder: [0, 0, -85],
          leftElbow: [0, 0, 95],
          rightElbow: [0, 0, -95],
        },
      },
      {
        t: 0.65,
        bones: {
          leftShoulder: [0, 0, 85],
          rightShoulder: [0, 0, -85],
          leftElbow: [0, 0, 102],
          rightElbow: [0, 0, -102],
        },
      },
      { t: 1, bones: { leftShoulder: [0, 0, 85], rightShoulder: [0, 0, -85] } },
    ],
  },

  /**
   * 목 옆으로 기울이기 — 귀를 어깨 쪽으로.
   *
   * neckTurn(좌우로 돌리기)과는 다른 방향의 목 스트레칭이다. 머리를 Z 로
   * 기울이기만 하면 되고, 머리 위 새싹이 같이 기울어져서 멀리서도 어느 쪽으로
   * 기울었는지 바로 보인다.
   *
   * 한때 '나를 안아주기'(양팔로 반대쪽 어깨 잡기)를 넣으려 했으나 이 체형에서는
   * 불가능했다. 팔 길이 0.62 로는 손이 반대쪽 어깨(0.46 떨어짐)에 닿으려면
   * 몸통을 통과해야 한다. 머리 위 박수와 같은 한계다.
   */
  neckTilt: {
    id: 'neckTilt',
    keys: [
      REST,
      { t: 0.2, bones: { head: [0, 0, 34] } },
      { t: 0.35, bones: { head: [0, 0, 34] } },
      { t: 0.5, bones: {} },
      { t: 0.7, bones: { head: [0, 0, -34] } },
      { t: 0.85, bones: { head: [0, 0, -34] } },
      { t: 1, bones: {} },
    ],
  },

  /** 목 좌우로 — 아주 천천히. 어깨는 가만히 둔다. */
  neckTurn: {
    id: 'neckTurn',
    keys: [
      REST,
      { t: 0.2, bones: { head: [0, 48, 0] } },
      { t: 0.35, bones: { head: [0, 48, 0] } },
      { t: 0.5, bones: {} },
      { t: 0.7, bones: { head: [0, -48, 0] } },
      { t: 0.85, bones: { head: [0, -48, 0] } },
      { t: 1, bones: {} },
    ],
  },
}

const ZERO: Euler3 = [0, 0, 0]

/** 좌우가 뒤바뀐 이름. 해당 없으면 그대로 돌려준다. */
function flipName(name: BoneName): BoneName {
  if (name.startsWith('left')) return ('right' + name.slice(4)) as BoneName
  if (name.startsWith('right')) return ('left' + name.slice(5)) as BoneName
  return name
}

/**
 * YZ 평면 기준 좌우 반전.
 * 좌·우 관절을 맞바꾸고, 그 평면 밖으로 향하는 Y·Z 회전의 부호를 뒤집는다.
 * (X 회전은 앞뒤 방향이라 반전해도 그대로다.)
 *
 * 따라 하기 화면에서는 이 반전을 켜서, 사용자가 든 팔과
 * 화면 속 캐릭터가 든 팔이 같은 쪽에 보이도록 만든다.
 */
export function mirrorPose(pose: BonePose): BonePose {
  const out: BonePose = {}
  for (const key of Object.keys(pose) as BoneName[]) {
    const rot = pose[key]
    if (!rot) continue
    out[flipName(key)] = [rot[0], -rot[1], -rot[2]]
  }
  return out
}

/**
 * 클립을 t(0~1) 위치에서 샘플링해 전체 관절 자세를 만든다.
 * 키에 없는 관절은 기본 자세로 채우므로 항상 완전한 자세가 나온다.
 */
export function samplePose(
  clip: PoseClip,
  t: number,
  mirrored = false,
): { bones: Record<BoneName, Euler3>; rootY: number } {
  const keys = clip.keys
  const clamped = Math.min(Math.max(t, 0), 1)

  // clamped 를 둘러싼 두 키를 찾는다.
  let next = keys.findIndex((k) => k.t >= clamped)
  if (next === -1) next = keys.length - 1
  const prev = Math.max(0, next - 1)

  const a = keys[prev]
  const b = keys[next]
  const span = b.t - a.t
  // 이징: 시작과 끝을 부드럽게 해서 동작이 뚝뚝 끊기지 않게 한다.
  const raw = span <= 0 ? 0 : (clamped - a.t) / span
  const k = raw * raw * (3 - 2 * raw)

  const bones = {} as Record<BoneName, Euler3>
  for (const name of BONE_NAMES) {
    const from = a.bones[name] ?? ZERO
    const to = b.bones[name] ?? ZERO
    bones[name] = [
      from[0] + (to[0] - from[0]) * k,
      from[1] + (to[1] - from[1]) * k,
      from[2] + (to[2] - from[2]) * k,
    ]
  }

  const rootY = (a.rootY ?? 0) + ((b.rootY ?? 0) - (a.rootY ?? 0)) * k

  return { bones: mirrored ? ({ ...bones, ...mirrorPose(bones) } as Record<BoneName, Euler3>) : bones, rootY }
}
