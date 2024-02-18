import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons, FontAwesome } from '@expo/vector-icons'; // https://icons.expo.fyi/Index
import 'react-native-polyfill-globals/auto'; // DO NOT DELETE!!!! This is to polyfill the fetch streaming! See: https://github.com/lndncole/lifemanager/pull/43

const ChatGPT = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const lastMessageRef = useRef(null);
  const chatWindowRef = useRef(null);

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollToEnd({ animated: true });
    }
  }, [conversation]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (text) => {
    setUserInput(text);
  };

  const handleKeyPress = (e) => {
    if (isOpen && e.key === 'Enter' && userInput.trim()) {
      sendMessage();
    }
  };

  const sendMessage = async () => {
    setIsLoading(true);

    const newMessage = { role: "user", content: userInput };
    setConversation((prevConversation) => [...prevConversation, newMessage]);
    setUserInput("");

    let accumulatedGptResponse = ""; // Accumulator for GPT's ongoing response

    const password = process.env.QUERY_STRING_PASSWORD;
    console.log(password);
    try {
      const response = await fetch("https://www.lifemngr.co/api/chatGPT?password=" +  process.env.QUERY_STRING_PASSWORD, { reactNative: { textStreaming: true },
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation: [...conversation, newMessage] })
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
          console.log("Hrtr");
          const isBlankMessage = match[0] === '{}';

          try {
            const jsonObj = JSON.parse(match[0]);
            console.log("JSONOBJ", jsonObj);
            if(jsonObj.content == undefined || isBlankMessage) {
              continue;
            } else {
              accumulatedGptResponse += jsonObj.content;
              setIsLoading(false);
            }
            console.log(accumulatedGptResponse);
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>lifeMNGR {/* <Ionicons name="md-flash" size={24} color="black" /> */}</Text>
        </View>
        <View style={styles.chatContainer}>
          <ScrollView
            ref={chatWindowRef}
            contentContainerStyle={styles.chatContent}
            style={styles.chatMessages}
            onContentSizeChange={() => chatWindowRef.current.scrollToEnd({ animated: true })}
          >
            {conversation.map((msg, index) => {
              const messageStyle = msg.role !== 'user' ? styles.aiMessage : styles.userMessage;
              return (
                <View key={index} style={{ ...messageStyle, padding: 8, marginVertical: 4 }}>
                  <Text>{msg.content}</Text>
                </View>
              );
            })}
            {isLoading && (
              <View style={styles.loadingIndicator}>
                <FontAwesome name="spinner" size={24} color="black" />
              </View>
            )}
          </ScrollView>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={userInput}
              onChangeText={handleInputChange}
              placeholder="Type your message..."
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
              <FontAwesome name="arrow-up" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

export default ChatGPT;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 100,
    backgroundColor: 'lightblue',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 24
  },
  chatContainer: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  chatContent: {
    padding: 16,
    flexGrow: 1,
  },
  chatMessages: {
    flex: 1,
  },
  aiMessage: {
    backgroundColor: 'lightgreen',
    textAlign: 'right',
  },
  userMessage: {
    backgroundColor: 'lightgrey'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    marginRight: 8,
    padding: 8,
  },
  sendButton: {
    backgroundColor: 'lightblue',
    borderRadius: 8,
    padding: 8,
  },
  loadingIndicator: {
    alignItems: 'center',
    marginVertical: 10,
  },
});