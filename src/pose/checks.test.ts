import { describe, expect, it } from 'vitest'
import { EXERCISES, findExercise } from '../data/exercises'
import { evaluateChecks } from './checks'
import { LANDMARK_INDEX, upSign, type Point, type RealLandmark } from './landmarks'

/**
 * 자세 판정은 눈으로 확인할 수 없는 부분이라 여기서 검증한다.
 *
 * 특히 확인하고 싶은 것은 두 가지다.
 *  1. 각 운동이 '했을 때' 통과하고 '안 했을 때' 통과하지 않는가.
 *  2. 랜드마크를 못 봤을 때 실패가 아니라 **통과**로 처리되는가.
 *     이 규칙이 깨지면, 팔이 화면 밖으로 나간 사용자는 아무리 열심히 해도
 *     칭찬을 받지 못한다.
 */

type Overrides = Partial<Record<RealLandmark, Partial<Point>>>

/**
 * 서 있는 사람의 world 랜드마크를 만든다.
 * MediaPipe 규약대로 골반 중점이 원점이고 y 는 아래로 증가한다(미터).
 */
function standing(overrides: Overrides = {}, flipYAxis = false): Point[] {
  const base: Partial<Record<RealLandmark, [number, number, number]>> = {
    nose: [0, -0.62, 0.06],
    leftEar: [0.08, -0.6, 0],
    rightEar: [-0.08, -0.6, 0],
    leftShoulder: [0.18, -0.5, 0],
    rightShoulder: [-0.18, -0.5, 0],
    leftElbow: [0.2, -0.24, 0],
    rightElbow: [-0.2, -0.24, 0],
    leftWrist: [0.21, 0.02, 0],
    rightWrist: [-0.21, 0.02, 0],
    leftHip: [0.09, 0, 0],
    rightHip: [-0.09, 0, 0],
    leftKnee: [0.09, 0.45, 0],
    rightKnee: [-0.09, 0.45, 0],
    leftAnkle: [0.09, 0.9, 0],
    rightAnkle: [-0.09, 0.9, 0],
  }

  const points: Point[] = Array.from({ length: 33 }, () => ({ x: 0, y: 0, z: 0, visibility: 0 }))

  for (const [name, xyz] of Object.entries(base) as [RealLandmark, [number, number, number]][]) {
    const patch = overrides[name] ?? {}
    const sign = flipYAxis ? -1 : 1
    points[LANDMARK_INDEX[name]] = {
      x: patch.x ?? xyz[0],
      y: (patch.y ?? xyz[1]) * sign,
      z: patch.z ?? xyz[2],
      visibility: patch.visibility ?? 1,
    }
  }

  return points
}

/** 어깨 너비 0.36 m 기준으로, 화면 기준 '위'는 y 가 작아지는 쪽. */
const ARMS_UP: Overrides = {
  leftWrist: { x: 0.46, y: -0.88 },
  rightWrist: { x: -0.46, y: -0.88 },
  leftElbow: { x: 0.34, y: -0.72 },
  rightElbow: { x: -0.34, y: -0.72 },
}

describe('upSign — 좌표계의 위쪽 방향을 몸에서 알아낸다', () => {
  it('y 가 아래로 증가하는 기본 규약에서 +1 이다', () => {
    expect(upSign(standing())).toBe(1)
  })

  it('y 축이 뒤집힌 좌표계에서도 스스로 -1 로 맞춘다', () => {
    expect(upSign(standing({}, true))).toBe(-1)
  })
})

describe('팔 위로 쭉', () => {
  const exercise = findExercise('arms-up')!

  it('팔을 내리고 있으면 통과하지 않는다', () => {
    expect(evaluateChecks(exercise.checks, standing())).toBe(false)
  })

  it('두 팔을 올리면 통과한다', () => {
    expect(evaluateChecks(exercise.checks, standing(ARMS_UP))).toBe(true)
  })

  it('y 축이 뒤집힌 좌표계에서도 같은 결과가 나온다', () => {
    expect(evaluateChecks(exercise.checks, standing(ARMS_UP, true))).toBe(true)
    expect(evaluateChecks(exercise.checks, standing({}, true))).toBe(false)
  })

  it('한쪽 손목이 안 보이면 그쪽은 통과로 치고, 보이는 쪽만 본다', () => {
    // 왼손은 올렸고 오른손은 화면 밖. 못 본 것을 실패로 만들지 않는다.
    const points = standing({
      leftWrist: { x: 0.46, y: -0.88 },
      rightWrist: { visibility: 0.1 },
    })
    expect(evaluateChecks(exercise.checks, points)).toBe(true)
  })
})

