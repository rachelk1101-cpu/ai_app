import { PoseLab } from './character/PoseLab'
import { HomeScreen } from './screens/HomeScreen'
import { PickScreen } from './screens/PickScreen'
import { RewardScreen } from './screens/RewardScreen'
import { WorkoutScreen } from './screens/WorkoutScreen'
import { MOCK_MODE, useSession } from './session/useSession'

/** `?pose=armsUp&turn=30` — 동작 키프레임을 확인하는 개발용 화면. */
const QUERY = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search)
const POSE_LAB = QUERY?.get('pose') ?? null
const POSE_TURN = Number(QUERY?.get('turn') ?? 0) || 0

export default function App() {
  const screen = useSession((s) => s.screen)

  if (POSE_LAB) return <PoseLab clip={POSE_LAB} turnDeg={POSE_TURN} />

  return (
    <div className="h-full">
      {screen === 'home' && <HomeScreen />}
      {screen === 'pick' && <PickScreen />}
      {/* key 로 세션마다 화면을 새로 만든다. 카메라와 타이머가 깨끗한 상태에서 시작한다. */}
      {screen === 'workout' && <WorkoutScreen key="workout" />}
      {screen === 'reward' && <RewardScreen />}

      {MOCK_MODE && (
        <p className="pointer-events-none fixed bottom-2 left-2 rounded-full bg-ink/70 px-3 py-1 text-[13px] font-bold text-white">
          시연 모드 (카메라 꺼짐)
        </p>
      )}
    </div>
  )
}
