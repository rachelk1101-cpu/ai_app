import { useCallback, useEffect, useRef, useState } from 'react'
import { REST_BETWEEN_SEC, type Exercise } from '../data/exercises'

export type Stage = 'intro' | 'active'

export type EngineView = {
  index: number
  stage: Stage
  /** 현재 운동에서 끝낸 횟수. */
  repsDone: number
  /** 이번 회차를 스스로 해냈는지. 인식에 성공한 순간 바로 true 가 된다. */
  repAchieved: boolean
}

type Options = {
  routine: Exercise[]
  paused: boolean
  /** 한 회차가 끝날 때마다. achieved 는 그 회차에 자세 인식이 통과했는지. */
  onRepComplete: (achieved: boolean) => void
  /** 마지막 운동까지 끝났을 때. */
  onFinish: () => void
}

/**
 * 운동 세션의 시간 진행을 담당한다.
 *
 * 진행 규칙이 이 앱의 핵심 설계다.
 *
 *   한 회차는 캐릭터 동작 한 사이클이고, **항상** 그 시간만큼 걸린다.
 *   자세 인식에 성공하면 그 순간 칭찬이 나가지만, 성공하지 못해도
 *   회차는 똑같이 끝나고 별도 똑같이 받는다.
 *
 * 인식 결과가 진행을 막지 못하게 한 것은 타협이 아니라 요구사항이다.
 * 발달장애인 사용자에게 '못 해서 멈춘 화면'은 그 자리에서 앱을 그만두게
 * 만드는 가장 확실한 방법이다. 인식은 칭찬을 주는 데만 쓰고,
 * 막는 데는 쓰지 않는다.
 *
 * 매 프레임 바뀌는 값(재생 위치)은 ref 로만 전달하고, state 는
 * 회차·운동이 바뀌는 순간에만 갱신한다. 덕분에 초당 60번이 아니라
 * 몇 초에 한 번만 리렌더가 일어난다.
 */
export function useWorkoutEngine({ routine, paused, onRepComplete, onFinish }: Options) {
  /** 현재 동작의 재생 위치 0~1. 캐릭터가 매 프레임 직접 읽어 간다. */
  const phaseRef = useRef(0)

  const elapsed = useRef(0)
  const index = useRef(0)
  const stage = useRef<Stage>('intro')
  const repsDone = useRef(0)
  const achieved = useRef(false)
  const finished = useRef(false)

  const [view, setView] = useState<EngineView>({
    index: 0,
    stage: 'intro',
    repsDone: 0,
    repAchieved: false,
  })
  /** 칭찬 연출을 다시 트리거하기 위한 값. 성공할 때마다 1씩 오른다. */
  const [celebration, setCelebration] = useState(0)

  // 콜백과 설정을 ref 에 담아, 애니메이션 루프를 한 번만 만들고 끝낸다.
  // 렌더 중이 아니라 렌더가 끝난 뒤에 갱신한다 — 버려질 수도 있는 렌더에서
  // ref 를 쓰면 실제로 화면에 나가지 않은 값이 루프에 흘러들어 갈 수 있다.
  const routineRef = useRef(routine)
  const pausedRef = useRef(paused)
  const onRepCompleteRef = useRef(onRepComplete)
  const onFinishRef = useRef(onFinish)

  useEffect(() => {
    routineRef.current = routine
    pausedRef.current = paused
    onRepCompleteRef.current = onRepComplete
    onFinishRef.current = onFinish
  })

  const publish = useCallback(() => {
    setView({
      index: index.current,
      stage: stage.current,
      repsDone: repsDone.current,
      repAchieved: achieved.current,
    })
  }, [])

  /** 자세 인식이 통과했다고 알린다. 한 회차에 한 번만 먹는다. */
  const markAchieved = useCallback(() => {
    if (achieved.current || finished.current) return
    if (stage.current !== 'active') return
    achieved.current = true
    setCelebration((n) => n + 1)
    publish()
  }, [publish])

  useEffect(() => {
    let raf = 0
    let last = performance.now()

    const advance = (dt: number) => {
      const exercise = routineRef.current[index.current]
      if (!exercise || finished.current) return

      elapsed.current += dt

      if (stage.current === 'intro') {
        // 쉬는 동안에도 캐릭터는 가만히 숨 쉬어야 한다. 위상을 계속 돌린다.
        phaseRef.current = (phaseRef.current + dt / 4) % 1

        if (elapsed.current >= REST_BETWEEN_SEC) {
          stage.current = 'active'
          // 넘친 시간을 이월해서 프레임이 밀려도 박자가 어긋나지 않게 한다.
          elapsed.current -= REST_BETWEEN_SEC
          achieved.current = false
          phaseRef.current = 0
          publish()
        } else {
          return
        }
      }

      const cycle = exercise.tempoSec
      const total = exercise.reps * cycle
      phaseRef.current = (Math.min(elapsed.current, total) % cycle) / cycle

      const target = Math.min(exercise.reps, Math.floor(elapsed.current / cycle))
      if (target > repsDone.current) {
        // 탭이 백그라운드에 있다 돌아오면 여러 회차가 한꺼번에 밀릴 수 있다.
        // 그래도 하나씩 보고한다.
        while (repsDone.current < target) {
          repsDone.current += 1
          onRepCompleteRef.current(achieved.current)
          achieved.current = false
        }
        publish()
      }

      if (elapsed.current >= total) {
        if (index.current + 1 < routineRef.current.length) {
          index.current += 1
          stage.current = 'intro'
          elapsed.current = 0
          repsDone.current = 0
          achieved.current = false
          phaseRef.current = 0
          publish()
        } else {
          finished.current = true
          onFinishRef.current()
        }
      }
    }

    const step = (now: number) => {
      // 탭 전환이나 화면 꺼짐으로 생긴 큰 시간 점프를 잘라 낸다.
      // 자르지 않으면 돌아왔을 때 운동 한 개가 통째로 건너뛰어진다.
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      if (!pausedRef.current) advance(dt)
      raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [publish])

  const exercise = routine[view.index]

  return {
    phaseRef,
    exercise,
    index: view.index,
    stage: view.stage,
    repsDone: view.repsDone,
    repAchieved: view.repAchieved,
    celebration,
    markAchieved,
    isLast: view.index === routine.length - 1,
  }
}
