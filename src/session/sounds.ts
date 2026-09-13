/**
 * 효과음을 WebAudio 로 직접 합성한다. 음원 파일을 두지 않는다.
 *
 * 파일이 없으니 오프라인에서도 나고, 로딩도 없다.
 * 소리는 일부러 작고 부드럽게 만들었다 — 갑작스럽고 큰 소리는
 * 감각이 예민한 사용자에게 그 자체로 하기 싫은 이유가 된다.
 */

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** 첫 사용자 조작 때 불러 두면 이후 소리가 막히지 않는다. */
export function primeSound() {
  audio()
}

function tone(freq: number, startAt: number, duration: number, peak: number) {
  const c = audio()
  if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()

  osc.type = 'sine'
  osc.frequency.value = freq

  const t = c.currentTime + startAt
  // 부드러운 어택과 릴리스. 딱딱한 시작음을 피한다.
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(peak, t + 0.03)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)

  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(t)
  osc.stop(t + duration + 0.05)
}

/** 한 회차를 끝냈을 때. 조용한 한 음. */
export function playStar() {
  tone(880, 0, 0.32, 0.1)
}

/** 자세를 스스로 해냈을 때. 밝게 올라가는 세 음. */
export function playCheer() {
  tone(784, 0, 0.22, 0.12) // G5
  tone(988, 0.1, 0.22, 0.12) // B5
  tone(1319, 0.2, 0.42, 0.13) // E6
}

/** 운동 하나를 마쳤을 때. */
export function playLevelUp() {
  tone(523, 0, 0.2, 0.11)
  tone(659, 0.12, 0.2, 0.11)
  tone(784, 0.24, 0.2, 0.11)
  tone(1047, 0.36, 0.6, 0.13)
}
