import { useTabFocus } from "@/contexts/tab-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useAuthFetch } from "@/hooks/auth";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { LineChart, PieChart } from "react-native-chart-kit";

const categories = [
  "Comida",
  "Transporte",
  "Entretenimiento",
  "Servicios",
  "Salud",
  "Otro",
];

interface ExpenseByCategory {
  category: string;
  total: number;
}
const categoryColors: Record<string, string> = {
  Comida: "#fbbf24",
  Transporte: "#f87171",
  Entretenimiento: "#a78bfa",
  Servicios: "#60a5fa",
  Salud: "#34d399",
  Otro: "#9ca3af",
};

const formatCurrency = (value: number): string =>
  value.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

const Analysis = () => {
  const colors = useThemeColors();
  const authFetch = useAuthFetch();
  const { width: screenWidth } = useWindowDimensions();
  const [isLoading, setIsLoading] = React.useState(false);
  const [expenses, setExpenses] = React.useState<ExpenseByCategory[]>([]);
  const [incomeVsExpenses, setIncomeVsExpenses] = React.useState<
    { month: string; total: string; type: string }[]
  >([]);
  const [last7DaysExpenses, setLast7DaysExpenses] = React.useState<
    { day: string; total: string }[]
  >([]);
  const [selectedBarMonth, setSelectedBarMonth] = React.useState<{
    date: Date;
    income: number;
    expense: number;
  } | null>(null);

  const isFocused = useTabFocus(2);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchExpenses = React.useCallback(async () => {
    try {
      const data = await authFetch("/transactions/expenses-by-category");
      setExpenses(data.expensesByCategory ?? []);
      setIncomeVsExpenses(data.expensesVsIncome ?? []);
      setLast7DaysExpenses(data.last7DaysExpenses ?? []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  }, [authFetch]);

  React.useEffect(() => {
    if (!isFocused) return;
    setIsLoading(true);
    fetchExpenses().finally(() => setIsLoading(false));
  }, [isFocused, fetchExpenses]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchExpenses();
    } finally {
      setRefreshing(false);
    }
  }, [fetchExpenses]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingHorizontal: 25,
          paddingVertical: 18,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.text }}>
          Análisis
        </Text>
        <Pressable
          onPress={() => router.push("/home/settings" as any)}
          hitSlop={10}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <MaterialIcons name="settings" size={26} color={colors.text} />
        </Pressable>
      </View>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.text}
          />
        }
      >
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.text}
            style={{ marginTop: 40 }}
          />
        ) : (
          <>
            <View
              style={{
                marginBottom: 25,
                marginHorizontal: 15,
                paddingHorizontal: 25,
                elevation: 3,
                borderRadius: 8,
                backgroundColor: colors.surface,
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    marginBottom: 10,
                    color: colors.text,
                  }}
                >
                  Gastos por categoría
                </Text>
              </View>
              <View style={{ marginTop: 15 }}>
                {/* grafica pastel */}
                {expenses.length > 0 ? (
                  <View style={{ alignItems: "center" }}>
                    <PieChart
                      data={expenses.map((e) => ({
                        name: e.category,
                        population: Number(e.total),
                        color: categoryColors[e.category] ?? "#9ca3af",
                        legendFontColor: "#555",
                        legendFontSize: 13,
                      }))}
                      width={screenWidth}
                      height={220}
                      chartConfig={{ color: () => "#000" }}
                      accessor="population"
                      backgroundColor="transparent"
                      paddingLeft={String(screenWidth / 2 - 110)}
                      hasLegend={false}
                    />
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        gap: 10,
                        marginTop: 12,
                      }}
                    >
                      {expenses.map((e) => (
                        <View
                          key={e.category}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <View
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 6,
                              backgroundColor:
                                categoryColors[e.category] ?? "#9ca3af",
                            }}
                          />
                          <Text
                            style={{
                              fontSize: 13,
                              color: colors.textSecondary,
                            }}
                          >
                            {e.category}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <Text style={{ margin: 25, color: colors.textSecondary }}>
                    Sin datos de gastos.
                  </Text>
                )}
              </View>
            </View>
            <View>
              {/* gastos lineales */}
              {expenses.length > 0 &&
                (() => {
                  const max = Math.max(...expenses.map((e) => Number(e.total)));
                  return (
                    <View
                      style={{
                        marginHorizontal: 15,
                        marginBottom: 25,
                        paddingHorizontal: 25,
                        paddingVertical: 20,
                        elevation: 3,
                        borderRadius: 8,
                        backgroundColor: colors.surface,
                        gap: 16,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "bold",
                          color: colors.text,
                        }}
                      >
                        Desglose por categoría
                      </Text>
                      {expenses.map((e) => (
                        <View key={e.category} style={{ gap: 6 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <View
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: 5,
                                  backgroundColor:
                                    categoryColors[e.category] ?? "#9ca3af",
                                }}
                              />
                              <Text
                                style={{ fontSize: 14, color: colors.text }}
                              >
                                {e.category}
                              </Text>
                            </View>
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: "bold",
                                color: colors.text,
                              }}
                            >
                              {formatCurrency(Number(e.total))}
                            </Text>
                          </View>
                          <View
                            style={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: colors.border,
                            }}
                          >
                            <View
                              style={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor:
                                  categoryColors[e.category] ?? "#9ca3af",
                                width: `${(Number(e.total) / max) * 100}%`,
                              }}
                            />
                          </View>
                        </View>
                      ))}
                    </View>
                  );
                })()}
            </View>
            <View
              style={{
                marginHorizontal: 15,
                marginBottom: 25,
                paddingHorizontal: 25,
                paddingVertical: 20,
                elevation: 3,
                borderRadius: 8,
                backgroundColor: colors.surface,
                gap: 16,
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "bold", color: colors.text }}
              >
                Ingresos Vs Gastos (Últimos 6 meses)
              </Text>
              {(() => {
                const parseUTCDate = (iso: string) => {
                  const [y, m] = iso.split("T")[0].split("-").map(Number);
                  return new Date(y, m - 1, 1);
                };
                const monthAbbr = (iso: string) => {
                  const d = parseUTCDate(iso);
                  return d
                    .toLocaleDateString("es-CO", { month: "short" })
                    .replace(".", "")
                    .replace(/^\w/, (c) => c.toUpperCase());
                };
                const formatK = (val: number) => {
                  if (val >= 1_000_000)
                    return `${(val / 1_000_000).toFixed(1)}M`;
                  if (val >= 1_000) return `${Math.round(val / 1_000)}k`;
                  return String(Math.round(val));
                };

                // Generar los últimos 6 meses fijos
                const last6Months = Array.from({ length: 6 }).map((_, i) => {
                  const d = new Date();
                  d.setDate(1);
                  d.setMonth(d.getMonth() - (5 - i));
                  return d;
                });

                const getVal = (d: Date, type: string) => {
                  const match = incomeVsExpenses.find((item) => {
                    const itemDate = parseUTCDate(item.month);
                    return (
                      itemDate.getMonth() === d.getMonth() &&
                      itemDate.getFullYear() === d.getFullYear() &&
                      item.type === type
                    );
                  });
                  return Number(match?.total ?? 0);
                };

                const allValues = last6Months.flatMap((d) => [
                  getVal(d, "income"),
                  getVal(d, "expense"),
                ]);
                const max = Math.max(...allValues, 1);
                const chartHeight = 180;
                const ySteps = 4;

                return (
                  <View style={{ marginTop: 16 }}>
                    {selectedBarMonth && (
                      <View
                        style={{
                          backgroundColor: "#1e293b",
                          borderRadius: 8,
                          padding: 12,
                          marginBottom: 12,
                          alignSelf: "flex-start",
                          gap: 4,
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: "bold",
                            fontSize: 13,
                            marginBottom: 4,
                          }}
                        >
                          {monthAbbr(selectedBarMonth.date.toISOString())}
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 2,
                              backgroundColor: "#34d399",
                            }}
                          />
                          <Text style={{ color: "#ccc", fontSize: 12 }}>
                            Ingresos: {formatCurrency(selectedBarMonth.income)}
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
                              width: 8,
                              height: 8,
                              borderRadius: 2,
                              backgroundColor: "#f87171",
                            }}
                          />
                          <Text style={{ color: "#ccc", fontSize: 12 }}>
                            Gastos: {formatCurrency(selectedBarMonth.expense)}
                          </Text>
                        </View>
                      </View>
                    )}
                    <View style={{ flexDirection: "row" }}>
                      {/* Eje Y */}
                      <View
                        style={{
                          width: 36,
                          height: chartHeight,
                          justifyContent: "space-between",
                          alignItems: "flex-end",
                          paddingRight: 4,
                        }}
                      >
                        {Array.from({ length: ySteps + 1 }).map((_, i) => (
                          <Text
                            key={i}
                            style={{ fontSize: 9, color: colors.textMuted }}
                          >
                            {formatK((max / ySteps) * (ySteps - i))}
                          </Text>
                        ))}
                      </View>
                      {/* Barras */}
                      <View
                        style={{
                          flex: 1,
                          flexDirection: "row",
                          alignItems: "flex-end",
                          height: chartHeight,
                          gap: 4,
                        }}
                      >
                        {last6Months.map((d) => {
                          const income = getVal(d, "income");
                          const expense = getVal(d, "expense");
                          const key = d.toISOString();
                          const isSelected =
                            selectedBarMonth?.date.getMonth() ===
                              d.getMonth() &&
                            selectedBarMonth?.date.getFullYear() ===
                              d.getFullYear();
                          return (
                            <TouchableOpacity
                              key={key}
                              style={{ flex: 1, alignItems: "center" }}
                              activeOpacity={0.7}
                              onPress={() =>
                                setSelectedBarMonth(
                                  isSelected
                                    ? null
                                    : { date: d, income, expense },
                                )
                              }
                            >
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "flex-end",
                                  gap: 2,
                                  height: chartHeight,
                                }}
                              >
                                <View
                                  style={{
                                    width: 10,
                                    height: (income / max) * chartHeight,
                                    backgroundColor: "#34d399",
                                    borderRadius: 4,
                                    opacity: isSelected ? 1 : 0.75,
                                  }}
                                />
                                <View
                                  style={{
                                    width: 10,
                                    height: (expense / max) * chartHeight,
                                    backgroundColor: "#f87171",
                                    borderRadius: 4,
                                    opacity: isSelected ? 1 : 0.75,
                                  }}
                                />
                              </View>
                              <Text
                                style={{
                                  fontSize: 10,
                                  color: isSelected
                                    ? colors.text
                                    : colors.textSecondary,
                                  fontWeight: isSelected ? "bold" : "normal",
                                  marginTop: 4,
                                }}
                              >
                                {monthAbbr(d.toISOString())}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                    {/* Leyenda */}
                    <View
                      style={{ flexDirection: "row", gap: 16, marginTop: 12 }}
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
                            width: 10,
                            height: 10,
                            borderRadius: 2,
                            backgroundColor: "#34d399",
                          }}
                        />
                        <Text
                          style={{ fontSize: 12, color: colors.textSecondary }}
                        >
                          Ingresos
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
                            width: 10,
                            height: 10,
                            borderRadius: 2,
                            backgroundColor: "#f87171",
                          }}
                        />
                        <Text
                          style={{ fontSize: 12, color: colors.textSecondary }}
                        >
                          Gastos
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })()}
            </View>
            <View
              style={{
                marginHorizontal: 15,
                marginBottom: 25,
                paddingHorizontal: 25,
                paddingVertical: 20,
                elevation: 3,
                borderRadius: 8,
                backgroundColor: colors.surface,
                gap: 16,
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "bold", color: colors.text }}
              >
                Tendencia de Gastos (Últimos 7 días)
              </Text>
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const last7Days = Array.from({ length: 7 }).map((_, i) => {
                  const d = new Date(today);
                  d.setDate(today.getDate() - (6 - i));
                  return d;
                });

                const parseUTCDay = (iso: string) => {
                  const [y, m, day] = iso.split("T")[0].split("-").map(Number);
                  return new Date(y, m - 1, day);
                };

                const getDayVal = (d: Date) => {
                  const match = last7DaysExpenses?.find((item) => {
                    const itemDate = parseUTCDay(item.day);
                    return (
                      itemDate.getFullYear() === d.getFullYear() &&
                      itemDate.getMonth() === d.getMonth() &&
                      itemDate.getDate() === d.getDate()
                    );
                  });
                  return Number(match?.total ?? 0);
                };

                const values = last7Days.map((d) => getDayVal(d));
                const hasData = values.some((v) => v > 0);
                const chartValues = hasData ? values : values.map(() => 0.01);

                const labels = last7Days.map((d) =>
                  d
                    .toLocaleDateString("es-CO", { weekday: "short" })
                    .replace(".", "")
                    .replace(/^\w/, (c) => c.toUpperCase()),
                );

                return (
                  <LineChart
                    data={{ labels, datasets: [{ data: chartValues }] }}
                    width={screenWidth - 80}
                    height={200}
                    fromZero
                    chartConfig={{
                      backgroundColor: colors.surface,
                      backgroundGradientFrom: colors.surface,
                      backgroundGradientTo: colors.surface,
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                      labelColor: () => colors.textSecondary,
                      propsForDots: {
                        r: "4",
                        strokeWidth: "2",
                        stroke: "#3b82f6",
                      },
                      propsForBackgroundLines: {
                        stroke: colors.border,
                        strokeDasharray: "",
                      },
                    }}
                    bezier
                    withInnerLines
                    withOuterLines={false}
                    style={{ borderRadius: 8, marginLeft: -10 }}
                  />
                );
              })()}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default Analysis;
