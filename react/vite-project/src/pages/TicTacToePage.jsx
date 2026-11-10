import { useState } from 'react'
import './TicTacToe.css'

const winningLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

function getWinningLine(squares) {
  for (const line of winningLines) {
    const [first, second, third] = line
    if (squares[first] && squares[first] === squares[second] && squares[first] === squares[third]) {
      return line
    }
  }
  return null
}

function getWinner(squares) {
  const line = getWinningLine(squares)
  return line ? squares[line[0]] : null
}

function TicTacToePage() {
  const [history, setHistory] = useState([Array(9).fill(null)])
  const [currentMove, setCurrentMove] = useState(0)
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 })
  const currentSquares = history[currentMove]
  const winningLine = getWinningLine(currentSquares)
  const winner = winningLine ? currentSquares[winningLine[0]] : null
  const isDraw = !winner && currentSquares.every(Boolean)
  const nextPlayer = currentMove % 2 === 0 ? 'X' : 'O'

  function handleSquareClick(index) {
    if (currentSquares[index] || winner || isDraw) return

    const nextSquares = [...currentSquares]
    nextSquares[index] = nextPlayer
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares]
    setHistory(nextHistory)
    setCurrentMove(nextHistory.length - 1)

    const result = getWinner(nextSquares) ?? (nextSquares.every(Boolean) ? 'draws' : null)
    if (result) {
      setScores((currentScores) => ({
        ...currentScores,
        [result]: currentScores[result] + 1,
      }))
    }
  }

  function startNewGame() {
    setHistory([Array(9).fill(null)])
    setCurrentMove(0)
  }

  function jumpTo(move) {
    setCurrentMove(move)
  }

  let status = `Player ${nextPlayer}'s turn`
  if (winner) status = `Player ${winner} wins!`
  else if (isDraw) status = "It's a draw!"

  return (
    <section className="tic-tac-toe">
      <p className="tic-tac-toe__eyebrow">Practice 03</p>
      <h1 className="tic-tac-toe__title">Tic-Tac-Toe</h1>
      <p className="tic-tac-toe__intro">
        Take turns with a friend on the same device. Review previous moves,
        highlight the winning line, and track your match results.
      </p>

      <div className="tic-tac-toe__layout">
        <div className="tic-tac-toe__board" role="group" aria-label="Tic-Tac-Toe board">
          {currentSquares.map((square, index) => (
            <button
              aria-label={`Square ${index + 1}${square ? `: ${square}` : ', empty'}`}
              className={`tic-tac-toe__square${square ? ` tic-tac-toe__square--${square.toLowerCase()}` : ''}${winningLine?.includes(index) ? ' tic-tac-toe__square--winner' : ''}`}
              disabled={Boolean(square || winner || isDraw)}
              key={index}
              onClick={() => handleSquareClick(index)}
              type="button"
            >
              {square}
            </button>
          ))}
        </div>

        <aside className="tic-tac-toe__info">
          <p className="tic-tac-toe__status" aria-live="polite">{status}</p>
          {winner && (
            <p className="tic-tac-toe__winning-line">
              Winning line: squares {winningLine.map((index) => index + 1).join(', ')}.
            </p>
          )}
          <div className="tic-tac-toe__scoreboard" aria-label="Match score">
            <p><span>Player X</span><strong>{scores.X}</strong></p>
            <p><span>Player O</span><strong>{scores.O}</strong></p>
            <p><span>Draws</span><strong>{scores.draws}</strong></p>
          </div>
          <button
            className="tic-tac-toe__text-button"
            onClick={() => setScores({ X: 0, O: 0, draws: 0 })}
            type="button"
          >
            Reset scores
          </button>
          <ol className="tic-tac-toe__moves">
            {history.map((_, move) => (
              <li key={move}>
                <button
                  className="tic-tac-toe__text-button"
                  disabled={move === currentMove}
                  onClick={() => jumpTo(move)}
                  type="button"
                >
                  {move === 0
                    ? 'Go to game start'
                    : `Go to move #${move} (Player ${move % 2 === 1 ? 'X' : 'O'})`}
                </button>
              </li>
            ))}
          </ol>
          <button className="tic-tac-toe__restart" onClick={startNewGame} type="button">
            {winner || isDraw ? 'Play again' : 'New game'}
          </button>
        </aside>
      </div>
    </section>
  )
}

export default TicTacToePage
