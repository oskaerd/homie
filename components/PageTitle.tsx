export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1
      style={{
        fontFamily: 'var(--font-space-mono), monospace',
        color: '#e0c4ff',
        textShadow: '3px 3px 0 #c026d3, 6px 6px 0 #7e1ba0',
        letterSpacing: '-0.5px',
        lineHeight: 1,
      }}
      className="text-3xl font-bold"
    >
      {children}
    </h1>
  )
}
