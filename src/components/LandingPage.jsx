// LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';

function LandingPage() {
    const { instance } = useMsal();
    const [currentPage, setCurrentPage] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [theme, setTheme] = useState('light');

    // Initialize theme from localStorage or system preference
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setTheme(prefersDark ? 'dark' : 'light');
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const pages = [
        {
            title: "Study Smarter",
            subtitle: "AI Tutor for ADHD Minds",
            description: "Learn in a way that works with your brain, not against it.",
            icon: "bi-brain"
        },
        {
            title: "Smart Learning",
            subtitle: "Bite-sized Content",
            description: "Complex topics broken down into manageable, focused chunks.",
            icon: "bi-grid-3x3"
        },
        {
            title: "Stay Focused",
            subtitle: "Active Learning",
            description: "Interactive elements and timely reminders keep you engaged.",
            icon: "bi-lightning-charge"
        },
        {
            title: "Your Style",
            subtitle: "Personalized Teaching",
            description: "Learning adapted to your unique needs and preferences.",
            icon: "bi-person-gear"
        }
    ];

    const handleNext = () => {
        if (currentPage < pages.length - 1 && !isAnimating) {
            setIsAnimating(true);
            setCurrentPage(prev => prev + 1);
            setTimeout(() => setIsAnimating(false), 500);
        }
    };

    const handlePrevious = () => {
        if (currentPage > 0 && !isAnimating) {
            setIsAnimating(true);
            setCurrentPage(prev => prev - 1);
            setTimeout(() => setIsAnimating(false), 500);
        }
    };

    const handleGetStarted = async () => {
        try {
            document.querySelector('.btn-start').classList.add('loading');
            await instance.loginRedirect(loginRequest);
        } catch (error) {
            console.error('Login failed:', error);
            document.querySelector('.btn-start').classList.remove('loading');
        }
    };

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrevious();
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentPage]);

    return (
        <div className="onboarding-wrapper">
            <button 
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
                {theme === 'light' ? (
                    <i className="bi bi-moon-stars-fill"></i>
                ) : (
                    <i className="bi bi-sun-fill"></i>
                )}
            </button>

            <div className="background-animation">
                <div className="gradient-blob blob-1"></div>
                <div className="gradient-blob blob-2"></div>
                <div className="gradient-blob blob-3"></div>
            </div>

            <div className="onboarding-container">
                <div className="progress-track">
                    {pages.map((_, index) => (
                        <div 
                            key={index} 
                            className={`progress-dot ${index === currentPage ? 'active' : ''} 
                                      ${index < currentPage ? 'completed' : ''}`}
                            onClick={() => !isAnimating && setCurrentPage(index)}
                        >
                            <div className="dot-content">
                                <i className={`bi ${pages[index].icon}`}></i>
                            </div>
                            <div className="dot-connector"></div>
                        </div>
                    ))}
                </div>

                <div className={`onboarding-content ${isAnimating ? 'animating' : ''}`}>
                    <img 
                        src="/logo.png" 
                        alt="Cognify Logo" 
                        className="logo" 
                    />
                    
                    <div className="content-section">
                        <div className="page-icon">
                            <i className={`bi ${pages[currentPage].icon}`}></i>
                        </div>
                        
                        <h1 className="page-title">
                            {pages[currentPage].title}
                        </h1>
                        <h2 className="page-subtitle">
                            {pages[currentPage].subtitle}
                        </h2>
                        <p className="page-description">
                            {pages[currentPage].description}
                        </p>
                    </div>

                    <div className="navigation-section">
                        <div className="nav-buttons">
                            {currentPage > 0 && (
                                <button 
                                    className="btn-nav btn-previous"
                                    onClick={handlePrevious}
                                >
                                    <i className="bi bi-arrow-left"></i>
                                    <span>Back</span>
                                </button>
                            )}

                            {currentPage < pages.length - 1 ? (
                                <button 
                                    className="btn-nav btn-next"
                                    onClick={handleNext}
                                >
                                    <span>Continue</span>
                                    <i className="bi bi-arrow-right"></i>
                                </button>
                            ) : (
                                <button 
                                    className="btn-nav btn-start"
                                    onClick={handleGetStarted}
                                >
                                    <span>Let's Begin</span>
                                    <i className="bi bi-rocket-takeoff"></i>
                                </button>
                            )}
                        </div>
                        
                        <div className="page-indicator">
                            {currentPage + 1} / {pages.length}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LandingPage;