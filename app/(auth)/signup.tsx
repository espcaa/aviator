import React, { useState } from "react";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { KeyboardAvoidingView, Platform, View } from "react-native";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
            <Input
              variant="outline"
              size="xl"
              className="mt-2"
              isDisabled={false}
              isInvalid={false}
              isReadOnly={false}
            >
              <InputField
                type="password"
                placeholder="********"
                value={password}
                onChangeText={setPassword}
              />
            </Input>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
