import { Link, useLocation } from 'react-router-dom'
import './ReactConcepts.css'

function ReceiveDataPage() {
  const { state } = useLocation()
  const message = state?.message

  return (
    <section className="concept-page">
      <p className="concept-eyebrow">Page-to-page data</p>
      <h1>Receiving page</h1>
      {message ? (
        <>
          <p>From: {message.from}</p>
          <blockquote className="concept-quote">{message.text}</blockquote>
        </>
      ) : (
        <p>
          There is no navigation state. Open the sender page first; route state
          is not included in a direct URL or a fresh browser session.
        </p>
      )}
      <Link to="/concepts/send-data">Back to the sender page</Link>
    </section>
  )
}

export default ReceiveDataPage
