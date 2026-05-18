import { useThemeColors } from "@/contexts/theme-context";
import { useToast } from "@/contexts/toast-context";
import { useUiPrefs } from "@/contexts/ui-prefs-context";
import { useAuthFetch } from "@/hooks/auth";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { MotiView } from "moti";
import React from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Easing } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const GoalContribute = () => {
  const colors = useThemeColors();
  const { vibrationEnabled } = useUiPrefs();
  const authFetch = useAuthFetch();
  const toast = useToast();
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    name?: string;
    color?: string;
    icon?: string;
    mode?: string;
    currentAmount?: string;
  }>();

  const isWithdraw = params.mode === "withdraw";
  const currentAmount = Number(params.currentAmount ?? 0);

  const [isClosing, setIsClosing] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const [note, setNote] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const accent = isWithdraw ? "#dc2626" : params.color || "#1457f6";

  const handleClose = () => {
    if (isClosing) return;
    Keyboard.dismiss();
    setIsClosing(true);
    setTimeout(() => router.back(), 300);
  };

  const handleAmountChange = (value: string) => {
    const stripped = value.replace(/,/g, "").replace(/[^0-9]/g, "");
    setAmount(stripped);
  };

  const formatDisplay = (value: string): string => {
    if (!value) return "";
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!params.id) {
      toast.error("No se encontró la meta");
      return;
    }
    const numericAmount = parseFloat(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      if (vibrationEnabled)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error("Ingresa un monto válido");
      return;
    }
    if (isWithdraw && numericAmount > currentAmount) {
      if (vibrationEnabled)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error("El monto no puede ser mayor al saldo disponible");
      return;
    }

    try {
      setIsSubmitting(true);
      const body: { amount: number; note?: string } = {
        amount: isWithdraw ? -numericAmount : numericAmount,
      };
      const trimmedNote = note.trim();
      if (trimmedNote) body.note = trimmedNote;

      await authFetch(`/savings-goals/${params.id}/contributions`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (vibrationEnabled)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success(isWithdraw ? "Retiro registrado" : "Aporte registrado");
      handleClose();
    } catch (error) {
      console.error("Error creating contribution:", error);
      if (vibrationEnabled)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error(
        (isWithdraw
          ? "Error al registrar el retiro: "
          : "Error al registrar el aporte: ") +
          ((error as Error).message ?? "desconocido"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setIsClosing(false);
      };
    }, []),
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "transparent" }}
      edges={["top"]}
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
        <View style={{ flex: 1, backgroundColor: colors.surface }}>
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 20,
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
              {isWithdraw ? "Nuevo retiro" : "Nuevo aporte"}
            </Text>
            <Pressable onPress={handleClose} hitSlop={10}>
              <MaterialIcons
                name="keyboard-arrow-down"
                size={32}
                color="#8e8e93"
              />
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* Meta destino */}
            {params.name ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  padding: 14,
                  borderRadius: 16,
                  backgroundColor: accent + "18",
                  borderWidth: 1,
                  borderColor: accent + "40",
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: accent + "33",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{params.icon || "🎯"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 11,
                      fontWeight: "600",
                    }}
                  >
                    {isWithdraw ? "RETIRAR DE" : "APORTAR A"}
                  </Text>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 16,
                      fontWeight: "bold",
                    }}
                    numberOfLines={1}
                  >
                    {params.name}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Monto */}
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.text,
                  marginBottom: 8,
                }}
              >
                {isWithdraw ? "Monto del retiro" : "Monto del aporte"}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.background,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
              >
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "bold",
                    color: colors.textSecondary,
                    marginRight: 6,
                  }}
                >
                  $
                </Text>
                <TextInput
                  value={formatDisplay(amount)}
                  onChangeText={handleAmountChange}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  style={{
                    flex: 1,
                    fontSize: 22,
                    fontWeight: "bold",
                    color: colors.text,
                    padding: 0,
                  }}
                />
              </View>
              {isWithdraw ? (
                <Pressable
                  onPress={() => setAmount(String(Math.trunc(currentAmount)))}
                  hitSlop={6}
                  style={{
                    marginTop: 8,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color:
                        amount && parseFloat(amount) > currentAmount
                          ? "#dc2626"
                          : colors.textSecondary,
                    }}
                  >
                    Disponible: $
                    {formatDisplay(String(Math.trunc(currentAmount)))}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "bold",
                      color: accent,
                    }}
                  >
                    Usar máximo
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {/* Nota */}
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.text,
                  marginBottom: 8,
                }}
              >
                Nota{" "}
                <Text
                  style={{ color: colors.textSecondary, fontWeight: "normal" }}
                >
                  (opcional)
                </Text>
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder={
                  isWithdraw
                    ? "Ej. Imprevisto médico"
                    : "Ej. Bono de fin de año"
                }
                placeholderTextColor={colors.textSecondary}
                multiline
                maxLength={200}
                style={{
                  backgroundColor: colors.background,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 15,
                  color: colors.text,
                  minHeight: 80,
                  textAlignVertical: "top",
                }}
              />
            </View>

            {/* Botón guardar */}
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={({ pressed }) => ({
                backgroundColor: accent,
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
                opacity: isSubmitting ? 0.6 : pressed ? 0.8 : 1,
                elevation: 3,
                marginTop: 6,
              })}
            >
              <MaterialIcons
                name={isWithdraw ? "remove" : "add"}
                size={20}
                color="#fff"
              />
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                {isSubmitting
                  ? "Guardando..."
                  : isWithdraw
                    ? "Registrar retiro"
                    : "Registrar aporte"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </MotiView>
    </SafeAreaView>
  );
};

export default GoalContribute;
