import { findExercise, type Exercise } from './exercises'

/** 한 달 프로그램의 전체 회차 수. */
export const TOTAL_SESSIONS = 28
export const SESSIONS_PER_WEEK = 7

type PlanItem = { id: string; reps: number }
type WeekPlan = {
  week: number
  /** 이 주에 무엇이 달라지는지 한 줄. 고르기 화면에 보여 준다. */
  note: string
  items: PlanItem[]
}

/**
 * 4주 프로그램.
 *
 * ── 왜 매주 다 바꾸지 않는가 ─────────────────────────────
 * 1주와 2주는 운동 구성이 똑같고 횟수만 늘어난다. 새 동작은 3주에 두 개,
 * 4주에 하나만 들어온다. 매주 다섯 개가 전부 바뀌면 매번 처음부터 배워야 하고,
 * 그러면 한 달 내내 '익숙해지는 경험'을 한 번도 못 한다.
 *
 * 발달장애인 사용자에게 반복은 지루함이 아니라 학습이다. 같은 동작을 여러 주에
 * 걸쳐 반복해야 몸에 남고, 남아야 혼자서도 할 수 있게 된다. 변화는 '새로움'이
 * 아니라 '조금 더 할 수 있게 됐다'를 느끼게 하는 정도로만 준다.
 *
 * 한 회차는 2~3분이다. 길게 만들지 않는 것도 의도다 — 끝까지 해내는 경험이
 * 오래 하는 것보다 중요하다.
 */
const WEEKS: WeekPlan[] = [
  {
    week: 1,
    note: '천천히 익혀요',
    items: [
      { id: 'arms-up', reps: 4 },
      { id: 'side-stretch', reps: 3 },
      { id: 'march', reps: 4 },
      { id: 'clap-front', reps: 4 },
      { id: 'neck-turn', reps: 3 },
    ],
  },
  {
    week: 2,
    // 구성은 그대로. 아는 동작을 조금 더 하는 주.
    note: '조금 더 해봐요',
    items: [
      { id: 'arms-up', reps: 5 },
      { id: 'side-stretch', reps: 3 },
      { id: 'march', reps: 5 },
      { id: 'clap-front', reps: 5 },
      { id: 'neck-turn', reps: 4 },
    ],
  },
  {
    week: 3,
    note: '새로운 동작이 있어요',
    items: [
      { id: 'arms-up', reps: 5 },
      { id: 'arms-out', reps: 5 },
      { id: 'march', reps: 5 },
      { id: 'elbow-bend', reps: 5 },
      { id: 'neck-turn', reps: 4 },
    ],
  },
  {
    week: 4,
    note: '이제 잘할 수 있어요',
    items: [
      { id: 'arms-out', reps: 6 },
      { id: 'march', reps: 6 },
      { id: 'elbow-bend', reps: 5 },
      { id: 'neck-tilt', reps: 4 },
      { id: 'side-stretch', reps: 4 },
    ],
  },
]

/** 회차 번호(0부터)로 몇 주차인지. 1~4. */
export function weekOf(session: number): number {
  const clamped = Math.max(0, Math.min(TOTAL_SESSIONS - 1, session))
  return Math.floor(clamped / SESSIONS_PER_WEEK) + 1
}

function planFor(session: number): WeekPlan {
  return WEEKS[weekOf(session) - 1]
}

export function weekNote(session: number): string {
  return planFor(session).note
}

/**
 * 이번 회차에 할 운동 목록.
 * 주차별 횟수를 적용한 Exercise 객체로 돌려준다.
 */
export function routineForSession(session: number): Exercise[] {
  return planFor(session)
    .items.map(({ id, reps }) => {
      const exercise = findExercise(id)
      return exercise ? { ...exercise, reps } : null
    })
    .filter((e): e is Exercise => e !== null)
}
