import * as SecureStore from "expo-secure-store";
import React from "react";

const SOUND_KEY = "ui_sound_enabled";
const VIBRATION_KEY = "ui_vibration_enabled";
const GOAL_NOTIFS_KEY = "ui_goal_notifications_enabled";

interface UiPrefsContextType {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  goalNotificationsEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  setVibrationEnabled: (val: boolean) => void;
  setGoalNotificationsEnabled: (val: boolean) => void;
}

const UiPrefsContext = React.createContext<UiPrefsContextType>({
  soundEnabled: true,
  vibrationEnabled: true,
  goalNotificationsEnabled: true,
  setSoundEnabled: () => {},
  setVibrationEnabled: () => {},
  setGoalNotificationsEnabled: () => {},
});

export const useUiPrefs = () => React.useContext(UiPrefsContext);

export const UiPrefsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [soundEnabled, setSoundState] = React.useState(true);
  const [vibrationEnabled, setVibrationState] = React.useState(true);
  const [goalNotificationsEnabled, setGoalNotificationsState] =
    React.useState(true);

  React.useEffect(() => {
    SecureStore.getItemAsync(SOUND_KEY).then((val) => {
      if (val !== null) setSoundState(val === "true");
    });
    SecureStore.getItemAsync(VIBRATION_KEY).then((val) => {
      if (val !== null) setVibrationState(val === "true");
    });
    SecureStore.getItemAsync(GOAL_NOTIFS_KEY).then((val) => {
      if (val !== null) setGoalNotificationsState(val === "true");
    });
  }, []);

  const setSoundEnabled = React.useCallback(async (val: boolean) => {
    setSoundState(val);
    try {
      await SecureStore.setItemAsync(SOUND_KEY, String(val));
    } catch {}
  }, []);

  const setVibrationEnabled = React.useCallback(async (val: boolean) => {
    setVibrationState(val);
    try {
      await SecureStore.setItemAsync(VIBRATION_KEY, String(val));
    } catch {}
  }, []);

  const setGoalNotificationsEnabled = React.useCallback(
    async (val: boolean) => {
      setGoalNotificationsState(val);
      try {
        await SecureStore.setItemAsync(GOAL_NOTIFS_KEY, String(val));
      } catch {}
    },
    [],
  );

  return (
    <UiPrefsContext.Provider
      value={{
        soundEnabled,
        vibrationEnabled,
        goalNotificationsEnabled,
        setSoundEnabled,
        setVibrationEnabled,
        setGoalNotificationsEnabled,
      }}
    >
      {children}
    </UiPrefsContext.Provider>
  );
};
