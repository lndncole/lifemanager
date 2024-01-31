// src/components/ChatGPT.jsx
import React, { useState, useEffect, useRef } from "react";
import '../styles/chatgpt.css';
import { IoSparklesOutline } from "react-icons/io5";


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
    document.addEventListener("mouseup", handleClickOutside);
    return () => document.removeEventListener("mouseup", handleClickOutside);
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
    const userMessage = { role: "user", content: userInput };
    setConversation(currentConversation => [...currentConversation, userMessage]);
    setUserInput("");
  
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: userInput }),
    });
    const data = await response.json();
  
    if (data && data.gptFunction && data.gptFunction === 'fetch-calendar') {
      const calendarMessages = data.calendarEvents.map(event => ({
        role: "ai",
        content: `Event: ${event.summary}\nTime: ${new Date(event.start).toLocaleString()} - ${new Date(event.end).toLocaleString()}\nDescription: ${event.description || 'No description'}`
      }));
      setConversation(currentConversation => [...currentConversation, ...calendarMessages]);
    } else {
      const aiResponse = { role: "ai", content: data.response };
      setConversation(currentConversation => [...currentConversation, aiResponse]);
    }
  };

  return (
    <div className={`chat-container ${isOpen ? "open" : ""}`}>
      <div className={`chat-tab ${isOpen ? "open" : ""}`} onClick={toggleChat}>
        ChatGPT <IoSparklesOutline />
      </div>
  
        <div className={`chat-window ${isOpen ? "open" : ""}`} ref={chatWindowRef}>
          {isOpen && 
            <button className="close-chat" onClick={toggleChat}>X</button>
          }
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
    

    </div>
  );
};

export default ChatGPT;
