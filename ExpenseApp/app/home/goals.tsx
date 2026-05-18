import {
  formatGoalCurrency,
  goalProgress,
  goalStatusColor,
  goalStatusLabel,
  type Goal,
  type GoalStatus,
} from "@/constants/goals-utils";
import { useThemeColors } from "@/contexts/theme-context";
import { useAuthFetch } from "@/hooks/auth";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { MotiView, ScrollView } from "moti";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";

type FilterKey = "all" | GoalStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "active", label: "Activas" },
  { key: "completed", label: "Completadas" },
  { key: "archived", label: "Archivadas" },
];

const GoalCard: React.FC<{ goal: Goal; index: number }> = ({ goal, index }) => {
  const colors = useThemeColors();
  const progress = goalProgress(goal);
  const pct = Math.round(progress * 100);
  const isCompleted = goal.status === "completed";
  const isArchived = goal.status === "archived";
  const accent = isArchived ? "#9ca3af" : goal.color;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 30 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: "timing",
        duration: 400,
        delay: 150 + index * 80,
      }}
    >
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/home/goals/[id]" as any,
            params: { id: goal.id, goal: JSON.stringify(goal) },
          })
        }
        style={({ pressed }) => ({
          opacity: pressed ? 0.85 : isArchived ? 0.7 : 1,
        })}
      >
        <View
          style={{
            elevation: 4,
            padding: 18,
            borderRadius: 20,
            backgroundColor: colors.surface,
            marginBottom: 15,
            marginHorizontal: 25,
            gap: 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: accent + "22",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 26 }}>{goal.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: colors.text,
                    flexShrink: 1,
                  }}
                  numberOfLines={1}
                >
                  {goal.name}
                </Text>
                {goal.status !== "active" && (
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 999,
                      backgroundColor: goalStatusColor[goal.status] + "22",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "bold",
                        color: goalStatusColor[goal.status],
                      }}
                    >
                      {goalStatusLabel[goal.status].toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.textSecondary,
                  marginTop: 2,
                }}
              >
                {formatGoalCurrency(goal.currentAmount)}{" "}
                <Text style={{ color: colors.textMuted }}>
                  / {formatGoalCurrency(goal.targetAmount)}
                </Text>
              </Text>
            </View>
            {isCompleted && (
              <MaterialIcons name="check-circle" size={26} color="#16a34a" />
            )}
          </View>

          {/* Progress bar */}
          <View>
            <View
              style={{
                height: 8,
                borderRadius: 999,
                backgroundColor: colors.borderStrong,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  backgroundColor: accent,
                  borderRadius: 999,
                }}
              />
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 6,
              }}
            >
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                {pct}% completado
              </Text>
              {goal.deadline && (
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  ⏳{" "}
                  {new Date(goal.deadline).toLocaleDateString("es-CO", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    </MotiView>
  );
};

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

const Goals = () => {
  const colors = useThemeColors();
  const authFetch = useAuthFetch();
  const [filter, setFilter] = React.useState<FilterKey>("all");
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchGoals = React.useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "refresh") setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const data = await authFetch("/savings-goals");
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.goals)
            ? data.goals
            : Array.isArray(data?.data)
              ? data.data
              : [];
        setGoals(list.map(normalizeGoal));
      } catch (err) {
        console.error("Error fetching goals:", err);
        setError(
          "No se pudieron cargar las metas: " +
            ((err as Error).message ?? "desconocido"),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [authFetch],
  );

  useFocusEffect(
    React.useCallback(() => {
      fetchGoals("initial");
    }, [fetchGoals]),
  );

  const filteredGoals = React.useMemo(() => {
    if (filter === "all") return goals;
    return goals.filter((g) => g.status === filter);
  }, [goals, filter]);

  const summary = React.useMemo(() => {
    const active = goals.filter((g) => g.status === "active");
    const completed = goals.filter((g) => g.status === "completed");
    const totalSaved = active.reduce((s, g) => s + g.currentAmount, 0);
    const totalTarget = active.reduce((s, g) => s + g.targetAmount, 0);
    return {
      activeCount: active.length,
      completedCount: completed.length,
      totalSaved,
      totalTarget,
    };
  }, [goals]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 350 }}
      >
        <View
          style={{
            paddingHorizontal: 25,
            paddingVertical: 18,
            backgroundColor: colors.background,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{ fontSize: 24, fontWeight: "bold", color: colors.text }}
          >
            Metas
          </Text>
          <Pressable
            onPress={() => router.push("/home/settings" as any)}
            hitSlop={10}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <MaterialIcons name="settings" size={26} color={colors.text} />
          </Pressable>
        </View>
      </MotiView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchGoals("refresh")}
            tintColor={colors.text}
          />
        }
      >
        {/* Resumen */}
        <MotiView
          from={{ opacity: 0, translateY: 40 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400 }}
        >
          <LinearGradient
            colors={
              colors.isDark ? ["#1a2a4a", "#0d1f3c"] : ["#31a3db", "#165bf7"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              margin: 25,
              marginTop: 0,
              borderRadius: 24,
              padding: 22,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 14, opacity: 0.9 }}>
              Total ahorrado en metas activas
            </Text>
            <Text
              style={{
                color: "#fff",
                fontSize: 30,
                fontWeight: "bold",
                marginTop: 4,
              }}
            >
              {formatGoalCurrency(summary.totalSaved)}
            </Text>
            <Text style={{ color: "#fff", fontSize: 13, opacity: 0.85 }}>
              de {formatGoalCurrency(summary.totalTarget)}
            </Text>

            <View
              style={{
                flexDirection: "row",
                gap: 18,
                marginTop: 18,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    backgroundColor: "#6480fc",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialIcons name="flag" size={18} color="white" />
                </View>
                <Text style={{ color: "#fff", fontSize: 13 }}>
                  {summary.activeCount} activas
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    backgroundColor: "#16a34a",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialIcons name="check" size={18} color="white" />
                </View>
                <Text style={{ color: "#fff", fontSize: 13 }}>
                  {summary.completedCount} completadas
                </Text>
              </View>
            </View>
          </LinearGradient>
        </MotiView>

        {/* Filtros */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 80 }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 25,
              gap: 8,
              paddingBottom: 18,
            }}
          >
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: active ? "#1457f6" : colors.border,
                      backgroundColor: active ? "#1457f6" : colors.surface,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: active ? "#fff" : colors.text,
                      }}
                    >
                      {f.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </MotiView>

        {/* Lista */}
        {loading ? (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              padding: 40,
            }}
          >
            <ActivityIndicator size="large" color="#1457f6" />
          </View>
        ) : error ? (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              padding: 40,
              gap: 12,
            }}
          >
            <MaterialIcons
              name="error-outline"
              size={48}
              color={colors.textSecondary}
            />
            <Text
              style={{
                color: colors.textSecondary,
                textAlign: "center",
                paddingHorizontal: 20,
              }}
            >
              {error}
            </Text>
            <Pressable
              onPress={() => fetchGoals("initial")}
              style={({ pressed }) => ({
                paddingHorizontal: 18,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: "#1457f6",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                Reintentar
              </Text>
            </Pressable>
          </View>
        ) : filteredGoals.length === 0 ? (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              padding: 40,
              gap: 14,
            }}
          >
            <MaterialIcons name="flag" size={56} color={colors.textSecondary} />
            <Text
              style={{
                color: colors.textSecondary,
                textAlign: "center",
              }}
            >
              {goals.length === 0
                ? "Aún no tienes metas. ¡Crea la primera!"
                : "No hay metas en esta categoría."}
            </Text>
            {goals.length === 0 && (
              <Pressable
                onPress={() => router.push("/home/goals/create" as any)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor: "#1457f6",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <MaterialIcons name="add" size={18} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  Crear meta
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          filteredGoals.map((g, i) => (
            <GoalCard key={g.id} goal={g} index={i} />
          ))
        )}
      </ScrollView>

      {/* FAB crear meta */}
      <MotiView
        from={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "timing", duration: 300, delay: 200 }}
        style={{
          position: "absolute",
          right: 22,
          bottom: 28,
        }}
      >
        <Pressable
          onPress={() => router.push("/home/goals/create" as any)}
          style={({ pressed }) => ({
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: "#1457f6",
            alignItems: "center",
            justifyContent: "center",
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 6,
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}
        >
          <MaterialIcons name="add" size={32} color="#fff" />
        </Pressable>
      </MotiView>
    </View>
  );
};

export default Goals;
