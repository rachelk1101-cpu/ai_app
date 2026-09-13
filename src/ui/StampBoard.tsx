import { SESSIONS_PER_WEEK, TOTAL_SESSIONS } from '../data/program'

type Props = {
  /** 채워진 칸 수. */
  done: number
  /** 방금 찍힌 칸(0부터). 이 칸만 톡 튀어오른다. */
  justStamped?: number
  size?: 'sm' | 'lg'
}

/**
 * 한 달 도장판.
 *
 * 한 줄이 한 주이고, 한 칸이 한 회차다. 날짜가 아니라 회차라서
 * 며칠을 쉬든 빈칸이 생기지 않는다 — 오늘 하면 다음 칸이 채워질 뿐이다.
 *
 * 못 한 칸에는 X 도 빨간색도 없다. 그냥 아직 비어 있는 자리다.
 * "연속 몇 일"을 세지 않는 것도 같은 이유다. 하루 빠졌다고 쌓아 온 것이
 * 0 으로 돌아가는 경험은 그 자리에서 앱을 그만두게 만든다.
 */
export function StampBoard({ done, justStamped, size = 'lg' }: Props) {
  const cell = size === 'lg' ? 'text-[26px]' : 'text-[15px]'
  const gap = size === 'lg' ? 'gap-2' : 'gap-1'

  return (
    <div
      className={`grid w-full grid-cols-7 ${gap}`}
      role="img"
      aria-label={`${TOTAL_SESSIONS}번 중 ${done}번 했어요`}
    >
      {Array.from({ length: TOTAL_SESSIONS }, (_, i) => {
        const filled = i < done
        const isNew = justStamped === i
        const isNext = i === done

        return (
          <div
            // 채워지는 순간 노드를 새로 만들어 그 칸에서만 애니메이션이 돈다.
            key={`${i}-${filled}`}
            aria-hidden
            className={[
              'flex aspect-square items-center justify-center rounded-full border-2',
              cell,
              filled ? 'border-brand bg-brand-soft' : 'border-brand-soft/70 bg-surface',
              // 다음에 할 칸만 살짝 표시해 둔다. 어디를 이어서 하는지 보이도록.
              isNext ? 'border-dashed border-brand' : '',
              isNew ? 'animate-pop-in' : '',
            ].join(' ')}
          >
            {filled && <span>⭐</span>}
          </div>
        )
      })}
    </div>
  )
}

/** 주차 구분선이 필요할 때 쓰는 한 줄 요약. */
export function weekLabel(session: number): string {
  return `${Math.floor(session / SESSIONS_PER_WEEK) + 1}주차`
}
