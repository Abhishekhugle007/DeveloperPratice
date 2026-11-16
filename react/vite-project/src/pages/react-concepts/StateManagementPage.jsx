import { useState } from 'react'
import './ReactConcepts.css'

function StateManagementPage() {
  const [count, setCount] = useState(0)
  const [name, setName] = useState('')

  function updateCount(amount) {
    setCount((currentCount) => currentCount + amount)
  }

  return (
    <section className="concept-page">
      <p className="concept-eyebrow">State management</p>
      <h1>Keep UI in sync with state</h1>
      <p>
        State stores values that change over time. When you update state with a
        setter, React renders the component again with the latest values.
      </p>

      <div className="concept-card">
        <p className="concept-value" aria-live="polite">{count}</p>
        <button onClick={() => updateCount(-1)} type="button">Decrease</button>
        <button onClick={() => updateCount(1)} type="button">Increase</button>
        <button onClick={() => setCount(0)} type="button">Reset</button>
      </div>

      <div className="concept-form__field">
        <label htmlFor="state-name">Your name</label>
        <input
          id="state-name"
          onChange={(event) => setName(event.target.value)}
          placeholder="Type to update the preview"
          value={name}
        />
      </div>
      <p aria-live="polite">{name ? `Hello, ${name}!` : 'Enter a name to see state update the UI.'}</p>
      <pre className="concept-code">{`setCount((currentCount) => currentCount + 1)`}</pre>
    </section>
  )
}

export default StateManagementPage
