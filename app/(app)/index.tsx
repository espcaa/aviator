import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import Mapbox from "@rnmapbox/maps";
import BottomSheet, {
  BottomSheetView,
  useBottomSheetSpringConfigs,
} from "@gorhom/bottom-sheet";
// Import tailwind config
import { cssInterop } from "nativewind";
import customHandle from "@/components/handle";
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { useAtom } from "jotai";
import { nameAtom } from "@/atoms/userinfo";
import { mapStyleAtom } from "@/atoms/settings";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

cssInterop(BottomSheet, {
  className: { target: "backgroundStyle" },
});
cssInterop(BottomSheetView, {
  className: { target: "style" },
});

cssInterop(MaterialIcons, {
  className: { target: "style" },
});

function isJwtExpired(token: string): boolean {
  try {
    const { exp } = jwtDecode<{ exp?: number }>(token);
    if (!exp) return true;
    return exp * 1000 < Date.now();
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return true;
  }
}

export default function HomeScreen() {
  const [fullName] = useAtom(nameAtom);
  const [mapStyleUrl, setMapStyleUrl] = useAtom(mapStyleAtom);

  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [snappingPoints, setSnappingPoints] = useState<string[]>([
    "15%",
    "40%",
  ]);
  const sheetRef = useRef<BottomSheet>(null);
  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
    if (index === 2) {
      // 2 corresponds to the "90%" snap point
      sheetRef.current?.snapToIndex(1); // Revert to the "50%" snap point
    }
  }, []);

  const insets = useSafeAreaInsets();

  async function fetchMapboxToken() {
    let isValid = true;
    const currentToken = await SecureStore.getItemAsync("mapboxToken");

    if (!currentToken) {
      isValid = false;
    } else {
      // Make sure the token is still valid
      isValid = !isJwtExpired(currentToken);
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
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error("Failed to fetch Mapbox token: " + data.error);
        }
        if (data.token) {
          await SecureStore.setItemAsync("mapboxToken", data.token);
          console.log("Mapbox token updated successfully");
          return data.token;
        } else {
          console.error("No token received from server");
          return null;
        }
      } catch (error) {
        console.error("Error fetching Mapbox token:", error);
        return null;
      }
    } else {
      return currentToken;
    }
  }

  useEffect(() => {
    async function initMapboxToken() {
      const token = await fetchMapboxToken();
      if (token) {
        setMapboxToken(token);
        Mapbox.setAccessToken(token);
      }
      setLoading(false);
    }
    initMapboxToken();
  }, []);

  const handleSatelliteToggle = () => {
    if (mapStyleUrl === "mapbox://styles/mapbox/standard") {
      setMapStyleUrl("mapbox://styles/mapbox/standard-satellite");
    } else {
      setMapStyleUrl("mapbox://styles/mapbox/standard");
    }
  };

  if (loading) {
    return (
      <View style={styles.page}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!mapboxToken) {
    return (
      <View style={styles.page}>
        <Text>Failed to load Mapbox token...</Text>
      </View>
    );
  }

  return (
    <View
      style={{ flex: 1, justifyContent: "center" }}
      className="bg-background-0"
    >
      <View
        style={{
          zIndex: 1000,
          position: "absolute",
          top: insets.top + 10,
          right: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        <Button
          variant="outline"
          style={{
            borderRadius: 50,
            borderWidth: 0,
            width: 60, // Fixed width
            height: 60, // Fixed height
            justifyContent: "center", // Centers the icon
            alignItems: "center", // Centers the icon
          }}
          className="bg-background-0 focus:bg-background-50 "
          onPress={handleSatelliteToggle}
        >
          {mapStyleUrl === "mapbox://styles/mapbox/standard" ? (
            <MaterialIcons
              name="satellite-alt"
              size={24} // Use a fixed size for the icon
              // Use the primary color from the theme

              className="text-primary-500"
            />
          ) : (
            <MaterialIcons name="map" size={24} className="text-primary-500" />
          )}
        </Button>
      </View>
      <Mapbox.MapView
        style={styles.map}
        styleURL={mapStyleUrl}
        projection="globe"
        scaleBarEnabled={false}
        onPress={() => {
          sheetRef.current?.snapToIndex(0); // Snap to the first point (10%)
        }}
      />
      <BottomSheet
        ref={sheetRef}
        onChange={handleSheetChanges}
        animateOnMount={true}
        snapPoints={snappingPoints}
        index={1}
        enableDynamicSizing={false}
        handleComponent={customHandle}
        // @ts-ignore
        // It's fiiiiine
        className="bg-background-0"
      >
        <BottomSheetView
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
          className="bg-background-0"
        >
          <View
            style={{
              marginVertical: 20,
              display: "flex",
              flexDirection: "row",
              // Align items center
              alignItems: "center",
              // Make the two items opposite on width
              justifyContent: "space-between",
              width: "100%",
              paddingHorizontal: 20,
            }}
          >
            <Text size="2xl" className="font-bold">
              Your flights
            </Text>
            <Avatar size="lg">
              <AvatarFallbackText></AvatarFallbackText>
              <AvatarImage
                // Use a svg here
                source={{
                  uri:
                    "https://api.dicebear.com/9.x/initials/png?seed=" +
                    fullName +
                    "&fontWeight=900" +
                    "&backgroundType=gradientLinear,solid" +
                    "&scale=80" +
                    "&fontWeight=900",
                }}
              />
            </Avatar>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  map: {
    flex: 1,
  },
});
