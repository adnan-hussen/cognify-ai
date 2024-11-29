// src/components/VoiceConversation.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RTClient } from "rt-client";
import { AudioHandler } from "@/lib/audio";
import MenuModal from './MenuModal';
import { Weight } from "lucide-react";

function VoiceConversation() {
 const navigate = useNavigate();
 const [messages, setMessages] = useState([]);
 const [currentMessage, setCurrentMessage] = useState("");
 const [isRecording, setIsRecording] = useState(false);
 const [isConnected, setIsConnected] = useState(false);
 const [isConnecting, setIsConnecting] = useState(false);
 const [waveHeights, setWaveHeights] = useState(Array(30).fill(10));
 const [showMenu, setShowMenu] = useState(false);

 const clientRef = useRef(null);
 const audioHandlerRef = useRef(null);
 const lastUserInputTypeRef = useRef("text");

 const endpoint = import.meta.env.VITE_REALTIME_ENDPOINT;
 const apiKey = import.meta.env.VITE_REALTIME_KEY;
 const deployment = import.meta.env.VITE_REALTIME_DEPLOYMENT;

 const handleConnect = async () => {
   if (!isConnected) {
     try {
       setIsConnecting(true);

       if (!endpoint || !apiKey || !deployment) {
         throw new Error(
           "Azure configuration is missing. Please set the environment variables."
         );
       }

       clientRef.current = new RTClient(
         new URL(endpoint),
         { key: apiKey },
         { deployment }
       );

       await clientRef.current.configure({
         instructions: "You are Haven AI, a mental health companion. Keep responses concise and empathetic.",
         input_audio_transcription: { model: "whisper-1" },
         turn_detection: { type: "server_vad" },
         tools: [],
         temperature: 0.9,
         modalities: ["text", "audio"],
       });

       startResponseListener();
       setIsConnected(true);
     } catch (error) {
       console.error("Connection failed:", error);
       alert(`Connection failed: ${error.message}`);
     } finally {
       setIsConnecting(false);
     }
   } else {
     await disconnect();
   }
 };

 const disconnect = async () => {
   if (clientRef.current) {
     try {
       await clientRef.current.close();
       clientRef.current = null;
       setIsConnected(false);
     } catch (error) {
       console.error("Disconnect failed:", error);
     }
   }
 };

 const handleResponse = async (response) => {
   for await (const item of response) {
     if (item.type === "message" && item.role === "assistant") {
       const message = {
         type: item.role,
         content: "",
       };
       setMessages((prevMessages) => [...prevMessages, message]);

       for await (const content of item) {
         if (content.type === "text") {
           for await (const text of content.textChunks()) {
             message.content += text;
             setMessages((prevMessages) => {
               prevMessages[prevMessages.length - 1].content = message.content;
               return [...prevMessages];
             });
           }
         } else if (content.type === "audio") {
           if (lastUserInputTypeRef.current === "audio") {
             audioHandlerRef.current?.startStreamingPlayback();
             for await (const audio of content.audioChunks()) {
               audioHandlerRef.current?.playChunk(audio);
             }
           } else {
             for await (const audio of content.audioChunks()) {
               // Consume audio chunks without playing them
             }
           }

           for await (const text of content.transcriptChunks()) {
             message.content += text;
             setMessages((prevMessages) => {
               prevMessages[prevMessages.length - 1].content = message.content;
               return [...prevMessages];
             });
           }
         }
       }
     }
   }
 };

 const handleInputAudio = async (item) => {
   audioHandlerRef.current?.stopStreamingPlayback();
   await item.waitForCompletion();
   lastUserInputTypeRef.current = "audio";

   setMessages((prevMessages) => [
     ...prevMessages,
     {
       type: "user",
       content: item.transcription || "",
     },
   ]);
 };

 const startResponseListener = async () => {
   if (!clientRef.current) return;

   try {
     for await (const serverEvent of clientRef.current.events()) {
       if (serverEvent.type === "response") {
         await handleResponse(serverEvent);
       } else if (serverEvent.type === "input_audio") {
         await handleInputAudio(serverEvent);
       }
     }
   } catch (error) {
     if (clientRef.current) {
       console.error("Response iteration error:", error);
     }
   }
 };

 const sendMessage = async () => {
   if (currentMessage.trim() && clientRef.current) {
     try {
       setMessages((prevMessages) => [
         ...prevMessages,
         {
           type: "user",
           content: currentMessage,
         },
       ]);

       await clientRef.current.sendItem({
         type: "message",
         role: "user",
         content: [{ type: "input_text", text: currentMessage }],
       });

       lastUserInputTypeRef.current = "text";
       await clientRef.current.generateResponse();
       setCurrentMessage("");
     } catch (error) {
       console.error("Failed to send message:", error);
     }
   }
 };

 const toggleRecording = async () => {
   if (!isRecording && clientRef.current) {
     try {
       if (!audioHandlerRef.current) {
         audioHandlerRef.current = new AudioHandler();
         await audioHandlerRef.current.initialize();
       }
       await audioHandlerRef.current.startRecording(async (chunk) => {
         await clientRef.current?.sendAudio(chunk);
       });
       setIsRecording(true);
     } catch (error) {
       console.error("Failed to start recording:", error);
     }
   } else if (audioHandlerRef.current) {
     try {
       audioHandlerRef.current.stopRecording();
       setIsRecording(false);
     } catch (error) {
       console.error("Failed to stop recording:", error);
     }
   }
 };

 const handleUpdateInfo = () => {
   setShowMenu(false);
   navigate('/assessment');
 };

 useEffect(() => {
   const initAudioHandler = async () => {
     const handler = new AudioHandler();
     await handler.initialize();
     audioHandlerRef.current = handler;
   };

   initAudioHandler().catch(console.error);

   return () => {
     disconnect();
     audioHandlerRef.current?.close().catch(console.error);
   };
 }, []);

 useEffect(() => {
   if (isRecording) {
     const interval = setInterval(() => {
       setWaveHeights(prev => 
         prev.map(() => Math.random() * 40 + 10)
       );
     }, 100);
     return () => clearInterval(interval);
   }
 }, [isRecording]);

 return (
   <div className="chat-container">
     <button 
       className="menu-button"
       onClick={() => setShowMenu(true)}
       aria-label="Menu"
     >
       <i className="bi bi-list"></i>
     </button>

    

     <div className="chat-content d-flex flex-column">
       <h1 className="gradient-text text-center mb-4">Voice Chat</h1>

       {!isConnected && (
         <button 
           className="btn btn-custom w-50 mx-auto mb-4"
           style={{fontWeight:200,fontSize:25}}
           onClick={handleConnect}
           disabled={isConnecting}
         >
           {isConnecting ? "Connecting..." : "Click Here to Start"}
         </button>
       )}

       <div className="messages-container">
         {messages.map((message, index) => (
           <div
             key={index}
             className={`message ${message.type === 'user' ? 'user-message' : 'ai-message'}`}
           >
             <div className="message-content">
               {message.content}
             </div>
           </div>
         ))}

         {isRecording && (
           <div className="wave-container mt-4">
             {waveHeights.map((height, index) => (
               <div
                 key={index}
                 className="wave-bar"
                 style={{
                   height: `${height}px`,
                   opacity: isRecording ? 1 : 0.5,
                 }}
               />
             ))}
           </div>
         )}
       </div>
     </div>
     
     <div className="chat-input-container">
       <div className="input-group">
         <input
           type="text"
           className="form-control"
           placeholder="Type a Message or Start a Voice Conversation"
           value={currentMessage}
           onChange={(e) => setCurrentMessage(e.target.value)}
           onKeyUp={(e) => e.key === "Enter" && sendMessage()}
           disabled={!isConnected}
         />
         <button 
           className="btn send-btn"
           onClick={sendMessage}
           disabled={!isConnected || !currentMessage.trim()}
         >
           <i className="bi bi-send-fill"></i>
         </button>
         <button 
           className="btn voice-btn"
           onClick={toggleRecording}
           disabled={!isConnected}
         >
           <i className={`bi ${isRecording ? 'bi-mic-mute-fill' : 'bi-mic-fill'}`}></i>
         </button>
       </div>
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

export default VoiceConversation;