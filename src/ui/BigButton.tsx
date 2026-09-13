import type { ReactNode } from 'react'
import { A11Y } from './tokens'

type Props = {
  children: ReactNode
  onClick: () => void
  /** 버튼 왼쪽 그림. 글자만으로 판단하지 않아도 되게 한다. */
  emoji?: string
  tone?: 'primary' | 'quiet'
  className?: string
  ariaLabel?: string
}

/**
 * 이 앱의 유일한 버튼.
 *
 * 크기·글자 크기·눌렀을 때의 반응을 여기서 한 번만 정해 두고
 * 모든 화면이 그대로 쓴다. 화면마다 "이번엔 조금 작게" 같은 판단이
 * 끼어들 여지를 없애려는 것이다.
 */
export function BigButton({ children, onClick, emoji, tone = 'primary', className = '', ariaLabel }: Props) {
  const palette =
    tone === 'primary'
      ? 'bg-brand text-white shadow-[0_6px_0_0_var(--color-brand-deep)] active:shadow-[0_2px_0_0_var(--color-brand-deep)]'
      : 'bg-surface text-ink border-4 border-brand-soft shadow-[0_6px_0_0_var(--color-brand-soft)] active:shadow-[0_2px_0_0_var(--color-brand-soft)]'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={{ minHeight: A11Y.MIN_TOUCH_PX }}
      className={`flex items-center justify-center gap-4 rounded-[28px] px-8 text-[30px] font-bold transition-transform duration-150 active:translate-y-[4px] ${palette} ${className}`}
    >
      {emoji && (
        <span aria-hidden className="text-[38px] leading-none">
          {emoji}
        </span>
      )}
      {/* 글자는 절대 줄바꿈하지 않는다. 두 줄로 쪼개진 짧은 단어는 읽기 어렵다. */}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  )
}
