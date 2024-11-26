import { Link } from 'react-router-dom'

function LandingPage() {
  return (
    <div className="container-fluid d-flex flex-column align-items-center justify-content-center vh-100 landing-page">
      <div className="text-center">
        <img src="/logo.png" alt="Haven AI Logo" className="mb-4 logo" />
        <h1 className="brand-name">Haven AI</h1>
        <p className="brand-subtitle mb-5">Your Mental Health Companion</p>
        <Link to="/login" className="btn btn-custom px-4 py-2">
          Get Started
        </Link>
      </div>
    </div>
  )
}

export default LandingPage