import { memo, useCallback, useState } from 'react'
import './ReactConcepts.css'

const initialItems = [
  { id: 1, label: 'Stable keys help React match items between renders.' },
  { id: 2, label: 'Props pass data and callbacks to child components.' },
]

const OptimizedListItem = memo(function OptimizedListItem({ item, onRemove }) {
  return (
    <li className="concept-list__row">
      <p>{item.label}</p>
      <button onClick={() => onRemove(item.id)} type="button">Remove</button>
    </li>
  )
})

function KeysPropsPage() {
  const [items, setItems] = useState(initialItems)
  const [nextId, setNextId] = useState(3)
  const [unrelatedCount, setUnrelatedCount] = useState(0)

  const removeItem = useCallback((id) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id))
  }, [])

  function addItem() {
    setItems((currentItems) => [
      ...currentItems,
      { id: nextId, label: `New item ${nextId}: this item has a stable key.` },
    ])
    setNextId((id) => id + 1)
  }

  return (
    <section className="concept-page">
      <p className="concept-eyebrow">Keys and props</p>
      <h1>Give list items stable identities</h1>
      <p>
        A key helps React identify each item when a list changes. This example
        uses each item’s stable ID as its key, then passes the item and a stable
        removal callback to a memoized child through props.
      </p>

      <button onClick={addItem} type="button">Add item</button>
      <button onClick={() => setUnrelatedCount((count) => count + 1)} type="button">
        Update unrelated state ({unrelatedCount})
      </button>
      <ul className="concept-list">
        {items.map((item) => (
          <OptimizedListItem item={item} key={item.id} onRemove={removeItem} />
        ))}
      </ul>
      <p>Because unchanged props are reused, memoized items can skip rendering when unrelated state changes.</p>
      <pre className="concept-code">{`items.map((item) => (
  <OptimizedListItem key={item.id} item={item} onRemove={removeItem} />
))`}</pre>
    </section>
  )
}

export default KeysPropsPage
