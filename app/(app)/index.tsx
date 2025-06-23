import { View, Text } from "react-native";
import * as SecureStore from "expo-secure-store";
import jwt from "jsonwebtoken";

export default function HomeScreen() {
  // Fetch the mapbox token if the current one is invalid


  function isJwtExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as { exp?: number } | null;
      if (!decoded || !decoded.exp) return true;

      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      return decoded.exp < now;
    } catch (e) {
      console.error("Error decoding JWT:", e);
      return true;
    }
  }


  async function fetchMapboxToken() {
    // Check if the current token in SecureStore exists/is valid
    let isValid = true

    const currentToken = await SecureStore.getItemAsync("mapboxToken");
    if (!currentToken) {
      isValid = false;
    }
    if (!currentToken) {
      isValid = false
    } else {
      // Check if the token exp date is passed
      isValid = isJwtExpired(currentToken);
    }

    if (!isValid) {
      try {
        const response = await fetch(
          "https://aviator.spectralo.hackclub.app/api/maps/getToken",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sessionToken: await SecureStore.getItemAsync("sessionToken"),
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch Mapbox token");
        }

        const data = await response.json();
        if (data.token) {
          await SecureStore.setItemAsync("mapboxToken", data.token);
          console.log("Mapbox token updated successfully");
        } else {
          console.error("No token received from server");
        }
      } catch (error) {
        console.error("Error fetching Mapbox token:", error);
      }
    }



  return (
    <View
      style={{
        justifyContent: "center",
        flex: 1,
      }}
      className="bg-background-0"
    >
      <View style={{ marginHorizontal: 30 }}>
        <Text>Welcome to the Home Screen!</Text>
      </View>
    </View>
  );
}
