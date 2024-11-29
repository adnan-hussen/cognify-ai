// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';

// Components
import LandingPage from './components/LandingPage';
import ChatInterface from './components/ChatInterface';
import InitialSurvey from './components/InitialSurvey';
// import VoiceConversation from './components/ChatInterface';





function App() {
    return (
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
                                <ChatInterface />
                            </ProtectedRoute>
                        }
                    />
                    {/* <Route
                    path="/voice"
                    element={
                        <ProtectedRoute>
                           <VoiceConversation/>
                        </ProtectedRoute>
                    }
                    /> */}
                    
                    <Route
                        path="/assessment"
                        element={
                            <ProtectedRoute>
                                <InitialSurvey />
                            </ProtectedRoute>
                        }
                    />
                    
                    {/* Catch-all route - redirect to home */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;