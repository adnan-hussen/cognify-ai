// src/components/LandingPage.jsx
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';

function LandingPage() {
    const { instance } = useMsal();

    const handleGetStarted = async () => {
        try {
            // Directly trigger Azure AD B2C login
            await instance.loginRedirect(loginRequest);
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    return (
        <div className="container-fluid d-flex flex-column align-items-center justify-content-center vh-100 landing-page">
            <div className="text-center">
                <img src="/logo.png" alt="Logo" className="mb-4 logo" />
                <h1 className="brand-name">Cognify</h1>
                <p className="brand-subtitle mb-5">Your AI Study Companion</p>
                <button 
                    onClick={handleGetStarted}
                    className="btn btn-custom px-4 py-2"
                >
                    Get Started
                </button>
            </div>
        </div>
    );
}

export default LandingPage;