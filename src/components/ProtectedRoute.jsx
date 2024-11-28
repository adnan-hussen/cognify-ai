// src/components/ProtectedRoute.jsx
import { useMsal } from '@azure/msal-react';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children }) => {
    const { accounts } = useMsal();
    
    if (accounts.length === 0) {
        // Redirect to root instead of login
        return <Navigate to="/" />;
    }

    return children;
};