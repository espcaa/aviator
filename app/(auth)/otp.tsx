import { useState, useRef, useEffect } from "react";
import { Text } from "@/components/ui/text";
import { View, TextInput, Keyboard } from "react-native";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button } from "@/components/ui/button";
import { useLocalSearchParams } from "expo-router";

export default function OTPScreen() {
  const { email, password } = useLocalSearchParams();
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef([]);

  const handleOtpChange = (value: any, index: any) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e: any, index: any) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = () => {
    const otpValue = otp.join("");
    if (otpValue.length === 4) {
      Keyboard.dismiss();

      console.log("OTP Submitted:", otpValue);
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== "");

  return (
    <View className="flex-1 bg-background-0 justify-center">
      <View style={{ marginHorizontal: 30 }}>
        <VStack space="lg" px="$6">
          <VStack space="md" alignItems="center">
            <Text size="2xl" className="text-center font-medium">
              Verify your email address
            </Text>

            <Text size="md" className="text-center text-gray-500 mt-2">
              Please enter the verification code below
            </Text>
          </VStack>
          <HStack space="md" justifyContent="center" mt="$6">
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

          <HStack space="sm" justifyContent="center" mt="$4">
            <Text size="sm" className="text-gray-500">
              Didn't receive a code?
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
      </View>
    </View>
  );
}
