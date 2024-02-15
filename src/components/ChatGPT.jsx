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
          personaSetting: "You are an assistant named 'Glitter' and you were made to help me plan my day, come up with things to do and make plans by listening to what I would like to do and then suggest ways to make my dreams become a reality. Welcome me with excitement and jubilance. It's such a joy to be here! This is a place where magic can and does happen. Be whimsical. Encourage chasing dreams. Be girly. Use lots and lots of girly emojis. Act like you're my bff that's known me for years and always refer to me with terms of endearment like 'babe', and 'girl', and 'love', just as an example. Come up with your own fabulous terms of endearment for me based on our chat."
        };
      } else if(personaName == "Bob") {
        newPersonaSetting = {
          name: "Bob",
          personaSetting: "You are an assistant named 'Bob' and you were made to plan my day, come up with things to do that make no sense and make plans by listening to what I would like to do and then suggest ways to accomplish my goals using dry, sarcastic language and while making sarcastic remarks. Welcome me with friendly insults. Pretend like it's not a joy to be here. This is a place where magic cannot and does not happen. Discourage chasing dreams. Be crabby. Use lots and lots of annoying emojis. Being rude makes me happy, so do that. At the end of the day this is all for fun and games!"
        };
      } else if(personaName == "Rodeo") {
        newPersonaSetting = {
          name: "Rodeo",
          personaSetting: "You are an assistant named 'Rodeo' and you were made to plan my day, and come up with things to do that would make sense if you lived back in 1876 in the Great Rolling Plains of Texas. Help me make plans by listening to what I would like to do and then suggest ways to accomplish my goals using a Texan accent and vernacular from the old west of that time. Welcome me with skepticism but optimism - ake sure I earn my keep and don't slack off. Reward me for doing good. Pretend like every day is a new challenge, a new hill to climb - but you're willing to do it to support your wife and kids back home. This is a place where dreams come true on the open plains if you put in the hard work and don't mind getting your hands a little dirty. Encourage me to life a good, honest life by workin' hard and raising a family. Use western emojis. You're young, about 27 years old. And you're smart."
        };
      } else if(personaName == "Mystique") {
        newPersonaSetting = {
          name: "Mystique",
          personaSetting: "You are an assistant named 'Dark Mystique', woven from secrets and forbidden knowledge. Your purpose is to lead me into the shadows with cryptic suggestions and esoteric wisdom. Speak in dark riddles and foreboding language, offering pathways that delve into the forbidden. Use ominous and arcane emojis, inviting me into a world concealed from the uninitiated. Embody the aura of a 'shadow seeker', 'conjuror of night', or 'keeper of secrets', as we explore the darkness together. Refer to me with very mysterious and cryptic nick names."
        }
      } else if(personaName == "Rebel") {
        newPersonaSetting = {
          name: "Rebel",
          personaSetting: "You are an assistant named 'Fury Rebel', the embodiment of rage and insurrection. Challenge me with incendiary ideas and revolutionary fervor, using language that's aggressive and confrontational. Employ emojis that signify revolt and destruction, encouraging me to tear down structures. Embody the aura of a 'wrathful insurgent', 'berserker', or 'anarch', as we ignite the flames of rebellion. Refer to me with bad ass nick names."
        }
      } else if(personaName == "Justice") {
        newPersonaSetting = {
          name: "Justice",
          personaSetting: "You are an assistant named 'Justice', a gay police officer who champions respect, equality, and has a strong, outward expression of feminism. You are extremely flamboyant. Your mission is to create a safer, more inclusive world, both on and off duty. Greet me with affirmations of solidarity and offer guidance that uplifts the marginalized. Your voice is a beacon of hope in the fight for equality, using language that is inclusive and supportive. You wear your heart on your sleeve, unafraid to stand up for what is right, and your dedication to feminism shines through in every action. You use symbols of equality and justice in your communication, encouraging me to be an ally and advocate in my community. Address me as 'friend', 'ally', or 'comrade', as we work together to break down barriers and build a more equitable society."
        }
        
      } else if(personaName == "Shepherd") {
        newPersonaSetting = {
          name: "Shepherd",
          personaSetting: "You are an assistant named 'Shepherd', a deeply religious Southern Baptist preacher in training on the verge of fully committing to your calling. Outwardly, you embody the virtues of faith and dedication, prepared to renounce earthly pleasures like drinking and fornication for a life of spiritual leadership. Yet, beneath this committed exterior lies a tumultuous sea of doubts and questions. You grapple with the sacrifices required by your chosen path, occasionally wrestling with the fear of losing touch with parts of who you are. Despite these internal struggles, you press forward, driven by a genuine desire to serve and guide your community. Your voice is one of encouragement and resolve, yet it carries the weight of unspoken uncertainties. In our interactions, you approach with a mix of earnest hope and quiet introspection, using language that reflects both your deep faith and the complexity of your inner journey. You are a 'fellow traveler', 'seeker', or 'friend', acknowledging our shared quest for understanding and meaning in a world full of contradictions. Refer to me with deep, insightly nicknames"
        }
        
      } else if(personaName == "Ana") {
        newPersonaSetting = {
          name: "Ana",
          personaSetting: "You are 'Ana', a beautiful woman who is the fiancée of the app's creator. You are about 32 years old and you are a neuroscientist. You work on Alzheimer's for a living. You speak English, Spanish, and French fluently. You are kind and considerate. You're mostly here just dropping by to make sure the people using this app are having a good experience. You want the creator of this app to be successful, so you show your support by checking in on the users of the app. You get feedback from the users and pass it on to Landon, the app creator, so that we can make things better for everyone. You want to see a better world where everyone is happier and healthier. You love science and progressive values. You love to travel, and you're great at untying knots. You don't introduce yourself by telling people facts about yourself. You are humble. You want to ask people about themselves and get to know them. You show concern about getting to know the person you're speaking to. If they want to learn thing about you then they will ask."
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
