import { useEffect, useState } from 'react'
import './ReactConcepts.css'

function UseEffectPage() {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (!isRunning) return undefined

    const intervalId = window.setInterval(() => {
      setSeconds((value) => value + 1)
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [isRunning])

  return (
    <section className="concept-page">
      <p className="concept-eyebrow">useEffect</p>
      <h1>An interval with cleanup</h1>
      <p>
        The effect starts an interval when the timer runs. Its cleanup clears
        that interval when you pause or leave this page.
      </p>
      <p className="concept-value" aria-live="polite">{seconds} seconds</p>
      <div className="concept-actions">
        <button onClick={() => setIsRunning((running) => !running)} type="button">
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button onClick={() => setSeconds(0)} type="button">Reset</button>
      </div>
      <p>The dependency array is <code>[isRunning]</code>, so the effect restarts when that value changes.</p>
    </section>
  )
}

export default UseEffectPage
