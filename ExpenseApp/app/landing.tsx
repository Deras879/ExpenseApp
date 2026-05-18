import { loginUser } from "@/api/usersServices";
import { useToast } from "@/contexts/toast-context";
import {
  getRefreshToken,
  isTokenExpired,
  saveRefreshToken,
  saveToken,
  saveUserData,
} from "@/hooks/auth";
import { MaterialIcons } from "@expo/vector-icons";
import { Button } from "@react-navigation/elements";
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

const Landing = (props: Props) => {
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

  const formData = {
    email: "",
    password: "",
  };
  const [form, setForm] = useState(formData);
  const [isExiting, setIsExiting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resetear el estado de salida cuando la pantalla recibe foco (volver atrás)
  useFocusEffect(
    useCallback(() => {
      setIsExiting(false);
    }, []),
  );

  const navigateTo = (path: string, method: "push" | "replace" = "push") => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      method === "replace"
        ? router.replace(path as any)
        : router.push(path as any);
    }, 280);
  };
  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.email.trim() || !form.password.trim()) {
      toast.warning("Completa todos los campos");
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await loginUser(form.email, form.password);
      if (response) {
        await saveToken(response.token);
        await saveRefreshToken(response.refreshToken);
        await saveUserData(response.user);
        toast.success(`¡Bienvenido, ${response.user?.username ?? ""}!`);
        navigateTo("/home", "replace");
      } else {
        toast.error("Correo o contraseña incorrectos");
      }
    } catch (error: any) {
      const message: string = error?.message ?? "";
      const status: number | undefined = error?.status;

      if (
        status === 400 ||
        message === "User not found" ||
        message === "Invalid password"
      ) {
        toast.error("Correo o contraseña incorrectos");
      } else if (
        message.includes("Network") ||
        message.includes("fetch") ||
        message.includes("Failed to fetch")
      ) {
        toast.error("Sin conexión con el servidor");
      } else {
        toast.error("Error al iniciar sesión");
      }
    } finally {
      setIsSubmitting(false);
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
          from={{ translateY: 1000 }}
          animate={{ translateY: isExiting ? 1000 : 0 }}
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
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
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
                  <Button
                    children={
                      isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"
                    }
                    disabled={isSubmitting}
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
                    color="#ff0000"
                    variant="filled"
                    onPress={() => navigateTo("/register")}
                    children="Registrarse"
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

export default Landing;
