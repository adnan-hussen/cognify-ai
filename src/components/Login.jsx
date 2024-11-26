// src/components/Login.jsx
import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'

function Login() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Login attempt with:', formData)
    // Here you would handle authentication
    navigate('/chat')
  }

  const handleMicrosoftLogin = () => {
    // Here you would handle Microsoft authentication
    navigate('/chat')
  }

  return (
    <div className="container-fluid">
      <button 
        onClick={() => navigate('/')} 
        className="position-absolute back-button m-4"
        aria-label="Go back"
       style={{width:49}}
      >
        <i className="bi bi-arrow-left fs-4"></i>
      </button>
      
      <div className="row vh-100">
        <div className="col-md-6 d-flex flex-column justify-content-center p-5">
          <div className="login-form-container">
            <h2 className="mb-4 fw-bold">LOGIN</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <div className="input-group">
                  <span className="input-group-text bg-light border-0">
                    <i className="bi bi-envelope"></i>
                  </span>
                  <input
                    type="email"
                    name="email"
                    className="form-control bg-light border-0"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>
              <div className="mb-4">
                <div className="input-group">
                  <span className="input-group-text bg-light border-0">
                    <i className="bi bi-lock"></i>
                  </span>
                  <input
                    type="password"
                    name="password"
                    className="form-control bg-light border-0"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-custom w-100 mb-3">
                Login
              </button>
              <div className="text-center mb-3">Or</div>
              <button 
                type="button" 
                className="btn btn-outline-secondary w-100 mb-3 d-flex align-items-center justify-content-center gap-2"
                onClick={handleMicrosoftLogin}
              >
                <img src="/microsoft-logo.png" alt="Microsoft" width="20" height="20" />
                Sign in with Microsoft
              </button>
              <div className="text-center">
                Don't have an account? <Link to="/signup">Sign up</Link>
              </div>
            </form>
          </div>
        </div>
        <div className="col-md-6 bg-custom d-flex align-items-center justify-content-center">
          <img src="/logo.png" alt="Haven AI Logo" className="logo-large" />
        </div>
      </div>
    </div>
  )
}

export default Login