import { useEffect, useState } from 'react'

export function useCountUp(target: number, duration = 1500, shouldStart = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!shouldStart) return
    let start = 0
    const steps = 60
    const increment = target / steps
    const interval = duration / steps
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, interval)
    return () => clearInterval(timer)
  }, [target, duration, shouldStart])
  return count
}
