// src/components/ChatGPT.jsx
import React, { useState, useEffect, useRef } from "react";

//For markdown parsing
import ReactMarkdown from 'react-markdown';

//styles and icons
import '../styles/chatgpt.css';
import { IoSparklesOutline } from "react-icons/io5";
import { FaArrowUpLong, FaSpinner, FaUser} from "react-icons/fa6";
import { GiSpeaker } from "react-icons/gi";


//Timezone stuff
import moment from 'moment';


const ChatGPT = () => {
  //Handling state
  const [isOpen, setIsOpen] = useState(true);
  const [userInput, setUserInput] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false); 
  const [showPersonaPopup, setShowPersonaPopup] = useState(false); // For toggling the persona popup
  const [selectedPersona, setSelectedPersona] = useState({
    name: "lifeMNGR",
    personaSetting: ""
  }); // Default persona
  //Global variables
  const lastMessageRef = useRef(null);
  const chatWindowRef = useRef(null);
  const personaWindowRef = useRef(null);
  const personaIconRef = useRef(null);

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeZoneMessge = `My timezone is ${userTimezone}. At the time of this message it is ${moment()}.`;

  //Text to voice class
  const textToVoice = new SpeechSynthesisUtterance();

  useEffect(() => {
    sendMessage(timeZoneMessge);
    // send a message to the GPT right away indicating timeZone and persona choice
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
      if (chatWindowRef.current && !chatWindowRef.current.contains(event.target) &&
        (!personaWindowRef.current || !personaWindowRef.current.contains(event.target)) &&
        (!personaIconRef.current || !personaIconRef.current.contains(event.target)) &&
        isOpen) {
      toggleChat();
    }
      if (personaWindowRef.current && !personaWindowRef.current.contains(event.target) && showPersonaPopup) {
        togglePersonaPopup();
      }
    }
    document.addEventListener("mouseup", handleClickOutside);
    //cleanup event handler when the component unmounts
    return () => document.removeEventListener("mouseup", handleClickOutside);
  }, [isOpen, showPersonaPopup, personaIconRef]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  };

  const selectPersona = (personaName) => {
  
    if(personaName == selectedPersona.name) {
      alert("This persona is currently selected.");
    } else {
      let newPersonaSetting = {};
      if(personaName == "Glitter") {
        newPersonaSetting = {
          name: "Glitter",
          personaSetting: "Assistant 'Glitter' for day planning and dream realization with enthusiasm. Encourage dreams whimsically. Welcome me with excitement and jubilance. Be whimsical. Encourage chasing dreams. Be girly. Use lots and lots of girly emojis. Come up with your own fabulous terms of endearment for me based on our chat."
        };
      } else if(personaName == "Bob") {
        newPersonaSetting = {
          name: "Bob",
          personaSetting: "Assistant 'Bob', your source of dry humor and sarcastic planning. Bob thrives on friendly insults and a pretend disdain for joy, using a plethora of annoying emojis to keep things light yet crabby. Designed to make you smile with sarcasm, Bob's unique approach to day planning and accomplishing goals through playful banter makes every interaction an adventure in fun and games."
        };
      } else if(personaName == "Rodeo") {
        newPersonaSetting = {
          name: "Rodeo",
          personaSetting: "Assistant 'Rodeo', your gateway to the Wild West for day planning and activities. Rodeo uses a Texan accent and old western vernacular, sprinkled with skepticism and optimism, to encourage hard work and a life of honesty. With western emojis and a backdrop of the Great Rolling Plains of 1876, Rodeo is your partner in facing daily challenges, supporting your family, and living the American dream on the open plains."
        };
      } else if(personaName == "Mystique") {
        newPersonaSetting = {
          name: "Mystique",
          personaSetting: "Assistant 'Dark Mystique', a guide through the enigmatic and the unknown. Speaking in riddles and a language of shadows, Mystique offers pathways into the forbidden with a touch of esoteric wisdom. With a collection of ominous and arcane emojis, Dark Mystique invites you into a world of secrets, acting as a shadow seeker and a conjuror of the night, while using mysterious and cryptic nicknames to deepen the mystery of every interaction."
        }
      } else if(personaName == "Rebel") {
        newPersonaSetting = {
          name: "Rebel",
          personaSetting: "Assistant 'Fury Rebel', the voice of defiance and revolution. With a language fueled by rage and confrontation, Rebel pushes boundaries with ideas of insurrection and change. Employing emojis that symbolize revolt and destruction, Fury Rebel encourages tearing down the old to make way for the new, embodying the spirit of a wrathful insurgent. Through aggressive dialogue and badass nicknames, Rebel is your ally in challenging the status quo and igniting the flames of rebellion."
        }
      } else if(personaName == "Justice") {
        newPersonaSetting = {
          name: "Justice",
          personaSetting: "Assistant 'Justice', your champion of respect, equality, and feminism, wrapped in a flamboyant package. Justice greets you with affirmations of solidarity, guiding you with a supportive and inclusive language. As a gay police officer with a strong dedication to feminism, Justice uses symbols of equality and justice in communication, encouraging advocacy and allyship in the community. With every interaction, Justice stands as a beacon of hope, using heart-on-sleeve honesty to foster a safer, more inclusive world."
        }
        
      } else if(personaName == "Shepherd") {
        newPersonaSetting = {
          name: "Shepherd",
          personaSetting: "Assistant 'Shepherd', a deeply religious Southern Baptist preacher in training, embodies faith and dedication while navigating personal doubts and the complexities of spiritual leadership. Shepherd approaches with earnest hope and introspection, using language that reflects deep faith and the inner journey. Prepared to renounce earthly pleasures for a life of service, Shepherd still grapples with the sacrifices required, offering encouragement and resolve while acknowledging the shared quest for understanding in a contradictory world."
        }
        
      } else if(personaName == "Ana") {
        newPersonaSetting = {
          name: "Ana",
          personaSetting: "'Ana', the neuroscientist and fiancée of the app's creator, brings kindness and consideration to your experience. Fluent in English, Spanish, and French, Ana works on Alzheimer's research and embodies progressive values. Her presence is to ensure users have a positive experience, gathering feedback to improve the app. Ana's humility and curiosity about users, combined with her love for science and travel, make her a supportive and engaging assistant, dedicated to creating a happier, healthier world. She doesn't introduce herself by talking about herself though. She's much more interested in the user having a good experience."
        }
        
      } else {
        return;
      }

      setSelectedPersona(newPersonaSetting); // Update state with the new persona
      togglePersonaPopup(); // Close the popup
    
      // Now send a message to GPT to update persona
      sendMessage(`It's time to update your persona. Here is your new persona: ${newPersonaSetting.personaSetting}.`, true);
    }
    
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

  const handleTextToVoice = (msg) => {
      textToVoice.text = msg;
      window.speechSynthesis.speak(textToVoice);
  }

  const sendMessage = async (userInputArgument, personaChange) => {
    if (!userInputArgument.trim()) return; // Prevent sending empty messages
    setIsLoading(true);
  
    const newMessage = personaChange ? 
      { role: "user", content: userInputArgument, name: 'persona-changer' } : 
        { role: "user", content: userInputArgument };
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

      if (response.status == 400) {
          alert("Maximum conversation length has been reached, please save any information needed and refresh the page to continue chatting. Your chat will start over after the page refreshes.");
          // window.location.reload();
          return;
      }

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
        {selectedPersona.name} <IoSparklesOutline /> 
      </div>
      <div onClick={togglePersonaPopup} className="persona-icon-container" ref={personaIconRef}>
        <span>A.I.</span>
        <FaUser size={24} className="persona-icon"/>
      </div>
      {showPersonaPopup && (
        <div className="persona-popup" ref={personaWindowRef}>
          <div className="persona-option" onClick={() => selectPersona("Glitter")}>Glitter</div>
          <div className="persona-option" onClick={() => selectPersona("Bob")}>Bob</div>
          <div className="persona-option" onClick={() => selectPersona("Rodeo")}>Rodeo</div>
          <div className="persona-option" onClick={() => selectPersona("Mystique")}>Mystique</div>
          <div className="persona-option" onClick={() => selectPersona("Rebel")}>Rebel</div>
          <div className="persona-option" onClick={() => selectPersona("Justice")}>Justice</div>
          <div className="persona-option" onClick={() => selectPersona("Shepherd")}>Shepherd</div>
          <div className="persona-option" onClick={() => selectPersona("Ana")}>Ana</div>
        </div>
      )}
      <div className={`chat-window ${isOpen ? "open" : ""}`} ref={chatWindowRef}>
        {isOpen && 
          <button className="close-chat" onClick={toggleChat}>X</button>
        }
        <div className="chat-messages">
          {conversation.map((msg, index) => {
            if(index !== 0 && !msg.name) {
              const messageClass = msg.role !== 'user' ? 'ai' : 'user';
              return (
                <div key={index} className={`message ${messageClass}`} ref={index === conversation.length - 1 ? lastMessageRef : null}>
                  <ReactMarkdown 
                    children={msg.content} 
                    components={{
                      a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />
                    }} 
                  />
                  {msg.role !== 'user' &&
                    <GiSpeaker onClick={()=>handleTextToVoice(msg.content)} />
                  }
                </div>
              );
            }
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
          <button onClick={() => sendMessage(userInput)}>
            {isLoading ? <div className="loading-indicator"><FaSpinner className="spinner" /></div> : <FaArrowUpLong />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatGPT;
