import { loginUser } from "@/api/usersServices";
import { saveRefreshToken, saveToken } from "@/hooks/auth";
import { MaterialIcons } from "@expo/vector-icons";
import { Button } from "@react-navigation/elements";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import React, { useState } from "react";
import {
  Keyboard,
  Text,
  TextInput,
  ToastAndroid,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {};

const Landing = (props: Props) => {
  const router = useRouter();
  const formData = {
    email: "",
    password: "",
  };
  const [form, setForm] = useState(formData);
  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      const response = await loginUser(form.email, form.password);
      if (response) {
        console.log(response);
        saveToken(response.token);
        saveRefreshToken(response.refreshToken);
        ToastAndroid.show("Login successful", ToastAndroid.SHORT);
        router.push("/home");
      } else {
        // Handle login failure (e.g., show an error message)
        console.log("Login failed");
        ToastAndroid.show("Login failed", ToastAndroid.SHORT);
      }
    } catch (error) {
      if (error.message === "Invalid password") {
        ToastAndroid.show("Invalid Email or Password", ToastAndroid.SHORT);
      } else {
        ToastAndroid.show(
          "Error logging in: " + error.message,
          ToastAndroid.SHORT,
        );
      }
    }
  };
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TouchableWithoutFeedback
        onPress={() => {
          // Dismiss keyboard when tapping outside
          Keyboard.dismiss();
        }}
      >
        <MotiView
          from={{ bottom: -1000 }}
          animate={{ bottom: 0 }}
          style={{
            backgroundColor: "#1457f6",
            flex: 1,
            alignItems: "center",
          }}
        >
          <View style={{ alignItems: "center", marginTop: 100 }}>
            <View
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
            </View>

            <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>
              ¡Bienvenido!
            </Text>
            <Text style={{ fontSize: 16, color: "white" }}>
              Inicia sesión para gestionar tus finanzas
            </Text>
          </View>
          <MotiView
            from={{ opacity: 0, bottom: -1000 }}
            animate={{ opacity: 1, bottom: 0 }}
            transition={{ delay: 500 }}
            style={{
              marginTop: 50,
              width: "100%",
              height: "100%",
              backgroundColor: "white",
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              padding: 20,
            }}
          >
            <View style={{ marginBottom: 20 }}>
              <Text style={{ marginBottom: 8 }}>Correo Electrónico</Text>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 8,
                  paddingHorizontal: 10,
                }}
              >
                <MaterialIcons name="email" size={24} color="black" />
                <TextInput
                  placeholder="Correo electrónico"
                  value={form.email}
                  onChangeText={(value) => handleInputChange("email", value)}
                  style={{
                    flex: 1,
                    marginLeft: 8,
                  }}
                />
              </View>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ marginBottom: 8 }}>Contraseña</Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 8,
                  paddingHorizontal: 10,
                }}
              >
                <MaterialIcons name="lock" size={24} color="black" />
                <TextInput
                  placeholder="Contraseña"
                  secureTextEntry={true}
                  style={{
                    flex: 1,
                    marginLeft: 8,
                  }}
                  value={form.password}
                  onChangeText={(value) => handleInputChange("password", value)}
                />
              </View>
              <View>
                <Text
                  style={{
                    justifyContent: "flex-end",
                    textAlign: "right",
                    marginTop: 8,
                    color: "#1457f6",
                  }}
                >
                  Has olvidado tu contraseña?
                </Text>
              </View>
            </View>
            <MotiView
              from={{ scale: 0.01 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1000 }}
              style={{ marginBottom: 20 }}
            >
              <Button children="Iniciar Sesión" onPress={handleSubmit} />
            </MotiView>
            <MotiView
              from={{ scale: 0.01 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1500 }}
              style={{ marginBottom: 20 }}
            >
              <Button
                color="#ff0000"
                variant="filled"
                onPress={() => {
                  router.push("/register");
                }}
                children="Registrarse"
              />
            </MotiView>
          </MotiView>
        </MotiView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default Landing;
