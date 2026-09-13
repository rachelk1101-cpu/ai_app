import { useEffect } from 'react'
import { CharacterStage } from '../character/CharacterStage'
import { TOTAL_SESSIONS } from '../data/program'
import { speak } from '../session/speak'
import { useSession } from '../session/useSession'
import { BigButton } from '../ui/BigButton'
import { StampBoard } from '../ui/StampBoard'

/**
 * 칭찬 화면.
 *
 * 몇 퍼센트 정확했는지, 어디가 틀렸는지는 보여 주지 않는다.
 * 오늘 몸을 움직였다는 사실과, 도장이 하나 더 찍혔다는 것만 보여 준다.
 */
export function RewardScreen() {
  const totalReps = useSession((s) => s.totalReps)
  const achievedReps = useSession((s) => s.achievedReps)
  const progress = useSession((s) => s.progress)
  const goHome = useSession((s) => s.goHome)
  const restart = useSession((s) => s.restart)

  // finish() 에서 이미 한 칸 올라갔으므로, 방금 찍힌 칸은 그 직전이다.
  const justStamped = Math.max(0, progress.done - 1)
  const finishedAll = progress.done >= TOTAL_SESSIONS

  useEffect(() => {
    speak(
      finishedAll
        ? `다 했어요! 한 달을 모두 채웠어요. 정말 대단해요.`
        : `다 했어요! 오늘 ${totalReps}번 움직였어요. 정말 잘했어요.`,
      { force: true },
    )
  }, [totalReps, finishedAll])

  return (
    <main className="mx-auto flex h-full w-full max-w-[760px] flex-col items-center px-6 py-6">
      <header className="text-center">
        <h1 className="text-[44px] leading-tight font-black text-brand">
          {finishedAll ? '한 달 완성! 🎉' : '다 했어요!'}
        </h1>
        <p className="mt-1 text-[28px] font-bold">
          오늘 <span className="text-brand">{totalReps}번</span> 움직였어요
        </p>
        {achievedReps > 0 && (
          <p className="mt-1 text-[20px] font-bold text-ink-soft">
            그중 <span className="text-brand">{achievedReps}번</span>은 튼튼이랑 똑같이 해냈어요
          </p>
        )}
      </header>

      <div className="mt-4 w-full">
        <StampBoard done={progress.done} justStamped={justStamped} />
        <p className="mt-2 text-center text-[22px] font-bold text-ink-soft">
          도장 {progress.done} / {TOTAL_SESSIONS} · <span aria-hidden>⭐</span> 모은 별{' '}
          {progress.stars}개
        </p>
      </div>

      <div className="min-h-0 w-full flex-1">
        <CharacterStage clip="cheer" tempoSec={1.6} className="h-full w-full" />
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row-reverse">
        {finishedAll ? (
          <BigButton emoji="🔁" onClick={restart} className="flex-1">
            처음부터 다시
          </BigButton>
        ) : (
          <BigButton emoji="🏠" onClick={goHome} className="flex-1">
            오늘은 끝!
          </BigButton>
        )}
      </div>
    </main>
  )
}
