// src/components/ChatGPT.jsx
import React, { useState, useEffect, useRef } from "react";

//For markdown parsing
import ReactMarkdown from 'react-markdown';

//styles and icons
import '../styles/chatgpt.css';
import { IoSparklesOutline } from "react-icons/io5";
import { FaArrowUpLong, FaSpinner } from "react-icons/fa6";


const ChatGPT = () => {
  //Handling state
  const [isOpen, setIsOpen] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false); 
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

  const sendMessage = async () => {
    setIsLoading(true);

    const newMessage = { role: "user", content: userInput };
    // Update local state first
    setConversation(prevConversation => [...prevConversation, newMessage]);
    setUserInput("");

    // Prepare the conversation for the API call
    const conversationForApi = [...conversation, newMessage];
  
    try{
      const response = await fetch("/api/chatGPT", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conversation: conversationForApi }),
      });
      const data = await response.json();
    
      if (data && data.gptFunction) {
        if(data.gptFunction == 'fetch-calendar') {
          const googleFetchCalendarResponse = { role: 'assistant', content: data.calendarEvents, name: 'google-calendar-fetch'};
          setConversation(currentConversation => [...currentConversation, googleFetchCalendarResponse]);
        } else if(data.gptFunction == "add-calendar-events") {
          const googleAddEventResponse = { role: 'assistant', content: data.response, name: 'google-calendar-add-event'};
          setConversation(currentConversation => [...currentConversation, googleAddEventResponse]);
        } else if(data.gptFunction == "google-search") {
          const googleSearchResponse = { role: 'assistant', content: data.result, name: 'google-search'};
          setConversation(currentConversation => [...currentConversation, googleSearchResponse]);
        }
      } else {
        const aiResponse = { role: data.response.role, content: data.response.content };
        setConversation(currentConversation => [...currentConversation, aiResponse]);
      }
    } catch(e) {
      console.error("Error communicating with the GPT: ", e);
    } finally {
      setIsLoading(false); 
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
          return (
            <div key={index} className={`message ${messageClass}`} ref={index === conversation.length - 1 ? lastMessageRef : null}>
              <ReactMarkdown 
                children={msg.content} 
                components={{
                  a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />
                }} 
              />
            </div>
          );
        })}
        {isLoading && <div className="loading-indicator"><FaSpinner className="spinner" /></div>}
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
