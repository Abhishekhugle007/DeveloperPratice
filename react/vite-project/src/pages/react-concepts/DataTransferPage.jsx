import { Link } from 'react-router-dom'
import './ReactConcepts.css'

const message = {
  from: 'The sender page',
  text: 'This message arrived through React Router navigation state.',
}

function DataTransferPage() {
  return (
    <section className="concept-page">
      <p className="concept-eyebrow">Page-to-page data</p>
      <h1>Send data to another page</h1>
      <p>The next route receives this object through the link’s <code>state</code> property.</p>
      <pre className="concept-code">{JSON.stringify(message, null, 2)}</pre>
      <Link
        className="concept-button"
        to="/concepts/receive-data"
        state={{ message }}
      >
        Open the receiving page
      </Link>
    </section>
  )
}

export default DataTransferPage
