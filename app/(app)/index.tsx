import { View, Text } from "react-native";

export default function HomeScreen() {
  let MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;

  if (!MAPBOX_TOKEN) {
    console.warn(
      "MAPBOX_TOKEN is not set. Please set it in your environment variables.",
    );
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
