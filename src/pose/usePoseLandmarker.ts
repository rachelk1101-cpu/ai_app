import type { PoseLandmarker } from '@mediapipe/tasks-vision'
import { useEffect, useRef, useState } from 'react'
import type { Point } from './landmarks'

export type PoseStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  /** 사용자가 카메라를 거부했거나 다른 앱이 쓰고 있음. 운동은 그대로 진행된다. */
  | 'denied'
  | 'error'

export type PoseFrame = {
  /** 판정용. 미터 단위, 골반 중점이 원점이라 체격·거리에 영향을 덜 받는다. */
  world: Point[]
  /** 화면에 뼈대를 그리기 위한 0~1 정규화 좌표. */
  screen: Point[]
}

type Options = {
  enabled: boolean
  onFrame: (frame: PoseFrame) => void
}

/** 초당 인식 횟수. 60fps 로 돌릴 이유가 없고, 태블릿 발열·배터리에 그대로 영향을 준다. */
const TARGET_FPS = 24

/**
 * 카메라를 열고 MediaPipe 로 자세를 인식한다.
 *
 * 영상은 기기 밖으로 나가지 않는다. WASM 런타임과 모델 파일을 모두
 * `public/` 에 번들해 두었기 때문에, 인터넷이 끊긴 곳에서도 동작하고
 * 프레임이 서버로 전송되는 경로 자체가 없다.
 */
export function usePoseLandmarker({ enabled, onFrame }: Options) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [status, setStatus] = useState<PoseStatus>('idle')
  const [message, setMessage] = useState('')

  const onFrameRef = useRef(onFrame)
  useEffect(() => {
    onFrameRef.current = onFrame
  })

  useEffect(() => {
    if (!enabled) {
      setStatus((s) => (s === 'idle' ? s : 'idle'))
      return
    }

    let cancelled = false
    let stream: MediaStream | null = null
    let landmarker: PoseLandmarker | null = null
    let timer: number | undefined
    let raf = 0
    let lastTimestamp = -1
    // 정리 함수는 이 시점의 video 엘리먼트를 잡아 둔다. 정리가 돌 때쯤
    // ref 가 이미 다른 것을 가리키고 있을 수 있다.
    const videoEl = videoRef.current

    const start = async () => {
      setStatus('loading')
      setMessage('')

      // 1) 카메라부터 연다. 거부당하면 무거운 모델을 받을 이유가 없다.
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        })
      } catch (err) {
        if (cancelled) return
        setStatus('denied')
        setMessage(err instanceof Error ? err.message : String(err))
        return
      }
      // 여기 도달하기 전에 정리 함수가 이미 돌았을 수 있다(React StrictMode 의
      // 이중 마운트, 빠른 화면 전환). 그때는 정리 함수가 이 stream 을 보지 못했으므로
      // 여기서 직접 꺼야 한다. 안 그러면 카메라 불이 켜진 채로 남는다.
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }

      const video = videoEl
      if (!video) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      video.srcObject = stream
      try {
        await video.play()
      } catch {
        // 자동재생이 막혀도 뒤에서 계속 시도되므로 치명적이지 않다.
      }

      // 2) 인식기 준비. GPU 위임이 안 되는 기기에서는 CPU 로 물러선다.
      try {
        // 동적 import: MediaPipe 는 번들의 큰 덩어리인데 시작·고르기 화면에서는
        // 쓰지 않는다. 운동을 시작할 때 받도록 미뤄서 첫 화면이 빨리 뜨게 한다.
        const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision')
        const vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm')
        const options = {
          baseOptions: {
            modelAssetPath: '/mediapipe/pose_landmarker_lite.task',
            delegate: 'GPU' as const,
          },
          runningMode: 'VIDEO' as const,
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        }
        try {
          landmarker = await PoseLandmarker.createFromOptions(vision, options)
        } catch {
          landmarker = await PoseLandmarker.createFromOptions(vision, {
            ...options,
            baseOptions: { ...options.baseOptions, delegate: 'CPU' },
          })
        }
      } catch (err) {
        if (cancelled) return
        setStatus('error')
        setMessage(err instanceof Error ? err.message : String(err))
        return
      }
      if (cancelled) {
        landmarker?.close()
        return
      }

      setStatus('ready')

      const detect = () => {
        if (cancelled || !landmarker || !video) return
        if (video.readyState >= 2 && video.videoWidth > 0) {
          // detectForVideo 는 타임스탬프가 반드시 증가해야 한다.
          const ts = Math.max(performance.now(), lastTimestamp + 1)
          lastTimestamp = ts
          try {
            const result = landmarker.detectForVideo(video, ts)
            const world = result.worldLandmarks?.[0]
            const screen = result.landmarks?.[0]
            if (world && screen) {
              onFrameRef.current({
                world: world.map((p, i) => ({
                  x: p.x,
                  y: p.y,
                  z: p.z,
                  // world 쪽에 visibility 가 비어 있는 경우가 있어 화면 좌표에서 보완한다.
                  visibility: p.visibility ?? screen[i]?.visibility ?? 1,
                })),
                screen: screen.map((p) => ({
                  x: p.x,
                  y: p.y,
                  z: p.z,
                  visibility: p.visibility ?? 1,
                })),
              })
            }
          } catch {
            // 한 프레임 실패는 흘려보낸다. 다음 프레임에서 회복되는 경우가 대부분이다.
          }
        }
        schedule()
      }

      const schedule = () => {
        timer = window.setTimeout(() => {
          raf = requestAnimationFrame(detect)
        }, 1000 / TARGET_FPS)
      }

      schedule()
    }

    void start()

    return () => {
      cancelled = true
      if (timer !== undefined) clearTimeout(timer)
      cancelAnimationFrame(raf)
      landmarker?.close()
      stream?.getTracks().forEach((t) => t.stop())
      if (videoEl) videoEl.srcObject = null
    }
  }, [enabled])

  return { videoRef, status, message }
}
