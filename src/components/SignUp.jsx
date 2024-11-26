// src/components/SignUp.jsx
import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'

function SignUp() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [passwordError, setPasswordError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    
    console.log('Signup attempt with:', formData)
    setPasswordError('')
    navigate('/chat', { state: { isNewUser: true } })
  }

  const handleMicrosoftSignup = () => {
    // Here you would handle Microsoft authentication
    navigate('/chat', { state: { isNewUser: true } })
  }

  return (
    <div className="container-fluid">
      <button 
        onClick={() => navigate('/')} 
        className="position-absolute back-button m-4"
        aria-label="Go back"
      >
        <i className="bi bi-arrow-left fs-4"></i>
      </button>
      
      <div className="row vh-100">
        <div className="col-md-6 d-flex flex-column justify-content-center p-5">
          <div className="login-form-container">
            <h2 className="mb-4 fw-bold">CREATE ACCOUNT</h2>
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
              <div className="mb-3">
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
                    autoComplete="new-password"
                    required
                    minLength="8"
                  />
                </div>
              </div>
              <div className="mb-4">
                <div className="input-group">
                  <span className="input-group-text bg-light border-0">
                    <i className="bi bi-lock-fill"></i>
                  </span>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="form-control bg-light border-0"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                    minLength="8"
                  />
                </div>
                {passwordError && (
                  <div className="text-danger mt-2 small">
                    <i className="bi bi-exclamation-circle me-1"></i>
                    {passwordError}
                  </div>
                )}
              </div>
              <button type="submit" className="btn btn-custom w-100 mb-3">
                Create Account
              </button>
              <div className="text-center mb-3">Or</div>
              <button 
                type="button" 
                className="btn btn-outline-secondary w-100 mb-3 d-flex align-items-center justify-content-center gap-2"
                onClick={handleMicrosoftSignup}
              >
                <img src="/microsoft-logo.png" alt="Microsoft" width="20" height="20" />
                Sign up with Microsoft
              </button>
              <div className="text-center">
                Already have an account? <Link to="/login">Login</Link>
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

export default SignUp