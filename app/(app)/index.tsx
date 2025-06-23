import { View, Text } from "react-native";

export default function HomeScreen() {
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
