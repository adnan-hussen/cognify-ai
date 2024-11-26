// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import Login from './components/Login'
import SignUp from './components/SignUp'
import ChatInterface from './components/ChatInterface'
import VoiceConversation from './components/VoiceConversation'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/chat" element={<ChatInterface />} />
        <Route path="/voice" element={<VoiceConversation />} />
      </Routes>
    </Router>
  )
}

export default App