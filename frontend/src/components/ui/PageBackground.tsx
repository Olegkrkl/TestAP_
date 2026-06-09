/** Decorative mesh background — fixed to viewport so it works on mobile scroll too. */
export default function PageBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden -z-10"
      aria-hidden
    >
      {/* Light theme orbs */}
      <div
        className="absolute rounded-full blur-[70px] sm:blur-[90px] opacity-70 dark:opacity-0
          w-[min(100vw,420px)] h-[min(100vw,420px)] sm:w-[520px] sm:h-[520px]"
        style={{
          background: 'radial-gradient(circle, rgba(167,139,250,0.55) 0%, transparent 70%)',
          top: '-5%',
          right: '-15%',
          animation: 'meshDrift 16s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full blur-[60px] sm:blur-[80px] opacity-60 dark:opacity-0
          w-[min(90vw,360px)] h-[min(90vw,360px)] sm:w-[440px] sm:h-[440px]"
        style={{
          background: 'radial-gradient(circle, rgba(196,181,253,0.5) 0%, transparent 70%)',
          bottom: '-8%',
          left: '-20%',
          animation: 'meshDrift 20s ease-in-out infinite reverse',
        }}
      />

      {/* Dark theme orbs — slightly stronger on small screens */}
      <div
        className="absolute rounded-full blur-[80px] sm:blur-[100px]
          opacity-0 dark:opacity-[0.65] sm:dark:opacity-[0.55]
          w-[min(110vw,480px)] h-[min(110vw,480px)] sm:w-[640px] sm:h-[640px]"
        style={{
          background: 'radial-gradient(circle, rgba(124,58,237,0.75) 0%, transparent 68%)',
          top: '-8%',
          right: '-20%',
          animation: 'meshDrift 14s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full blur-[70px] sm:blur-[90px]
          opacity-0 dark:opacity-[0.55] sm:dark:opacity-[0.45]
          w-[min(100vw,400px)] h-[min(100vw,400px)] sm:w-[520px] sm:h-[520px]"
        style={{
          background: 'radial-gradient(circle, rgba(147,51,234,0.65) 0%, transparent 70%)',
          bottom: '-10%',
          left: '-25%',
          animation: 'meshDrift 18s ease-in-out infinite reverse',
        }}
      />
      <div
        className="absolute rounded-full blur-[55px] sm:blur-[70px]
          opacity-0 dark:opacity-[0.4] sm:dark:opacity-[0.3]
          w-[min(80vw,320px)] h-[min(80vw,320px)] sm:w-[380px] sm:h-[380px]"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 70%)',
          top: '40%',
          left: '10%',
          animation: 'meshDrift 12s ease-in-out infinite 2s',
        }}
      />
    </div>
  )
}
