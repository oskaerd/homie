import { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function GradientButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-white transition-all disabled:opacity-50',
        className
      )}
      style={{
        background: 'linear-gradient(110deg, #f472b6 0%, #a855f7 45%, #60a5fa 100%)',
        boxShadow: '0 0 12px rgba(168,85,247,0.45)',
        ...props.style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 0 20px rgba(168,85,247,0.7)'
        e.currentTarget.style.filter = 'brightness(1.1)'
        props.onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 0 12px rgba(168,85,247,0.45)'
        e.currentTarget.style.filter = ''
        props.onMouseLeave?.(e)
      }}
    >
      {children}
    </button>
  )
}
