/**
 * MediaPipe Pose 의 33개 랜드마크 중 이 앱이 쓰는 것만 이름으로 정리한다.
 *
 * 주의: left/right 는 '보는 사람' 기준이 아니라 '찍히는 사람' 기준이다.
 * leftWrist 는 사용자 본인의 왼손목이다.
 */
export const LANDMARK_INDEX = {
  nose: 0,
  leftEar: 7,
  rightEar: 8,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
} as const

export type RealLandmark = keyof typeof LANDMARK_INDEX

/** 두 점의 중점처럼, 실제 랜드마크는 아니지만 판정에 편한 가상 지점. */
export type VirtualLandmark = 'shoulderCenter' | 'hipCenter'

export type LandmarkName = RealLandmark | VirtualLandmark

export type Point = {
  x: number
  y: number
  z: number
  /** 0~1. 가려졌거나 화면 밖이면 낮아진다. */
  visibility: number
}

const MISSING: Point = { x: 0, y: 0, z: 0, visibility: 0 }

function midpoint(a: Point, b: Point): Point {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
    visibility: Math.min(a.visibility, b.visibility),
  }
}

/**
 * 이름으로 좌표를 꺼낸다. 가상 지점은 즉석에서 계산한다.
 * MediaPipe 결과 배열이 짧거나 비어 있으면 visibility 0 인 점을 돌려주고,
 * 판정 쪽에서 '알 수 없음'으로 처리한다.
 */
export function resolveLandmark(name: LandmarkName, points: Point[]): Point {
  if (name === 'shoulderCenter') {
    return midpoint(resolveLandmark('leftShoulder', points), resolveLandmark('rightShoulder', points))
  }
  if (name === 'hipCenter') {
    return midpoint(resolveLandmark('leftHip', points), resolveLandmark('rightHip', points))
  }
  return points[LANDMARK_INDEX[name]] ?? MISSING
}

/**
 * 어깨 너비(미터). 모든 거리 기준을 이 값의 배수로 표현해서
 * 사용자의 체격이나 카메라와의 거리가 달라도 같은 판정이 나오게 한다.
 */
export function shoulderWidth(points: Point[]): number {
  const l = resolveLandmark('leftShoulder', points)
  const r = resolveLandmark('rightShoulder', points)
  const w = Math.hypot(l.x - r.x, l.y - r.y, l.z - r.z)
  // 인식이 흔들릴 때 0 에 가까운 값이 나오면 판정이 요동친다. 최소치를 둔다.
  return w > 0.12 ? w : 0.35
}

/**
 * '위쪽'이 좌표계의 어느 방향인지 몸에서 직접 알아낸다.
 *
 * MediaPipe 는 y 가 아래로 증가하지만, 그 규약에 코드를 묶어 두면
 * 버전이 바뀌거나 다른 엔진으로 갈아탈 때 판정이 통째로 뒤집힌다.
 * 서 있는 사람은 어깨가 골반보다 항상 위에 있으므로, 그 관계에서 부호를 얻는다.
 * 반환값을 (b.y - a.y) 에 곱했을 때 양수면 a 가 b 보다 위에 있다는 뜻이다.
 */
export function upSign(points: Point[]): number {
  const shoulder = resolveLandmark('shoulderCenter', points)
  const hip = resolveLandmark('hipCenter', points)
  const diff = hip.y - shoulder.y
  if (Math.abs(diff) < 1e-4) return 1
  return Math.sign(diff)
}
