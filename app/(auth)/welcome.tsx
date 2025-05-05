import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useRouter } from "expo-router";
import { View } from "react-native";

export default function LoginScreen() {
  const router = useRouter();

  return (
    <View
      style={{ flex: 1, justifyContent: "center" }}
      className="bg-background-0"
    >
      <View style={{ marginHorizontal: 30 }}>
        <Text size="4xl" bold>
          Welcome!
        </Text>
        <Text size="lg" className="text">
          Please login or sign up to continue.
        </Text>
        <Button size="xl" className="mt-8">
          <ButtonText>Login</ButtonText>
        </Button>
        <Button
          size="xl"
          className="mt-4"
          variant="outline"
          onPress={() => {
            router.navigate("/(auth)/signup");
          }}
        >
          <ButtonText>Sign Up</ButtonText>
        </Button>
      </View>
    </View>
  );
}
