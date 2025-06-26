import React, { useState } from "react";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { Button, ButtonText } from "@/components/ui/button";
import { Ionicons } from "@expo/vector-icons";
import {
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
} from "@/components/ui/checkbox";
import { useRouter } from "expo-router";
import { Spinner } from "@/components/ui/spinner";
import * as SecureStore from "expo-secure-store";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (!checkEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // Get a refresh token
      const response = await fetch(
        `https://aviator.spectralo.hackclub.app/api/sessions/getRefreshToken`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        // Handle non-OK responses based on server error format
        if (response.status === 401) {
          setError("Invalid email or password");
        } else {
          // Use details or error from the server response
          setError(
            data.details ||
              data.error ||
              "An unknown error occurred while logging in.",
          );
        }
      } else {
        // Handle OK response
        console.log("Login successful:", data);
        if (data.token) {
          console.log("Storing refresh token securely: ", data.token);
          await SecureStore.setItemAsync("refreshToken", data.token);
          router.push(`/(auth)/success?email=${email}`);
        } else {
          setError("Login successful but no refresh token received.");
        }
      }
    } catch (error) {
      setError("An error occurred while connecting to the server," + error);
    } finally {
      setIsLoading(false); // Always stop loading
    }
  }

  function checkEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  if (isLoading) {
    return (
      <View
        style={{
          justifyContent: "center",
          flex: 1,
        }}
        className="bg-background-0"
      >
        <Spinner size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View
        style={{
          justifyContent: "center",
          flex: 1,
        }}
        className="bg-background-0"
      >
        <View style={{ marginHorizontal: 30 }}>
          <Text size="4xl" bold>
            Login
          </Text>
          <Text className="mt-2" size="xl">
            Welcome back!
          </Text>
          <View style={{ marginHorizontal: 10, marginTop: 10 }}>
            <Text className="mt-4" size="xl">
              Email
            </Text>
            <Input
              variant="outline"
              size="xl"
              className="mt-2"
              isDisabled={false}
              isInvalid={false}
              isReadOnly={false}
            >
              <InputField
                placeholder="name@domain.tld"
                value={email}
                onChangeText={setEmail}
              />
            </Input>
            <Text className="mt-4" size="xl">
              Password
            </Text>

            <View className="flex flex-row content-center items-center">
              <Input
                variant="outline"
                size="xl"
                className="mt-2 w-max"
                style={{ flex: 1 }}
                isDisabled={false}
                isInvalid={false}
                isReadOnly={false}
              >
                <InputField
                  type={passwordVisible ? "text" : "password"}
                  placeholder="yourpassword"
                  value={password}
                  onChangeText={(text) => setPassword(text)}
                />
              </Input>
            </View>
            <Checkbox
              size="md"
              onChange={(value) => {
                setPasswordVisible(value);
              }}
              value=""
              className="mt-4"
            >
              <CheckboxIndicator>
                <CheckboxIcon
                  as={Ionicons}
                  //@ts-ignore
                  name="checkmark"
                />
              </CheckboxIndicator>
              <CheckboxLabel>Show password</CheckboxLabel>
            </Checkbox>
            <Button
              onPress={handleLogin}
              className="mt-8 bg-green-700 outline outline-white"
              size="xl"
            >
              <ButtonText className="text-white">Login</ButtonText>
            </Button>
            <Text size="xl" bold className="text-red-600 mt-2">
              {error}
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
