import { deleteRefreshToken, deleteToken } from "@/hooks/auth";
import { router } from "expo-router";
import React from "react";
import { Pressable, Text, ToastAndroid, View } from "react-native";

type Props = {};

const settings = (props: Props) => {
  const handleLogout = () => {
    deleteToken();
    deleteRefreshToken();
    router.push("/landing");
    ToastAndroid.show("Logout successful", ToastAndroid.SHORT);
  };
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffff",
      }}
    >
      <Text>settings</Text>
      <Pressable onPress={handleLogout}>
        <Text>Logout</Text>
      </Pressable>
    </View>
  );
};

export default settings;
