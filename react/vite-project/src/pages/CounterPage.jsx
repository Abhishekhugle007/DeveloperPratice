import { useState } from 'react'
import Button from '../components/Button/Button'

function CounterPage() {
  const [count, setCount] = useState(0)

  return (
    <section>
      <p>Practice 02</p>
      <h1>State counter</h1>
      <p aria-live="polite">{count}</p>
      <div>
        <Button text="Decrease" onClickHandler={() => setCount((value) => value - 1)} />
        <Button text="Reset" onClickHandler={() => setCount(0)} />
        <Button text="Increase" onClickHandler={() => setCount((value) => value + 1)} />
      </div>
    </section>
  )
}

export default CounterPage
