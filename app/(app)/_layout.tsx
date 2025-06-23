import { Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SecureStore from "expo-secure-store";
import { useAtom } from "jotai";
import { emailAtom, nameAtom } from "@/atoms/userinfo";

export default function AppLayout() {
  const [name, setName] = useAtom(nameAtom);
  const [email, setEmail] = useAtom(emailAtom);

  // Update the user info in localStorage

  useEffect(() => {
    async function updateUserInfo() {
      try {
        fetch(`https://aviator.spectralo.hackclub.app/api/users/getUserInfo`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: await SecureStore.getItemAsync("sessionToken"),
          }),
        })
          .then(async (response) => {
            if (response.ok) {
              let data = await response.json();
              setName(data.full_name || "");
              setEmail(data.email || "");
              console.log("User info updated successfully");
              console.log("Name:", data.full_name);
              console.log("Email:", data.email);
              console.log("Atom Name:", name);
              console.log("Atom Email:", email);
            } else {
              console.error("Failed to update user info");
              console.error("Response status:", response.status);
            }
          })
          .catch((error) => {
            console.error("Error updating user info:", error);
          });
      } catch (error) {
        console.error("Error in updateUserInfo:", error);
      }
    }
    updateUserInfo();
  }, []);

  return (
    <GestureHandlerRootView>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
