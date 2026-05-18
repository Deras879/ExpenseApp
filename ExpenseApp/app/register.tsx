import { registerUser } from "@/api/usersServices";
import { useToast } from "@/contexts/toast-context";
import { getRefreshToken, isTokenExpired } from "@/hooks/auth";
import { MaterialIcons } from "@expo/vector-icons";
import { Button } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { MotiView } from "moti";
import React, { useCallback, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type Props = {};

const Register = (props: Props) => {
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  // Guard: si ya está logueado, redirigir a home
  React.useEffect(() => {
    getRefreshToken().then((token) => {
      if (token && !isTokenExpired(token)) {
        router.replace("/home");
      }
    });
  }, []);

  const [showPassword, setShowPassword] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Resetear el estado de salida cuando la pantalla recibe foco (volver atrás)
  useFocusEffect(
    useCallback(() => {
      setIsExiting(false);
    }, []),
  );

  const goBackToLanding = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => router.replace("/landing" as any), 280);
  };
  const formData = {
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  };
  const [form, setForm] = useState(formData);

  const passwordValid = form.password.length >= 8 && /\d/.test(form.password);
  const passwordsMatch =
    form.confirmPassword.length > 0 && form.password === form.confirmPassword;
  const emailValid = /.+@.+\..+/.test(form.email.trim());
  const canSubmit =
    form.username.trim().length > 0 &&
    emailValid &&
    passwordValid &&
    passwordsMatch;

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.warning("Revisa los campos del formulario");
      return;
    }
    try {
      const response = await registerUser(
        form.username,
        form.email,
        form.password,
      );

      if (response) {
        toast.success("Usuario registrado exitosamente");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        goBackToLanding();
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
        toast.error("Error al registrar el usuario");
      }
    } catch (error: any) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
      const message: string = error?.message ?? "";
      const status: number | undefined = error?.status;

      if (message === "Email already exists") {
        toast.error("El correo electrónico ya está en uso");
      } else if (status === 400) {
        toast.error(message || "Datos inválidos");
      } else if (
        message.includes("Network") ||
        message.includes("fetch") ||
        message.includes("Failed to fetch")
      ) {
        toast.error("Sin conexión con el servidor");
      } else {
        toast.error("Ocurrió un error inesperado");
      }
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#1457f6" }}
      edges={["top", "left", "right"]}
    >
      <TouchableWithoutFeedback
        onPress={() => {
          // Dismiss keyboard when tapping outside
          Keyboard.dismiss();
        }}
      >
        <MotiView
          from={{ translateY: -1000 }}
          animate={{ translateY: isExiting ? -1000 : 0 }}
          transition={
            isExiting
              ? { type: "timing", duration: 280 }
              : { type: "timing", duration: 500 }
          }
          style={{
            backgroundColor: "#1457f6",
            flex: 1,
            alignItems: "center",
          }}
        >
          <View style={{ alignItems: "center", marginTop: 60 }}>
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
              ¡Regístrate!
            </Text>
            <Text style={{ fontSize: 16, color: "white" }}>
              y comienza a gestionar tus finanzas
            </Text>
          </View>
          <MotiView
            from={{ opacity: 0, bottom: 1000 }}
            animate={{ opacity: 1, bottom: 0 }}
            style={{
              marginTop: 30,
              width: "100%",
              flex: 1,
              backgroundColor: "white",
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              overflow: "hidden",
            }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={{ flex: 1 }}
            >
              <ScrollView
                contentContainerStyle={{
                  padding: 20,
                  paddingBottom: 20 + insets.bottom,
                  flexGrow: 1,
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
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
                      placeholderTextColor="#999"
                      value={form.username}
                      onChangeText={(value) =>
                        handleInputChange("username", value)
                      }
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
                      placeholderTextColor="#999"
                      value={form.email}
                      onChangeText={(value) =>
                        handleInputChange("email", value)
                      }
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
                      placeholderTextColor="#999"
                      secureTextEntry={!showPassword}
                      style={{
                        flex: 1,
                        marginLeft: 8,
                        color: "#000",
                      }}
                      value={form.password}
                      onChangeText={(value) =>
                        handleInputChange("password", value)
                      }
                    />
                    <MaterialIcons
                      name={showPassword ? "visibility" : "visibility-off"}
                      size={24}
                      color="black"
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  </View>
                  {form.password.length > 0 && !passwordValid && (
                    <Text
                      style={{ color: "#e53935", fontSize: 12, marginTop: 4 }}
                    >
                      Mínimo 8 caracteres y al menos 1 número
                    </Text>
                  )}
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
                      placeholderTextColor="#999"
                      secureTextEntry={!showPassword}
                      style={{
                        flex: 1,
                        marginLeft: 8,
                        color: "#000",
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
                  {form.confirmPassword.length > 0 && !passwordsMatch && (
                    <Text
                      style={{ color: "#e53935", fontSize: 12, marginTop: 4 }}
                    >
                      Las contraseñas no coinciden
                    </Text>
                  )}
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
                    disabled={!canSubmit}
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
                      router.replace("/landing");
                    }}
                  />
                </MotiView>
              </ScrollView>
            </KeyboardAvoidingView>
          </MotiView>
        </MotiView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default Register;
