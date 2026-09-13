import {
  resolveLandmark,
  shoulderWidth,
  upSign,
  type LandmarkName,
  type Point,
} from './landmarks'

/**
 * 운동 동작의 성공 조건.
 *
 * 설계 원칙 하나를 코드에 박아 둔다: **모르면 통과시킨다.**
 * 팔이 화면 밖으로 나갔거나 몸에 가려져 좌표를 못 얻었을 때,
 * 그것은 사용자가 못 한 것이 아니라 우리가 못 본 것이다.
 * 이 구분을 놓치면 앱은 열심히 하는 사용자에게 실패를 돌려주게 된다.
 */
export type PoseCheck =
  /** a 가 b 보다 위에 있다. margin 은 어깨 너비의 배수. */
  | { type: 'above'; a: LandmarkName; b: LandmarkName; margin?: number }
  /** a-b-c 가 이루는 각(도)이 범위 안에 있다. b 가 꼭짓점. */
  | { type: 'angle'; joints: [LandmarkName, LandmarkName, LandmarkName]; min?: number; max?: number }
  /** 두 점이 가깝다. 거리 기준은 어깨 너비의 배수. */
  | { type: 'near'; a: LandmarkName; b: LandmarkName; maxDist: number }
  /** 두 점이 떨어져 있다. 거리 기준은 어깨 너비의 배수. */
  | { type: 'apart'; a: LandmarkName; b: LandmarkName; minDist: number }
  /** point 가 from 기준으로 좌우 어느 쪽이든 일정 이상 벗어나 있다. */
  | { type: 'sideShift'; point: LandmarkName; from: LandmarkName; min: number }
  /** 하나라도 만족하면 통과. 좌우 교대 동작에 쓴다. */
  | { type: 'anyOf'; checks: PoseCheck[] }

/** 이 값 아래의 랜드마크는 '못 봤다'고 보고 판정에서 제외한다. */
const VISIBILITY_FLOOR = 0.5

function seen(...points: Point[]): boolean {
  return points.every((p) => p.visibility >= VISIBILITY_FLOOR)
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

/** a-b-c 가 b 에서 이루는 각도(0~180). */
function angleAt(a: Point, b: Point, c: Point): number {
  const v1 = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
  const v2 = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z }
  const n1 = Math.hypot(v1.x, v1.y, v1.z)
  const n2 = Math.hypot(v2.x, v2.y, v2.z)
  if (n1 === 0 || n2 === 0) return 0
  const cos = (v1.x * v2.x + v1.y * v2.y + v1.z * v2.z) / (n1 * n2)
  return (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI
}

function evaluateOne(check: PoseCheck, points: Point[]): boolean {
  if (check.type === 'anyOf') {
    return check.checks.some((c) => evaluateOne(c, points))
  }

  const width = shoulderWidth(points)

  switch (check.type) {
    case 'above': {
      const a = resolveLandmark(check.a, points)
      const b = resolveLandmark(check.b, points)
      if (!seen(a, b)) return true
      const margin = (check.margin ?? 0) * width
      return (b.y - a.y) * upSign(points) > margin
    }
    case 'angle': {
      const [pa, pb, pc] = check.joints.map((n) => resolveLandmark(n, points))
      if (!seen(pa, pb, pc)) return true
      const deg = angleAt(pa, pb, pc)
      if (check.min !== undefined && deg < check.min) return false
      if (check.max !== undefined && deg > check.max) return false
      return true
    }
    case 'near': {
      const a = resolveLandmark(check.a, points)
      const b = resolveLandmark(check.b, points)
      if (!seen(a, b)) return true
      return distance(a, b) <= check.maxDist * width
    }
    case 'apart': {
      const a = resolveLandmark(check.a, points)
      const b = resolveLandmark(check.b, points)
      if (!seen(a, b)) return true
      return distance(a, b) >= check.minDist * width
    }
    case 'sideShift': {
      const p = resolveLandmark(check.point, points)
      const from = resolveLandmark(check.from, points)
      if (!seen(p, from)) return true
      return Math.abs(p.x - from.x) >= check.min * width
    }
  }
}

/** 모든 조건을 만족해야 한 번 해낸 것으로 본다. */
export function evaluateChecks(checks: PoseCheck[], points: Point[]): boolean {
  if (checks.length === 0) return false
  return checks.every((c) => evaluateOne(c, points))
}

/**
 * 사람이 화면 안에 제대로 들어와 있는지.
 * 통과하지 못하면 "조금 뒤로 가 볼까요?" 같은 안내를 띄우되,
 * 운동 진행 자체를 막지는 않는다.
 */
export function isFramedWell(points: Point[]): boolean {
  const ls = resolveLandmark('leftShoulder', points)
  const rs = resolveLandmark('rightShoulder', points)
  const nose = resolveLandmark('nose', points)
  return seen(ls, rs, nose)
}
