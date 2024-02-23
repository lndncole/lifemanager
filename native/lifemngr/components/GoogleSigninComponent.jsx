import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons, FontAwesome } from '@expo/vector-icons'; // https://icons.expo.fyi/Index
import { useState } from 'react';

const GoogleSigninComponent = () => {
    const [isSigninInProgress, setSigninInProgress] = useState(false);

    try {
        GoogleSignin.configure({
            iosClientId: "823473139699-sv8avim8avqfp39mg9ve86paiq9ga54v.apps.googleusercontent.com",
        })
        // GoogleSignin.configure({
        //     scopes: [
        //     "https://www.googleapis.com/auth/userinfo.profile",
        //     ],
        //     webClientId: Platform.OS === 'android' ? 'xxx-xxx.apps.googleusercontent.com' : 'xxx-xxx.apps.googleusercontent.com',
        //     iosClientId: Platform.OS === 'ios' ? 'xxx-xxx.apps.googleusercontent.com' : undefined,
        //     offlineAccess: false,
        // });
        //await GoogleSignin.hasPlayServices();
        
        //console.log(userInfo);   
    } catch (error) {
        console.log(error);
    }

    const signIn = async () => {
        try {
          await GoogleSignin.hasPlayServices();
          const userInfo = await GoogleSignin.signIn();
          console.log(userInfo);
        } catch (error) {
            console.log(error);
          if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            // user cancelled the login flow
          } else if (error.code === statusCodes.IN_PROGRESS) {
            // operation (e.g. sign in) is in progress already
          } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            // play services not available or outdated
          } else {
            // some other error happened
          }
        }
      };

    return (
        // Make button to sign in with Google
        <View style={styles.container}> 
            <GoogleSigninButton
                size={GoogleSigninButton.Size.Wide}
                color={GoogleSigninButton.Color.Dark}
                onPress={this.signIn}
                disabled={this.isSigninInProgress}
            />
        </View>
    )     
}

export default GoogleSigninComponent;

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',   
    }
  });