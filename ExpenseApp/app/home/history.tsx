import { useTabFocus } from "@/contexts/tab-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useAuthFetch } from "@/hooks/auth";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
type Props = {};
const categories = [
  "Todas",
  "Comida",
  "Transporte",
  "Entretenimiento",
  "Servicios",
  "Salud",
  "Otro",
];

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
const formatDateLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (isSameDay(date, today)) return "Hoy";
  if (isSameDay(date, yesterday)) return "Ayer";

  return date.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

const groupByDate = (
  txs: Transaction[],
): { label: string; data: Transaction[] }[] => {
  const map = new Map<string, Transaction[]>();
  for (const tx of txs) {
    const key = new Date(tx.date).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(tx);
  }
  return Array.from(map.entries()).map(([, data]) => ({
    label: formatDateLabel(data[0].date),
    data,
  }));
};

const categoryConfig: Record<string, { emoji: string; color: string }> = {
  Comida: { emoji: "🍔", color: "#fef3c7" },
  Transporte: { emoji: "🚗", color: "#fee2e2" },
  Entretenimiento: { emoji: "🎮", color: "#ede9fe" },
  Servicios: { emoji: "💡", color: "#dbeafe" },
  Salud: { emoji: "💊", color: "#dcfce7" },
  Otro: { emoji: "📦", color: "#f3f4f6" },
};

const History = (props: Props) => {
  const colors = useThemeColors();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("Todas");
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const authFetch = useAuthFetch();
  const prevFiltersRef = React.useRef({
    selectedCategory: "Todas",
    searchTerm: "",
  });

  const isFocused = useTabFocus(1);
  React.useEffect(() => {
    if (!isFocused) return;
    prevFiltersRef.current = { selectedCategory: "Todas", searchTerm: "" };
    setSearchTerm("");
    setSelectedCategory("Todas");
    setHasMore(true);
    setPage(1);
    setTransactions([]);
    setRefreshKey((k) => k + 1);
  }, [isFocused]);

  // Fetch con debounce — detecta cambio de filtros con ref para evitar doble fetch
  React.useEffect(() => {
    if (!isFocused) return;
    const filtersChanged =
      prevFiltersRef.current.selectedCategory !== selectedCategory ||
      prevFiltersRef.current.searchTerm !== searchTerm;
    prevFiltersRef.current = { selectedCategory, searchTerm };

    // Si los filtros cambiaron y la página no es 1, resetear primero;
    // el efecto se disparará de nuevo con page=1 y filtersChanged=false
    if (filtersChanged && page !== 1) {
      setPage(1);
      setTransactions([]);
      return;
    }

    const fetchTransactions = async () => {
      if (page === 1) setLoadingTransactions(true);
      else setLoadingMore(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "10" });
        if (searchTerm) params.set("title", searchTerm);
        if (selectedCategory !== "Todas")
          params.set("category", selectedCategory);
        const data = await authFetch(`/transactions?${params.toString()}`);
        if (page === 1) {
          setTransactions(data.data ?? []);
        } else {
          setTransactions((prev) => [...prev, ...(data.data ?? [])]);
        }
        setHasMore(data.page * data.limit < data.total);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoadingTransactions(false);
        setLoadingMore(false);
      }
    };

    const timer = setTimeout(fetchTransactions, 500);
    return () => clearTimeout(timer);
  }, [page, selectedCategory, searchTerm, refreshKey, isFocused]);

  const handleScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const isNearBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
    if (isNearBottom && hasMore && !loadingMore && !loadingTransactions) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
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
          <Text
            style={{ fontSize: 24, fontWeight: "bold", color: colors.text }}
          >
            Historial
          </Text>
          <Pressable
            onPress={() => router.push("/home/settings" as any)}
            hitSlop={10}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <MaterialIcons name="settings" size={26} color={colors.text} />
          </Pressable>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.searchBorder,

            borderRadius: 8,
            paddingHorizontal: 10,
            marginLeft: 25,
            marginRight: 25,
          }}
        >
          <MaterialIcons name="search" size={24} color={colors.searchIcon} />
          <TextInput
            placeholder="Buscar transacción"
            placeholderTextColor={colors.textSecondary}
            style={{
              flex: 1,
              marginLeft: 8,
              color: colors.text,
            }}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            marginTop: 20,
            maxHeight: 40,
          }}
          contentContainerStyle={{
            alignItems: "center",
            paddingHorizontal: 10,
          }}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={{
                marginRight: 10,
                borderWidth: 1,
                borderColor:
                  selectedCategory === cat ? "#165bf7" : colors.searchBorder,
                borderRadius: 20,
                paddingHorizontal: 15,
                paddingVertical: 5,
                backgroundColor:
                  selectedCategory === cat ? "#165bf7" : colors.surface,
              }}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "bold",
                  color: selectedCategory === cat ? "#fff" : colors.text,
                }}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {loadingTransactions ? (
          <View
            style={{
              flex: 1,
            }}
          >
            <Text style={{ margin: 25, color: colors.text }}>
              Cargando transacciones...
            </Text>
          </View>
        ) : transactions.length === 0 ? (
          <Text style={{ margin: 25, color: colors.text }}>
            No hay transacciones recientes.
          </Text>
        ) : (
          <ScrollView
            style={{ flex: 1, marginTop: 20 }}
            onScroll={handleScroll}
            scrollEventThrottle={200}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            refreshControl={
              <RefreshControl
                refreshing={loadingTransactions && page === 1}
                onRefresh={() => {
                  setPage(1);
                  setTransactions([]);
                  setRefreshKey((k) => k + 1);
                }}
                tintColor={colors.text}
              />
            }
          >
            {groupByDate(transactions).map(({ label, data }) => (
              <View key={label}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "bold",
                    color: colors.textSecondary,
                    marginHorizontal: 25,
                    marginBottom: 10,
                    textTransform: "capitalize",
                  }}
                >
                  {label}
                </Text>
                {data.map((transaction) => {
                  const { emoji, color } =
                    categoryConfig[transaction.category] ??
                    categoryConfig["Otro"];

                  return (
                    <View
                      key={transaction.id}
                      style={{
                        gap: 5,
                        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
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
                              {transaction.category
                                ? transaction.category
                                : "Sueldo"}
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
                  );
                })}
              </View>
            ))}
            {loadingMore && (
              <Text
                style={{
                  textAlign: "center",
                  color: colors.textSecondary,
                  marginVertical: 16,
                }}
              >
                Cargando más...
              </Text>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

export default History;
