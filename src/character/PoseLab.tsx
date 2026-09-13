import { useMemo } from 'react'
import { CharacterStage } from './CharacterStage'
import { POSE_CLIPS } from './poses'

const STEPS = [0, 0.2, 0.35, 0.5, 0.65, 0.8]

function Frame({ clip, t, turnDeg }: { clip: string; t: number; turnDeg: number }) {
  // 값이 고정된 { current } 상자. 캐릭터가 매 프레임 읽지만 내용이 바뀌지 않아
  // 그 한 자세에서 멈춰 선다.
  const phaseRef = useMemo(() => ({ current: t }), [t])

  return (
    <figure className="m-0 flex min-w-0 flex-1 flex-col">
      <div className="min-h-0 flex-1">
        <CharacterStage clip={clip} phaseRef={phaseRef} turnDeg={turnDeg} className="h-full w-full" />
      </div>
      <figcaption className="text-center text-[15px] font-bold text-ink-soft">
        t = {t.toFixed(2)}
      </figcaption>
    </figure>
  )
}

/**
 * 동작 키프레임을 눈으로 확인하는 개발용 화면. `?pose=armsUp` 으로 연다.
 *
 * 관절 각도를 손으로 쓰는 방식이라, 한 사이클을 여러 지점에서 동시에 펼쳐
 * 봐야 어디가 어색한지 빨리 찾을 수 있다. 특히 팔이 머리에 가려지는지는
 * 이렇게 보지 않으면 놓치기 쉽다.
 */
export function PoseLab({ clip, turnDeg }: { clip: string; turnDeg: number }) {
  const known = clip in POSE_CLIPS

  return (
    <main className="flex h-full flex-col p-4">
      <h1 className="text-[26px] font-black">
        {clip}
        <span className="ml-3 text-[18px] font-bold text-ink-soft">turn {turnDeg}°</span>
        {!known && <span className="ml-3 text-[18px] text-blush">— 없는 클립, idle 로 대체</span>}
      </h1>
      <p className="text-[16px] font-bold text-ink-soft">
        있는 클립: {Object.keys(POSE_CLIPS).join(', ')}
      </p>
      <div className="mt-2 flex min-h-0 flex-1 gap-1">
        {STEPS.map((t) => (
          <Frame key={t} clip={clip} t={t} turnDeg={turnDeg} />
        ))}
      </div>
    </main>
  )
}
