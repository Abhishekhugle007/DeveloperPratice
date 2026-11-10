import { useState } from 'react'
import './ReactConcepts.css'

const initialValues = {
  name: '',
  email: '',
  password: '',
}

function validate(values) {
  const errors = {}

  if (!values.name.trim()) {
    errors.name = 'Enter your name.'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (values.password.length < 8) {
    errors.password = 'Use at least 8 characters.'
  }

  return errors
}

function ValidationPage() {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setValues((currentValues) => ({ ...currentValues, [name]: value }))
    setSubmitted(false)
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    setSubmitted(Object.keys(nextErrors).length === 0)
  }

  return (
    <section className="concept-page">
      <p className="concept-eyebrow">Forms</p>
      <h1>Form validation</h1>
      <p>
        This controlled form validates each value on submit and connects
        inline errors to their fields for assistive technology.
      </p>

      <form className="concept-form" noValidate onSubmit={handleSubmit}>
        <div className="concept-form__field">
          <label htmlFor="validation-name">Name</label>
          <input
            autoComplete="name"
            aria-describedby={errors.name ? 'validation-name-error' : undefined}
            aria-invalid={Boolean(errors.name)}
            id="validation-name"
            name="name"
            onChange={handleChange}
            value={values.name}
          />
          {errors.name && <p className="concept-form__error" id="validation-name-error">{errors.name}</p>}
        </div>

        <div className="concept-form__field">
          <label htmlFor="validation-email">Email</label>
          <input
            autoComplete="email"
            aria-describedby={errors.email ? 'validation-email-error' : undefined}
            aria-invalid={Boolean(errors.email)}
            id="validation-email"
            name="email"
            onChange={handleChange}
            type="email"
            value={values.email}
          />
          {errors.email && <p className="concept-form__error" id="validation-email-error">{errors.email}</p>}
        </div>

        <div className="concept-form__field">
          <label htmlFor="validation-password">Password</label>
          <input
            autoComplete="new-password"
            aria-describedby={errors.password ? 'validation-password-error' : undefined}
            aria-invalid={Boolean(errors.password)}
            id="validation-password"
            name="password"
            onChange={handleChange}
            type="password"
            value={values.password}
          />
          {errors.password && <p className="concept-form__error" id="validation-password-error">{errors.password}</p>}
        </div>

        <button type="submit">Validate form</button>
        {submitted && <p className="concept-form__success" role="status">Form submitted successfully.</p>}
      </form>
    </section>
  )
}

export default ValidationPage
