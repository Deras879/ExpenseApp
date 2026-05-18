import { Confetti } from "@/components/confetti";
import {
  formatGoalCurrency,
  formatGoalDate,
  goalProgress,
  goalStatusColor,
  goalStatusLabel,
  type Goal,
  type GoalMovement,
  type GoalStatus,
} from "@/constants/goals-utils";
import { useThemeColors } from "@/contexts/theme-context";
import { useToast } from "@/contexts/toast-context";
import { useUiPrefs } from "@/contexts/ui-prefs-context";
import { useAuthFetch } from "@/hooks/auth";
import { useGoalNotifications } from "@/hooks/use-goal-notifications";
import { MaterialIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { MotiView, ScrollView } from "moti";
import React from "react";
import { Alert, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const normalizeGoal = (raw: any): Goal => ({
  id: String(raw?.id ?? raw?._id ?? ""),
  name: String(raw?.name ?? ""),
  targetAmount: Number(raw?.targetAmount ?? raw?.target_amount ?? 0),
  currentAmount: Number(raw?.currentAmount ?? raw?.current_amount ?? 0),
  deadline: raw?.deadline ?? undefined,
  icon: String(raw?.icon ?? "🎯"),
  color: String(raw?.color ?? "#1457f6"),
  status: (raw?.status as GoalStatus) ?? "active",
  createdAt: String(
    raw?.createdAt ?? raw?.created_at ?? new Date().toISOString(),
  ),
  completedAt: raw?.completedAt ?? raw?.completed_at ?? undefined,
  movements: Array.isArray(raw?.movements) ? raw.movements : [],
});

const normalizeMovement = (raw: any): GoalMovement => {
  const rawAmount = Number(raw?.amount ?? 0);
  const rawType = String(raw?.type ?? "").toLowerCase();
  const type: GoalMovement["type"] =
    rawType === "withdraw" || rawType === "withdrawal" || rawAmount < 0
      ? "withdraw"
      : "deposit";
  return {
    id: String(raw?.id ?? raw?._id ?? Math.random().toString(36).slice(2)),
    type,
    amount: Math.abs(rawAmount),
    note: raw?.note ?? undefined,
    createdAt: String(
      raw?.createdAt ?? raw?.created_at ?? new Date().toISOString(),
    ),
  };
};

const MovementRow: React.FC<{ m: GoalMovement; index: number }> = ({
  m,
  index,
}) => {
  const colors = useThemeColors();
  const isDeposit = m.type === "deposit";
  const accent = isDeposit ? "#16a34a" : "#dc2626";
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 300, delay: 200 + index * 50 }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingVertical: 12,
          paddingHorizontal: 18,
          borderRadius: 16,
          backgroundColor: colors.surface,
          marginHorizontal: 25,
          marginBottom: 10,
          elevation: 2,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            backgroundColor: accent + "22",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIcons
            name={isDeposit ? "arrow-downward" : "arrow-upward"}
            size={20}
            color={accent}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>
            {isDeposit ? "Aporte" : "Retiro"}
          </Text>
          {m.note ? (
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              {m.note}
            </Text>
          ) : null}
          <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
            {formatGoalDate(m.createdAt)}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "bold",
            color: accent,
          }}
        >
          {isDeposit ? "+" : "-"}
          {formatGoalCurrency(m.amount)}
        </Text>
      </View>
    </MotiView>
  );
};

