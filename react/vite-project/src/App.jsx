import { NavLink, Route, Routes } from 'react-router-dom'
import CounterPage from './pages/CounterPage'
import HomePage from './pages/HomePage'
import RenderingListPage from './pages/RenderingListPage'
import TicTacToePage from './pages/TicTacToePage'
import ConceptsHomePage from './pages/react-concepts/ConceptsHomePage'
import DarkModePage from './pages/react-concepts/DarkModePage'
import DataTransferPage from './pages/react-concepts/DataTransferPage'
import MemoizationPage from './pages/react-concepts/MemoizationPage'
import ReceiveDataPage from './pages/react-concepts/ReceiveDataPage'
import ReducerPage from './pages/react-concepts/ReducerPage'
import RerenderPage from './pages/react-concepts/RerenderPage'
import UseEffectPage from './pages/react-concepts/UseEffectPage'
import ValidationPage from './pages/react-concepts/ValidationPage'
import './App.css'

function App() {
  return (
    <div>
      <header className="site-header">
        <NavLink className="site-brand" to="/">
          React Practice
        </NavLink>
        <nav className="site-nav" aria-label="Main navigation">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/rendering-list">Rendering Lists</NavLink>
          <NavLink to="/tic-tac-toe">Tic-Tac-Toe</NavLink>
          <NavLink to="/counter">Counter</NavLink>
          <NavLink to="/concepts">React concepts</NavLink>
        </nav>
      </header>

      <main className="site-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rendering-list" element={<RenderingListPage />} />
          <Route path="/tic-tac-toe" element={<TicTacToePage />} />
          <Route path="/counter" element={<CounterPage />} />
          <Route path="/concepts" element={<ConceptsHomePage />} />
          <Route path="/concepts/use-effect" element={<UseEffectPage />} />
          <Route path="/concepts/send-data" element={<DataTransferPage />} />
          <Route path="/concepts/receive-data" element={<ReceiveDataPage />} />
          <Route path="/concepts/dark-mode" element={<DarkModePage />} />
          <Route path="/concepts/reducer" element={<ReducerPage />} />
          <Route path="/concepts/rerenders" element={<RerenderPage />} />
          <Route path="/concepts/memoization" element={<MemoizationPage />} />
          <Route path="/concepts/form-validation" element={<ValidationPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
