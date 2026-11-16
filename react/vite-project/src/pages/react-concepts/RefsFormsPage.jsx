import { useRef, useState } from 'react'
import './ReactConcepts.css'

function RefsFormsPage() {
  const nameInputRef = useRef(null)
  const [submittedName, setSubmittedName] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = formData.get('name')

    if (typeof name === 'string') {
      setSubmittedName(name.trim())
      event.currentTarget.reset()
    }
  }

  return (
    <section className="concept-page">
      <p className="concept-eyebrow">Refs and forms</p>
      <h1>Use refs for DOM interactions</h1>
      <p>
        A ref keeps a value between renders without triggering a render itself.
        Here, it points to the input so the button can focus it. The form uses
        the browser’s FormData API to read its uncontrolled input on submit.
      </p>

      <button onClick={() => nameInputRef.current?.focus()} type="button">
        Focus name field
      </button>
      <form className="concept-form" onSubmit={handleSubmit}>
        <div className="concept-form__field">
          <label htmlFor="ref-form-name">Name</label>
          <input autoComplete="name" id="ref-form-name" name="name" ref={nameInputRef} required />
        </div>
        <button type="submit">Submit</button>
      </form>
      {submittedName && (
        <p className="concept-form__result" role="status">
          Thanks, {submittedName}. The form value was read on submit.
        </p>
      )}
      <pre className="concept-code">{`const nameInputRef = useRef(null)
nameInputRef.current?.focus()`}</pre>
    </section>
  )
}

export default RefsFormsPage