const GoalDetail = () => {
  const colors = useThemeColors();
  const authFetch = useAuthFetch();
  const toast = useToast();
  const { soundEnabled, vibrationEnabled } = useUiPrefs();
  const { checkMilestoneAndCleanup, purgeGoal, cancelForGoal } =
    useGoalNotifications();
  const params = useLocalSearchParams<{ id: string; goal?: string }>();
  const [isArchiving, setIsArchiving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const initialGoal = React.useMemo<Goal | null>(() => {
    if (!params.goal) return null;
    try {
      const parsed = JSON.parse(params.goal) as Goal;
      return {
        ...parsed,
        movements: Array.isArray(parsed.movements) ? parsed.movements : [],
      };
    } catch {
      return null;
    }
  }, [params.goal]);

  const [goal, setGoal] = React.useState<Goal | null>(initialGoal);
  const [movements, setMovements] = React.useState<GoalMovement[]>(
    initialGoal?.movements ?? [],
  );
  const [loadingMovements, setLoadingMovements] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const isFirstFocus = React.useRef(true);
  const prevCurrentAmount = React.useRef<number | null>(null);
  const [showConfetti, setShowConfetti] = React.useState(false);

  const refetchGoal = React.useCallback(async () => {
    if (!params.id) return;
    try {
      const data = await authFetch(`/savings-goals/${params.id}`);
      const raw = (data as any)?.goal ?? (data as any)?.data ?? data;
      if (raw && typeof raw === "object") {
        const normalized = normalizeGoal(raw);
        setGoal((prev) => {
          const prevAmt = prevCurrentAmount.current ?? prev?.currentAmount ?? 0;
          if (
            normalized.targetAmount > 0 &&
            prevAmt < normalized.targetAmount &&
            normalized.currentAmount >= normalized.targetAmount
          ) {
            setShowConfetti(true);
            if (vibrationEnabled)
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
            if (soundEnabled) {
              (async () => {
                try {
                  const { sound } = await Audio.Sound.createAsync(
                    require("@/assets/sounds/partySound.mp3"),
                    { volume: 0.8 },
                  );
                  await sound.playAsync();
                  sound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && status.didJustFinish)
                      sound.unloadAsync();
                  });
                } catch (_) {}
              })();
            }
          }
          // Disparar milestones (25/50/75/100) y limpiar notifs si llegó al 100%
          checkMilestoneAndCleanup(normalized, prevAmt).catch(() => {});
          prevCurrentAmount.current = normalized.currentAmount;
          return {
            ...normalized,
            movements: Array.isArray((raw as any).movements)
              ? (raw as any).movements
              : (prev?.movements ?? []),
          };
        });
      }
    } catch (err) {
      console.error("Error refetching goal:", err);
    }
  }, [
    authFetch,
    params.id,
    vibrationEnabled,
    soundEnabled,
    checkMilestoneAndCleanup,
  ]);

  const fetchContributions = React.useCallback(async () => {
    if (!params.id) return;
    try {
      setLoadingMovements(true);
      const data = await authFetch(`/savings-goals/${params.id}/contributions`);
      const list = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.contributions)
          ? (data as any).contributions
          : Array.isArray((data as any)?.data)
            ? (data as any).data
            : [];
      setMovements(list.map(normalizeMovement));
    } catch (err) {
      console.error("Error fetching contributions:", err);
    } finally {
      setLoadingMovements(false);
    }
  }, [authFetch, params.id]);

  useFocusEffect(
    React.useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        fetchContributions();
        return;
      }
      refetchGoal();
      fetchContributions();
    }, [refetchGoal, fetchContributions]),
  );

  if (!goal) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
          padding: 25,
        }}
      >
        <MaterialIcons name="error-outline" size={48} color={colors.text} />
        <Text style={{ color: colors.text, marginTop: 12 }}>
          Meta no encontrada
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{ marginTop: 20 }}
          hitSlop={10}
        >
          <Text style={{ color: "#1457f6", fontWeight: "bold" }}>Volver</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const progress = goalProgress(goal);
  const pct = Math.round(progress * 100);
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const isCompleted = goal.status === "completed";
  const isArchived = goal.status === "archived";
  const accent = isArchived ? "#9ca3af" : goal.color;

  const performStatusChange = async (newStatus: "archived" | "active") => {
    if (isArchiving) return;
    try {
      setIsArchiving(true);
      await authFetch(`/savings-goals/${goal.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: goal.name,
          targetAmount: goal.targetAmount,
          deadline: goal.deadline ?? null,
          icon: goal.icon,
          color: goal.color,
          status: newStatus,
        }),
      });
      // Si se archivó, cancelar notifs programadas (mantener prefs)
      if (newStatus === "archived") {
        await cancelForGoal(goal.id).catch(() => {});
      }
      if (vibrationEnabled)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success(
        newStatus === "archived" ? "Meta archivada" : "Meta restaurada",
      );
      router.back();
    } catch (error) {
      console.error("Error updating goal status:", error);
      if (vibrationEnabled)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error(
        "Error al cambiar el estado: " +
          ((error as Error).message ?? "desconocido"),
      );
    } finally {
      setIsArchiving(false);
    }
  };

  const performDelete = async () => {
    if (isDeleting) return;
    try {
      setIsDeleting(true);
      await authFetch(`/savings-goals/${goal.id}`, {
        method: "DELETE",
      });
      // Purgar prefs + notifs locales
      await purgeGoal(goal.id).catch(() => {});
      if (vibrationEnabled)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success("Meta eliminada");
      router.back();
    } catch (error) {
      console.error("Error deleting goal:", error);
      if (vibrationEnabled)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error(
        "Error al eliminar la meta: " +
          ((error as Error).message ?? "desconocido"),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeletePress = () => {
    Alert.alert(
      "Eliminar meta",
      "Esta acción no se puede deshacer. Se eliminarán también todos los movimientos asociados.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: performDelete,
        },
      ],
    );
  };

  const handleArchivePress = () => {
    const goingToArchive = !isArchived;
    Alert.alert(
      goingToArchive ? "Archivar meta" : "Restaurar meta",
      goingToArchive
        ? "La meta dejará de aceptar movimientos y se moverá a la pestaña de archivadas. Podrás restaurarla más tarde."
        : "La meta volverá a estar activa y aceptará movimientos.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: goingToArchive ? "Archivar" : "Restaurar",
          style: goingToArchive ? "destructive" : "default",
          onPress: () =>
            performStatusChange(goingToArchive ? "archived" : "active"),
        },
      ],
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <MaterialIcons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <Text
          style={{ fontSize: 18, fontWeight: "bold", color: colors.text }}
          numberOfLines={1}
        >
          Detalle de meta
        </Text>
        <View style={{ flexDirection: "row", gap: 14 }}>
          <Pressable
            hitSlop={10}
            onPress={() =>
              router.push({
                pathname: "/home/goals/edit" as any,
                params: { id: goal.id, goal: JSON.stringify(goal) },
              })
            }
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <MaterialIcons name="edit" size={22} color={colors.text} />
          </Pressable>
          <Pressable
            hitSlop={10}
            onPress={handleArchivePress}
            disabled={isArchiving}
            style={({ pressed }) => ({
              opacity: isArchiving ? 0.4 : pressed ? 0.6 : 1,
            })}
          >
            <MaterialIcons
              name={isArchived ? "unarchive" : "archive"}
              size={22}
              color={colors.text}
            />
          </Pressable>
          <Pressable
            hitSlop={10}
            onPress={handleDeletePress}
            disabled={isDeleting || isArchiving}
            style={({ pressed }) => ({
              opacity: isDeleting ? 0.4 : pressed ? 0.6 : 1,
            })}
          >
            <MaterialIcons name="delete-outline" size={22} color="#dc2626" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                await Promise.all([refetchGoal(), fetchContributions()]);
              } finally {
                setRefreshing(false);
              }
            }}
            tintColor={colors.text}
          />
        }
      >
        {/* Tarjeta principal */}
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400 }}
        >
          <LinearGradient
            colors={
              isArchived
                ? ["#6b7280", "#4b5563"]
                : isCompleted
                  ? ["#22c55e", "#15803d"]
                  : colors.isDark
                    ? ["#1a2a4a", "#0d1f3c"]
                    : ["#31a3db", "#165bf7"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              margin: 25,
              borderRadius: 24,
              padding: 24,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: "rgba(255,255,255,0.18)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 30 }}>{goal.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}
                >
                  {goal.name}
                </Text>
                <View
                  style={{
                    alignSelf: "flex-start",
                    marginTop: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    borderRadius: 999,
                    backgroundColor: "rgba(255,255,255,0.2)",
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: "bold",
                    }}
                  >
                    {goalStatusLabel[goal.status].toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ marginTop: 22 }}>
              <Text style={{ color: "#fff", fontSize: 13, opacity: 0.85 }}>
                Ahorrado
              </Text>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 32,
                  fontWeight: "bold",
                  marginTop: 2,
                }}
              >
                {formatGoalCurrency(goal.currentAmount)}
              </Text>
              <Text style={{ color: "#fff", fontSize: 13, opacity: 0.85 }}>
                de {formatGoalCurrency(goal.targetAmount)}
              </Text>
            </View>

            {/* Progress bar */}
            <View style={{ marginTop: 18 }}>
              <View
                style={{
                  height: 10,
                  borderRadius: 999,
                  backgroundColor: "rgba(255,255,255,0.25)",
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    backgroundColor: "#fff",
                    borderRadius: 999,
                  }}
                />
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 8,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 12 }}>
                  {pct}% completado
                </Text>
                {!isCompleted && (
                  <Text style={{ color: "#fff", fontSize: 12 }}>
                    Faltan {formatGoalCurrency(remaining)}
                  </Text>
                )}
              </View>
            </View>

            {goal.deadline && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 14,
                }}
              >
                <MaterialIcons name="event" size={16} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 12 }}>
                  Fecha límite: {formatGoalDate(goal.deadline)}
                </Text>
              </View>
            )}
            {goal.completedAt && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 14,
                }}
              >
                <MaterialIcons name="check-circle" size={16} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 12 }}>
                  Completada el {formatGoalDate(goal.completedAt)}
                </Text>
              </View>
            )}
          </LinearGradient>
        </MotiView>

        {/* Botones de acción */}
        {!isArchived && !isCompleted && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 400, delay: 100 }}
          >
            <View
              style={{
                flexDirection: "row",
                gap: 12,
                marginHorizontal: 25,
                marginBottom: 25,
              }}
            >
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/home/goals/contribute" as any,
                    params: {
                      id: goal.id,
                      name: goal.name,
                      color: goal.color,
                      icon: goal.icon,
                      currentAmount: String(goal.currentAmount),
                      targetAmount: String(goal.targetAmount),
                    },
                  })
                }
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: "#1457f6",
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 6,
                  opacity: pressed ? 0.8 : 1,
                  elevation: 3,
                })}
              >
                <MaterialIcons name="add" size={20} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  Aportar
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (goal.currentAmount <= 0) {
                    if (vibrationEnabled)
                      Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Warning,
                      );
                    toast.warning(
                      "No hay saldo disponible para retirar en esta meta",
                    );
                    return;
                  }
                  router.push({
                    pathname: "/home/goals/contribute" as any,
                    params: {
                      id: goal.id,
                      name: goal.name,
                      color: goal.color,
                      icon: goal.icon,
                      mode: "withdraw",
                      currentAmount: String(goal.currentAmount),
                    },
                  });
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.borderStrong,
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 6,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <MaterialIcons name="remove" size={20} color={colors.text} />
                <Text style={{ color: colors.text, fontWeight: "bold" }}>
                  Retirar
                </Text>
              </Pressable>
            </View>
          </MotiView>
        )}

        {/* Estado para completadas / archivadas */}
        {(isCompleted || isArchived) && (
          <View
            style={{
              marginHorizontal: 25,
              marginBottom: 25,
              padding: 16,
              borderRadius: 14,
              backgroundColor: goalStatusColor[goal.status] + "18",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <MaterialIcons
              name={isCompleted ? "celebration" : "archive"}
              size={22}
              color={goalStatusColor[goal.status]}
            />
            <Text
              style={{
                flex: 1,
                color: goalStatusColor[goal.status],
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              {isCompleted
                ? "¡Felicidades! Ya alcanzaste esta meta."
                : "Esta meta está archivada y no acepta movimientos."}
            </Text>
          </View>
        )}

        {/* Historial */}
        <View style={{ marginHorizontal: 25, marginBottom: 12 }}>
          <Text
            style={{ fontSize: 18, fontWeight: "bold", color: colors.text }}
          >
            Historial de movimientos
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.textSecondary,
              marginTop: 2,
            }}
          >
            {movements.length}{" "}
            {movements.length === 1 ? "movimiento" : "movimientos"}
          </Text>
        </View>

        {loadingMovements && movements.length === 0 ? (
          <Text
            style={{
              marginHorizontal: 25,
              color: colors.textSecondary,
              fontStyle: "italic",
            }}
          >
            Cargando movimientos...
          </Text>
        ) : movements.length === 0 ? (
          <Text
            style={{
              marginHorizontal: 25,
              color: colors.textSecondary,
              fontStyle: "italic",
            }}
          >
            Aún no hay movimientos registrados.
          </Text>
        ) : (
          movements.map((m, i) => <MovementRow key={m.id} m={m} index={i} />)
        )}
      </ScrollView>
      <Confetti active={showConfetti} onDone={() => setShowConfetti(false)} />
    </SafeAreaView>
  );
};

export default GoalDetail;
