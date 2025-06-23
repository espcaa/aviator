import { View } from "react-native";

export default function CustomHandle() {
  return (
    <View
      style={{
        width: 40,
        height: 6,
        borderRadius: 3,

        alignSelf: "center",
        marginVertical: 8,
      }}
      className="bg-gray-300 dark"
    />
  );
}
