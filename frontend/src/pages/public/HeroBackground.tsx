export default function HeroBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-[80px] opacity-40"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)',
          top: '-10%',
          right: '-5%',
          animation: 'meshDrift 14s ease-in-out infinite',
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-[70px] opacity-35"
        style={{
          background: 'radial-gradient(circle, rgba(147,51,234,0.45) 0%, transparent 70%)',
          bottom: '-15%',
          left: '-10%',
          animation: 'meshDrift 18s ease-in-out infinite reverse',
        }}
      />
      <div
        className="absolute w-[350px] h-[350px] rounded-full blur-[60px] opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(16,185,129,0.35) 0%, transparent 70%)',
          top: '40%',
          left: '35%',
          animation: 'meshDrift 11s ease-in-out infinite 2s',
        }}
      />
      <div
        className="absolute w-[280px] h-[280px] rounded-full blur-[50px] opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(167,139,250,0.4) 0%, transparent 70%)',
          top: '20%',
          left: '10%',
          animation: 'meshDrift 16s ease-in-out infinite 1s',
        }}
      />
    </div>
  )
}
