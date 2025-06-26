import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Keyboard } from "react-native";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import Mapbox from "@rnmapbox/maps";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
// Import tailwind config
import { cssInterop } from "nativewind";
import { Text } from "@/components/ui/text";
import { useAtom } from "jotai";
import { mapStyleAtom } from "@/atoms/settings";
import { Button, ButtonText } from "@/components/ui/button";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
} from "@/components/ui/modal";
import { Heading } from "@/components/ui/heading";
import { CloseIcon, Icon } from "@/components/ui/icon";

// wow i'm a secret

cssInterop(BottomSheet, {
  className: { target: "backgroundStyle" },
});
cssInterop(BottomSheetScrollView, {
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
  const [mapStyleUrl, setMapStyleUrl] = useAtom(mapStyleAtom);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<
    "loading" | "success" | "error"
  >("loading");
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [showModal, setShowModal] = React.useState(false);

  const insets = useSafeAreaInsets();

  async function fetchMapboxToken(retryCount = 0): Promise<string | null> {
    try {
      const currentToken = await SecureStore.getItemAsync("mapboxToken");
      if (currentToken && !isJwtExpired(currentToken)) {
        return currentToken;
      }

      const sessionToken = await SecureStore.getItemAsync("sessionToken");
      const response = await fetch(
        "https://aviator.spectralo.hackclub.app/api/maps/getToken",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionToken }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch token");
      }

      if (!data.token) {
        throw new Error("No token received from server");
      }

      await SecureStore.setItemAsync("mapboxToken", data.token);
      console.log("Mapbox token updated successfully");
      return data.token;
    } catch (error) {
      console.error("Error fetching Mapbox token:", error);

      if (retryCount < 3) {
        console.log(`Retrying token fetch (attempt ${retryCount + 1})...`);
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, retryCount)),
        );
        return fetchMapboxToken(retryCount + 1);
      }

      return null;
    }
  }

  // comments in code are like silkscreen on pcbs!

  useEffect(() => {
    async function initMapboxToken() {
      setTokenStatus("loading");
      setTokenError(null);

      try {
        const token = await fetchMapboxToken();
        if (token) {
          setMapboxToken(token);
          Mapbox.setAccessToken(token);
          setTokenStatus("success");
        } else {
          throw new Error("Could not obtain a valid Mapbox token");
        }
      } catch (error) {
        setTokenError(error instanceof Error ? error.message : "Unknown error");
        setTokenStatus("error");
      }
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

  if (tokenStatus === "loading") {
    return (
      <View style={styles.page} className="bg-background-0">
        <ActivityIndicator size="large" />
        <Text className="mt-4">Boarding your flight...</Text>
      </View>
    );
  }

  if (tokenStatus === "error" || !mapboxToken) {
    return (
      <View style={styles.page} className="bg-background-0">
        <View className="bg-red-100 p-4 rounded-md mb-4">
          <Text className="text-red-600 font-bold mb-2">Map Loading Error</Text>
          <Text className="text-red-600">
            {tokenError || "Failed to load Mapbox token"}
          </Text>
        </View>
        <Button
          onPress={() => {
            setTokenStatus("loading");
            fetchMapboxToken().then((token) => {
              if (token) {
                setMapboxToken(token);
                Mapbox.setAccessToken(token);
                setTokenStatus("success");
                setTokenError(null);
              } else {
                setTokenStatus("error");
                setTokenError("Still unable to load map token");
              }
            });
          }}
          className="mt-2"
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialIcons
              name="refresh"
              size={20}
              className="text-background-0 mr-3"
            />
            <ButtonText>Retry</ButtonText>
          </View>
        </Button>
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
          className="bg-background-0 focus:bg-background-50"
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
      />
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
        }}
        size="md"
      >
        <ModalBackdrop />
        <ModalContent style={{ width: "90%", borderRadius: 25 }}>
          <ModalHeader>
            <Heading size="xl" className="text-typography-950">
              Aviator v0.1.0
            </Heading>
            <ModalCloseButton>
              <Icon
                as={CloseIcon}
                size="md"
                className="stroke-background-400 group-[:hover]/modal-close-button:stroke-background-700 group-[:active]/modal-close-button:stroke-background-900 group-[:focus-visible]/modal-close-button:stroke-background-900"
              />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            <Text style={{ marginBottom: 20 }}>
              Note: This is a beta build of Aviator. Some features may not work
              as expected and you might lose data.
            </Text>
            <Button>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialIcons
                  name="confirmation-number"
                  size={20}
                  className="text-background-0 mr-3"
                />
                <ButtonText>Passport</ButtonText>
              </View>
            </Button>

            <Button className="mt-2">
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialIcons
                  name="settings"
                  size={20}
                  className="text-background-0 mr-3"
                />
                <ButtonText>Settings</ButtonText>
              </View>
            </Button>
            <Button
              className="mt-2"
              variant="solid"
              onPress={() => {
                setShowModal(false);
                setIsLoggedIn(false);
                SecureStore.deleteItemAsync("sessionToken");
                SecureStore.deleteItemAsync("mapboxToken");
                SecureStore.deleteItemAsync("refreshToken");
              }}
              action="negative"
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialIcons
                  name="logout"
                  size={20}
                  className="text-background-0 mr-3"
                />
                <ButtonText>Log Out</ButtonText>
              </View>
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
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
