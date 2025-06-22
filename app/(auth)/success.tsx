import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Button, ButtonText } from "@/components/ui/button";
import { Image } from "expo-image";
import { useAtom } from "jotai";
import { authAtom } from "@/atoms/auth";
import { useState } from "react";

export default function Success() {
  const { email } = useLocalSearchParams();
  let emailString = email as string;
  const emailwithoutatpart = emailString?.split("@")[0];
  const [isLoggedIn] = useAtom(authAtom);
  const [errorText, setErrorText] = useState("");

  function handleSubmit() {
    // Get a session token & set isLoggedIn to true
    try {
      fetch(`https://aviator.spectralo.hackclub.app/api/sessions/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${email}`,
        },
      })
        .then((response) => {
          if (response.token) {
            isLoggedIn = true;
          } else {
            setErrorText(
              "Wow something truly unexpected happened!!! Our army of rabbits is working on it.",
            );
          }
        })
        .catch((error) => {
          console.error("Error logging in:", error);
          setErrorText("Server error, please try again later.");
        });
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setErrorText(
        "Wow something truly unexpected happened!!! Our army of rabbits is working on it...",
      );
    }
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
        >
          <ButtonText
            style={{ color: "#FFFFFF", fontSize: 16 }}
            onPress={handleSubmit()}
          >
            Get Started with Aviator
          </ButtonText>
        </Button>
        <Text
          size="md"
          style={{
            textAlign: "center",
            color: "#FFFFFF",
            marginTop: 20,
          }}
        >
          {{ errorText }}
        </Text>
      </View>
    </LinearGradient>
  );
}
