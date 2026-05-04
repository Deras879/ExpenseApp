import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  Keyboard,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {};

const categories = [
  "Food",
  "Transport",
  "Entertainment",
  "Services",
  "Health",
  "Other",
];
const Create = (props: Props) => {
  const [selectedType, setSelectedType] = React.useState<
    "expense" | "income" | null
  >("expense");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null,
  );

  const today = new Date();
  const readableDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#ffff", gap: 20, padding: 20 }}
    >
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={{ flex: 1, gap: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>
            New Transaction
          </Text>
          <View
            style={{ flexDirection: "row", gap: 20, justifyContent: "center" }}
          >
            <Pressable
              style={{
                backgroundColor:
                  selectedType === "expense" ? "#e7000b" : "#e0e0e0",
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
                  color: selectedType === "expense" ? "#ffffff" : "#000000",
                  fontSize: 16,
                  fontWeight: "bold",
                }}
              >
                Expense
              </Text>
            </Pressable>
            <Pressable
              style={{
                backgroundColor:
                  selectedType === "income" ? "#00a63e" : "#e0e0e0",
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
                  color: selectedType === "income" ? "#ffffff" : "#000000",
                  fontSize: 16,
                  fontWeight: "bold",
                }}
              >
                Income
              </Text>
            </Pressable>
          </View>
          <View>
            <View style={{ gap: 10, marginBottom: 40 }}>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>Amount</Text>
              <View
                style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
              >
                <MaterialIcons name="attach-money" size={40} color="gray" />
                <TextInput
                  keyboardType="numeric"
                  placeholder="0.00"
                  style={{
                    padding: 10,
                    borderBottomWidth: 1,
                    borderColor: "#e0e0e0",
                    fontSize: 25,
                    flex: 1,
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
                style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
              >
                <MaterialIcons name="description" size={20} color="gray" />
                <Text style={{ fontSize: 16, fontWeight: "bold" }}>Title</Text>
              </View>
              <TextInput
                placeholder="Ex. Grocery shopping"
                style={{
                  padding: 10,
                  borderBottomWidth: 1,
                  borderColor: "#e0e0e0",
                  fontSize: 15,
                  color: "black",
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
                style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
              >
                <MaterialIcons name="sell" size={20} color="gray" />
                <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                  Category
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                {categories.map((category) => (
                  <View
                    style={{
                      boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                      padding: 10,
                      borderRadius: 10,
                      width: "48%",
                      backgroundColor:
                        selectedCategory === category ? "#155dfc" : "#fff",
                    }}
                    key={category}
                    onTouchStart={() => setSelectedCategory(category)}
                  >
                    <Text
                      style={{
                        color:
                          selectedCategory === category ? "#ffffff" : "#000000",
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
          <View style={{ gap: 10, flexDirection: "row", alignItems: "center" }}>
            <MaterialIcons name="calendar-today" size={20} color="gray" />
            <Text style={{ fontSize: 16 }}>{readableDate}</Text>
          </View>
          <View>
            <Pressable
              style={{
                padding: 20,
                backgroundColor:
                  selectedType === "expense" ? "#e7000b" : "#00a63e",
                borderRadius: 15,
              }}
            >
              <Text
                style={{
                  color: "#ffffff",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                {selectedType === "expense" ? "Add Expense" : "Add Income"}
              </Text>
            </Pressable>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default Create;
