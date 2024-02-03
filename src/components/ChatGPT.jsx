// src/components/ChatGPT.jsx
import React, { useState, useEffect, useRef } from "react";
import '../styles/chatgpt.css';
import { IoSparklesOutline } from "react-icons/io5";
import { FaArrowUpLong } from "react-icons/fa6";


const ChatGPT = () => {
  //Handling state
  const [isOpen, setIsOpen] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [conversation, setConversation] = useState([]);
  //Global variables
  const lastMessageRef = useRef(null);
  const chatWindowRef = useRef(null);

  useEffect(() => {
    //For updating the chat box when the conversation updates
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
    //cleanup event handler when the component unmounts
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

  function extractUrlFromString(text) {
      // Regular expression to match a URL starting with "https://www"
      const regex = /https:\/\/www\.[^\s]+/g;
      const matches = text.match(regex);
      
      // Return the first match found or null if no match is found
      return matches ? matches[0] : null;
  };

  const sendMessage = async () => {
    const newMessage = { role: "user", content: userInput };
    // Update local state first
    setConversation(prevConversation => [...prevConversation, newMessage]);
    setUserInput("");

    // Prepare the conversation for the API call
    const conversationForApi = [...conversation, newMessage];
  
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ conversation: conversationForApi }),
    });
    const data = await response.json();
  
    if (data && data.gptFunction) {
      if(data.gptFunction == 'fetch-calendar') {
        const calendarMessages = data.calendarEvents.map(event => ({
          role: "assistant",
          content: `Event: ${event.summary}\nTime: ${new Date(event.start).toLocaleString()} - ${new Date(event.end).toLocaleString()}\nDescription: ${event.description || 'No description'}`
        }));
        setConversation(currentConversation => [...currentConversation, ...calendarMessages]);
      } else if(data.gptFunction == "add-calendar-event") {
        const addCalendarResponse = { role: 'assistant', content: "Your event has been added, here's the link! " + data.addedEvent.htmlLink};
        console.log(data);
        setConversation(currentConversation => [...currentConversation, addCalendarResponse]);
      }
    } else {
      const aiResponse = { role: data.response.role, content: data.response.content };
      setConversation(currentConversation => [...currentConversation, aiResponse]);
    }
  };

  return (
    <div className={`chat-container ${isOpen ? "open" : ""}`}>
      <div className={`chat-tab ${isOpen ? "open" : ""}`} onClick={toggleChat}>
        lifeMNGR <IoSparklesOutline /> 
      </div>
  
        <div className={`chat-window ${isOpen ? "open" : ""}`} ref={chatWindowRef}>
          {isOpen && 
            <button className="close-chat" onClick={toggleChat}>X</button>
          }
          <div className="chat-messages">
          {conversation.map((msg, index) => {
            const messageClass = msg.role !== 'user' ? 'ai' : 'user';
            const isLinkMessage = msg.content.includes("http") && msg.role === 'assistant';
            
            return (
              <div key={index} className={`message ${messageClass}`}
                  ref={index === conversation.length - 1 ? lastMessageRef : null}>
                {isLinkMessage ? (
                  <span>
                    Your event has been added, here's the link! <a href={extractUrlFromString(msg.content)} target="_blank" rel="noopener noreferrer">Click here</a>
                  </span>
                ) : (
                  msg.content
                )}
              </div>
            );
          })}
          </div>
          <div className="chat-input">
              <input
                type="text"
                value={userInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress} 
                placeholder="Type your message..."
              />
              <button onClick={sendMessage}><FaArrowUpLong /></button>
          </div>
        </div>
    

    </div>
  );
};

export default ChatGPT;
