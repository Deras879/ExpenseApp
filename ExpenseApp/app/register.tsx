import {
  View,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  ToastAndroid,
} from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { Button } from "@react-navigation/elements";
import { useRouter } from "expo-router";
import { useState } from "react";
import { registerUser } from "@/api/usersServices";
import * as Haptics from "expo-haptics";

type Props = {};

const Register = (props: Props) => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const formData = {
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  };
  const [form, setForm] = useState(formData);

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      const response = await registerUser(
        form.username,
        form.email,
        form.password,
      );

      if (response) {
        ToastAndroid.show(
          "Usuario registrado exitosamente",
          ToastAndroid.SHORT,
        );
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push("/landing");
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
        ToastAndroid.show("Error al registrar el usuario", ToastAndroid.SHORT);
      }
      // Aquí puedes redirigir al usuario a otra pantalla o mostrar un mensaje de éxito
    } catch (error: any) {
      if (error.message === "Email already exists") {
        ToastAndroid.show(
          "There's already a user with this email",
          ToastAndroid.SHORT,
        );
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
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
          from={{ bottom: 1000 }}
          animate={{ bottom: 0 }}
          transition={{ delay: 300 }}
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
              Registrate y comienza a gestionar tus finanzas
            </Text>
          </View>
          <MotiView
            from={{ opacity: 0, bottom: 1000 }}
            animate={{ opacity: 1, bottom: 0 }}
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
              <Text style={{ marginBottom: 8 }}>User Name</Text>

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
                <MaterialIcons name="person" size={24} color="black" />
                <TextInput
                  placeholder="Nombre de usuario"
                  value={form.username}
                  onChangeText={(value) => handleInputChange("username", value)}
                  style={{
                    flex: 1,
                    marginLeft: 8,
                  }}
                />
              </View>
            </View>
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
                  secureTextEntry={!showPassword}
                  style={{
                    flex: 1,
                    marginLeft: 8,
                  }}
                  value={form.password}
                  onChangeText={(value) => handleInputChange("password", value)}
                />
                <MaterialIcons
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={24}
                  color="black"
                  onPress={() => setShowPassword(!showPassword)}
                />
              </View>
            </View>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ marginBottom: 8 }}>Confirmar Contraseña</Text>
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
                  placeholder="Confirmar Contraseña"
                  secureTextEntry={!showPassword}
                  style={{
                    flex: 1,
                    marginLeft: 8,
                  }}
                  value={form.confirmPassword}
                  onChangeText={(value) =>
                    handleInputChange("confirmPassword", value)
                  }
                />
                <MaterialIcons
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={24}
                  color="black"
                  onPress={() => setShowPassword(!showPassword)}
                />
              </View>
            </View>
            <MotiView
              from={{ scale: 0.01 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1000 }}
              style={{ marginBottom: 20 }}
            >
              <Button
                color="#ff0000"
                variant="filled"
                href=""
                children="Registrarse"
                onPress={handleSubmit}
              />
            </MotiView>
            <MotiView
              from={{ scale: 0.01 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1500 }}
              style={{ marginBottom: 20 }}
            >
              <Button
                href=""
                children="Iniciar Sesión"
                onPress={() => {
                  router.push("/landing");
                }}
              />
            </MotiView>
          </MotiView>
        </MotiView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default Register;
