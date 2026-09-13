import { create } from 'zustand'
import { EXERCISES, type Exercise } from '../data/exercises'

export type Screen = 'home' | 'pick' | 'workout' | 'reward'

const SCREENS: Screen[] = ['home', 'pick', 'workout', 'reward']

function param(name: string): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(name)
}

function readFlag(name: string): boolean {
  const value = param(name)
  return value !== null && value !== '0' && value !== 'false'
}

/**
 * `?screen=workout` 으로 원하는 화면부터 연다.
 *
 * 개발 중 매번 세 번씩 눌러 들어가지 않아도 되고, 발표 때 시간이 모자라면
 * 곧장 핵심 화면으로 시작할 수 있다.
 */
function readScreen(): Screen {
  const value = param('screen')
  return SCREENS.includes(value as Screen) ? (value as Screen) : 'home'
}

/**
 * 카메라 없이 전체 흐름을 재생하는 시연 모드 (`?mock=1`).
 *
 * 대회장 조명이 어둡거나, 노트북 카메라 권한이 막히거나, 사람이 붐벼서
 * 전신이 안 잡히는 일은 실제로 자주 일어난다. 그때 발표가 통째로
 * 무너지지 않도록 두는 보험이다. 자세 인식 대신 시간에 맞춰
 * 성공 신호를 만들어 낸다.
 */
export const MOCK_MODE = readFlag('mock')

type SessionStore = {
  screen: Screen
  routine: Exercise[]
  /** 이번 세션에 완료한 총 횟수 = 모은 별 개수. */
  totalReps: number
  /** 그중 자세 인식까지 통과한 횟수. */
  achievedReps: number

  goHome: () => void
  goPick: () => void
  start: (routine: Exercise[]) => void
  recordRep: (achieved: boolean) => void
  finish: () => void
}

const INITIAL_SCREEN = readScreen()

export const useSession = create<SessionStore>((set) => ({
  screen: INITIAL_SCREEN,
  // 운동 화면으로 바로 들어온 경우에도 할 운동이 있어야 한다.
  routine: INITIAL_SCREEN === 'workout' ? EXERCISES : [],
  totalReps: 0,
  achievedReps: 0,

  goHome: () => set({ screen: 'home', routine: [], totalReps: 0, achievedReps: 0 }),
  goPick: () => set({ screen: 'pick', totalReps: 0, achievedReps: 0 }),

  start: (routine) => set({ screen: 'workout', routine, totalReps: 0, achievedReps: 0 }),

  recordRep: (achieved) =>
    set((s) => ({
      totalReps: s.totalReps + 1,
      achievedReps: s.achievedReps + (achieved ? 1 : 0),
    })),

  finish: () => set({ screen: 'reward' }),
}))
