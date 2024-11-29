// src/components/VoiceConversation.jsx

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Player } from './player.js'; // Ensure correct path and extension

function VoiceConversation() {
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [waveHeights, setWaveHeights] = useState(Array(30).fill(10));
  const [transcription, setTranscription] = useState(""); // Store live transcription
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  const socketRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const workletNodeRef = useRef(null);
  const playerRef = useRef(null);

  // Environment variables
  const API_URL = import.meta.env.VITE_AZURE_REALTIME_ENDPOINT; // "wss://havenaigpt4o.openai.azure.com/openai/realtime"
  const API_VERSION = "2024-10-01-preview";
  const DEPLOYMENT = import.meta.env.VITE_AZURE_REALTIME_DEPLOYMENT; // "gpt-4o-realtime-preview"
  const API_KEY = import.meta.env.VITE_AZURE_REALTIME_API_KEY; // Your API key

  const fullUrl = `${API_URL}?api-version=${API_VERSION}&deployment=${DEPLOYMENT}&api-key=${API_KEY}`;

  // Initialize Player
  useEffect(() => {
    playerRef.current = new Player();
    playerRef.current.init(24000); // Initialize with a sample rate of 24,000 Hz

    return () => {
      if (playerRef.current) {
        playerRef.current.clear();
      }
    };
  }, []);

  // Waveform Animation
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setWaveHeights(prev =>
        prev.map(() => (isMuted ? 5 : Math.random() * 40 + 10))
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, isMuted]);

  // Initialize WebSocket and Audio Capture
  useEffect(() => {
    if (isActive) {
      initializeWebSocket();
      startAudioCapture();
    }

    return () => {
      stopAudioCapture();
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // Helper: Decode Base64 to Int16Array
  const decodeBase64ToInt16Array = (base64) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const int16Array = new Int16Array(bytes.buffer);
    return int16Array;
  };

  // Initialize WebSocket Connection
  const initializeWebSocket = () => {
    if (socketRef.current && socketRef.current.readyState !== WebSocket.CLOSED) {
      console.log('WebSocket already initialized.');
      return;
    }

    try {
      socketRef.current = new WebSocket(fullUrl);

      socketRef.current.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('Connected');
        socketRef.current.send(
          JSON.stringify({
            type: 'session.update',
            session: {
              voice: 'alloy',
              input_audio_format: 'pcm16',
              input_audio_transcription: {
                model: 'whisper-1',
              },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.4,
                silence_duration_ms: 600,
              },
            },
          })
        );
      };

      socketRef.current.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message:', data);

          if (data.error) {
            console.error('API Error:', data.error);
            alert(`Error: ${data.error.message}`);
            return;
          }

          switch (data.type) {
            case 'session.created':
              console.log('Session successfully created.');
              makeNewTextBlock("<< Session Started >>");
              break;

            case 'session.updated':
              console.log('Session updated:', data);
              // Handle session updates if necessary
              break;

            case 'response.text.delta':
              setTranscription(prev => prev + (data.delta.text || ''));
              break;

            case 'response.audio.delta':
              if (data.delta.audio) {
                const audioBuffer = decodeBase64ToInt16Array(data.delta.audio);
                playerRef.current.play(audioBuffer);
              }
              break;

            case 'conversation.item.input_audio_transcription.completed':
              setTranscription(prev => prev + `\n[Transcription]: ${data.transcript}`);
              break;

            case 'response.done':
              console.log('Response generation completed.');
              makeNewTextBlock("<< Response Completed >>");
              break;

            case 'error':
              console.error('API Error:', data.error.message);
              alert(`Error: ${data.error.message}`);
              break;

            default:
              console.log('Unhandled message type:', data.type);
          }
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };

      socketRef.current.onclose = event => {
        console.log('WebSocket disconnected:', event.reason || 'Unknown reason');
        setConnectionStatus('Disconnected');
      };

      socketRef.current.onerror = error => {
        console.error('WebSocket error:', error);
        alert('An error occurred with the WebSocket connection. Please try again later.');
      };
    } catch (error) {
      console.error('WebSocket initialization failed:', error.message);
      alert('WebSocket initialization failed. Please check your connection and try again.');
    }
  };

  // Start Audio Capture
  const startAudioCapture = async () => {
    try {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      await audioContextRef.current.audioWorklet.addModule('/audio-processor.js');

      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);

      const workletNode = new AudioWorkletNode(audioContextRef.current, 'audio-processor');
      workletNodeRef.current = workletNode;

      workletNode.port.postMessage({ command: "START_RECORDING" });

      workletNode.port.onmessage = (event) => {
        const { type, audioData } = event.data;
        if (type === 'audio-chunk') {
          if (isMuted || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

          // Convert Int16Array to Base64 string
          let binary = '';
          for (let i = 0; i < audioData.length; i++) {
            binary += String.fromCharCode(audioData[i] & 0xff, (audioData[i] >> 8) & 0xff);
          }
          const base64Audio = btoa(binary);

          // Send the audio chunk to the WebSocket
          socketRef.current.send(
            JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: base64Audio,
            })
          );
        }
      };

      source.connect(workletNode);
    } catch (error) {
      console.error('Audio capture initialization failed:', error.message);
      alert('Microphone access is required to use this feature.');
    }
  };

  // Stop Audio Capture
  const stopAudioCapture = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (workletNodeRef.current) {
      workletNodeRef.current.port.postMessage({ command: "STOP_RECORDING" });
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
  };

  // Handle Stop Button
  const handleStop = () => {
    setIsActive(false);
    setTimeout(() => navigate('/chat'), 500);
  };

  // UI Helper Functions
  const makeNewTextBlock = (text = "") => {
    const container = document.getElementById('received-text-container');
    if (container) {
      const newElement = document.createElement("p");
      newElement.textContent = text;
      container.appendChild(newElement);
    }
  };

  return (
    <div className="voice-conversation-container">
      <button className="back-button m-4" onClick={handleStop} aria-label="Stop conversation">
        <i className="bi bi-x-lg"></i>
      </button>

      <div className="voice-content">
        <h2 className="text-center mb-5">I'm listening...</h2>
        <p className="text-center">{transcription || "Waiting for transcription..."}</p>
        <p className="text-center">Status: {connectionStatus}</p>

        <div className="wave-container">
          {waveHeights.map((height, index) => (
            <div
              key={index}
              className="wave-bar"
              style={{
                height: `${height}px`,
                opacity: isActive ? 1 : 0.5,
                transition: 'height 0.1s ease',
              }}
            />
          ))}
        </div>

        <div className="voice-controls mt-5">
          <button
            className={`control-button ${isMuted ? 'active' : ''}`}
            onClick={() => setIsMuted(!isMuted)}
            aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
          >
            <i className={`bi ${isMuted ? 'bi-mic-mute-fill' : 'bi-mic-fill'}`}></i>
          </button>
          <button className="control-button stop-button ms-4" onClick={handleStop} aria-label="Stop conversation">
            <i className="bi bi-stop-fill"></i>
          </button>
        </div>
      </div>

      {/* Container for transcriptions and session messages */}
      <div id="received-text-container" style={{ display: 'none' }}></div>
    </div>
  );
}

export default VoiceConversation;
