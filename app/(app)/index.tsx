import { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
  BackHandler,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import Mapbox from "@rnmapbox/maps";
import BottomSheet, {
  BottomSheetView,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
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
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Input, InputField } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";

// wow i'm a secret

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
  const [AirlineSearch, setAirlineSearch] = useState(true);
  const [snappingPoints, setSnappingPoints] = useState<string[]>([
    "15%",
    "40%",
  ]);
  const [textInputFocused, setTextInputFocused] = useState(false);
  const [textInputValue, setTextInputValue] = useState("");
  const [airlineData, setAirlineData] = useState<any[]>([]);
  const sheetRef = useRef<BottomSheet>(null);
  const handleSheetChanges = useCallback((index: number) => {}, []);

  const insets = useSafeAreaInsets();

  // Fetch the airlines when the value changes and AirlineSearch is true
  useEffect(() => {
    async function fetchAirlines() {
      if (textInputValue.trim() !== "" && AirlineSearch) {
        fetch(
          `https://aviator.spectralo.hackclub.app/api/airlines/getAirlines`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sessionToken: await SecureStore.getItemAsync("sessionToken"),
              searchString: textInputValue,
              searchlimit: 10, // You can adjust this limit as needed
            }),
          },
        )
          .then((response) => response.json())
          .then((data) => {
            if (data.error) {
              console.error("Error fetching airlines:", data.error);
              return;
            }
            console.log("Airlines data:", data.airlines);
            setAirlineData(data.airlines || []);
            setAirlineSearch(true);
          })
          .catch((error) => {
            console.error("Error fetching airlines:", error);
          });
      } else {
        setAirlineData([]);
      }
    }
    fetchAirlines();
  }, [textInputValue, AirlineSearch]);

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

  // comments in code are like silkscreen on pcbs!

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

  useEffect(() => {
    const onKeyboardHide = () => {
      console.log("Kbhide");
      if (
        textInputFocused === false &&
        (typeof textInputValue === "string" ? textInputValue.trim() : "") === ""
      ) {
        Keyboard.dismiss();
        setSnappingPoints(["15%", "40%"]);
        sheetRef.current?.snapToIndex(1);
      }
      setTextInputFocused(false);
    };

    const keyboardListener = Keyboard.addListener(
      "keyboardDidHide",
      onKeyboardHide,
    );

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onKeyboardHide();
        return false;
        // Who needs comment fr, just ai :D
      },
    );

    return () => {
      keyboardListener.remove();
      backHandler.remove();
    };
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
            width: 60,
            height: 60,
            justifyContent: "center",
            alignItems: "center",
          }}
          className="bg-background-0 focus:bg-background-50 "
          onPress={handleSatelliteToggle}
        >
          {mapStyleUrl === "mapbox://styles/mapbox/standard" ? (
            <MaterialIcons
              name="satellite-alt"
              size={24}
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
          sheetRef.current?.snapToIndex(0);
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
            width: "100%", // Ensure it takes full width
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
          <Input
            variant="rounded"
            size="lg"
            style={{ width: "90%", marginBottom: 20 }}
            className="bg-background-0"
          >
            <InputField
              placeholder="What airlines are you traveling with?"
              onChangeText={(text) => {
                setTextInputValue(text);
              }}
              onFocus={() => {
                if (textInputFocused === false) {
                  setSnappingPoints(["80%", "80%"]); // Higher snapping point for scrolling
                  setTextInputFocused(true);
                  console.log("Focused");
                }
              }}
              onBlur={() => {
                setSnappingPoints(["15%", "40%"]);
                setTextInputFocused(false);
                console.log("Unfocused");
                sheetRef.current?.snapToIndex(1);
              }}
              onSubmitEditing={() => {
                setTextInputFocused(false);
                if ((textInputValue || "").trim() === "") {
                  setSnappingPoints(["15%", "40%"]);
                  sheetRef.current?.snapToIndex(1);
                }
              }}
            />
          </Input>
          {!AirlineSearch && (
            <Image
              source={require("@/assets/arrowdark.png")}
              style={{ width: 150, height: 150 }}
              contentFit="contain"
            />
          )}
          <BottomSheetScrollView
            style={{ width: "90%", flexGrow: 1 }}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {AirlineSearch &&
              airlineData.map((airline) => (
                <Card
                  key={airline.name}
                  className="mb-2"
                  variant="outline"
                  style={{ padding: 10 }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 5,
                        backgroundColor: "white",
                        marginRight: 10,
                      }}
                    >
                      <Image
                        source={{
                          uri: `https://aviator.spectralo.hackclub.app/api/logo/getLogo?icao=${airline.code}`,
                        }}
                        style={{ width: 40, height: 40, margin: 5 }}
                        contentFit="contain"
                        transition={1000}
                      />
                    </View>
                    <Heading size="xl" className="mt-0">
                      {airline.name} - {airline.code}
                    </Heading>
                  </View>
                </Card>
              ))}
          </BottomSheetScrollView>
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
