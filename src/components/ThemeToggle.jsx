// src/components/ThemeToggle.jsx
import React from 'react';
import { useTheme } from '../context/ThemeContext';

function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
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
    );
}

export default ThemeToggle;