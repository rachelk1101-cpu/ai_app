import { useEffect } from 'react'
import { CharacterStage } from '../character/CharacterStage'
import { EXERCISES } from '../data/exercises'
import { speak } from '../session/speak'
import { useSession } from '../session/useSession'
import { BigButton } from '../ui/BigButton'
import { StarRow } from '../ui/StarRow'

/**
 * 칭찬 화면.
 *
 * 몇 퍼센트 정확했는지, 어디가 틀렸는지는 보여 주지 않는다.
 * 오늘 몸을 움직였다는 사실만 크게 보여 주는 것이 이 화면의 전부다.
 */
export function RewardScreen() {
  const totalReps = useSession((s) => s.totalReps)
  const achievedReps = useSession((s) => s.achievedReps)
  const start = useSession((s) => s.start)
  const goHome = useSession((s) => s.goHome)

  useEffect(() => {
    speak(`다 했어요! 오늘 ${totalReps}번 움직였어요. 정말 잘했어요.`, { force: true })
  }, [totalReps])

  return (
    <main className="mx-auto flex h-full w-full max-w-[900px] flex-col items-center px-6 py-7">
      <header className="text-center">
        <h1 className="text-[48px] leading-tight font-black text-brand">다 했어요!</h1>
        <p className="mt-2 text-[30px] font-bold">
          오늘 <span className="text-brand">{totalReps}번</span> 움직였어요
        </p>
      </header>

      {/* 별을 좁은 폭 안에서 여러 줄로 흘려 '한 무더기'처럼 보이게 한다.
          한 줄로 길게 늘어놓으면 개수가 많을수록 오히려 초라해 보인다. */}
      <div className="mt-4 flex max-h-[116px] w-full max-w-[620px] justify-center overflow-hidden">
        <StarRow
          total={totalReps}
          filled={totalReps}
          size={30}
          label={`별 ${totalReps}개를 모았어요`}
        />
      </div>

      {achievedReps > 0 && (
        <p className="mt-3 text-center text-[22px] font-bold text-ink-soft">
          그중 <span className="text-brand">{achievedReps}번</span>은 튼튼이랑 똑같이 해냈어요
        </p>
      )}

      <div className="min-h-0 w-full flex-1">
        <CharacterStage clip="cheer" tempoSec={1.6} className="h-full w-full" />
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row-reverse">
        <BigButton emoji="🔁" onClick={() => start(EXERCISES)} className="flex-1">
          한 번 더
        </BigButton>
        <BigButton
          tone="quiet"
          emoji="🏠"
          onClick={goHome}
          className="sm:max-w-[240px] sm:flex-none"
        >
          처음으로
        </BigButton>
      </div>
    </main>
  )
}
