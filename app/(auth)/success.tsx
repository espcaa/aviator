import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Button, ButtonText } from "@/components/ui/button";
import { Image } from "expo-image";
import { useAtom } from "jotai";
import { authAtom } from "@/atoms/auth";
import { useEffect, useRef, useState } from "react";
import * as SecureStore from "expo-secure-store";

export default function Success() {
  const { email } = useLocalSearchParams();
  let emailString = email as string;
  const emailwithoutatpart = emailString?.split("@")[0];
  const [isLoggedIn, setIsLoggedIn] = useAtom(authAtom);
  const [errorText, setErrorText] = useState("");
  // Track mounted status
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function handleSubmit() {
    // Get a session token & set isLoggedIn to true
    // get the refresh token from secure store
    SecureStore.getItemAsync("refreshToken").then(async (token) => {
      try {
        console.log("Token:", token);
        const response = await fetch(
          `https://aviator.spectralo.hackclub.app/api/sessions/login`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json();
        if (data.token) {
          setIsLoggedIn(true);
        } else {
          console.log("Login failed:", data);
          setErrorText(
            "Wow something truly unexpected happened!!! Our army of rabbits is working on it.",
          );
        }
      } catch (error) {
        console.error("Error logging in:", error);
        if (mounted.current) {
          setErrorText("Server error, please try again later.");
        }
      }
    });
  }

  return (
    <LinearGradient
      colors={["#4CAF50", "#2E7D32"]}
      style={{ flex: 1, paddingHorizontal: 20 }}
    >
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Image
          source={require("@/assets/images/a380.png")}
          style={{
            width: 250,
            height: 250,
            alignSelf: "center",
            marginBottom: 30,
          }}
          contentFit="contain"
          transition={1000}
        />

        <Text size="4xl" bold style={{ textAlign: "center", color: "#FFFFFF" }}>
          Welcome to Aviator!
        </Text>

        <Text
          size="lg"
          style={{
            textAlign: "center",
            color: "#E8F5E9",
            marginTop: 20,
            lineHeight: 24,
          }}
        >
          Hi <Text bold>{emailwithoutatpart}</Text>, We&apos;re so excited to
          have you onboard!
        </Text>

        <Button
          className="mt-8"
          size="xl"
          style={{ backgroundColor: "#1B5E20", borderRadius: 25 }}
          onPress={handleSubmit}
        >
          <ButtonText style={{ color: "#FFFFFF", fontSize: 16 }}>
            Get Started with Aviator
          </ButtonText>
        </Button>
        <Text
          size="xl"
          bold
          className="text-red-600 mt-2 bg-background-0 p-3 rounded-lg"
        >
          {errorText}
        </Text>
      </View>
    </LinearGradient>
  );
}
