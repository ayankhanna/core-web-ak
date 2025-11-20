import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { DarkModeProvider } from './contexts/DarkModeContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AuthCallback from './pages/AuthCallback'

function App() {
  return (
    <DarkModeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </Router>
    </DarkModeProvider>
  )
}

export default App
