// src/authConfig.js
export const msalConfig = {
    auth: {
        clientId: "7fcbd5e4-38d5-43e6-937e-00f4750825ae", // Application (client) ID from Azure
        authority: "https://havenai1.b2clogin.com/havenai1.onmicrosoft.com/B2C_1_signupin",
        knownAuthorities: ["havenai1.b2clogin.com"],
        redirectUri: window.location.origin, // Your app's redirect URI
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    }
};

// Add scopes for token request
export const loginRequest = {
    scopes: ["openid", "offline_access"]
};