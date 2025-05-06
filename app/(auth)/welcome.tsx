import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useRouter } from "expo-router";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";

export default function LoginScreen() {
  const router = useRouter();

  return (
    <LinearGradient colors={["#4c669f", "rgba(1,1,1,1)"]} style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <View style={{ marginHorizontal: 30 }}>
          <Image
            source={require("@/assets/images/a320.png")}
            style={{
              width: "100%",
              height: 100,
              alignSelf: "center",
              marginBottom: 40,
            }}
            contentFit="contain"
            transition={1000}
          />
          <Text size="4xl" bold className="text-white">
            Welcome!
          </Text>
          <Text size="lg" className="text-white">
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
    </LinearGradient>
  );
}
