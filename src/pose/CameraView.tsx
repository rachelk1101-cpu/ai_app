import { useEffect, useRef, type RefObject } from 'react'
import { LANDMARK_INDEX } from './landmarks'
import type { PoseFrame, PoseStatus } from './usePoseLandmarker'

const L = LANDMARK_INDEX

/**
 * 얼굴의 잔가지는 빼고 몸통·팔·다리만 잇는다.
 * 뼈대가 단순할수록 "지금 내 팔이 어디 있는지"가 한눈에 들어온다.
 */
const BONES: [number, number][] = [
  [L.leftShoulder, L.rightShoulder],
  [L.leftShoulder, L.leftElbow],
  [L.leftElbow, L.leftWrist],
  [L.rightShoulder, L.rightElbow],
  [L.rightElbow, L.rightWrist],
  [L.leftShoulder, L.leftHip],
  [L.rightShoulder, L.rightHip],
  [L.leftHip, L.rightHip],
  [L.leftHip, L.leftKnee],
  [L.leftKnee, L.leftAnkle],
  [L.rightHip, L.rightKnee],
  [L.rightKnee, L.rightAnkle],
]

const JOINTS = [
  L.leftShoulder,
  L.rightShoulder,
  L.leftElbow,
  L.rightElbow,
  L.leftWrist,
  L.rightWrist,
  L.leftHip,
  L.rightHip,
  L.leftKnee,
  L.rightKnee,
]

type Props = {
  videoRef: RefObject<HTMLVideoElement | null>
  frameRef: { current: PoseFrame | null }
  /** 지금 자세가 맞는지. 테두리 색으로만 알린다. */
  matching: boolean
  status: PoseStatus
}

/**
 * 내 모습이 나오는 작은 창.
 *
 * 화면을 좌우로 뒤집어 거울처럼 보여 준다. 거울이 아니면 '오른손을 들었는데
 * 화면에서는 왼쪽에서 올라가는' 상황이 되어, 자기 몸과 화면을 맞춰 보는 일이
 * 갑자기 어려워진다.
 *
 * 자세가 맞지 않을 때 빨간색이나 X 표시를 쓰지 않는다. 맞았을 때만 초록으로
 * 밝아지고, 아닐 때는 그냥 평소 색이다 — 틀렸다는 신호를 주지 않기로 한 설계를
 * 이 작은 창에서도 지킨다.
 */
export function CameraView({ videoRef, frameRef, matching, status }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    let raf = 0

    const draw = () => {
      raf = requestAnimationFrame(draw)
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (w === 0 || h === 0) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(h * dpr)
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const points = frameRef.current?.screen
      if (!points || points.length === 0) return

      const at = (i: number) => {
        const p = points[i]
        return p ? { x: p.x * w, y: p.y * h, v: p.visibility } : null
      }

      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = matching ? 'rgba(60, 220, 160, 0.95)' : 'rgba(255, 255, 255, 0.9)'
      ctx.lineWidth = 5
      ctx.shadowColor = 'rgba(0,0,0,0.35)'
      ctx.shadowBlur = 4

      for (const [a, b] of BONES) {
        const pa = at(a)
        const pb = at(b)
        if (!pa || !pb || pa.v < 0.4 || pb.v < 0.4) continue
        ctx.beginPath()
        ctx.moveTo(pa.x, pa.y)
        ctx.lineTo(pb.x, pb.y)
        ctx.stroke()
      }

      ctx.shadowBlur = 0
      ctx.fillStyle = matching ? 'rgba(60, 220, 160, 1)' : 'rgba(255, 197, 61, 1)'
      for (const j of JOINTS) {
        const p = at(j)
        if (!p || p.v < 0.4) continue
        ctx.beginPath()
        ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [frameRef, matching])

  return (
    <div
      className="relative overflow-hidden rounded-3xl bg-ink/85 transition-shadow duration-300"
      style={{
        boxShadow: matching
          ? '0 0 0 6px rgba(60, 220, 160, 0.95), 0 10px 24px rgba(0,0,0,0.18)'
          : '0 0 0 6px rgba(255,255,255,0.9), 0 10px 24px rgba(0,0,0,0.14)',
      }}
    >
      {/* 거울 보기: 좌우 반전 */}
      <video
        ref={videoRef}
        playsInline
        muted
        className="block h-full w-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ transform: 'scaleX(-1)' }}
      />

      {status !== 'ready' && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink/80 p-3 text-center text-[17px] font-bold text-white">
          {status === 'loading' && '카메라를 준비하고 있어요'}
          {status === 'denied' && '카메라 없이 해요'}
          {status === 'error' && '카메라 없이 해요'}
          {status === 'idle' && '카메라 꺼짐'}
        </div>
      )}
    </div>
  )
}
