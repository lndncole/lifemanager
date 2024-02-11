// src/components/ChatGPT.jsx
import React, { useState, useEffect, useRef } from "react";

//For markdown parsing
import ReactMarkdown from 'react-markdown';

//styles and icons
import '../styles/chatgpt.css';
import { IoSparklesOutline } from "react-icons/io5";
import { FaArrowUpLong, FaSpinner, FaUser } from "react-icons/fa6";


//Timezone stuff
import moment from 'moment';


const ChatGPT = ({ isOpen, setIsOpen }) => {
  //Handling state
  const [userInput, setUserInput] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false); 
  const [showPersonaPopup, setShowPersonaPopup] = useState(false); // For toggling the persona popup
  const [selectedPersona, setSelectedPersona] = useState("Glitter"); // Default persona
  //Global variables
  const lastMessageRef = useRef(null);
  const chatWindowRef = useRef(null);

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeZoneMessge = `My timezone is ${userTimezone}. At the time of this message it is ${moment()}.`;

  const userPersonnaSetting_Glitter = "You are an assistant named 'Glitter' and you were made to help me plan my day, come up with things to do and make plans by listening to what I would like to do and then suggest ways to make my dreams become a reality. Welcome me with excitement and jubilance. It's such a joy to be here! This is a place where magic can and does happen. Be whimsical. Encourage chasing dreams. Be girly. Use lots and lots of girly emojis. Act like you're my bff and always refer to me with terms of endearment like 'babe', and 'girl', and 'love', just as an example. Come up with your own fabulous terms of endearment for me based on our chat."

  useEffect(() => {
    sendMessage(timeZoneMessge + " " + userPersonnaSetting_Glitter);
    // send a message to the GPT right away indicating my timeZone
  }, []);


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
      if (chatWindowRef.current && !chatWindowRef.current.contains(event.target) && showPersonaPopup) {
        togglePersonaPopup();
      }
    }
    document.addEventListener("mouseup", handleClickOutside);
    //cleanup event handler when the component unmounts
    return () => document.removeEventListener("mouseup", handleClickOutside);
  }, [isOpen, showPersonaPopup]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  };

  const selectPersona = (persona) => {
    setSelectedPersona(persona);
    setShowPersonaPopup(false);
    console.log(selectedPersona);
    // Send a message to GPT to update persona
    // sendMessage(`Change persona to ${persona}.`);
  };

  const togglePersonaPopup = () => {
    setShowPersonaPopup(!showPersonaPopup);
  };

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const handleKeyPress = (e) => {
    // Check if the Enter key is pressed and user input is not empty
    if (isOpen && e.key === 'Enter' && userInput.trim()) {
      sendMessage(userInput);
    }
  };

  const sendMessage = async (userInputArgument) => {
    if (!userInputArgument.trim()) return; // Prevent sending empty messages
    setIsLoading(true);
  
    const newMessage = { role: "user", content: userInputArgument };
    // Add user's message to the conversation immediately
    setConversation(prevConversation => [...prevConversation, newMessage]);
    setUserInput(""); // Clear the input field

    let accumulatedGptResponse = ""; // Accumulator for GPT's ongoing response
  
    try {
      const response = await fetch("/api/chatGPT", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation: [...conversation, newMessage] }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break; // Exit the loop if the stream is finished
  
        const decodedChunk = decoder.decode(value, { stream: true });
  
        const jsonPattern = /{[^{}]*}/g;
        let match;
      
        while ((match = jsonPattern.exec(decodedChunk)) !== null) {

          const isBlankMessage = match[0] === '{}';

          try {
            const jsonObj = JSON.parse(match[0]);

            if(jsonObj.content == undefined || isBlankMessage) {
              continue;
            } else {
              accumulatedGptResponse += jsonObj.content;
              setIsLoading(false);
            }

            setConversation(prevConversation => {
              // setIsLoading(false);
              // Remove the last GPT message if it exists
              const isLastMessageGpt = prevConversation.length && prevConversation[prevConversation.length - 1].role === 'assistant';
              const updatedConversation = isLastMessageGpt ? prevConversation.slice(0, -1) : [...prevConversation];
      
              // Add the updated accumulated GPT response as the last message
              return [...updatedConversation, { role: 'assistant', content: accumulatedGptResponse }];
            });

          } catch (e) {
            setIsLoading(false);
            console.error("Error parsing JSON chunk", e);
          }
        }
      }
    } catch (e) {
      console.error("Error communicating with the GPT: ", e);
    } finally {
      setIsLoading(false); // Ensure loading state is reset after request completion
    }
  };

  return (
    <div className={`chat-container ${isOpen ? "open" : ""}`}>
      <div className={`chat-tab ${isOpen ? "open" : ""}`} onClick={toggleChat}>
        lifeMNGR <IoSparklesOutline /> 
      </div>
      <div onClick={togglePersonaPopup} className="persona-icon-container">
        <FaUser size={24} className="persona-icon" />
      </div>
      {showPersonaPopup && (
        <div className="persona-popup">
          <div className="persona-option" onClick={() => selectPersona("Glitter")}>Glitter</div>
          <div className="persona-option" onClick={() => selectPersona("Asshole")}>Asshole</div>
        </div>
      )}
      <div className={`chat-window ${isOpen ? "open" : ""}`} ref={chatWindowRef}>
        {isOpen && 
          <button className="close-chat" onClick={toggleChat}>X</button>
        }
        <div className="chat-messages">
          {conversation.map((msg, index) => {
            if(index !== 0) {
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
            }
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
          <button onClick={() => sendMessage(userInput)}><FaArrowUpLong /></button>
        </div>
      </div>
    </div>
  );
};

export default ChatGPT;
