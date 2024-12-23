// src/authConfig.js
export const msalConfig = {
    auth: {
        clientId: "71caec0f-8b1f-4014-bc6c-c212d3a46ae1", // Application (client) ID from Azure
        authority: "https://cognifyaitutor.b2clogin.com/cognifyaitutor.onmicrosoft.com/B2C_1_signinup",
        knownAuthorities: ["cognifyaitutor.b2clogin.com"],
        redirectUri: "http://localhost:5173", // Your app's redirect URI
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