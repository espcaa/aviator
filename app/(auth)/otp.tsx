import { Button } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Keyboard, TextInput, View } from "react-native";
import * as SecureStore from "expo-secure-store";

export default function OTPScreen() {
  const { email, password } = useLocalSearchParams();
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (
      e.nativeEvent.key === "Backspace" &&
      !otp[index] &&
      index > 0 &&
      inputRefs.current[index - 1]
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = () => {
    setIsLoading(true);
    const otpValue = otp.join("");
    if (otpValue.length === 4) {
      Keyboard.dismiss();
      console.log("Submitting OTP:", otpValue);

      fetch(`https://aviator.spectralo.hackclub.app/api/otp/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp: otpValue,
        }),
      })
        .then((response) => {
          console.log("Creating user with email:", email);
          if (response.ok) {
            fetch(
              `https://aviator.spectralo.hackclub.app/api/users/createUser`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email,
                  password,
                }),
              },
            )
              .then((res) => res.json())
              .then((data) => {
                if (data.error) {
                  console.error("Error creating user:", data.error);
                  setError(data.error);
                } else {
                  console.log("User created successfully:", data);
                }
              })
              .catch((error) => {
                console.log("Error creating user:", error);
                console.log(
                  "Json stringified user data:",
                  JSON.stringify({
                    email,
                    password,
                  }),
                );

                setError("An error occurred while creating the user.");
                setIsLoading(false);
              });

            // Get a jwt token from the api before redirecting
            // Wait 2s before doing this to ensure the user is created
            setTimeout(() => {
              fetch(
                `https://aviator.spectralo.hackclub.app/api/sessions/getRefreshToken`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    email,
                    password,
                  }),
                },
              )
                .then((res) => res.json())
                .then((data) => {
                  if (data.error) {
                    console.error("Error logging in:", data.error);
                    setError(data.error);
                  } else {
                    console.log("Login successful:", data);
                    // Store the token securely
                    SecureStore.setItemAsync("refreshToken", data.token)
                      .then(() => {
                        console.log("Token stored successfully");
                      })
                      .catch((error) => {
                        console.error("Error storing token:", error);
                        setError("An error occurred while storing the token.");
                      });
                  }
                })
                .catch((error) => {
                  console.error("Error logging in:", error);
                  setError("An error occurred while logging in.");
                });

              router.push(
                `/(auth)/success?email=${email}&password=${password}`,
              );
              setIsLoading(false);
            }, 2000);
          } else {
            console.error("Invalid OTP response:", response);
            setError("Invalid OTP");
            setIsLoading(false);
          }
        })
        .catch((error) => {
          console.error("Error verifying OTP:", error);
          setError("An error occurred. Please try again.");
          setIsLoading(false);
        });
    } else {
      setError("Please enter a valid OTP");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background-0">
        <Spinner size="large" />
      </View>
    );
  }

  const isOtpComplete = otp.every((digit) => digit !== "");

  return (
    <View className="flex-1 bg-background-0 justify-center">
      <View style={{ marginHorizontal: 30 }}>
        <VStack space="lg" style={{ paddingHorizontal: 24 }}>
          <VStack space="md" style={{ alignItems: "center" }}>
            <Text size="2xl" className="text-center font-medium">
              Verify your email address
            </Text>

            <Text size="md" className="text-center text-gray-500 mt-2">
              Please enter the verification code below
            </Text>
          </VStack>
          <HStack
            space="md"
            style={{ justifyContent: "center", marginTop: 24 }}
          >
            {[0, 1, 2, 3].map((index) => (
              <View
                key={index}
                className="w-14 h-14 border-2 rounded-lg justify-center items-center border-primary-500"
                style={{
                  backgroundColor: otp[index]
                    ? "rgba(74, 144, 226, 0.1)"
                    : "transparent",
                }}
              >
                <TextInput
                  // @ts-ignore
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  value={otp[index]}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  className="text-center text-2xl font-bold w-full h-full text-white"
                />
              </View>
            ))}
          </HStack>

          <Button
            size="lg"
            variant="outline"
            className={isOtpComplete ? "bg-green-700 mt-8" : "mt-8"}
            disabled={!isOtpComplete}
            onPress={handleSubmit}
          >
            <Text
              size="md"
              className={isOtpComplete ? "text-white" : "text-primary-500"}
            >
              Verify
            </Text>
          </Button>

          <HStack
            space="sm"
            style={{ justifyContent: "center", marginTop: 16 }}
          >
            <Text size="sm" className="text-gray-500">
              Didn&apos;t receive a code?
            </Text>
            <Text
              size="sm"
              className="text-primary-500 font-medium"
              onPress={() => console.log("Resend OTP")}
            >
              Resend
            </Text>
          </HStack>
        </VStack>
        <Text size="xl" bold className="text-red-600 mt-2">
          {error}
        </Text>
      </View>
    </View>
  );
}
