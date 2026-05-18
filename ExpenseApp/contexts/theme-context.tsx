import * as SecureStore from "expo-secure-store";
import React from "react";
import { useColorScheme } from "react-native";

export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  surface: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  tabBar: string;
  tabBarBorder: string;
  searchBorder: string;
  searchIcon: string;
  inputBg: string;
  isDark: boolean;
}

const lightColors: ThemeColors = {
  background: "#fff",
  backgroundSecondary: "#f5f5f5",
  surface: "#fff",
  border: "#f0f0f0",
  borderStrong: "#e8e8e8",
  text: "#11181C",
  textSecondary: "#888",
  textMuted: "#aaa",
  tabBar: "#fff",
  tabBarBorder: "#e5e5e5",
  searchBorder: "#ccc",
  searchIcon: "#555",
  inputBg: "transparent",
  isDark: false,
};

const darkColors: ThemeColors = {
  background: "#121212",
  backgroundSecondary: "#1c1c1e",
  surface: "#1e1e1e",
  border: "#2a2a2a",
  borderStrong: "#333",
  text: "#f0f0f0",
  textSecondary: "#9a9a9a",
  textMuted: "#555",
  tabBar: "#1c1c1e",
  tabBarBorder: "#2a2a2a",
  searchBorder: "#444",
  searchIcon: "#ccc",
  inputBg: "transparent",
  isDark: true,
};

export type AppTheme = "system" | "light" | "dark";

const STORAGE_KEY = "app_theme";

interface ThemeContextType {
  appTheme: AppTheme;
  setAppTheme: (theme: AppTheme) => Promise<void>;
}

const ThemeContext = React.createContext<ThemeContextType>({
  appTheme: "system",
  setAppTheme: () => {},
});

export const useAppTheme = () => React.useContext(ThemeContext);

export const useThemeColors = (): ThemeColors => {
  const { appTheme } = useAppTheme();
  const systemScheme = useColorScheme();
  const isDark =
    appTheme === "dark" || (appTheme === "system" && systemScheme === "dark");
  return isDark ? darkColors : lightColors;
};

export const AppThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [appTheme, setAppThemeState] = React.useState<AppTheme>("system");

  // Cargar preferencia guardada al montar
  React.useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setAppThemeState(stored);
      }
      // Si no hay nada guardado, se queda en "system" por defecto
    });
  }, []);

  const setAppTheme = React.useCallback(async (theme: AppTheme) => {
    setAppThemeState(theme);
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, theme);
    } catch {}
  }, []);

  return (
    <ThemeContext.Provider value={{ appTheme, setAppTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
