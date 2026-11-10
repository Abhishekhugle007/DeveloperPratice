import { useReducer } from 'react'
import { counterReducer } from './counterReducer'
import './ReactConcepts.css'

function ReducerPage() {
  const [count, dispatch] = useReducer(counterReducer, 0)

  return (
    <section className="concept-page">
      <p className="concept-eyebrow">useReducer</p>
      <h1>Reducers and actions</h1>
      <p>
        An action describes what happened; the reducer receives the current
        state and action, then returns the next state.
      </p>
      <p className="concept-value" aria-live="polite">{count}</p>
      <div className="concept-actions">
        <button onClick={() => dispatch({ type: 'decrement' })} type="button">Decrement</button>
        <button onClick={() => dispatch({ type: 'reset' })} type="button">Reset</button>
        <button onClick={() => dispatch({ type: 'increment' })} type="button">Increment</button>
      </div>
      <pre className="concept-code">{`dispatch({ type: 'increment' })`}</pre>
    </section>
  )
}

export default ReducerPage
