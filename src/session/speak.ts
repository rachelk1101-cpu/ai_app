/**
 * 한국어 음성 안내. 브라우저 내장 Web Speech API 만 쓴다.
 *
 * 외부 TTS 서비스를 쓰지 않는 이유는 두 가지다.
 * 네트워크가 끊긴 곳에서도 안내가 나와야 하고, 사용자의 사용 기록이
 * 어디로도 나가지 않아야 한다.
 */

let koreanVoice: SpeechSynthesisVoice | null = null
let lastText = ''
let lastAt = 0
let unlocked = false

function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null
}

function pickVoice() {
  const s = synth()
  if (!s) return
  const voices = s.getVoices()
  if (voices.length === 0) return
  koreanVoice =
    voices.find((v) => v.lang.toLowerCase().startsWith('ko')) ??
    voices.find((v) => v.lang.toLowerCase().includes('kr')) ??
    null
}

// 목소리 목록은 비동기로 채워진다. 두 번 다 걸어 둔다.
if (synth()) {
  pickVoice()
  synth()!.addEventListener('voiceschanged', pickVoice)
}

/**
 * iOS Safari 등은 사용자가 무언가를 누르기 전에는 소리를 내지 않는다.
 * 첫 버튼(운동 시작)을 누르는 순간 빈 발화로 잠금을 풀어 둔다.
 */
export function primeSpeech() {
  const s = synth()
  if (!s || unlocked) return
  unlocked = true
  pickVoice()
  const u = new SpeechSynthesisUtterance(' ')
  u.volume = 0
  s.speak(u)
}

export type SpeakOptions = {
  /** 같은 문장이라도 다시 읽는다. */
  force?: boolean
  /** 읽던 문장을 끊고 바로 읽는다. */
  interrupt?: boolean
}

/**
 * 문장을 읽어 준다.
 * 같은 문장이 2초 안에 다시 들어오면 무시한다 — 렌더가 여러 번 일어나도
 * 같은 말이 겹쳐 나오지 않게 하기 위한 것이다.
 */
export function speak(text: string, options: SpeakOptions = {}) {
  const s = synth()
  if (!s || !text) return

  const now = Date.now()
  if (!options.force && text === lastText && now - lastAt < 2000) return
  lastText = text
  lastAt = now

  if (options.interrupt) s.cancel()

  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ko-KR'
  if (koreanVoice) u.voice = koreanVoice
  // 느리게. 발달장애인 사용자에게는 말의 속도가 곧 난이도다.
  u.rate = 0.88
  u.pitch = 1.1
  u.volume = 1
  s.speak(u)
}

export function stopSpeaking() {
  synth()?.cancel()
  lastText = ''
}
