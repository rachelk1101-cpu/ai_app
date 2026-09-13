import { CharacterStage } from '../character/CharacterStage'
import { TOTAL_SESSIONS } from '../data/program'
import { primeSound } from '../session/sounds'
import { primeSpeech, speak } from '../session/speak'
import { useSession } from '../session/useSession'
import { BigButton } from '../ui/BigButton'
import { StampBoard } from '../ui/StampBoard'

/**
 * 시작 화면.
 *
 * 누를 수 있는 것이 버튼 하나뿐이다. 처음 앱을 켠 사람이
 * "무엇을 해야 하지?" 하고 망설일 여지를 남기지 않는다.
 *
 * 도장판을 여기 두는 것은, 앱을 열 때마다 지금까지 쌓은 것이 먼저
 * 보이게 하기 위해서다. 남은 칸이 아니라 채운 칸이 눈에 들어와야 한다.
 */
export function HomeScreen() {
  const goPick = useSession((s) => s.goPick)
  const restart = useSession((s) => s.restart)
  const progress = useSession((s) => s.progress)

  const finishedAll = progress.done >= TOTAL_SESSIONS

  const handleStart = () => {
    // 소리와 음성은 사용자가 무언가를 누르는 순간에만 열 수 있다.
    // 이 버튼이 그 첫 조작이다.
    primeSpeech()
    primeSound()
    speak('같이 운동해요!', { force: true })
    goPick()
  }

  const handleRestart = () => {
    primeSpeech()
    primeSound()
    speak('처음부터 다시 시작해요!', { force: true })
    restart()
  }

  return (
    <main className="mx-auto flex h-full w-full max-w-[760px] flex-col items-center justify-between px-6 py-6">
      <header className="w-full text-center">
        <h1 className="text-[36px] leading-tight font-black text-brand sm:text-[44px]">
          튼튼이와 운동해요
        </h1>

        {finishedAll ? (
          <p className="mt-1 text-[26px] font-bold">한 달을 다 채웠어요! 🎉</p>
        ) : (
          <p className="mt-1 text-[26px] font-bold">
            오늘은 <span className="text-brand">{progress.done + 1}번째</span> 날이에요
          </p>
        )}

        {/* 폭을 좁혀 칸을 작게 만든다. 시작 화면에서는 도장판이 한눈에 들어오되
            캐릭터 자리를 빼앗지 않아야 한다. */}
        <div className="mx-auto mt-3 w-full max-w-[380px]">
          <StampBoard done={progress.done} size="sm" />
        </div>
        <p className="mt-2 text-[20px] font-bold text-ink-soft">
          <span aria-hidden>⭐</span> 모은 별 {progress.stars}개
        </p>
      </header>

      <div className="min-h-0 w-full flex-1">
        <CharacterStage clip={finishedAll ? 'cheer' : 'wave'} tempoSec={finishedAll ? 1.8 : 3.2} className="h-full w-full" />
      </div>

      {finishedAll ? (
        <BigButton emoji="🔁" onClick={handleRestart} className="w-full max-w-[520px]">
          처음부터 다시
        </BigButton>
      ) : (
        <BigButton emoji="▶️" onClick={handleStart} className="w-full max-w-[520px]">
          운동 시작
        </BigButton>
      )}
    </main>
  )
}
