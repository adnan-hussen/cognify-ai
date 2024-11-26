// src/components/MenuModal.jsx
import { useNavigate } from 'react-router-dom'

function MenuModal({ onClose, onUpdateInfo }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    // Add any logout logic here (clearing session, etc.)
    navigate('/')
  }

  return (
    <div className="menu-modal-overlay" onClick={onClose}>
      <div className="menu-modal-content" onClick={e => e.stopPropagation()}>
        <div className="menu-items">
          <button 
            className="menu-item" 
            onClick={onUpdateInfo}
          >
            <i className="bi bi-pencil-square me-2"></i>
            Update Personal Assessment
          </button>
          <button className="menu-item">
            <i className="bi bi-star-fill me-2"></i>
            Get Premium
          </button>
          <button className="menu-item text-danger">
            <i className="bi bi-trash-fill me-2"></i>
            Delete Account
          </button>
          <div className="menu-divider"></div>
          <button 
            className="menu-item"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default MenuModal