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
  
        // Process the decoded chunk to extract message content
        // Here, adjust your logic to extract the content from the chunk

        const jsonPattern = /{[^{}]*}/g;
        let match;
      
        while ((match = jsonPattern.exec(decodedChunk)) !== null) {
          try {
            const jsonObj = JSON.parse(match[0]);

            accumulatedGptResponse += jsonObj.content;

            setConversation(prevConversation => {
              // Remove the last GPT message if it exists
              const isLastMessageGpt = prevConversation.length && prevConversation[prevConversation.length - 1].role === 'assistant';
              const updatedConversation = isLastMessageGpt ? prevConversation.slice(0, -1) : [...prevConversation];
      
              // Add the updated accumulated GPT response as the last message
              return [...updatedConversation, { role: 'assistant', content: accumulatedGptResponse }];
            });
      
            // After processing a match, you might want to do something with jsonObj
            // For example, updating UI or state
          } catch (e) {
            console.error("Error parsing JSON chunk", e);
          }
        }
      }
    } catch (e) {
      console.error("Error communicating with the GPT: ", e);
    } finally {
      setIsLoading(false);
    }
  };
  

  const sendMessage1 = async () => {
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
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      // Accumulate chunks for processing
      let accumulatedChunks = '';
      
      while(true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        // Decode each chunk
        const decodedChunk = decoder.decode(value, {stream: true});
        // Accumulate decoded chunk
        accumulatedChunks += decodedChunk;
      
        // Handle accumulated chunks
        // Use a RegExp to find JSON objects, assuming they are not nested
        const jsonPattern = /{[^{}]*}/g;
        let match;
        let parsedData = [];
      
        while ((match = jsonPattern.exec(accumulatedChunks)) !== null) {
          try {
            const jsonObj = JSON.parse(match[0]);
            parsedData.push(jsonObj);
      
            // After processing a match, you might want to do something with jsonObj
            // For example, updating UI or state
          } catch (e) {
            console.error("Error parsing JSON chunk", e);
          }
        }
      
        // Assuming all JSON strings are parsed correctly, clear accumulatedChunks
        // Or implement a more sophisticated method to only remove processed parts
        accumulatedChunks = '';
      
        for (const chunk of parsedData) {
          //use chunk.content to update the chat as if the GPT is chatting live
          console.log(chunk.content);
          if (chunk.content) {
            // Update the conversation state to render this message
            setConversation((prevConversation) => [
              ...prevConversation,
              { role: 'assistant', content: chunk.content },
            ]);
          }
        }
      }
    
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
