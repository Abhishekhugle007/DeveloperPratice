import { useEffect, useState } from 'react'
import './ReactConcepts.css'

function RenderedChild() {
  useEffect(() => {
    console.log('RenderedChild committed after a render')
  })

  return <p>The child ran as part of the parent’s render.</p>
}

function RerenderPage() {
  const [count, setCount] = useState(0)

  return (
    <section className="concept-page">
      <p className="concept-eyebrow">Rendering</p>
      <h1>Understanding rerenders</h1>
      <p>
        Updating this page’s state rerenders its function component and, by
        default, its child. Check the browser console to see the child effect.
      </p>
      <p className="concept-value" aria-live="polite">{count}</p>
      <button onClick={() => setCount((value) => value + 1)} type="button">
        Update parent state
      </button>
      <RenderedChild />
      <p>A rerender updates the UI; it does not mean the whole page reloads.</p>
    </section>
  )
}

export default RerenderPage
