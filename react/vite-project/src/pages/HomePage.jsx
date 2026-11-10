import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <section className="home-page">
      <p className="home-page__eyebrow">Learn by building</p>
      <h1>React practice</h1>
      <p className="home-page__intro">
        Explore client-side routing, render data with lists, and play a
        turn-based Tic-Tac-Toe game. You can also explore focused examples
        of common React concepts.
      </p>
      <div className="home-page__links">
        <Link to="/rendering-list">Explore rendering lists</Link>
        <Link to="/tic-tac-toe">Play Tic-Tac-Toe</Link>
        <Link to="/concepts">Explore React concepts</Link>
      </div>
    </section>
  )
}

export default HomePage
