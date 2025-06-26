import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
  BackHandler,
  Pressable,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import Mapbox from "@rnmapbox/maps";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
// Import tailwind config
import { cssInterop } from "nativewind";
import customHandle from "@/components/handle";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { useAtom } from "jotai";
import { nameAtom } from "@/atoms/userinfo";
import { mapStyleAtom } from "@/atoms/settings";
import { Button, ButtonText } from "@/components/ui/button";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AirlineSearch from "@/components/AirlineSearch";
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
import { authAtom } from "@/atoms/auth";

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
  const [fullName] = useAtom(nameAtom);
  const [mapStyleUrl, setMapStyleUrl] = useAtom(mapStyleAtom);

  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<
    "loading" | "success" | "error"
  >("loading");
  const [tokenError, setTokenError] = useState<string | null>(null);
  // Bottom sheet state management
  type BottomSheetState = "collapsed" | "expanded" | "searchFocused";
  const [bottomSheetState, setBottomSheetState] =
    useState<BottomSheetState>("expanded");
  const [isSearchBarEmpty, setIsSearchBarEmpty] = useState(true);
  const [hasAirlineData, setHasAirlineData] = useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const [, setIsLoggedIn] = useAtom(authAtom);
  const sheetRef = useRef<BottomSheet>(null);

  // Get snap points based on current state and if there's airline data
  const getSnapPoints = useCallback((): string[] => {
    switch (bottomSheetState) {
      case "collapsed":
        return hasAirlineData ? ["80%", "80%"] : ["15%", "40%"];
      case "expanded":
        return hasAirlineData ? ["80%", "80%"] : ["40%", "40%"];
      case "searchFocused":
        return ["80%", "80%"];
      default:
        return hasAirlineData ? ["80%", "80%"] : ["15%", "40%"];
    }
  }, [bottomSheetState, hasAirlineData]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      console.log("Sheet index changed to:", index);
      // If we have airline data, always keep the sheet at index 1 (expanded)
      if (hasAirlineData && index === 0) {
        console.log("Preventing collapse because there is airline data");
        sheetRef.current?.snapToIndex(1);
        return;
      }

      // Only allow collapsing if empty search and not in search mode
      if (
        index === 0 &&
        (!isSearchBarEmpty || bottomSheetState === "searchFocused")
      ) {
        console.log(
          "Preventing collapse because text is in search bar or search is focused",
        );
        sheetRef.current?.snapToIndex(1);
      } else if (index === 0 && bottomSheetState !== "collapsed") {
        setBottomSheetState("collapsed");
      }
    },
    [bottomSheetState, isSearchBarEmpty, hasAirlineData],
  );

  const insets = useSafeAreaInsets();

  // Centralized handlers for text input and bottom sheet
  const handleTextInputFocus = () => {
    setBottomSheetState("searchFocused");
    sheetRef.current?.snapToIndex(1);
    console.log("Search focused");
  };

  const handleTextInputBlur = (isEmpty: boolean) => {
    setIsSearchBarEmpty(isEmpty);
    if (isEmpty && !hasAirlineData) {
      setBottomSheetState("collapsed");
    } else {
      setBottomSheetState("expanded");
    }
    sheetRef.current?.snapToIndex(1);
  };

  const handleTextInputSubmit = (isEmpty: boolean) => {
    setIsSearchBarEmpty(isEmpty);
    if (isEmpty && !hasAirlineData) {
      setBottomSheetState("collapsed");
    } else {
      setBottomSheetState("expanded");
    }
    sheetRef.current?.snapToIndex(1);
  };

  const handleTextInputChange = (text: string) => {
    const isEmpty = text.trim() === "";
    setIsSearchBarEmpty(isEmpty);
    // No need to change sheet state here - just track if search is empty
  };

  async function fetchMapboxToken(retryCount = 0): Promise<string | null> {
    try {
      // First check if we have a valid token stored
      const currentToken = await SecureStore.getItemAsync("mapboxToken");
      if (currentToken && !isJwtExpired(currentToken)) {
        return currentToken;
      }

      // Otherwise fetch a new token
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

      // Store the new token
      await SecureStore.setItemAsync("mapboxToken", data.token);
      console.log("Mapbox token updated successfully");
      return data.token;
    } catch (error) {
      console.error("Error fetching Mapbox token:", error);

      // Retry logic (max 3 retries)
      if (retryCount < 3) {
        console.log(`Retrying token fetch (attempt ${retryCount + 1})...`);
        // Exponential backoff
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
        console.error("Token initialization failed:", error);
        setTokenError(error instanceof Error ? error.message : "Unknown error");
        setTokenStatus("error");
      }
    }

    initMapboxToken();
  }, []);

  useEffect(() => {
    const onKeyboardHide = () => {
      console.log("Keyboard hidden");
      console.log("isSearchBarEmpty:", isSearchBarEmpty);
      console.log("hasAirlineData:", hasAirlineData);

      Keyboard.dismiss();

      // Update bottom sheet state based on search content and airline data
      if (isSearchBarEmpty && !hasAirlineData) {
        setBottomSheetState("collapsed");
      } else {
        setBottomSheetState("expanded");
      }
      sheetRef.current?.snapToIndex(1);
    };

    const keyboardListener = Keyboard.addListener(
      "keyboardDidHide",
      onKeyboardHide,
    );

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        // If in search focused mode, first go back to normal mode
        if (bottomSheetState === "searchFocused") {
          onKeyboardHide();
          return true;
        }
        // If text is in the search bar or if we have airline data, prevent back action
        else if (!isSearchBarEmpty || hasAirlineData) {
          return true;
        }
        // Otherwise let the system handle back
        return false;
      },
    );

    return () => {
      keyboardListener.remove();
      backHandler.remove();
    };
  }, [isSearchBarEmpty, bottomSheetState, hasAirlineData]);

  // Effect to handle airline data changes
  useEffect(() => {
    console.log("Airline data changed:", hasAirlineData);
    if (hasAirlineData) {
      // If we get airline data, expand the sheet
      setBottomSheetState("expanded");
      sheetRef.current?.snapToIndex(1);
    } else if (isSearchBarEmpty) {
      // If no airline data and search is empty, collapse
      setBottomSheetState("collapsed");
    }
  }, [hasAirlineData, isSearchBarEmpty]);

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
        onPress={() => {
          if (
            isSearchBarEmpty &&
            !hasAirlineData &&
            bottomSheetState !== "searchFocused"
          ) {
            sheetRef.current?.snapToIndex(0);
          }
          Keyboard.dismiss();
        }}
      />
      <BottomSheet
        ref={sheetRef}
        onChange={handleSheetChanges}
        animateOnMount={true}
        snapPoints={getSnapPoints()}
        index={1}
        enableDynamicSizing={false}
        handleComponent={customHandle}
        enablePanDownToClose={false}
        // @ts-ignore
        // It's fiiiiine
        className="bg-background-0"
      >
        <BottomSheetScrollView
          style={{
            flex: 1,
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
            <Text size="3xl" className="font-bold">
              Aviator
            </Text>
            <Pressable onPress={() => setShowModal(true)}>
              <Avatar size="lg">
                <AvatarImage
                  source={{
                    uri:
                      "https://api.dicebear.com/9.x/initials/png?seed=" +
                      encodeURIComponent(fullName) +
                      "&fontWeight=900" +
                      "&backgroundType=gradientLinear,solid" +
                      "&scale=80",
                  }}
                />
              </Avatar>
            </Pressable>
          </View>
          <AirlineSearch
            onTextInputFocus={handleTextInputFocus}
            onTextInputBlur={handleTextInputBlur}
            onTextInputSubmit={handleTextInputSubmit}
            onTextInputChange={handleTextInputChange}
            onAirlineDataChange={(hasData) => setHasAirlineData(hasData)}
            active={true}
          />
        </BottomSheetScrollView>
      </BottomSheet>
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
