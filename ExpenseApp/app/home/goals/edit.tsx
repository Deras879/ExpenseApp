import { RemindersSection } from "@/components/reminders-section";
import { useThemeColors } from "@/contexts/theme-context";
import { useToast } from "@/contexts/toast-context";
import { useUiPrefs } from "@/contexts/ui-prefs-context";
import { useAuthFetch } from "@/hooks/auth";
import {
  DEFAULT_RECURRING,
  loadGoalNotifPrefs,
  useGoalNotifications,
  type GoalRecurringPrefs,
} from "@/hooks/use-goal-notifications";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { MotiView } from "moti";
import React from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Easing } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const ICONS = [
  "✈️",
  "🏠",
  "🚗",
  "📱",
  "💻",
  "📚",
  "🎓",
  "💍",
  "🎁",
  "🏖️",
  "💰",
  "🎯",
];

const COLORS_PALETTE = [
  "#1457f6",
  "#16a34a",
  "#dc2626",
  "#d97706",
  "#9333ea",
  "#0891b2",
  "#db2777",
  "#475569",
];

const GoalEdit = () => {
  const colors = useThemeColors();
  const { vibrationEnabled } = useUiPrefs();
  const authFetch = useAuthFetch();
  const toast = useToast();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; goal?: string }>();

  const initial = React.useMemo(() => {
    if (!params.goal) return null;
    try {
      return JSON.parse(params.goal) as {
        id: string;
        name: string;
        targetAmount: number;
        deadline?: string | null;
        icon: string;
        color: string;
      };
    } catch {
      return null;
    }
  }, [params.goal]);

  const [isClosing, setIsClosing] = React.useState(false);
  const [name, setName] = React.useState(initial?.name ?? "");
  const [targetAmount, setTargetAmount] = React.useState(
    initial?.targetAmount ? String(Math.trunc(initial.targetAmount)) : "",
  );
  const [deadline, setDeadline] = React.useState<Date | null>(
    initial?.deadline ? new Date(initial.deadline) : null,
  );
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [selectedIcon, setSelectedIcon] = React.useState<string>(
    initial?.icon ?? ICONS[0],
  );
  const [selectedColor, setSelectedColor] = React.useState<string>(
    initial?.color ?? COLORS_PALETTE[0],
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [recurring, setRecurring] =
    React.useState<GoalRecurringPrefs>(DEFAULT_RECURRING);
  const [showTimePicker, setShowTimePicker] = React.useState(false);
  const { scheduleForGoal } = useGoalNotifications();

  // Load existing reminder prefs
  React.useEffect(() => {
    const goalId = initial?.id ?? params.id;
    if (!goalId) return;
    loadGoalNotifPrefs(String(goalId))
      .then((p) => setRecurring(p.recurring))
      .catch(() => {});
  }, [initial?.id, params.id]);

  const handleClose = () => {
    if (isClosing) return;
    Keyboard.dismiss();
    setIsClosing(true);
    setTimeout(() => router.back(), 300);
  };

  const handleAmountChange = (value: string) => {
    const stripped = value.replace(/,/g, "").replace(/[^0-9]/g, "");
    setTargetAmount(stripped);
  };

  const formatDisplay = (value: string): string => {
    if (!value) return "";
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleDateChange = (_event: any, date?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (date) setDeadline(date);
  };

  const formatDeadlineLabel = (d: Date) =>
    d.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const goalId = initial?.id ?? params.id;
    if (!goalId) {
      toast.error("No se encontró la meta a editar");
      return;
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      if (vibrationEnabled)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error("Ingresa un nombre para la meta");
      return;
    }
    const numericTarget = parseFloat(targetAmount);
    if (!targetAmount || isNaN(numericTarget) || numericTarget <= 0) {
      if (vibrationEnabled)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error("Ingresa un monto objetivo válido");
      return;
    }

    try {
      setIsSubmitting(true);
      const body = {
        name: trimmedName,
        targetAmount: numericTarget,
        deadline: deadline ? deadline.toISOString() : null,
        icon: selectedIcon,
        color: selectedColor,
      };
      await authFetch(`/savings-goals/${goalId}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      try {
        await scheduleForGoal(
          {
            id: String(goalId),
            name: trimmedName,
            targetAmount: numericTarget,
            currentAmount: 0,
            createdAt: new Date().toISOString(),
            deadline: deadline ? deadline.toISOString() : null,
            status: "active",
          },
          { recurring },
        );
      } catch (err) {
        console.warn("Could not reschedule goal notifications", err);
      }
      if (vibrationEnabled)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success("Meta actualizada");
      handleClose();
    } catch (error) {
      console.error("Error updating goal:", error);
      if (vibrationEnabled)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error(
        "Error al actualizar la meta: " +
          ((error as Error).message ?? "desconocido"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setShowDatePicker(false);
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
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: colors.text,
              }}
            >
              Editar Meta
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
            contentContainerStyle={{
              padding: 20,
              gap: 24,
              paddingBottom: 40,
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* Vista previa */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                padding: 16,
                borderRadius: 16,
                backgroundColor: selectedColor + "18",
                borderWidth: 1,
                borderColor: selectedColor + "44",
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  backgroundColor: selectedColor + "33",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 28 }}>{selectedIcon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: colors.text,
                  }}
                  numberOfLines={1}
                >
                  {name.trim() || "Nombre de tu meta"}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                    marginTop: 2,
                  }}
                >
                  Objetivo:{" "}
                  {targetAmount ? `$${formatDisplay(targetAmount)}` : "$0"}
                </Text>
              </View>
            </View>

            {/* Nombre */}
            <View style={{ gap: 10 }}>
              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <MaterialIcons name="flag" size={20} color="gray" />
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
                placeholder="Ej. Viaje a Japón"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
                maxLength={80}
                style={{
                  padding: 10,
                  borderBottomWidth: 1,
                  borderColor: colors.border,
                  fontSize: 15,
                  color: colors.text,
                }}
              />
            </View>

            {/* Monto objetivo */}
            <View style={{ gap: 10 }}>
              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <MaterialIcons name="attach-money" size={20} color="gray" />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: colors.text,
                  }}
                >
                  Monto objetivo
                </Text>
              </View>
              <TextInput
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                value={formatDisplay(targetAmount)}
                onChangeText={handleAmountChange}
                style={{
                  padding: 10,
                  borderBottomWidth: 1,
                  borderColor: colors.border,
                  fontSize: 22,
                  color: colors.text,
                }}
              />
            </View>

            {/* Fecha límite */}
            <View style={{ gap: 10 }}>
              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <MaterialIcons name="event" size={20} color="gray" />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: colors.text,
                  }}
                >
                  Fecha límite{" "}
                  <Text
                    style={{
                      fontWeight: "normal",
                      fontSize: 13,
                      color: colors.textSecondary,
                    }}
                  >
                    (opcional)
                  </Text>
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  style={({ pressed }) => ({
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ color: colors.text }}>
                    {deadline
                      ? formatDeadlineLabel(deadline)
                      : "Seleccionar fecha"}
                  </Text>
                </Pressable>
                {deadline && (
                  <Pressable
                    onPress={() => setDeadline(null)}
                    hitSlop={8}
                    style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                  >
                    <MaterialIcons
                      name="close"
                      size={24}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                )}
              </View>
              {showDatePicker && (
                <DateTimePicker
                  value={deadline ?? new Date()}
                  mode="date"
                  onChange={handleDateChange}
                />
              )}
            </View>

            {/* Icono */}
            <View style={{ gap: 10 }}>
              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <MaterialIcons name="emoji-emotions" size={20} color="gray" />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: colors.text,
                  }}
                >
                  Ícono
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                {ICONS.map((icon) => {
                  const isActive = selectedIcon === icon;
                  return (
                    <Pressable
                      key={icon}
                      onPress={() => setSelectedIcon(icon)}
                      style={({ pressed }) => ({
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 2,
                        borderColor: isActive ? selectedColor : colors.border,
                        backgroundColor: isActive
                          ? selectedColor + "22"
                          : colors.surface,
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Text style={{ fontSize: 24 }}>{icon}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Color */}
            <View style={{ gap: 10 }}>
              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <MaterialIcons name="palette" size={20} color="gray" />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: colors.text,
                  }}
                >
                  Color
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                {COLORS_PALETTE.map((c) => {
                  const isActive = selectedColor === c;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => setSelectedColor(c)}
                      style={({ pressed }) => ({
                        width: 38,
                        height: 38,
                        borderRadius: 999,
                        backgroundColor: c,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 3,
                        borderColor: isActive ? colors.text : "transparent",
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      {isActive && (
                        <MaterialIcons name="check" size={20} color="#fff" />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Recordatorios */}
            <RemindersSection
              colors={colors}
              value={recurring}
              onChange={setRecurring}
              showTimePicker={showTimePicker}
              setShowTimePicker={setShowTimePicker}
              hasDeadline={!!deadline}
            />

            {/* Acciones */}
            <View style={{ gap: 16, marginTop: 10 }}>
              <Pressable
                style={({ pressed }) => ({
                  padding: 18,
                  backgroundColor: selectedColor,
                  borderRadius: 15,
                  opacity: isSubmitting || pressed ? 0.7 : 1,
                })}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text
                  style={{
                    color: "#ffffff",
                    fontWeight: "bold",
                    textAlign: "center",
                    fontSize: 15,
                  }}
                >
                  {isSubmitting ? "Guardando..." : "Guardar cambios"}
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
          </ScrollView>
        </View>
      </MotiView>
    </SafeAreaView>
  );
};

export default GoalEdit;
