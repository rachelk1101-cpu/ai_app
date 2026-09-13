import { estimateMinutes } from '../data/exercises'
import { weekNote, weekOf } from '../data/program'
import { speak } from '../session/speak'
import { useSession } from '../session/useSession'
import { BigButton } from '../ui/BigButton'

/**
 * 오늘 할 운동을 미리 보여 주는 화면.
 *
 * 여기서 운동을 고르게 하지 않는 것은 의도적인 선택이다.
 * 여러 개를 고르는 일은 그 자체로 부담이고, 무엇보다 **무엇이 몇 개 나오는지
 * 미리 다 보여 주는 것**이 이 사용자층에게는 선택권보다 훨씬 중요하다.
 * 앞으로 일어날 일을 알면 불안이 줄고, 중간에 그만두는 일도 줄어든다.
 *
 * 운동 구성을 바꾸는 일은 보호자·교사용 화면이 할 몫으로 남겨 둔다.
 */
export function PickScreen() {
  const beginSession = useSession((s) => s.beginSession)
  const goHome = useSession((s) => s.goHome)
  const routine = useSession((s) => s.routine)
  const sessionIndex = useSession((s) => s.sessionIndex)

  const minutes = estimateMinutes(routine)
  const week = weekOf(sessionIndex)

  const handleStart = () => {
    speak('시작할게요. 튼튼이를 따라 해 보세요.', { force: true })
    beginSession()
  }

  return (
    <main className="mx-auto flex h-full w-full max-w-[900px] flex-col px-6 py-7">
      <header className="text-center">
        <p className="text-[22px] font-bold text-brand">
          {week}주차 · {weekNote(sessionIndex)}
        </p>
        <h1 className="mt-1 text-[38px] leading-tight font-black text-ink">오늘은 이걸 해요</h1>
        <p className="mt-1 text-[24px] font-bold text-ink-soft">
          {routine.length}가지 · 약 {minutes}분
        </p>
      </header>

      <ol className="my-6 min-h-0 flex-1 space-y-3 overflow-y-auto">
        {routine.map((exercise, i) => (
          <li
            key={exercise.id}
            className="flex items-center gap-4 rounded-3xl border-4 border-brand-soft bg-surface px-5 py-4"
          >
            <span
              aria-hidden
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[26px] font-black text-brand"
            >
              {i + 1}
            </span>
            <span aria-hidden className="text-[42px] leading-none">
              {exercise.emoji}
            </span>
            <span className="flex-1 text-[28px] font-bold">{exercise.name}</span>
            <span className="shrink-0 text-[22px] font-bold text-ink-soft">
              <span aria-hidden>⭐</span> {exercise.reps}
            </span>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <BigButton emoji="👍" onClick={handleStart} className="flex-1">
          시작해요
        </BigButton>
        <BigButton tone="quiet" emoji="↩️" onClick={goHome} className="sm:max-w-[220px] sm:flex-none">
          뒤로
        </BigButton>
      </div>
    </main>
  )
}
