// src/components/AuthProvider.jsx 
import { useMsal } from '@azure/msal-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthProvider = ({ children }) => {
    const { instance, accounts, inProgress } = useMsal();
    const navigate = useNavigate();

    useEffect(() => {
        const handleRedirect = async () => {
            try {
                if (inProgress === "startup") {
                    return;
                }

                const response = await instance.handleRedirectPromise();
                if (response) {
                    navigate('/chat'); // Always go to chat
                }
            } catch (error) {
                console.error('Redirect error:', error);
            }
        };

        handleRedirect();
    }, [instance, navigate, inProgress]);

    useEffect(() => {
        if (accounts.length > 0) {
            navigate('/chat'); // Always go to chat
        }
    }, [accounts, navigate]);

    return children;
};