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

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [secondPassword, setSecondPassword] = useState("");
  const router = useRouter();

  function handleSignUp() {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (!checkEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== secondPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");

    router.push(`/(auth)/otp?email=${email}&password=${password}`);
  }

  function checkEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
            Sign Up
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
            <Text className="mt-4" size="xl">
              Re-enter your password
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
                  value={secondPassword}
                  onChangeText={(text) => setSecondPassword(text)}
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
                <CheckboxIcon as={Ionicons} name="checkmark" />
              </CheckboxIndicator>
              <CheckboxLabel>Show passwords</CheckboxLabel>
            </Checkbox>
            <Button
              onPress={handleSignUp}
              className="mt-8 bg-green-700 outline outline-white"
              size="xl"
            >
              <ButtonText className="text-white">Sign Up</ButtonText>
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
