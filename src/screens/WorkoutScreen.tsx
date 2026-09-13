import { useCallback, useEffect, useRef, useState } from 'react'
import { CharacterStage } from '../character/CharacterStage'
import { CameraView } from '../pose/CameraView'
import { evaluateChecks } from '../pose/checks'
import { usePoseLandmarker, type PoseFrame } from '../pose/usePoseLandmarker'
import { playCheer, playLevelUp, playStar } from '../session/sounds'
import { speak, stopSpeaking } from '../session/speak'
import { MOCK_MODE, useSession } from '../session/useSession'
import { useWorkoutEngine } from '../session/useWorkoutEngine'
import { BigButton } from '../ui/BigButton'
import { StarRow } from '../ui/StarRow'

export function WorkoutScreen() {
  const routine = useSession((s) => s.routine)
  const recordRep = useSession((s) => s.recordRep)
  const finish = useSession((s) => s.finish)
  const goHome = useSession((s) => s.goHome)

  const [paused, setPaused] = useState(false)
  const [matching, setMatching] = useState(false)

  const frameRef = useRef<PoseFrame | null>(null)
  const matchingRef = useRef(false)
  const holdSince = useRef<number | null>(null)
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  const onRepComplete = useCallback(
    (achieved: boolean) => {
      recordRep(achieved)
      playStar()
    },
    [recordRep],
  )

  const onFinish = useCallback(() => {
    playLevelUp()
    finish()
  }, [finish])

  const engine = useWorkoutEngine({ routine, paused, onRepComplete, onFinish })
  const { exercise, stage, index, repsDone, celebration, markAchieved, phaseRef } = engine

  // 매 프레임 도는 인식 콜백에서 최신 값을 읽기 위한 ref 들.
  const exerciseRef = useRef(exercise)
  exerciseRef.current = exercise
  const stageRef = useRef(stage)
  stageRef.current = stage

  /** 카메라 프레임 하나를 받아 지금 자세가 조건을 만족하는지 본다. */
  const handleFrame = useCallback(
    (frame: PoseFrame) => {
      frameRef.current = frame

      const current = exerciseRef.current
      const active = current && stageRef.current === 'active' && !pausedRef.current
      if (!active) {
        holdSince.current = null
        if (matchingRef.current) {
          matchingRef.current = false
          setMatching(false)
        }
        return
      }

      const ok = evaluateChecks(current.checks, frame.world)

      // 값이 바뀔 때만 state 를 건드린다. 초당 24번 리렌더할 이유가 없다.
      if (matchingRef.current !== ok) {
        matchingRef.current = ok
        setMatching(ok)
      }

      if (!ok) {
        holdSince.current = null
        return
      }
      // 순간적인 오인식으로 칭찬이 튀어나오지 않도록 잠깐 유지되어야 인정한다.
      const now = performance.now()
      if (holdSince.current === null) holdSince.current = now
      else if (now - holdSince.current >= current.holdMs) markAchieved()
    },
    [markAchieved],
  )

  const { videoRef, status } = usePoseLandmarker({ enabled: !MOCK_MODE, onFrame: handleFrame })

  // ── 음성 안내 ────────────────────────────────────────────
  const exerciseId = exercise?.id
  useEffect(() => {
    if (!exercise) return
    if (stage === 'intro') {
      speak(index === 0 ? `첫 번째, ${exercise.name}` : `다음은 ${exercise.name}`, { interrupt: true })
    } else {
      speak(exercise.cue, { interrupt: true })
    }
    // exercise 객체가 아니라 id 로 비교해야 같은 안내가 두 번 나오지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId, stage, index])

  // ── 칭찬 ────────────────────────────────────────────────
  const praisedAt = useRef(-1)
  useEffect(() => {
    if (celebration === 0) return
    playCheer()
    // 말로 하는 칭찬은 운동마다 한 번만. 매번 말이 나오면 곧 소음이 된다.
    if (praisedAt.current !== index) {
      praisedAt.current = index
      speak('잘하고 있어요!')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebration])

  // ── 카메라 없이 하는 시연 (?mock=1) ─────────────────────
  useEffect(() => {
    if (!MOCK_MODE || paused || stage !== 'active' || !exercise) return
    const timer = setTimeout(() => markAchieved(), exercise.tempoSec * 550)
    return () => clearTimeout(timer)
  }, [stage, index, repsDone, paused, exercise, markAchieved])

  useEffect(() => {
    if (paused) stopSpeaking()
  }, [paused])

  useEffect(() => stopSpeaking, [])

  if (!exercise) return null

  const showIntro = stage === 'intro'

  return (
    <main className="relative flex h-full flex-col">
      <header className="flex items-start justify-between gap-4 px-6 pt-5">
        <div className="min-w-0">
          <p className="text-[20px] font-bold text-ink-soft">
            {index + 1} / {routine.length}
          </p>
          <h1 className="truncate text-[34px] leading-tight font-black">
            <span aria-hidden className="mr-2">
              {exercise.emoji}
            </span>
            {exercise.name}
          </h1>
        </div>
        <div className="shrink-0 pt-1">
          <StarRow
            total={exercise.reps}
            filled={repsDone}
            size={36}
            label={`${exercise.reps}번 중 ${repsDone}번 했어요`}
          />
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <CharacterStage
          clip={showIntro ? 'idle' : exercise.clip}
          phaseRef={phaseRef}
          paused={paused}
          // 예고 중에는 정면으로 두었다가 동작이 시작될 때 필요한 각도로 돌아간다.
          turnDeg={showIntro ? 0 : (exercise.viewAngle ?? 0)}
          // 거울 반전은 끈다. 캐릭터가 정면으로 마주 보고 있으므로 보이는 대로
          // 따라 하면 되고, 아래 카메라 창도 거울로 비치기 때문에 두 화면의
          // 좌우가 이미 일치한다. (안내 문구가 '오른팔'처럼 방향을 말하는
          // 동작을 넣게 되면 그때 이 값을 켜면 된다.)
          mirrored={false}
          className="h-full w-full"
        />

        {/* 다음 동작 예고. 캐릭터 얼굴을 가리지 않도록 아래쪽에 놓는다 —
            무엇을 할지 읽는 동안에도 튼튼이가 계속 보여야 한다. */}
        {showIntro && (
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center p-5">
            <div className="animate-pop-in flex items-center gap-5 rounded-[32px] border-4 border-brand-soft bg-surface px-8 py-5 text-left shadow-xl">
              <span aria-hidden className="text-[64px] leading-none">
                {exercise.emoji}
              </span>
              <span>
                <p className="text-[34px] leading-tight font-black">{exercise.name}</p>
                <p className="text-[22px] font-bold text-ink-soft">준비해요</p>
              </span>
            </div>
          </div>
        )}

        {/* 자세를 해냈을 때의 칭찬. 사라질 때까지 아무것도 가리지 않는다. */}
        {celebration > 0 && (
          <div
            key={celebration}
            className="animate-pop-in pointer-events-none absolute top-4 left-1/2 -translate-x-1/2"
          >
            <div className="rounded-full bg-star px-8 py-3 text-[30px] font-black text-ink shadow-lg">
              잘했어요! ⭐
            </div>
          </div>
        )}

        {!MOCK_MODE && (
          <div className="absolute right-4 bottom-4 aspect-[3/4] w-[150px] sm:w-[190px]">
            <CameraView
              videoRef={videoRef}
              frameRef={frameRef}
              matching={matching}
              status={status}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 px-6 pb-7">
        <p className="min-w-0 flex-1 text-[30px] leading-tight font-bold">
          {showIntro ? '곧 시작해요' : exercise.hint}
        </p>
        <BigButton
          tone="quiet"
          emoji="⏸️"
          onClick={() => setPaused(true)}
          className="shrink-0"
          ariaLabel="잠깐 쉬기"
        >
          쉬기
        </BigButton>
      </div>

      {paused && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-cream/95 px-8">
          <p className="text-center text-[44px] font-black">잠깐 쉬는 중</p>
          <BigButton emoji="▶️" onClick={() => setPaused(false)} className="w-full max-w-[460px]">
            계속하기
          </BigButton>
          <BigButton
            tone="quiet"
            emoji="🏠"
            onClick={() => {
              stopSpeaking()
              goHome()
            }}
            className="w-full max-w-[460px]"
          >
            처음으로
          </BigButton>
        </div>
      )}
    </main>
  )
}
