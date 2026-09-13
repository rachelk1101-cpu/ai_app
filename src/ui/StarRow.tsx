type Props = {
  total: number
  filled: number
  /** 칸 크기(px). 좁은 화면에서는 줄여 쓴다. */
  size?: number
  label?: string
}

/**
 * 남은 횟수를 별로 보여 준다.
 *
 * "3 / 6" 같은 숫자 대신 채워지는 별을 쓰는 이유는, 숫자를 읽고
 * 나누어 해석하는 단계 없이 한눈에 '얼마나 남았는지'가 보이기 때문이다.
 * 스크린 리더에게는 aria-label 로 숫자를 그대로 전달한다.
 */
export function StarRow({ total, filled, size = 44, label }: Props) {
  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="img"
      aria-label={label ?? `${total}번 중 ${filled}번 했어요`}
    >
      {Array.from({ length: total }, (_, i) => {
        const done = i < filled
        return (
          <span
            // key 에 상태를 섞으면 방금 채워진 별만 노드가 새로 만들어져
            // 톡 튀어오르는 애니메이션이 그 별에서만 한 번 재생된다.
            key={`${i}-${done}`}
            aria-hidden
            className={done ? 'animate-pop-in' : ''}
            style={{
              fontSize: size,
              lineHeight: 1,
              filter: done ? 'none' : 'grayscale(1)',
              opacity: done ? 1 : 0.32,
            }}
          >
            ⭐
          </span>
        )
      })}
    </div>
  )
}
