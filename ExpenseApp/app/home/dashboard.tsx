import { authFetch } from "@/api";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { ScrollView } from "moti";
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {};

const Dashboard = (props: Props) => {
  const [loadingTransactions, setLoadingTransactions] = React.useState(true);
  const [transactions, setTransactions] = React.useState([]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchTransactions = async () => {
        setLoadingTransactions(true);
        try {
          const data = await authFetch("/transactions");
          setTransactions(data);
        } catch (error) {
          console.error("Error fetching transactions:", error);
        } finally {
          setLoadingTransactions(false);
        }
      };

      fetchTransactions();
    }, []),
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView style={{ flex: 1 }}>
        <LinearGradient
          colors={["#31a3db", "#165bf7"]}
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
              <Text style={{ color: "#fff", fontSize: 14 }}>Total Balance</Text>
              <Text style={{ color: "#fff", fontSize: 32, fontWeight: "bold" }}>
                $1000.00
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
                  <Text style={{ color: "#fff" }}>Income</Text>
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    $500.00
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
                  <MaterialIcons name="trending-down" size={24} color="white" />
                </View>
                <View>
                  <Text style={{ color: "#fff" }}>Expenses</Text>
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    $200.00
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
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
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
              padding: 20,
              borderRadius: 20,
              backgroundColor: "#fff",
              flex: 1,
            }}
          >
            <View
              style={{ gap: 5, flexDirection: "row", alignItems: "center" }}
            >
              <MaterialIcons
                name="account-balance-wallet"
                size={36}
                color="green"
              ></MaterialIcons>
              <Text style={{ fontSize: 14 }}>Saved</Text>
            </View>
            <View>
              <Text style={{ fontSize: 32, fontWeight: "bold" }}>$1000</Text>
            </View>
          </View>
          <View
            style={{
              gap: 5,
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
              padding: 20,
              borderRadius: 20,
              backgroundColor: "#fff",
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
              <Text style={{ fontSize: 14 }}>Transactions</Text>
            </View>
            <View>
              <Text style={{ fontSize: 32, fontWeight: "bold" }}>$1000</Text>
            </View>
          </View>
        </View>
        <View style={{ margin: 25, gap: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>
            Recent Transactions
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;
