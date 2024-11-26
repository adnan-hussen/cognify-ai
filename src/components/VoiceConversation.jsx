// src/components/VoiceConversation.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function VoiceConversation() {
  const navigate = useNavigate()
  const [isMuted, setIsMuted] = useState(false)
  const [isActive, setIsActive] = useState(true)

  // Simulate wave animation timing
  const [waveHeights, setWaveHeights] = useState(Array(30).fill(10))

  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      setWaveHeights(prev => 
        prev.map(() => isMuted ? 5 : Math.random() * 40 + 10)
      )
    }, 100)

    return () => clearInterval(interval)
  }, [isActive, isMuted])

  const handleStop = () => {
    setIsActive(false)
    // Add a small delay before navigation for better UX
    setTimeout(() => navigate('/chat'), 500)
  }

  return (
    <div className="voice-conversation-container">
      <button 
        className="back-button m-4"
        onClick={handleStop}
        aria-label="Stop conversation"
      >
        <i className="bi bi-x-lg"></i>
      </button>

      <div className="voice-content">
        <h2 className="text-center mb-5">I'm listening...</h2>
        
        <div className="wave-container">
          {waveHeights.map((height, index) => (
            <div
              key={index}
              className="wave-bar"
              style={{
                height: `${height}px`,
                opacity: isActive ? 1 : 0.5,
                transition: 'height 0.1s ease'
              }}
            />
          ))}
        </div>

        <div className="voice-controls mt-5">
          <button 
            className={`control-button ${isMuted ? 'active' : ''}`}
            onClick={() => setIsMuted(!isMuted)}
          >
            <i className={`bi ${isMuted ? 'bi-mic-mute-fill' : 'bi-mic-fill'}`}></i>
          </button>
          <button 
            className="control-button stop-button ms-4"
            onClick={handleStop}
          >
            <i className="bi bi-stop-fill"></i>
          </button>
        </div>
      </div>
    </div>
  )
}

export default VoiceConversation