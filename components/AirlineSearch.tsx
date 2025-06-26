import { useEffect, useState, useCallback, useRef } from "react";
import { View, ActivityIndicator } from "react-native";
import FastImage from "@d11/react-native-fast-image";
import * as SecureStore from "expo-secure-store";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Input, InputField } from "@/components/ui/input";

interface AirlineSearchProps {
  onTextInputFocus: () => void;
  onTextInputBlur: (isEmpty: boolean) => void;
  onTextInputSubmit: (isEmpty: boolean) => void;
  onTextInputChange: (text: string) => void;
  onAirlineDataChange: (hasData: boolean) => void;
  onAirlineSelect?: (airline: Airline) => void;
  active: boolean;
}

interface Airline {
  id: string;
  name: string;
  code: string;
}

export default function AirlineSearch({
  onTextInputFocus,
  onTextInputBlur,
  onTextInputSubmit,
  onTextInputChange,
  onAirlineDataChange,
  active,
}: AirlineSearchProps) {
  const [textInputValue, setTextInputValue] = useState("");
  const [airlineData, setAirlineData] = useState<Airline[]>([]);
  const [isSearchBarEmpty, setIsSearchBarEmpty] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<any>(null);
  const cachedResults = useRef<Record<string, Airline[]>>({});

  useEffect(() => {
    const isEmpty = textInputValue.trim() === "";
    setIsSearchBarEmpty(isEmpty);

    if (isEmpty) {
      setAirlineData([]);
    }

    onTextInputChange(textInputValue);
  }, [textInputValue, onTextInputChange]);

  const fetchAirlines = useCallback(
    async (searchTerm: string) => {
      const trimmedSearch = searchTerm.trim();
      if (trimmedSearch === "" || !active) {
        setAirlineData([]);
        setIsLoading(false);
        return;
      }

      const cacheKey = trimmedSearch.toLowerCase();
      if (cachedResults.current[cacheKey]) {
        setAirlineData(cachedResults.current[cacheKey]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const sessionToken = await SecureStore.getItemAsync("sessionToken");

        // Check if the search term is an exact ICAO code (typically 3 letters)
        const trimmedTerm = searchTerm.trim();
        const isIcaoCode = /^[A-Za-z]{2,3}$/.test(trimmedTerm);
        const searchString = isIcaoCode
          ? trimmedTerm.toUpperCase()
          : trimmedTerm;

        const response = await fetch(
          `https://aviator.spectralo.hackclub.app/api/airlines/getAirlines`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sessionToken,
              searchString,
            }),
          },
        );

        const data = await response.json();

        if (data.error) {
          setError(data.error);
          setAirlineData([]);
        } else {
          const airlines = data.airlines || [];
          setAirlineData(airlines);
          cachedResults.current[cacheKey] = airlines;
        }
      } catch (err) {
        setError("Failed to connect to server" + err);

        setAirlineData([]);
      } finally {
        setIsLoading(false);
      }
    },
    [active],
  );

  useEffect(() => {
    if (textInputValue.trim() !== "" && active) {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      debounceTimeout.current = setTimeout(() => {
        fetchAirlines(textInputValue);
      }, 100) as unknown as NodeJS.Timeout;
    } else {
      setAirlineData([]);
    }

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [textInputValue, active, fetchAirlines]);

  // Notify parent component when airline data changes
  useEffect(() => {
    onAirlineDataChange(airlineData.length > 0);
  }, [airlineData, onAirlineDataChange]);

  if (!active) return null;

  return (
    <View style={{ width: "100%", alignItems: "center" }}>
      <Input
        variant="rounded"
        size="lg"
        style={{ width: "90%", marginBottom: 5 }}
        className="bg-background-0"
      >
        <InputField
          ref={inputRef}
          placeholder="What airlines are you traveling with?"
          onChangeText={(text) => setTextInputValue(text.trim())}
          onFocus={onTextInputFocus}
          onBlur={() => onTextInputBlur(textInputValue.trim() === "")}
          onSubmitEditing={() =>
            onTextInputSubmit(textInputValue.trim() === "")
          }
          autoCapitalize="none"
          autoCorrect={false}
        />
      </Input>

      {isLoading && (
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 10 }}>Searching for airlines...</Text>
        </View>
      )}

      {!isLoading && error && (
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: "red" }}>{error}</Text>
        </View>
      )}

      {!isLoading &&
        !error &&
        airlineData.length === 0 &&
        textInputValue.trim() !== "" && (
          <View style={{ alignItems: "center", marginTop: 20 }}>
            <Text>No airlines found matching {textInputValue}</Text>
          </View>
        )}

      {!isLoading && airlineData.length === 0 && isSearchBarEmpty && (
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <FastImage
            source={require("@/assets/arrowdark.png")}
            style={{ width: 150, height: 150 }}
            resizeMode="contain"
          />
          <Text style={{ marginTop: 10 }}>
            Start typing to search for airlines
          </Text>
        </View>
      )}
      {!isLoading && (
        <View style={{ marginTop: 20, width: "90%", marginBottom: 40 }}>
          {!isLoading &&
            airlineData.map((airline) => (
              <Card
                key={airline.id}
                className="mb-2"
                variant="outline"
                style={{ padding: 10 }}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 5,
                      backgroundColor: "white",
                      marginRight: 10,
                    }}
                  >
                    <FastImage
                      source={{
                        uri: `https://aviator.spectralo.hackclub.app/api/logo/getLogo?icao=${airline.code}`,
                      }}
                      style={{
                        width: 40,
                        height: 40,
                        margin: 5,
                      }}
                    />
                  </View>
                  <Heading size="xl" className="mt-0">
                    {airline.name} - {airline.code}
                  </Heading>
                </View>
              </Card>
            ))}
        </View>
      )}
    </View>
  );
}
