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
                // Wait for MSAL initialization
                if (inProgress === "startup") {
                    return;
                }

                // Handle redirect promise
                const response = await instance.handleRedirectPromise();
                if (response) {
                    // Successfully logged in
                    if (response.account) {
                        if (response.account.idTokenClaims?.newUser) {
                            navigate('/assessment');
                        } else {
                            navigate('/chat');
                        }
                    }
                }
            } catch (error) {
                console.error('Redirect error:', error);
            }
        };

        handleRedirect();
    }, [instance, navigate, inProgress]);

    useEffect(() => {
        if (accounts.length > 0) {
            const currentAccount = accounts[0];
            if (currentAccount?.idTokenClaims?.newUser) {
                navigate('/assessment');
            }
        }
    }, [accounts, navigate]);

    return children;
};