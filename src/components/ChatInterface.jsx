// src/components/ChatInterface.jsx
import { useState, useRef, useEffect } from 'react';
import { sendMessage } from '../services/openaiService';

function ChatInterface() {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || isLoading) return;

        const userMessage = { role: "user", content: inputText };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            const aiResponse = await sendMessage(
                inputText, 
                messages.slice(-10) // Keep last 10 messages for context
            );
            setMessages(prev => [...prev, aiResponse]);
        } catch (error) {
            console.error('Failed to get response:', error);
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "I'm sorry, I'm having trouble responding right now. Please try again."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-content">
                <div className="messages-container">
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`message ${message.role === 'user' ? 'user-message' : 'ai-message'}`}
                        >
                            <div className="message-content">
                                {message.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="message ai-message">
                            <div className="message-content">
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="chat-input-container">
                <form onSubmit={handleSendMessage} className="input-group">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Type a message..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        disabled={isLoading}
                    />
                    <button 
                        className="btn send-btn" 
                        type="submit"
                        disabled={isLoading || !inputText.trim()}
                    >
                        <i className="bi bi-send-fill"></i>
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ChatInterface;