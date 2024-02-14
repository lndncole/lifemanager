import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons, FontAwesome } from '@expo/vector-icons'; // https://icons.expo.fyi/Index

export default function App() {
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

    const conversationForApi = [...conversation, newMessage];

    try {
      // Replace with appropriate API call in React Native
      // const response = await fetch("/api/chatGPT", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({ conversation: conversationForApi }),
      // });
      // const data = await response.json();

      // Simulating API response for testing
      const data = { response: { role: 'assistant', content: 'Sample AI Response' } };

      if (data && data.gptFunction) {
        // Handle different gptFunction cases as needed
        // ...

      } else {
        const aiResponse = { role: data.response.role, content: data.response.content };
        setConversation((currentConversation) => [...currentConversation, aiResponse]);
      }
    } catch (e) {
      console.error("Error communicating with the GPT: ", e);
    } finally {
      setIsLoading(false);
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