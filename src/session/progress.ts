import { TOTAL_SESSIONS } from '../data/program'

const KEY = 'teunteuni-progress-v1'

export type Progress = {
  /** 끝까지 마친 회차 수. 0 ~ TOTAL_SESSIONS. 다음에 할 회차의 인덱스이기도 하다. */
  done: number
  /** 한 달 동안 모은 별 총합. */
  stars: number
}

const EMPTY: Progress = { done: 0, stars: 0 }

/**
 * 진도를 브라우저에 저장한다.
 *
 * ── 왜 날짜가 아니라 회차인가 ────────────────────────────
 * 달력 날짜로 진행하면 사흘 쉬었다 들어온 사용자는 갑자기 4일차로 건너뛴다.
 * 못 한 날이 눈에 보이고, 따라잡을 수도 없다.
 *
 * 회차로 세면 오늘 하면 다음 칸이 하나 채워질 뿐이다. 일주일을 쉬어도
 * 이어서 하면 된다. '빠진 날'이라는 개념 자체가 생기지 않는다.
 * 연속 출석(스트릭)을 두지 않는 것도 같은 이유다 — 하루 빠졌다고 쌓아 온
 * 것이 0으로 돌아가는 경험은 그 자리에서 앱을 그만두게 만든다.
 */
export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<Progress>
    return {
      done: clampDone(parsed.done),
      stars: Math.max(0, Math.floor(Number(parsed.stars) || 0)),
    }
  } catch {
    // 시크릿 모드이거나 저장이 막힌 환경. 기록이 없을 뿐 운동은 그대로 된다.
    return EMPTY
  }
}

export function saveProgress(progress: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress))
  } catch {
    // 저장 실패는 조용히 넘긴다. 사용자에게 알릴 만한 일이 아니다.
  }
}

export function resetProgress() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // 위와 같다.
  }
}

function clampDone(value: unknown): number {
  const n = Math.floor(Number(value) || 0)
  return Math.max(0, Math.min(TOTAL_SESSIONS, n))
}

/** 한 회차를 마쳤을 때의 새 진도. 28회를 채우면 더 오르지 않는다. */
export function advance(progress: Progress, starsEarned: number): Progress {
  return {
    done: clampDone(progress.done + 1),
    stars: progress.stars + Math.max(0, starsEarned),
  }
}
