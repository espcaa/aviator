import { Slot, Redirect } from "expo-router";
import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { useAtom } from "jotai";
import { authAtom } from "@/atoms/auth";
import { colorscheme } from "@/atoms/settings";
import { useColorScheme, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useState, useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";

export default function RootLayout() {
  const [isLoggedIn, setIsLoggedIn] = useAtom(authAtom);
  const [colorScheme] = useAtom(colorscheme);
  const systemColorScheme = useColorScheme();
  const [isLoading, setIsLoading] = useState(true);

  const glueStacksColorscheme =
    colorScheme === "system" ? systemColorScheme : colorScheme;

  useEffect(() => {
    setIsLoading(true);
    // Check if the user is logged in
    SecureStore.getItemAsync("refreshToken").then((token) => {
      if (token) {
        // Check if the token is valid by trying to get a session token
        fetch(`https://aviator.spectralo.hackclub.app/api/sessions/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })
          .then(async (response) => {
            if (response.ok) {
              setIsLoggedIn(true);
              // Store the token
              let data = await response.json();
              SecureStore.setItemAsync("sessionToken", data.token);
            } else {
              console.log("Login failed, invalid token");
              setIsLoggedIn(false);
            }
          })
          .catch(() => {
            setIsLoggedIn(false);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        console.log("No refresh token found");
        setIsLoggedIn(false);
        setIsLoading(false);
      }
    });
  }, []);

  return (
    <View style={{ flex: 1 }} className="bg-background-0">
      <GluestackUIProvider
        //@ts-ignore
        mode={glueStacksColorscheme}
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center bg-background-0">
            <Spinner size="large" />
          </View>
        ) : isLoggedIn ? (
          <Redirect href="/(app)" />
        ) : (
          <Redirect href="/(auth)/welcome" />
        )}
        <Slot />
      </GluestackUIProvider>
    </View>
  );
}
