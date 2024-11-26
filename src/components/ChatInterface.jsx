import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import InitialSurvey from './InitialSurvey'
import MenuModal from './MenuModal'
import { useNavigate } from 'react-router-dom'

function ChatInterface() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showSurvey, setShowSurvey] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  
  useEffect(() => {
    if (location.state?.isNewUser === true) {
      setShowSurvey(true)
    }
  }, [location])

  const handleUpdateInfo = () => {
    setShowMenu(false)
    setShowSurvey(true)
  }

  return (
    <div className="container-fluid p-0">
      <div className="chat-container">
        <button 
          className="menu-button"
          onClick={() => setShowMenu(true)}
          aria-label="Menu"
        >
          <i className="bi bi-list"></i>
        </button>

        <div className="chat-content d-flex flex-column">
          <h1 className="gradient-text text-center mb-auto">Haven AI</h1>
        </div>
        
        <div className="chat-input-container">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Type a Message or Start a Voice Conversation"
            />
            <button className="btn send-btn">
              <i className="bi bi-send-fill"></i>
            </button>
            
            <button 
      className="btn voice-btn"
      onClick={() => navigate('/voice')}
    >
      <i className="bi bi-mic-fill"></i>
    </button>

          </div>
        </div>

        {showMenu && (
          <MenuModal 
            onClose={() => setShowMenu(false)}
            onUpdateInfo={handleUpdateInfo}
          />
        )}

        {showSurvey && (
          <InitialSurvey onClose={() => setShowSurvey(false)} />
        )}
      </div>
    </div>
  )
}

export default ChatInterface