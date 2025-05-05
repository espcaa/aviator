import { Slot, Redirect } from "expo-router";
import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { useAtom } from "jotai";
import { authAtom } from "@/atoms/auth";
import { colorscheme } from "@/atoms/settings";
import { useColorScheme, View } from "react-native";

export default function RootLayout() {
  const [isLoggedIn] = useAtom(authAtom);
  const [colorScheme] = useAtom(colorscheme);
  const systemColorScheme = useColorScheme();

  const glueStacksColorscheme =
    colorScheme === "system" ? systemColorScheme : colorScheme;

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
