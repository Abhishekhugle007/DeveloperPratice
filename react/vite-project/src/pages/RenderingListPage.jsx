const topics = [
  { id: 'router', title: 'React Router', description: 'Move between pages without a full reload.' },
  { id: 'lists', title: 'Rendering lists', description: 'Use map() and stable keys to render data.' },
  { id: 'state', title: 'State and turns', description: 'Update the board as players take turns.' },
  { id: 'winner', title: 'Finishing the game', description: 'Detect a winner or a draw and stop play.' },
]

function RenderingListPage() {
  return (
    <section>
      <p>Practice 01</p>
      <h1>Rendering lists</h1>
      <p>
        This list is created from an array with <code>map()</code>. Each item
        has a stable key so React can track it.
      </p>
      <ul>
        {topics.map((topic) => (
          <li key={topic.id}>
            <h2>{topic.title}</h2>
            <p>{topic.description}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default RenderingListPage