describe('손뼉 치기', () => {
  const exercise = findExercise('clap-front')!

  it('팔을 벌리고 있으면 통과하지 않는다', () => {
    const wide = standing({
      leftWrist: { x: 0.75, y: -0.5 },
      rightWrist: { x: -0.75, y: -0.5 },
    })
    expect(evaluateChecks(exercise.checks, wide)).toBe(false)
  })

  it('두 손이 모이면 통과한다', () => {
    const clapped = standing({
      leftWrist: { x: 0.04, y: -0.3, z: 0.4 },
      rightWrist: { x: -0.04, y: -0.3, z: 0.4 },
    })
    expect(evaluateChecks(exercise.checks, clapped)).toBe(true)
  })
})

describe('제자리 걷기', () => {
  const exercise = findExercise('march')!

  it('두 발을 다 딛고 있으면 통과하지 않는다', () => {
    expect(evaluateChecks(exercise.checks, standing())).toBe(false)
  })

  it('어느 쪽이든 무릎을 들면 통과한다', () => {
    const leftUp = standing({ leftKnee: { y: 0.1, z: 0.3 } })
    const rightUp = standing({ rightKnee: { y: 0.1, z: 0.3 } })
    expect(evaluateChecks(exercise.checks, leftUp)).toBe(true)
    expect(evaluateChecks(exercise.checks, rightUp)).toBe(true)
  })
})

describe('목 좌우로', () => {
  const exercise = findExercise('neck-turn')!

  it('정면을 보고 있으면 통과하지 않는다', () => {
    expect(evaluateChecks(exercise.checks, standing())).toBe(false)
  })

  it('고개를 옆으로 돌리면 통과한다', () => {
    expect(evaluateChecks(exercise.checks, standing({ nose: { x: 0.12 } }))).toBe(true)
    expect(evaluateChecks(exercise.checks, standing({ nose: { x: -0.12 } }))).toBe(true)
  })
})

describe('옆구리 늘리기', () => {
  const exercise = findExercise('side-stretch')!

  it('가만히 서 있으면 통과하지 않는다', () => {
    expect(evaluateChecks(exercise.checks, standing())).toBe(false)
  })

  it('한 팔만 올려도 통과한다', () => {
    const oneArm = standing({ rightWrist: { x: -0.5, y: -0.95 } })
    expect(evaluateChecks(exercise.checks, oneArm)).toBe(true)
  })
})

describe('모든 운동에 공통으로 지켜야 할 것', () => {
  it('사람이 아예 안 잡히면 모든 운동이 통과한다 (진행을 막지 않는다)', () => {
    const nobody: Point[] = Array.from({ length: 33 }, () => ({ x: 0, y: 0, z: 0, visibility: 0 }))
    for (const exercise of EXERCISES) {
      expect(evaluateChecks(exercise.checks, nobody), exercise.name).toBe(true)
    }
  })

  it('가만히 서 있기만 하면 어떤 운동도 통과하지 않는다', () => {
    const idle = standing()
    for (const exercise of EXERCISES) {
      expect(evaluateChecks(exercise.checks, idle), exercise.name).toBe(false)
    }
  })

  it('참조하는 동작 클립과 조건이 모두 채워져 있다', () => {
    for (const exercise of EXERCISES) {
      expect(exercise.checks.length, exercise.name).toBeGreaterThan(0)
      expect(exercise.reps, exercise.name).toBeGreaterThan(0)
      expect(exercise.tempoSec, exercise.name).toBeGreaterThan(0)
    }
  })
})
