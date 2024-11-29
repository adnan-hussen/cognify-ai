"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  RTClient,
 
} from "rt-client";
import { AudioHandler } from "@/lib/audio";

// Bootstrap components
import {
  Accordion,
  Card,
  Button,
  Form,
  InputGroup,
  Dropdown,
} from "react-bootstrap";
import { Plus, SendFill, MicFill, MicMuteFill, Power } from "react-bootstrap-icons";

const VoiceConversation = () => {
  const [isAzure, setIsAzure] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [deployment, setDeployment] = useState("");
  const [useVAD, setUseVAD] = useState(true);
  const [instructions, setInstructions] = useState("");
  const [temperature, setTemperature] = useState(0.9);
  const [modality, setModality] = useState("audio");
  const [tools, setTools] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const clientRef = useRef(null);
  const audioHandlerRef = useRef(null);

  const addTool = () => {
    setTools([...tools, { name: "", parameters: "", returnValue: "" }]);
  };

  const updateTool = (index, field, value) => {
    const newTools = [...tools];
    newTools[index][field] = value;
    setTools(newTools);
  };

  const handleConnect = async () => {
    if (!isConnected) {
      try {
        setIsConnecting(true);
        clientRef.current = isAzure
          ? new RTClient(new URL(endpoint), { key: apiKey }, { deployment })
          : new RTClient(
              { key: apiKey },
              { model: "gpt-4o-realtime-preview-2024-10-01" }
            );
        const modalities =
          modality === "audio" ? ["text", "audio"] : ["text"];
        const turnDetection = useVAD ? { type: "server_vad" } : null;
        clientRef.current.configure({
          instructions: instructions?.length > 0 ? instructions : undefined,
          input_audio_transcription: { model: "whisper-1" },
          turn_detection: turnDetection,
          tools,
          temperature,
          modalities,
        });
        startResponseListener();

        setIsConnected(true);
      } catch (error) {
        console.error("Connection failed:", error);
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
                prevMessages[prevMessages.length - 1].content =
                  message.content;
                return [...prevMessages];
              });
            }
          } else if (content.type === "audio") {
            const textTask = async () => {
              for await (const text of content.transcriptChunks()) {
                message.content += text;
                setMessages((prevMessages) => {
                  prevMessages[prevMessages.length - 1].content =
                    message.content;
                  return [...prevMessages];
                });
              }
            };
            const audioTask = async () => {
              audioHandlerRef.current?.startStreamingPlayback();
              for await (const audio of content.audioChunks()) {
                audioHandlerRef.current?.playChunk(audio);
              }
            };
            await Promise.all([textTask(), audioTask()]);
          }
        }
      }
    }
  };

  const handleInputAudio = async (item) => {
    audioHandlerRef.current?.stopStreamingPlayback();
    await item.waitForCompletion();
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
        if (!useVAD) {
          const inputAudio = await clientRef.current?.commitAudio();
          await handleInputAudio(inputAudio);
          await clientRef.current?.generateResponse();
        }
        setIsRecording(false);
      } catch (error) {
        console.error("Failed to stop recording:", error);
      }
    }
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

  return (
    <div className="d-flex vh-100">
      {/* Parameters Panel */}
      <div className="bg-light p-4 border-end" style={{ width: "20rem" }}>
        <Accordion defaultActiveKey="0">
          {/* Connection Settings */}
          <Accordion.Item eventKey="0">
            <Accordion.Header>Connection Settings</Accordion.Header>
            <Accordion.Body>
              <Form>
                <Form.Group className="d-flex align-items-center justify-content-between mb-3">
                  <Form.Label className="mb-0">Use Azure OpenAI</Form.Label>
                  <Form.Check
                    type="switch"
                    id="use-azure-switch"
                    checked={isAzure}
                    onChange={(e) => setIsAzure(e.target.checked)}
                    disabled={isConnected}
                  />
                </Form.Group>

                {isAzure && (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label>Azure Endpoint</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Azure Endpoint"
                        value={endpoint}
                        onChange={(e) => setEndpoint(e.target.value)}
                        disabled={isConnected}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Deployment Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Deployment Name"
                        value={deployment}
                        onChange={(e) => setDeployment(e.target.value)}
                        disabled={isConnected}
                      />
                    </Form.Group>
                  </>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>API Key</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={isConnected}
                  />
                </Form.Group>
              </Form>
            </Accordion.Body>
          </Accordion.Item>

          {/* Conversation Settings */}
          <Accordion.Item eventKey="1">
            <Accordion.Header>Conversation Settings</Accordion.Header>
            <Accordion.Body>
              <Form>
                <Form.Group className="d-flex align-items-center justify-content-between mb-3">
                  <Form.Label className="mb-0">Use Server VAD</Form.Label>
                  <Form.Check
                    type="switch"
                    id="use-vad-switch"
                    checked={useVAD}
                    onChange={(e) => setUseVAD(e.target.checked)}
                    disabled={isConnected}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Instructions</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Instructions"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    disabled={isConnected}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Tools</Form.Label>
                  {tools.map((tool, index) => (
                    <Card className="mb-2" key={index}>
                      <Card.Body>
                        <Form.Group className="mb-2">
                          <Form.Control
                            type="text"
                            placeholder="Function name"
                            value={tool.name}
                            onChange={(e) =>
                              updateTool(index, "name", e.target.value)
                            }
                            disabled={isConnected}
                          />
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Control
                            type="text"
                            placeholder="Parameters"
                            value={tool.parameters}
                            onChange={(e) =>
                              updateTool(index, "parameters", e.target.value)
                            }
                            disabled={isConnected}
                          />
                        </Form.Group>
                        <Form.Group>
                          <Form.Control
                            type="text"
                            placeholder="Return value"
                            value={tool.returnValue}
                            onChange={(e) =>
                              updateTool(index, "returnValue", e.target.value)
                            }
                            disabled={isConnected}
                          />
                        </Form.Group>
                      </Card.Body>
                    </Card>
                  ))}
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={addTool}
                    className="w-100"
                    disabled={isConnected}
                  >
                    <Plus className="me-2" />
                    Add Tool
                  </Button>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Temperature ({temperature.toFixed(1)})
                  </Form.Label>
                  <Form.Control
                    type="range"
                    min={0.6}
                    max={1.2}
                    step={0.1}
                    value={temperature}
                    onChange={(e) =>
                      setTemperature(parseFloat(e.target.value))
                    }
                    disabled={isConnected}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Modality</Form.Label>
                  <Form.Select
                    value={modality}
                    onChange={(e) => setModality(e.target.value)}
                    disabled={isConnected}
                  >
                    <option value="text">Text</option>
                    <option value="audio">Audio</option>
                  </Form.Select>
                </Form.Group>
              </Form>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        {/* Connect Button */}
        <Button
          className="mt-4 w-100"
          variant={isConnected ? "danger" : "primary"}
          onClick={handleConnect}
          disabled={isConnecting}
        >
          <Power className="me-2" />
          {isConnecting
            ? "Connecting..."
            : isConnected
            ? "Disconnect"
            : "Connect"}
        </Button>
      </div>

      {/* Chat Window */}
      <div className="flex-grow-1 d-flex flex-column">
        {/* Messages Area */}
        <div className="flex-grow-1 p-4 overflow-auto d-flex flex-column">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 p-3 rounded ${
                message.type === "user"
                  ? "bg-primary text-white align-self-end"
                  : "bg-light align-self-start"
              }`}
              style={{ maxWidth: "80%" }}
            >
              {message.content}
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 border-top">
          <InputGroup>
            <Form.Control
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyUp={(e) => e.key === "Enter" && sendMessage()}
              disabled={!isConnected}
            />
            <Button
              variant={isRecording ? "danger" : "outline-secondary"}
              onClick={toggleRecording}
              disabled={!isConnected}
            >
              {isRecording ? <MicMuteFill /> : <MicFill />}
            </Button>
            <Button
              onClick={sendMessage}
              disabled={!isConnected}
              variant="primary"
            >
              <SendFill />
            </Button>
          </InputGroup>
        </div>
      </div>
    </div>
  );
};

export default VoiceConversation;
