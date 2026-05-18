import { getRefreshToken, isTokenExpired } from "@/hooks/auth";
import { Stack, useRouter } from "expo-router";
import React from "react";

export default function HomeLayout() {
  const router = useRouter();

  // Guard: si no está logueado, redirigir a landing
  React.useEffect(() => {
    getRefreshToken().then((token) => {
      if (!token || isTokenExpired(token)) {
        router.replace("/landing");
      }
    });
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ animation: "none" }} />
      <Stack.Screen
        name="create"
        options={{
          animation: "none",
          presentation: "transparentModal",
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="goals/[id]"
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="goals/create"
        options={{
          animation: "none",
          presentation: "transparentModal",
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="goals/edit"
        options={{
          animation: "none",
          presentation: "transparentModal",
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="goals/contribute"
        options={{
          animation: "none",
          presentation: "transparentModal",
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
    </Stack>
  );
}
