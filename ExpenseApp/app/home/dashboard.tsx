import { authFetch } from "@/api";
import {
  formatGoalCurrency,
  goalProgress,
  type Goal,
} from "@/constants/goals-utils";
import { useTabFocus } from "@/contexts/tab-context";
import { useThemeColors } from "@/contexts/theme-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { MotiView, ScrollView } from "moti";
import React from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";

type Props = {};

interface Transaction {
  id: string;
  type: "income" | "expense";
  title: string;
  amount: string;
  category: string;
  date: string;
}

const formatCurrency = (value: string): string => {
  const number = parseFloat(value);
  if (isNaN(number)) return "$0.00";
  return number.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
};

const categoryConfig: Record<string, { emoji: string; color: string }> = {
  Comida: { emoji: "🍔", color: "#fef3c7" },
  Transporte: { emoji: "🚗", color: "#fee2e2" },
  Entretenimiento: { emoji: "🎮", color: "#ede9fe" },
  Servicios: { emoji: "💡", color: "#dbeafe" },
  Salud: { emoji: "💊", color: "#dcfce7" },
  Otro: { emoji: "📦", color: "#f3f4f6" },
};

const Dashboard = (props: Props) => {
  const colors = useThemeColors();
  const [loadingTransactions, setLoadingTransactions] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [loadingGoals, setLoadingGoals] = React.useState(true);
  const [metrics, setMetrics] = React.useState({
    monthBalance: 0,
    monthIncome: 0,
    monthExpense: 0,
    monthSavings: 0,
    monthTransactions: 0,
  });

  const isFocused = useTabFocus(0);

  const fetchTransactions = React.useCallback(async () => {
    setLoadingTransactions(true);
    try {
      const data = await authFetch("/transactions?page=1&limit=5");
      setTransactions(data.data ?? []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoadingTransactions(false);
    }
  }, []);

  const fetchMetrics = React.useCallback(async () => {
    try {
      const data = await authFetch("/transactions/metrics");
      const incomeMonth =
        data.find((item: any) => item.type === "income") || {};
      const expenseMonth =
        data.find((item: any) => item.type === "expense") || {};
      const monthBalance = (incomeMonth.total || 0) - (expenseMonth.total || 0);
      const totalTransactions =
        (Number(incomeMonth.count) || 0) + (Number(expenseMonth.count) || 0);
      const incomeTotal = incomeMonth.total || 0;
      const savingsRate =
        incomeTotal > 0 ? (monthBalance / incomeTotal) * 100 : 0;
      setMetrics((prev) => ({
        ...prev,
        monthExpense: expenseMonth.total || 0,
        monthIncome: incomeTotal,
        monthBalance,
        monthSavings: savingsRate,
        monthTransactions: totalTransactions,
      }));
    } catch (error) {
      console.error("Error fetching metrics:", error);
    }
  }, []);

  const fetchGoals = React.useCallback(async () => {
    setLoadingGoals(true);
    try {
      const data = await authFetch("/savings-goals");
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.goals)
          ? data.goals
          : Array.isArray(data?.data)
            ? data.data
            : [];
      const normalized: Goal[] = list.map((raw: any) => ({
        id: String(raw?.id ?? raw?._id ?? ""),
        name: String(raw?.name ?? ""),
        targetAmount: Number(raw?.targetAmount ?? raw?.target_amount ?? 0),
        currentAmount: Number(raw?.currentAmount ?? raw?.current_amount ?? 0),
        deadline: raw?.deadline ?? undefined,
        icon: String(raw?.icon ?? "🎯"),
        color: String(raw?.color ?? "#1457f6"),
        status: (raw?.status ?? "active") as Goal["status"],
        createdAt: String(raw?.createdAt ?? raw?.created_at ?? ""),
        completedAt: raw?.completedAt ?? raw?.completed_at ?? undefined,
        movements: Array.isArray(raw?.movements) ? raw.movements : [],
      }));
      setGoals(normalized);
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setLoadingGoals(false);
    }
  }, []);

  // Recarga al cambiar a esta pestaña
  React.useEffect(() => {
    if (!isFocused) return;
    fetchMetrics();
    fetchTransactions();
    fetchGoals();
  }, [isFocused, fetchMetrics, fetchTransactions, fetchGoals]);

  // Recarga al cerrar el modal de creación (la pantalla recupera el foco del stack)
  useFocusEffect(
    React.useCallback(() => {
      if (!isFocused) return;
      fetchMetrics();
      fetchTransactions();
      fetchGoals();
    }, [isFocused, fetchMetrics, fetchTransactions, fetchGoals]),
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchMetrics(), fetchTransactions(), fetchGoals()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchMetrics, fetchTransactions, fetchGoals]);

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
            Dashboard
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.text}
          />
        }
      >
        <MotiView
          from={{ opacity: 0, translateY: 80 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500, delay: 100 }}
        >
          <LinearGradient
            colors={
              colors.isDark ? ["#1a2a4a", "#0d1f3c"] : ["#31a3db", "#165bf7"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              marginTop: 0,
              margin: 25,
              borderRadius: 30,
              flex: 1,
              borderBottomLeftRadius: 30,
              borderBottomRightRadius: 30,
            }}
          >
            <View
              style={{
                margin: 25,
                padding: 10,
                borderRadius: 30,
              }}
            >
              <View>
                <Text style={{ color: "#fff", fontSize: 14 }}>
                  Balance Total (mes)
                </Text>
                <Text
                  style={{ color: "#fff", fontSize: 32, fontWeight: "bold" }}
                >
                  {loadingTransactions
                    ? "Cargando..."
                    : formatCurrency(metrics.monthBalance.toString())}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-start",
                  gap: 20,
                  marginTop: 20,
                }}
              >
                <View
                  style={{ gap: 5, flexDirection: "row", alignItems: "center" }}
                >
                  <View
                    style={{
                      backgroundColor: "#6480fc",
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <MaterialIcons name="trending-up" size={24} color="white" />
                  </View>
                  <View>
                    <Text style={{ color: "#fff" }}>Ingresos</Text>
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                      {loadingTransactions
                        ? "Cargando..."
                        : formatCurrency(metrics.monthIncome.toString())}
                    </Text>
                  </View>
                </View>
                <View
                  style={{ gap: 5, flexDirection: "row", alignItems: "center" }}
                >
                  <View
                    style={{
                      backgroundColor: "#6480fc",
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <MaterialIcons
                      name="trending-down"
                      size={24}
                      color="white"
                    />
                  </View>
                  <View>
                    <Text style={{ color: "#fff" }}>Gastos</Text>
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                      {loadingTransactions
                        ? "Cargando..."
                        : formatCurrency(metrics.monthExpense.toString())}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </MotiView>
        <MotiView
          from={{ opacity: 0, translateY: 60 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500, delay: 220 }}
        >
          <View
            style={{
              margin: 25,
              gap: 20,
              marginTop: 40,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{
                gap: 5,
                elevation: 4,
                padding: 20,
                borderRadius: 20,
                backgroundColor: colors.surface,
                flex: 1,
              }}
            >
              <View
                style={{ gap: 5, flexDirection: "row", alignItems: "center" }}
              >
                <MaterialIcons
                  name="account-balance-wallet"
                  size={36}
                  color={metrics.monthSavings >= 0 ? "green" : "red"}
                ></MaterialIcons>
                <Text style={{ fontSize: 14, color: colors.text }}>
                  Tasa de ahorro
                </Text>
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    color: metrics.monthSavings >= 0 ? "green" : "red",
                  }}
                >
                  {loadingTransactions
                    ? "Cargando..."
                    : `${metrics.monthSavings >= 0 ? "+" : ""}${metrics.monthSavings.toFixed(1)}%`}
                </Text>
              </View>
            </View>
            <View
              style={{
                gap: 5,
                elevation: 4,
                padding: 20,
                borderRadius: 20,
                backgroundColor: colors.surface,
                flex: 1,
              }}
            >
              <View
                style={{ gap: 5, flexDirection: "row", alignItems: "center" }}
              >
                <MaterialIcons
                  name="credit-card"
                  size={36}
                  color="orange"
                ></MaterialIcons>
                <Text style={{ fontSize: 14, color: colors.text }}>
                  Transacciones
                </Text>
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 32,
                    fontWeight: "bold",
                    color: "orange",
                  }}
                >
                  {loadingTransactions
                    ? "Cargando..."
                    : metrics.monthTransactions}
                </Text>
              </View>
            </View>
          </View>
        </MotiView>
        <MotiView
          from={{ opacity: 0, translateY: 50 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500, delay: 280 }}
        >
          <View
            style={{
              marginHorizontal: 25,
              marginTop: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "bold", color: colors.text }}
            >
              Mis Metas
            </Text>
            <Pressable
              onPress={() => router.push("/home/goals" as any)}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text style={{ color: "#1457f6", fontWeight: "600" }}>
                Ver todas
              </Text>
            </Pressable>
          </View>
          {loadingGoals ? (
            <Text
              style={{
                marginHorizontal: 25,
                marginTop: 10,
                color: colors.text,
              }}
            >
              Cargando metas...
            </Text>
          ) : (
            (() => {
              const activeGoals = goals
                .filter((g) => g.status === "active")
                .sort((a, b) => goalProgress(b) - goalProgress(a))
                .slice(0, 5);

              if (activeGoals.length === 0) {
                return (
                  <Pressable
                    onPress={() => router.push("/home/goals/create" as any)}
                    style={({ pressed }) => ({
                      marginHorizontal: 25,
                      marginTop: 12,
                      padding: 20,
                      borderRadius: 20,
                      backgroundColor: colors.surface,
                      elevation: 4,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        backgroundColor: "#1457f622",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MaterialIcons name="flag" size={24} color="#1457f6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: colors.text,
                        }}
                      >
                        Crea tu primera meta
                      </Text>
                      <Text
                        style={{ fontSize: 12, color: colors.textSecondary }}
                      >
                        Define un objetivo y empieza a ahorrar
                      </Text>
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={22}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                );
              }

              return (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingHorizontal: 25,
                    paddingTop: 12,
                    paddingBottom: 4,
                    gap: 14,
                  }}
                >
                  {activeGoals.map((goal, index) => {
                    const progress = goalProgress(goal);
                    const pct = Math.round(progress * 100);
                    return (
                      <MotiView
                        key={goal.id}
                        from={{ opacity: 0, translateX: 30 }}
                        animate={{ opacity: 1, translateX: 0 }}
                        transition={{
                          type: "timing",
                          duration: 400,
                          delay: 320 + index * 70,
                        }}
                      >
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: "/home/goals/[id]" as any,
                              params: {
                                id: goal.id,
                                goal: JSON.stringify(goal),
                              },
                            })
                          }
                          style={({ pressed }) => ({
                            width: 200,
                            padding: 16,
                            borderRadius: 20,
                            backgroundColor: colors.surface,
                            elevation: 4,
                            gap: 12,
                            opacity: pressed ? 0.85 : 1,
                          })}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <View
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 12,
                                backgroundColor: goal.color + "22",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Text style={{ fontSize: 22 }}>{goal.icon}</Text>
                            </View>
                            <Text
                              numberOfLines={1}
                              style={{
                                flex: 1,
                                fontSize: 14,
                                fontWeight: "600",
                                color: colors.text,
                              }}
                            >
                              {goal.name}
                            </Text>
                          </View>
                          <View style={{ gap: 6 }}>
                            <View
                              style={{
                                height: 8,
                                borderRadius: 999,
                                backgroundColor: colors.background,
                                overflow: "hidden",
                              }}
                            >
                              <View
                                style={{
                                  width: `${Math.min(100, pct)}%`,
                                  height: "100%",
                                  backgroundColor: goal.color,
                                }}
                              />
                            </View>
                            <View
                              style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: "700",
                                  color: goal.color,
                                }}
                              >
                                {pct}%
                              </Text>
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: colors.textSecondary,
                                }}
                              >
                                {formatGoalCurrency(goal.currentAmount)}
                              </Text>
                            </View>
                          </View>
                        </Pressable>
                      </MotiView>
                    );
                  })}
                </ScrollView>
              );
            })()
          )}
        </MotiView>
        <MotiView
          from={{ opacity: 0, translateY: 40 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500, delay: 340 }}
        >
          <View style={{ margin: 25, gap: 10 }}>
            <Text
              style={{ fontSize: 18, fontWeight: "bold", color: colors.text }}
            >
              Transacciones Recientes
            </Text>
          </View>
          <View>
            {loadingTransactions ? (
              <Text style={{ margin: 25, color: colors.text }}>
                Cargando transacciones...
              </Text>
            ) : transactions.length === 0 ? (
              <Text style={{ margin: 25, color: colors.text }}>
                No hay transacciones recientes.
              </Text>
            ) : (
              transactions.map((transaction, index) => {
                const { emoji, color } =
                  transaction.type === "income"
                    ? { emoji: "💰", color: "#dcfce7" }
                    : (categoryConfig[transaction.category] ??
                      categoryConfig["Otro"]);

                return (
                  <MotiView
                    key={transaction.id}
                    from={{ opacity: 0, translateY: 30 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{
                      type: "timing",
                      duration: 400,
                      delay: 400 + index * 60,
                    }}
                  >
                    <View
                      style={{
                        gap: 5,
                        elevation: 4,
                        padding: 20,
                        borderRadius: 20,
                        backgroundColor: colors.surface,
                        marginBottom: 15,
                        marginHorizontal: 25,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={{
                          gap: 5,
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <View
                          style={{
                            gap: 10,
                            alignItems: "center",
                            flexDirection: "row",
                          }}
                        >
                          <View
                            style={{
                              borderRadius: 999,
                              backgroundColor: color,
                              width: 35,
                              height: 35,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text style={{ fontSize: 22 }}>{emoji}</Text>
                          </View>
                          <View>
                            <Text style={{ fontSize: 14, color: colors.text }}>
                              {transaction.title}
                            </Text>
                            <Text
                              style={{
                                fontSize: 14,
                                color: colors.textSecondary,
                              }}
                            >
                              {transaction.type === "income"
                                ? "Ingreso"
                                : (transaction.category ?? "Sin categoría")}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View>
                        <Text
                          style={{
                            fontSize: 24,
                            fontWeight: "bold",
                            color:
                              transaction.type === "income" ? "green" : "red",
                          }}
                        >
                          {transaction.type === "income" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </Text>
                      </View>
                    </View>
                  </MotiView>
                );
              })
            )}
          </View>
        </MotiView>
      </ScrollView>
    </View>
  );
};

export default Dashboard;
