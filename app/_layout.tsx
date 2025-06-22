import { Slot, Redirect } from "expo-router";
import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { useAtom } from "jotai";
import { authAtom } from "@/atoms/auth";
import { colorscheme } from "@/atoms/settings";
import { useColorScheme, View } from "react-native";
import * as SecureStore from "expo-secure-store";

export default function RootLayout() {
  const [isLoggedIn, setIsLoggedIn] = useAtom(authAtom);
  const [colorScheme] = useAtom(colorscheme);
  const systemColorScheme = useColorScheme();

  const glueStacksColorscheme =
    colorScheme === "system" ? systemColorScheme : colorScheme;

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
            setIsLoggedIn(false);
          }
        })
        .catch(() => {
          setIsLoggedIn(false);
        });
    } else {
      setIsLoggedIn(false);
    }
  });

  return (
    <View style={{ flex: 1 }} className="bg-background-0">
      <GluestackUIProvider mode={glueStacksColorscheme}>
        {isLoggedIn ? (
          <Redirect href="/(app)" />
        ) : (
          <Redirect href="/(auth)/welcome" />
        )}
        <Slot />
      </GluestackUIProvider>
    </View>
  );
}
