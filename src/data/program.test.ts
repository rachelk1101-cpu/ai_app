import { describe, expect, it } from 'vitest'
import { POSE_CLIPS } from '../character/poses'
import { EXERCISES } from './exercises'
import { SESSIONS_PER_WEEK, TOTAL_SESSIONS, routineForSession, weekNote, weekOf } from './program'

/**
 * 프로그램 표는 손으로 쓴 데이터라 오타가 나기 쉽다.
 * id 하나만 틀려도 그 회차에 운동이 조용히 하나 빠진 채로 돌아간다 —
 * 화면에서는 그냥 "4가지"로 보이므로 눈으로는 알아채기 어렵다.
 */
describe('한 달 프로그램', () => {
  const sessions = Array.from({ length: TOTAL_SESSIONS }, (_, i) => i)

  it('모든 회차에 운동이 5가지씩 있다 (id 오타가 있으면 여기서 걸린다)', () => {
    for (const session of sessions) {
      expect(routineForSession(session), `${session + 1}번째 회차`).toHaveLength(5)
    }
  })

  it('모든 회차의 횟수가 1 이상이다', () => {
    for (const session of sessions) {
      for (const exercise of routineForSession(session)) {
        expect(exercise.reps, `${session + 1}회차 ${exercise.name}`).toBeGreaterThan(0)
      }
    }
  })

  it('한 회차 안에 같은 운동이 두 번 나오지 않는다', () => {
    for (const session of sessions) {
      const ids = routineForSession(session).map((e) => e.id)
      expect(new Set(ids).size, `${session + 1}회차`).toBe(ids.length)
    }
  })

  it('주차는 1~4 이고 7회차마다 넘어간다', () => {
    expect(weekOf(0)).toBe(1)
    expect(weekOf(SESSIONS_PER_WEEK - 1)).toBe(1)
    expect(weekOf(SESSIONS_PER_WEEK)).toBe(2)
    expect(weekOf(TOTAL_SESSIONS - 1)).toBe(4)
    // 범위를 벗어나도 터지지 않는다
    expect(weekOf(-5)).toBe(1)
    expect(weekOf(999)).toBe(4)
  })

  it('주차마다 안내 문구가 있다', () => {
    for (const session of sessions) {
      expect(weekNote(session).length).toBeGreaterThan(0)
    }
  })

  it('1주와 2주는 구성이 같다 (반복으로 익히는 구간)', () => {
    const first = routineForSession(0).map((e) => e.id)
    const second = routineForSession(SESSIONS_PER_WEEK).map((e) => e.id)
    expect(second).toEqual(first)
  })

  it('회차가 갈수록 총 횟수가 줄지 않는다', () => {
    const totals = [0, 1, 2, 3].map((w) =>
      routineForSession(w * SESSIONS_PER_WEEK).reduce((sum, e) => sum + e.reps, 0),
    )
    for (let i = 1; i < totals.length; i++) {
      expect(totals[i], `${i + 1}주차`).toBeGreaterThanOrEqual(totals[i - 1])
    }
  })

  it('프로그램에 쓰인 운동은 모두 한 번 이상 등장한다 (안 쓰는 운동을 남겨두지 않는다)', () => {
    const used = new Set(sessions.flatMap((s) => routineForSession(s).map((e) => e.id)))
    for (const exercise of EXERCISES) {
      expect(used.has(exercise.id), `${exercise.name} 이 어느 주차에도 없다`).toBe(true)
    }
  })
})

describe('운동과 동작 클립의 연결', () => {
  it('모든 운동이 실제로 있는 클립을 가리킨다', () => {
    for (const exercise of EXERCISES) {
      expect(exercise.clip in POSE_CLIPS, `${exercise.name} → ${exercise.clip}`).toBe(true)
    }
  })

  it('모든 클립이 t=0 과 t=1 에서 같은 자세다 (반복 재생이 끊기지 않도록)', () => {
    for (const [id, clip] of Object.entries(POSE_CLIPS)) {
      const first = clip.keys[0]
      const last = clip.keys[clip.keys.length - 1]
      expect(first.t, `${id} 의 첫 키`).toBe(0)
      expect(last.t, `${id} 의 마지막 키`).toBe(1)
      expect(last.bones, `${id} 의 시작과 끝 자세`).toEqual(first.bones)
    }
  })
})
