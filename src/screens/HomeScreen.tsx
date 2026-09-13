import { CharacterStage } from '../character/CharacterStage'
import { primeSound } from '../session/sounds'
import { primeSpeech, speak } from '../session/speak'
import { useSession } from '../session/useSession'
import { BigButton } from '../ui/BigButton'

/**
 * 시작 화면.
 *
 * 누를 수 있는 것이 버튼 하나뿐이다. 처음 앱을 켠 사람이
 * "무엇을 해야 하지?" 하고 망설일 여지를 남기지 않는다.
 */
export function HomeScreen() {
  const goPick = useSession((s) => s.goPick)

  const handleStart = () => {
    // 소리와 음성은 사용자가 무언가를 누르는 순간에만 열 수 있다.
    // 이 버튼이 그 첫 조작이다.
    primeSpeech()
    primeSound()
    speak('같이 운동해요!', { force: true })
    goPick()
  }

  return (
    <main className="flex h-full flex-col items-center justify-between px-6 py-8">
      <header className="text-center">
        <h1 className="text-[44px] leading-tight font-black text-brand sm:text-[56px]">
          튼튼이와 운동해요
        </h1>
        <p className="mt-2 text-[24px] font-bold text-ink-soft">따라 하면 별을 모아요</p>
      </header>

      <div className="min-h-0 w-full flex-1">
        <CharacterStage clip="wave" tempoSec={3.2} className="h-full w-full" />
      </div>

      <BigButton emoji="▶️" onClick={handleStart} className="w-full max-w-[520px]">
        운동 시작
      </BigButton>
    </main>
  )
}
