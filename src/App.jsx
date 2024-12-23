// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';
// Components
import LandingPage from './components/LandingPage';
import FileUploadInterface from './components/FileUploadInterface';


function App() {
    return (
        <ThemeProvider>
            <Router>
            <AuthProvider>
                <Routes>
                    {/* Public route */}
                    <Route path="/" element={<LandingPage />} />

                    {/* Protected routes */}
                    <Route
                        path="/chat"
                        element={
                            <ProtectedRoute>
                                <FileUploadInterface />
                            </ProtectedRoute>
                        }
                    />
                    
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </AuthProvider>
        </Router>
        </ThemeProvider>
        
    );
}

export default App;