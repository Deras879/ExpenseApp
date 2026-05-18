import { useThemeColors } from "@/contexts/theme-context";
import { useUiPrefs } from "@/contexts/ui-prefs-context";
import { useAuthFetch } from "@/hooks/auth";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { MotiView } from "moti";
import React from "react";
import {
  Keyboard,
  Pressable,
  Text,
  TextInput,
  ToastAndroid,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Easing } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {};

const categories = [
  "Comida",
  "Transporte",
  "Entretenimiento",
  "Servicios",
  "Salud",
  "Otro",
];
const Create = (props: Props) => {
  const colors = useThemeColors();
  const { vibrationEnabled } = useUiPrefs();
  const authFetch = useAuthFetch();
  const router = useRouter();
  const [isClosing, setIsClosing] = React.useState(false);

  const handleClose = () => {
    if (isClosing) return;
    Keyboard.dismiss();
    setIsClosing(true);
    setTimeout(() => router.back(), 300);
  };
  const [selectedType, setSelectedType] = React.useState<
    "expense" | "income" | null
  >("expense");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null,
  );

  const formData = {
    amount: "",
    description: "",
    date: "",
  };
  const [form, setForm] = React.useState(formData);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleAmountChange = (value: string) => {
    // Quita separadores de miles y deja solo dígitos
    const stripped = value.replace(/,/g, "").replace(/[^0-9]/g, "");
    handleInputChange("amount", stripped);
  };

  const formatDisplay = (value: string): string => {
    if (!value) return "";
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const today = new Date();
  const readableDate = today.toLocaleDateString("es-ES", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (selectedType === null) {
      if (vibrationEnabled)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      ToastAndroid.show(
        "Selecciona el tipo de transacción",
        ToastAndroid.SHORT,
      );
      return;
    }
    try {
      if (selectedType === "expense" && !selectedCategory) {
        if (vibrationEnabled)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        ToastAndroid.show(
          "Selecciona una categoría para el gasto",
          ToastAndroid.SHORT,
        );
        return;
      }
      if (!form.amount || !form.description) {
        if (vibrationEnabled)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        ToastAndroid.show(
          "Por favor completa todos los campos",
          ToastAndroid.SHORT,
        );
        return;
      }
      if (form.amount === "0") {
        if (vibrationEnabled)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        ToastAndroid.show("El monto no puede ser cero", ToastAndroid.SHORT);
        return;
      }
      setIsSubmitting(true);
      const data = {
        ...form,
        type: selectedType,
        category: selectedCategory,
        date: new Date().toISOString(),
      };

      await authFetch("/transactions", {
        method: "POST",
        body: JSON.stringify(data),
      });
      ToastAndroid.show(
        "Transacción agregada correctamente",
        ToastAndroid.SHORT,
      );
      handleClose();
    } catch (error) {
      console.error("Error adding transaction:", error);
      if (vibrationEnabled)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      ToastAndroid.show(
        "Error al agregar la transacción: " + (error as Error).message,
        ToastAndroid.SHORT,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setForm(formData);
        setSelectedType("expense");
        setSelectedCategory(null);
      };
    }, []),
  );

  return (
    <SafeAreaView
      style={{
        flex: 1,
        gap: 20,
        backgroundColor: "transparent",
      }}
    >
      <MotiView
        from={{ translateY: 1000 }}
        animate={{ translateY: isClosing ? 1000 : 0 }}
        transition={
          isClosing
            ? { type: "timing", duration: 300, easing: Easing.in(Easing.cubic) }
            : {
                type: "timing",
                duration: 400,
                easing: Easing.out(Easing.cubic),
              }
        }
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View
            style={{
              flex: 1,
              gap: 20,
              backgroundColor: colors.surface,
              padding: 20,
              paddingTop: 0,
            }}
          >
            <View
              style={{
                paddingHorizontal: 0,
                paddingVertical: 18,
                backgroundColor: colors.surface,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{ fontSize: 24, fontWeight: "bold", color: colors.text }}
              >
                Nueva Transaccion
              </Text>
              <Pressable onPress={handleClose}>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={32}
                  color="#8e8e93"
                />
              </Pressable>
            </View>
            <View
              style={{
                flexDirection: "row",
                gap: 20,
                justifyContent: "center",
              }}
            >
              <Pressable
                style={{
                  backgroundColor:
                    selectedType === "expense"
                      ? "#e7000b"
                      : colors.borderStrong,
                  padding: 20,
                  borderRadius: 15,
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => setSelectedType("expense")}
              >
                <Text
                  style={{
                    color: selectedType === "expense" ? "#ffffff" : colors.text,
                    fontSize: 16,
                    fontWeight: "bold",
                  }}
                >
                  Gasto
                </Text>
              </Pressable>
              <Pressable
                style={{
                  backgroundColor:
                    selectedType === "income" ? "#00a63e" : colors.borderStrong,
                  padding: 20,
                  borderRadius: 15,
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => setSelectedType("income")}
              >
                <Text
                  style={{
                    color: selectedType === "income" ? "#ffffff" : colors.text,
                    fontSize: 16,
                    fontWeight: "bold",
                  }}
                >
                  Ingreso
                </Text>
              </Pressable>
            </View>
            <View>
              <View style={{ gap: 10, marginBottom: 40 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: colors.text,
                  }}
                >
                  Cantidad
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <MaterialIcons name="attach-money" size={40} color="gray" />
                  <TextInput
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                    value={formatDisplay(form.amount)}
                    onChangeText={handleAmountChange}
                    style={{
                      padding: 10,
                      borderBottomWidth: 1,
                      borderColor: colors.border,
                      fontSize: 25,
                      flex: 1,
                      color: colors.text,
                    }}
                  />
                </View>
              </View>
              <View
                style={{
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <MaterialIcons name="description" size={20} color="gray" />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: colors.text,
                    }}
                  >
                    Nombre
                  </Text>
                </View>
                <TextInput
                  placeholder="Ej. Compras de supermercado"
                  placeholderTextColor={colors.textSecondary}
                  value={form.description}
                  onChangeText={(value) =>
                    handleInputChange("description", value)
                  }
                  style={{
                    padding: 10,
                    borderBottomWidth: 1,
                    borderColor: colors.border,
                    fontSize: 15,
                    color: colors.text,
                    width: "100%",
                  }}
                />
              </View>
            </View>
            {selectedType === "expense" && (
              <View
                style={{
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <MaterialIcons name="sell" size={20} color="gray" />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: colors.text,
                    }}
                  >
                    Categoría
                  </Text>
                </View>
                <View
                  style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}
                >
                  {categories.map((category) => (
                    <View
                      style={{
                        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                        padding: 10,
                        borderRadius: 10,
                        width: "48%",
                        backgroundColor:
                          selectedCategory === category
                            ? "#155dfc"
                            : colors.surface,
                      }}
                      key={category}
                      onTouchStart={() => setSelectedCategory(category)}
                    >
                      <Text
                        style={{
                          color:
                            selectedCategory === category
                              ? "#ffffff"
                              : colors.text,
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        {category}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            <View
              style={{ gap: 10, flexDirection: "row", alignItems: "center" }}
            >
              <MaterialIcons name="calendar-today" size={20} color="gray" />
              <Text style={{ fontSize: 16, color: colors.text }}>
                {readableDate}
              </Text>
            </View>
            <View style={{ gap: 16 }}>
              <Pressable
                style={{
                  padding: 20,
                  backgroundColor:
                    selectedType === "expense" ? "#e7000b" : "#00a63e",
                  borderRadius: 15,
                  opacity: isSubmitting ? 0.6 : 1,
                }}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text
                  style={{
                    color: "#ffffff",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  {isSubmitting
                    ? "Guardando..."
                    : selectedType === "expense"
                      ? "Agregar Gasto"
                      : "Agregar Ingreso"}
                </Text>
              </Pressable>
              <Pressable onPress={handleClose} style={{ alignSelf: "center" }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialIcons name="close" size={24} color="#8e8e93" />
                </View>
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </MotiView>
    </SafeAreaView>
  );
};

export default Create;
