// src/components/AuthProvider.jsx
import { useMsal } from '@azure/msal-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthProvider = ({ children }) => {
    const { instance, accounts, inProgress } = useMsal();
    const navigate = useNavigate();

    useEffect(() => {
        // Handle the redirect promise when the app loads
        instance.handleRedirectPromise().then((response) => {
            if (response) {
                // Successfully logged in
                navigate('/chat');
            }
        }).catch((error) => {
            console.error('Redirect error:', error);
        });
    }, []);

    useEffect(() => {
        if (accounts.length > 0) {
            // User is signed in
            navigate('/chat');
        }
    }, [accounts, navigate]);

    return children;
};