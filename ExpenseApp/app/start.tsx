import {
  deleteRefreshToken,
  deleteToken,
  getRefreshToken,
  isTokenExpired,
} from "@/hooks/auth";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {};

const Start = (props: Props) => {
  const hasNavigated = React.useRef(false);
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    const navigate = setTimeout(async () => {
      const refreshToken = await getRefreshToken();
      const isExpired = isTokenExpired(refreshToken || "");

      if (refreshToken && !isExpired) {
        router.push("/home");
      } else {
        deleteToken();
        deleteRefreshToken();
        router.push("/landing");
      }
    }, 3500);

    return () => {
      clearTimeout(timer);
      clearTimeout(navigate);
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <MotiView
        from={{ opacity: 1 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ type: "timing", duration: 500 }}
        style={{ backgroundColor: "#1457f6", flex: 1 }}
      >
        <View
          style={{ alignItems: "center", justifyContent: "center", flex: 1 }}
        >
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 500 }}
            style={{
              backgroundColor: "#6480fc",
              borderRadius: 100,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <MaterialIcons
              name="wallet"
              size={100}
              color="white"
            ></MaterialIcons>
          </MotiView>
          <View style={{ alignItems: "center", flexDirection: "row" }}>
            <MotiView
              from={{ translateY: 0 }}
              animate={{ translateY: 20 }}
              transition={{
                type: "timing",
                loop: true,
                delay: 0,
                duration: 500,
              }}
            >
              <Text
                style={{ fontSize: 50, fontWeight: "bold", color: "white" }}
              >
                .
              </Text>
            </MotiView>
            <MotiView
              from={{ translateY: 0 }}
              animate={{ translateY: 20 }}
              transition={{
                type: "timing",
                loop: true,
                delay: 100,
                duration: 500,
              }}
            >
              <Text
                style={{ fontSize: 50, fontWeight: "bold", color: "white" }}
              >
                .
              </Text>
            </MotiView>
            <MotiView
              from={{ translateY: 0 }}
              animate={{ translateY: 20 }}
              transition={{
                type: "timing",
                loop: true,
                delay: 200,
                duration: 500,
              }}
            >
              <Text
                style={{ fontSize: 50, fontWeight: "bold", color: "white" }}
              >
                .
              </Text>
            </MotiView>
          </View>
        </View>
      </MotiView>
    </SafeAreaView>
  );
};

export default Start;
