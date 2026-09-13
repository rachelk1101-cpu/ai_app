import { create } from 'zustand'
import type { Exercise } from '../data/exercises'
import { TOTAL_SESSIONS, routineForSession } from '../data/program'
import { advance, loadProgress, resetProgress, saveProgress, type Progress } from './progress'

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
 * 카메라 없이 전체 흐름을 재생하는 시연 모드 (`?mock=1`).
 *
 * 대회장 조명이 어둡거나, 카메라 권한이 막히거나, 사람이 붐벼서 전신이
 * 안 잡히는 일은 실제로 자주 일어난다. 그때 발표가 통째로 무너지지 않도록
 * 두는 보험이다. 자세 인식 대신 시간에 맞춰 성공 신호를 만들어 낸다.
 */
export const MOCK_MODE = readFlag('mock')

/** `?screen=workout` 으로 원하는 화면부터 연다. */
function readScreen(): Screen {
  const value = param('screen')
  return SCREENS.includes(value as Screen) ? (value as Screen) : 'home'
}

/**
 * `?day=15` — 15번째 날부터 시작한 것처럼 보여 준다.
 *
 * 심사 자리에서 도장이 쌓인 화면을 보여 주려면 실제로 14번을 해 둘 수는 없다.
 * 저장된 진도를 덮어쓰기만 하고 저장하지는 않으므로, 사용자의 실제 기록은
 * 건드리지 않는다. 별 개수는 회차당 평균치로 채운 보여주기용 숫자다.
 */
function readDemoProgress(): Progress | null {
  const raw = param('day')
  if (raw === null) return null
  const day = Math.max(1, Math.min(TOTAL_SESSIONS, Math.floor(Number(raw) || 1)))
  const done = day - 1
  return { done, stars: done * 21 }
}

const DEMO_PROGRESS = readDemoProgress()
const INITIAL_SCREEN = readScreen()

function initialProgress(): Progress {
  return DEMO_PROGRESS ?? loadProgress()
}

type SessionStore = {
  screen: Screen
  /** 한 달 프로그램 전체 진도. */
  progress: Progress
  /** 지금 하고 있는(또는 방금 끝낸) 회차 번호. 0부터. */
  sessionIndex: number
  routine: Exercise[]
  /** 이번 회차에 완료한 횟수 = 이번에 받은 별. */
  totalReps: number
  /** 그중 자세 인식까지 통과한 횟수. */
  achievedReps: number

  goHome: () => void
  goPick: () => void
  beginSession: () => void
  recordRep: (achieved: boolean) => void
  finish: () => void
  restart: () => void
}

export const useSession = create<SessionStore>((set) => {
  const progress = initialProgress()

  const prepare = (index: number) => ({
    sessionIndex: index,
    routine: routineForSession(index),
    totalReps: 0,
    achievedReps: 0,
  })

  return {
    screen: INITIAL_SCREEN,
    progress,
    ...prepare(progress.done),

    goHome: () => set((s) => ({ screen: 'home', ...prepare(s.progress.done) })),

    goPick: () => set((s) => ({ screen: 'pick', ...prepare(s.progress.done) })),

    beginSession: () => set((s) => ({ screen: 'workout', ...prepare(s.progress.done) })),

    recordRep: (achieved) =>
      set((s) => ({
        totalReps: s.totalReps + 1,
        achievedReps: s.achievedReps + (achieved ? 1 : 0),
      })),

    finish: () =>
      set((s) => {
        const next = advance(s.progress, s.totalReps)
        // 시연 모드에서는 저장하지 않는다. 남의 기록을 덮어쓰면 안 된다.
        if (!DEMO_PROGRESS) saveProgress(next)
        return { screen: 'reward', progress: next }
      }),

    /** 28회를 다 채운 뒤 처음부터 다시. */
    restart: () => {
      if (!DEMO_PROGRESS) resetProgress()
      const fresh: Progress = { done: 0, stars: 0 }
      set({ screen: 'home', progress: fresh, ...prepare(0) })
    },
  }
})

/** 이번에 시작할 회차가 프로그램의 마지막인지. */
export function isLastSession(): boolean {
  return useSession.getState().progress.done >= TOTAL_SESSIONS
}
