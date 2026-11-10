import { useEffect, useState } from 'react'
import './ReactConcepts.css'

function getInitialTheme() {
  return window.localStorage.getItem('react-practice-theme') ?? 'light'
}

function DarkModePage() {
  const [theme, setTheme] = useState(getInitialTheme)
  const isDark = theme === 'dark'

  useEffect(() => {
    window.localStorage.setItem('react-practice-theme', theme)
    document.documentElement.dataset.theme = theme
  }, [theme])

  return (
    <section className={`concept-page theme-demo${isDark ? ' theme-demo--dark' : ''}`}>
      <p className="concept-eyebrow">Theme state</p>
      <h1>Dark mode</h1>
      <p>
        The selected theme is React state. An effect saves it to localStorage
        and sets a theme attribute on the document.
      </p>
      <button
        aria-pressed={isDark}
        onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
        type="button"
      >
        Switch to {isDark ? 'light' : 'dark'} mode
      </button>
      <p>Current theme: <strong>{theme}</strong></p>
    </section>
  )
}

export default DarkModePage
