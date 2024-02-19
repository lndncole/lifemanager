import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons, FontAwesome } from '@expo/vector-icons'; // https://icons.expo.fyi/Index
import 'react-native-polyfill-globals/auto'; // DO NOT DELETE!!!! This is to polyfill the fetch streaming! See: https://github.com/lndncole/lifemanager/pull/43


import ChatGPT from "./components/chatGPT"

export default function App() {

  return (
    // Make view take up the whole screen
    <View style={{ flex: 1 }}>
        <ChatGPT />
    </View>
  )
}