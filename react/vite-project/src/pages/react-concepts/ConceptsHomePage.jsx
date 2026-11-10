import { Link } from 'react-router-dom'
import './ReactConcepts.css'

const concepts = [
  { path: 'use-effect', title: 'useEffect and cleanup', description: 'Start and stop an interval with an effect.' },
  { path: 'send-data', title: 'Pass data between pages', description: 'Send navigation state to another route.' },
  { path: 'dark-mode', title: 'Dark mode', description: 'Toggle a theme and remember it in localStorage.' },
  { path: 'reducer', title: 'Reducers and actions', description: 'Update related state with useReducer.' },
  { path: 'rerenders', title: 'Understanding rerenders', description: 'See how state changes render a component tree.' },
  { path: 'memoization', title: 'Memoization', description: 'Try React.memo, useMemo, and useCallback.' },
  { path: 'form-validation', title: 'Form validation', description: 'Validate controlled form fields and show accessible errors.' },
]

function ConceptsHomePage() {
  return (
    <section className="concept-page">
      <p className="concept-eyebrow">React practice</p>
      <h1>React concepts</h1>
      <p>Each topic has a small, runnable example in its own file.</p>
      <ul className="concept-list">
        {concepts.map((concept) => (
          <li key={concept.path}>
            <Link to={`/concepts/${concept.path}`}>{concept.title}</Link>
            <p>{concept.description}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default ConceptsHomePage
