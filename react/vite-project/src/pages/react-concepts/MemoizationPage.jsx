import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import './ReactConcepts.css'

const MemoizedChild = memo(function MemoizedChild({ label, onAction }) {
  useEffect(() => {
    console.log('MemoizedChild committed after a render')
  })
  return (
    <div className="concept-card">
      <p>{label}</p>
      <button onClick={onAction} type="button">Update child state</button>
    </div>
  )
})

function MemoizationPage() {
  const [unrelatedCount, setUnrelatedCount] = useState(0)
  const [childCount, setChildCount] = useState(0)
  const expensiveValue = useMemo(() => {
    return Array.from({ length: 1000 }, (_, index) => index + 1).reduce((sum, value) => sum + value, 0)
  }, [])
  const updateChild = useCallback(() => {
    setChildCount((value) => value + 1)
  }, [])

  return (
    <section className="concept-page">
      <p className="concept-eyebrow">Memoization</p>
      <h1>Reuse stable values and callbacks</h1>
      <p>
        React.memo can skip a child render when its props are unchanged.
        useMemo caches a calculated value, and useCallback keeps a callback
        stable between renders.
      </p>
      <p>Unrelated parent state: <strong>{unrelatedCount}</strong></p>
      <button onClick={() => setUnrelatedCount((value) => value + 1)} type="button">
        Rerender parent only
      </button>
      <p>Memoized sum: <strong>{expensiveValue}</strong></p>
      <MemoizedChild label={`Child state: ${childCount}`} onAction={updateChild} />
      <p>Open the console: the child logs when its props change, not on unrelated parent updates.</p>
    </section>
  )
}

export default MemoizationPage
