export function WarmEarthyPlaceholder() {
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center gap-3"
      style={{ background: '#f5ede0' }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 30% 60%, rgba(210,160,90,0.15) 0%, transparent 70%), radial-gradient(ellipse at 75% 30%, rgba(180,120,70,0.1) 0%, transparent 60%)',
        }}
      />
      <svg style={{ position: 'relative', zIndex: 1, opacity: 0.45 }} width="52" height="52" viewBox="0 0 72 72" fill="none">
        <path d="M28 14 C28 10 32 10 32 6" stroke="#b07840" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M36 16 C36 12 40 12 40 8" stroke="#b07840" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M44 14 C44 10 48 10 48 6" stroke="#b07840" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M14 36 C14 52 58 52 58 36" stroke="#c8956a" strokeWidth="1.5" fill="rgba(180,120,70,0.06)"/>
        <line x1="12" y1="36" x2="60" y2="36" stroke="#c8956a" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M26 52 L24 58 M46 52 L48 58" stroke="#d4a880" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="22" y1="58" x2="50" y2="58" stroke="#d4a880" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="10" y1="24" x2="10" y2="46" stroke="#d4a880" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="8"  y1="24" x2="8"  y2="30" stroke="#d4a880" strokeWidth="1" strokeLinecap="round"/>
        <line x1="12" y1="24" x2="12" y2="30" stroke="#d4a880" strokeWidth="1" strokeLinecap="round"/>
        <line x1="62" y1="24" x2="62" y2="46" stroke="#d4a880" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M62 24 L65 30 L62 32" stroke="#d4a880" strokeWidth="1" strokeLinecap="round" fill="none"/>
      </svg>
      <span
        style={{
          fontFamily: 'var(--font-fraunces), serif',
          fontStyle: 'italic',
          fontWeight: 300,
          color: '#c8a882',
          fontSize: '14px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        No photo
      </span>
    </div>
  )
}
