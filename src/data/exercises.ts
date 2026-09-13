import type { PoseCheck } from '../pose/checks'

export type Exercise = {
  id: string
  /** 화면과 음성에 쓰는 이름. 짧은 평서문에 가깝게. */
  name: string
  /** 카드용 그림. 실제 서비스에서는 일러스트로 교체할 자리. */
  emoji: string
  /** POSE_CLIPS 의 키. */
  clip: string
  reps: number
  /**
   * 한 번 하는 데 걸리는 시간(초) = 캐릭터 동작 한 사이클.
   *
   * 횟수를 세는 기준도 이 시간이다. 자세 인식이 성공했든 아니든
   * 한 사이클이 끝나면 한 번 한 것으로 친다 — 진행 속도가 항상 일정해야
   * 다음에 무엇이 올지 예측할 수 있다.
   */
  tempoSec: number
  /** 동작 시작 때 읽어 줄 문장. */
  cue: string
  /** 화면 아래 자막. 한 줄, 되도록 8자 이내. */
  hint: string
  /**
   * 캐릭터를 몇 도 돌려서 보여 줄지. 0 이면 정면.
   *
   * 앞으로 뻗는 동작은 정면에서 보면 팔이 카메라 쪽으로 단축되어
   * 거의 움직이지 않는 것처럼 보인다. 그런 동작만 비스듬히 돌린다.
   */
  viewAngle?: number
  /** 이 조건들을 모두 만족하면 '스스로 해냈다'고 보고 칭찬한다. */
  checks: PoseCheck[]
  /** 위 조건을 이만큼 이어서 유지해야 인정한다(ms). 순간적인 오인식을 거른다. */
  holdMs: number
}

/**
 * 데모용 운동 다섯 가지.
 *
 * 모두 선 자세·앉은 자세 어느 쪽으로도 할 수 있는 상체 위주 동작이다.
 * 균형을 요구하는 동작(한 발 서기 등)은 넣지 않았다 — 낙상 위험이 있고,
 * 보조자 없이 혼자 하는 상황을 기본으로 보기 때문이다.
 *
 * 판정 기준은 전부 넉넉하게 잡았다. 정확한 자세를 가르치는 앱이 아니라
 * 몸을 움직이게 만드는 앱이므로, 애매하면 통과시키는 쪽이 맞다.
 */
export const EXERCISES: Exercise[] = [
  {
    id: 'arms-up',
    name: '팔 위로 쭉',
    emoji: '🙌',
    clip: 'armsUp',
    reps: 6,
    tempoSec: 4,
    cue: '두 팔을 하늘 높이 쭉 올려요.',
    hint: '팔을 위로!',
    holdMs: 300,
    checks: [
      { type: 'above', a: 'leftWrist', b: 'leftShoulder', margin: 0.15 },
      { type: 'above', a: 'rightWrist', b: 'rightShoulder', margin: 0.15 },
    ],
  },
  {
    id: 'side-stretch',
    name: '옆구리 늘리기',
    emoji: '🤸',
    clip: 'sideStretch',
    reps: 4,
    tempoSec: 8,
    cue: '한 손을 올리고 몸을 옆으로 기울여요.',
    hint: '옆으로 기울여요',
    holdMs: 400,
    // 한 사이클에 좌우를 모두 하므로, 어느 한쪽만 따라와도 통과로 본다.
    checks: [
      {
        type: 'anyOf',
        checks: [
          { type: 'above', a: 'leftWrist', b: 'shoulderCenter', margin: 0.3 },
          { type: 'above', a: 'rightWrist', b: 'shoulderCenter', margin: 0.3 },
        ],
      },
    ],
  },
  {
    id: 'march',
    name: '제자리 걷기',
    emoji: '🚶',
    clip: 'march',
    reps: 5,
    tempoSec: 4,
    cue: '무릎을 하나씩 천천히 올려요.',
    hint: '무릎 올려요',
    holdMs: 300,
    // 무릎을 드는 방향이 앞이라 정면에서는 거의 안 보인다.
    viewAngle: 35,
    // 한쪽 무릎이 반대쪽보다 확실히 위에 있으면 든 것으로 본다.
    // 앉아서 무릎만 들어도 똑같이 통과한다.
    checks: [
      {
        type: 'anyOf',
        checks: [
          { type: 'above', a: 'leftKnee', b: 'rightKnee', margin: 0.2 },
          { type: 'above', a: 'rightKnee', b: 'leftKnee', margin: 0.2 },
        ],
      },
    ],
  },
  {
    id: 'clap-front',
    name: '손뼉 치기',
    emoji: '👏',
    clip: 'clapFront',
    reps: 6,
    tempoSec: 4,
    cue: '팔을 활짝 벌렸다가 앞에서 짝짝 손뼉을 쳐요.',
    hint: '벌렸다가 짝!',
    holdMs: 200,
    // 손을 앞으로 모으는 구간이 정면에서는 보이지 않아 비스듬히 돌려 보여 준다.
    viewAngle: 30,
    // 두 손이 만나는 순간만 본다. 손뼉은 오인식할 여지가 거의 없는 동작이라
    // 기준을 하나만 두어도 충분하다.
    checks: [{ type: 'near', a: 'leftWrist', b: 'rightWrist', maxDist: 0.5 }],
  },
  {
    id: 'neck-turn',
    name: '목 좌우로',
    emoji: '🙂',
    clip: 'neckTurn',
    reps: 4,
    tempoSec: 8,
    cue: '고개를 천천히 옆으로 돌려요.',
    hint: '천천히 옆으로',
    holdMs: 300,
    checks: [{ type: 'sideShift', point: 'nose', from: 'shoulderCenter', min: 0.18 }],
  },
]

export function findExercise(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id)
}

/** 운동 사이 쉬는 시간(초). 다음 동작 이름을 읽어 줄 여유이기도 하다. */
export const REST_BETWEEN_SEC = 4

/** 한 세션의 총 예상 시간(분). 고르기 화면에 보여 준다. */
export function estimateMinutes(routine: Exercise[]): number {
  const seconds = routine.reduce((sum, e) => sum + e.reps * e.tempoSec + REST_BETWEEN_SEC, 0)
  return Math.max(1, Math.round(seconds / 60))
}
