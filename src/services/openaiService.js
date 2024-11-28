// src/services/openaiService.js
const AZURE_ENDPOINT = import.meta.env.VITE_AZURE_ENDPOINT;
const AZURE_API_KEY = import.meta.env.VITE_AZURE_API_KEY;
const DEPLOYMENT_NAME = import.meta.env.VITE_DEPLOYMENT_NAME;

export async function sendMessage(message, conversationHistory = []) {
    try {
        const response = await fetch(`${AZURE_ENDPOINT}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=2023-07-01-preview`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': AZURE_API_KEY
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: "You are a mental health companion AI, focused on providing support, understanding, and guidance. Respond with empathy and care." },
                    ...conversationHistory,
                    { role: "user", content: message }
                ],
                max_tokens: 800,
                temperature: 0.7,
                frequency_penalty: 0,
                presence_penalty: 0,
                top_p: 0.95
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message;
    } catch (error) {
        console.error('OpenAI API error:', error);
        throw error;
    }
}