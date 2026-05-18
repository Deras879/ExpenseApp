import {
  DEFAULT_RECURRING,
  type GoalRecurringPrefs,
  type RecurringFrequency,
} from "@/hooks/use-goal-notifications";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";

// Expo: weekday 1=Domingo .. 7=Sábado
const WEEKDAYS: { value: number; short: string }[] = [
  { value: 1, short: "D" },
  { value: 2, short: "L" },
  { value: 3, short: "M" },
  { value: 4, short: "X" },
  { value: 5, short: "J" },
  { value: 6, short: "V" },
  { value: 7, short: "S" },
];

const FREQUENCIES: { value: RecurringFrequency; label: string }[] = [
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensual" },
];

const pad = (n: number) => String(n).padStart(2, "0");

type Props = {
  colors: any;
  value: GoalRecurringPrefs;
  onChange: (next: GoalRecurringPrefs) => void;
  showTimePicker: boolean;
  setShowTimePicker: (v: boolean) => void;
  hasDeadline: boolean;
};

export const RemindersSection: React.FC<Props> = ({
  colors,
  value,
  onChange,
  showTimePicker,
  setShowTimePicker,
  hasDeadline,
}) => {
  const time = React.useMemo(() => {
    const d = new Date();
    d.setHours(value.hour, value.minute, 0, 0);
    return d;
  }, [value.hour, value.minute]);

  const handleTimeChange = (_e: any, d?: Date) => {
    if (Platform.OS === "android") setShowTimePicker(false);
    if (d) onChange({ ...value, hour: d.getHours(), minute: d.getMinutes() });
  };

  const handleDayOfMonth = (raw: string) => {
    const n = parseInt(raw.replace(/[^0-9]/g, ""), 10);
    const clamped = isNaN(n) ? 1 : Math.max(1, Math.min(28, n));
    onChange({ ...value, dayOfMonth: clamped });
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        <MaterialIcons name="notifications" size={20} color="gray" />
        <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text }}>
          Recordatorios{" "}
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

      <Pressable
        onPress={() => onChange({ ...value, enabled: !value.enabled })}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          padding: 12,
          borderRadius: 12,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            borderWidth: 2,
            borderColor: value.enabled ? "#1755ec" : colors.textMuted,
            backgroundColor: value.enabled ? "#1755ec" : "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {value.enabled && (
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: "#fff",
              }}
            />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>
            Recordatorio recurrente para aportar
          </Text>
          <Text
            style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}
          >
            Te avisaremos en el día y hora que elijas
          </Text>
        </View>
      </Pressable>

      {value.enabled && (
        <View style={{ gap: 12 }}>
          {/* Frequency */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            {FREQUENCIES.map((f) => {
              const active = value.frequency === f.value;
              return (
                <Pressable
                  key={f.value}
                  onPress={() => onChange({ ...value, frequency: f.value })}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: active ? "#1755ec" : colors.border,
                    backgroundColor: active ? "#1755ec22" : colors.surface,
                    alignItems: "center",
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text
                    style={{
                      color: active ? "#1755ec" : colors.text,
                      fontWeight: "600",
                    }}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Weekly day picker */}
          {value.frequency === "weekly" && (
            <View>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  marginBottom: 6,
                }}
              >
                Día de la semana
              </Text>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {WEEKDAYS.map((d) => {
                  const active = value.weekday === d.value;
                  return (
                    <Pressable
                      key={d.value}
                      onPress={() => onChange({ ...value, weekday: d.value })}
                      style={({ pressed }) => ({
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: active ? "#1755ec" : colors.border,
                        backgroundColor: active ? "#1755ec22" : colors.surface,
                        alignItems: "center",
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <Text
                        style={{
                          color: active ? "#1755ec" : colors.text,
                          fontWeight: "600",
                        }}
                      >
                        {d.short}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Monthly day of month */}
          {value.frequency === "monthly" && (
            <View>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  marginBottom: 6,
                }}
              >
                Día del mes (1-28)
              </Text>
              <TextInput
                keyboardType="numeric"
                value={String(value.dayOfMonth)}
                onChangeText={handleDayOfMonth}
                maxLength={2}
                style={{
                  padding: 10,
                  borderWidth: 1,
                  borderRadius: 10,
                  borderColor: colors.border,
                  fontSize: 16,
                  color: colors.text,
                  backgroundColor: colors.surface,
                }}
              />
            </View>
          )}

          {/* Time */}
          <View>
            <Text
              style={{
                fontSize: 12,
                color: colors.textSecondary,
                marginBottom: 6,
              }}
            >
              Hora
            </Text>
            <Pressable
              onPress={() => setShowTimePicker(true)}
              style={({ pressed }) => ({
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ color: colors.text }}>
                {pad(value.hour)}:{pad(value.minute)}
              </Text>
            </Pressable>
            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                is24Hour
                onChange={handleTimeChange}
              />
            )}
          </View>
        </View>
      )}

      {hasDeadline && (
        <View
          style={{
            padding: 10,
            borderRadius: 10,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: "row",
            gap: 8,
            alignItems: "flex-start",
          }}
        >
          <MaterialIcons
            name="info-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={{ flex: 1, fontSize: 12, color: colors.textSecondary }}>
            Como tienes fecha límite, también recibirás avisos automáticos al
            25%, 50% y 75% del tiempo, y 7 días, 1 día y el día del deadline.
          </Text>
        </View>
      )}
    </View>
  );
};

export { DEFAULT_RECURRING };
