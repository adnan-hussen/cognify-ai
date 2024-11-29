// src/components/ChatInterface.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { sendMessage } from '../services/openaiService';
import MenuModal from './MenuModal';

function ChatInterface() {
   const navigate = useNavigate();
   const [messages, setMessages] = useState([]);
   const [inputText, setInputText] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [showMenu, setShowMenu] = useState(false);
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
       const updatedMessages = [...messages, userMessage]; // Updated line
       setMessages(updatedMessages); // Updated line
       setInputText('');
       setIsLoading(true);

       try {
           const aiResponse = await sendMessage(
               inputText, 
               updatedMessages.slice(-10) // Updated line
           );
           setMessages(prev => [...prev, aiResponse]);
       } catch (error) {
           console.error('Failed to get response:', error);
           setMessages(prev => [...prev, {
               role: "assistant",
               content: `${error}`
           }]);
       } finally {
           setIsLoading(false);
       }
   };

   const handleUpdateInfo = () => {
       setShowMenu(false);
       navigate('/assessment');
   };

   return (
       <div className="chat-container">
           <button 
               className="menu-button"
               onClick={() => setShowMenu(true)}
               aria-label="Menu"
           >
               <i className="bi bi-list"></i>
           </button>

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
            <div className="message-content typing-content">
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
                   <button 
                       type="button"
                       className="btn voice-btn"
                       onClick={() => navigate('/voice')}
                   >
                       <i className="bi bi-mic-fill"></i>
                   </button>
               </form>
           </div>

           {showMenu && (
               <MenuModal 
                   onClose={() => setShowMenu(false)}
                   onUpdateInfo={handleUpdateInfo}
               />
           )}
       </div>
   );
}

export default ChatInterface;
