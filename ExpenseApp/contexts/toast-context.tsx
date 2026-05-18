import { MaterialIcons } from "@expo/vector-icons";
import { AnimatePresence, MotiView } from "moti";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export type ToastType = "success" | "error" | "info" | "warning";

export type ToastOptions = {
  duration?: number; // ms
  position?: "top" | "bottom";
};

type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
  position: "top" | "bottom";
};

type ToastContextValue = {
  show: (message: string, type?: ToastType, options?: ToastOptions) => void;
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  hide: (id?: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const COLORS: Record<
  ToastType,
  { bg: string; icon: keyof typeof MaterialIcons.glyphMap }
> = {
  success: { bg: "#16a34a", icon: "check-circle" },
  error: { bg: "#dc2626", icon: "error" },
  info: { bg: "#1457f6", icon: "info" },
  warning: { bg: "#d97706", icon: "warning" },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const timersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const hide = useCallback((id?: number) => {
    setToasts((prev) => {
      if (id == null) {
        Object.values(timersRef.current).forEach(clearTimeout);
        timersRef.current = {};
        return [];
      }
      const t = timersRef.current[id];
      if (t) {
        clearTimeout(t);
        delete timersRef.current[id];
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const show = useCallback(
    (message: string, type: ToastType = "info", options?: ToastOptions) => {
      const id = ++idRef.current;
      const item: ToastItem = {
        id,
        message,
        type,
        duration: options?.duration ?? 2800,
        position: options?.position ?? "bottom",
      };
      setToasts((prev) => [...prev, item]);
      timersRef.current[id] = setTimeout(() => hide(id), item.duration);
    },
    [hide],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      hide,
      success: (m, o) => show(m, "success", o),
      error: (m, o) => show(m, "error", o),
      info: (m, o) => show(m, "info", o),
      warning: (m, o) => show(m, "warning", o),
    }),
    [show, hide],
  );

  const topToasts = toasts.filter((t) => t.position === "top");
  const bottomToasts = toasts.filter((t) => t.position === "bottom");

  return (
    <ToastContext.Provider value={value}>
      {children}
      <SafeAreaView
        pointerEvents="box-none"
        style={StyleSheet.absoluteFillObject}
      >
        <View pointerEvents="box-none" style={styles.topContainer}>
          <AnimatePresence>
            {topToasts.map((t) => (
              <ToastView key={t.id} item={t} onPress={() => hide(t.id)} />
            ))}
          </AnimatePresence>
        </View>
        <View pointerEvents="box-none" style={styles.bottomContainer}>
          <AnimatePresence>
            {bottomToasts.map((t) => (
              <ToastView key={t.id} item={t} onPress={() => hide(t.id)} />
            ))}
          </AnimatePresence>
        </View>
      </SafeAreaView>
    </ToastContext.Provider>
  );
};

const ToastView: React.FC<{ item: ToastItem; onPress: () => void }> = ({
  item,
  onPress,
}) => {
  const isTop = item.position === "top";
  const offset = isTop ? -40 : 40;
  const colors = COLORS[item.type];
  return (
    <MotiView
      from={{ opacity: 0, translateY: offset, scale: 0.95 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      exit={{ opacity: 0, translateY: offset, scale: 0.95 }}
      transition={{ type: "timing", duration: 220 }}
      style={[styles.toast, { backgroundColor: colors.bg }]}
      onTouchEnd={onPress}
    >
      <MaterialIcons name={colors.icon} size={22} color="#fff" />
      <Text style={styles.text} numberOfLines={3}>
        {item.message}
      </Text>
    </MotiView>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
};

const styles = StyleSheet.create({
  topContainer: {
    position: "absolute",
    top: Platform.OS === "android" ? 16 : 8,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
  },
  bottomContainer: {
    position: "absolute",
    bottom: Platform.OS === "android" ? 24 : 16,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 220,
    maxWidth: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: {
    color: "#fff",
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "500",
  },
});
