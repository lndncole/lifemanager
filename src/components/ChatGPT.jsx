// src/components/ChatGPT.jsx
import React, { useState, useEffect, useRef } from "react";

import '../styles/chatgpt.css';

const ChatGPT = () => {
  //Handling state
  const [isOpen, setIsOpen] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [conversation, setConversation] = useState([]);
  //Global variables
  const lastMessageRef = useRef(null);
  const chatWindowRef = useRef(null);

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation]);

  useEffect(() => {
    // Close chat if clicked outside
    function handleClickOutside(event) {
      if (chatWindowRef.current && !chatWindowRef.current.contains(event.target) && isOpen) {
        toggleChat();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  };

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const handleKeyPress = (e) => {
    // Check if the Enter key is pressed and user input is not empty
    if (isOpen && e.key === 'Enter' && userInput.trim()) {
      sendMessage();
    }
  };

  const sendMessage = async () => {
    const message = { role: "user", content: userInput };
    setConversation([...conversation, message]);
    setUserInput("");

    // Send the message to the backend
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: userInput }),
    });
    const data = await response.json();
    setConversation([
      ...conversation,
      message,
      { role: "ai", content: data.response },
    ]);
  };

  return (
    <div className={`chat-container ${isOpen ? "open" : ""}`}>
      <div className={`chat-tab ${isOpen ? "open" : ""}`} onClick={toggleChat}>
        AI
      </div>
      {isOpen && (
        <div className="chat-window" ref={chatWindowRef}>
          <button className="close-chat" onClick={toggleChat}>X</button>
          <div className="chat-messages">
            {conversation.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}
                  ref={index === conversation.length - 1 ? lastMessageRef : null}>
                {msg.content}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={userInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress} 
              placeholder="Type your message..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChatGPT;
