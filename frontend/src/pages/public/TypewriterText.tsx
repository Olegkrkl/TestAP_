import { useEffect, useState } from 'react'

function useTypewriter(phrases: string[], typingSpeed = 50, pauseMs = 2000) {
  const [display, setDisplay] = useState('')
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = phrases[phraseIdx]

    if (!deleting && charIdx <= current.length) {
      const timer = setTimeout(() => {
        setDisplay(current.slice(0, charIdx))
        if (charIdx === current.length) {
          setTimeout(() => setDeleting(true), pauseMs)
        } else {
          setCharIdx(c => c + 1)
        }
      }, typingSpeed)
      return () => clearTimeout(timer)
    }

    if (deleting && charIdx >= 0) {
      const timer = setTimeout(() => {
        setDisplay(current.slice(0, charIdx))
        if (charIdx === 0) {
          setDeleting(false)
          setPhraseIdx(i => (i + 1) % phrases.length)
        } else {
          setCharIdx(c => c - 1)
        }
      }, typingSpeed / 2)
      return () => clearTimeout(timer)
    }
  }, [charIdx, deleting, phraseIdx, phrases, typingSpeed, pauseMs])

  return display
}

interface Props {
  phrases: string[]
  className?: string
}

export default function TypewriterText({ phrases, className = '' }: Props) {
  const text = useTypewriter(phrases)

  return (
    <span className={className}>
      {text}
      <span className="inline-block w-0.5 h-[1.1em] bg-white/60 ml-0.5 align-middle animate-pulse" />
    </span>
  )
}
