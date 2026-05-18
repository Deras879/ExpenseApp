import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import React from "react";

const STORE_KEY = "scheduled_notifications";

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export type ScheduledNotification = {
  id: string;
  weekday: number; // 1=Sun ... 7=Sat (Notifications API), display uses WEEKDAY_LABELS
  hour: number;
  minute: number;
};

async function loadFromStore(): Promise<ScheduledNotification[]> {
  const raw = await SecureStore.getItemAsync(STORE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ScheduledNotification[];
  } catch {
    return [];
  }
}

async function saveToStore(items: ScheduledNotification[]): Promise<void> {
  await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(items));
}

async function ensurePermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return true;
  const { status: asked } = await Notifications.requestPermissionsAsync();
  return asked === "granted";
}

export function useScheduledNotifications() {
  const [notifications, setNotifications] = React.useState<
    ScheduledNotification[]
  >([]);

  React.useEffect(() => {
    loadFromStore().then(setNotifications);
  }, []);

  const addNotification = React.useCallback(
    async (weekday: number, hour: number, minute: number) => {
      const granted = await ensurePermissions();
      if (!granted) throw new Error("permission_denied");

      const notifId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Expense App",
          body: "¡No olvides registrar tus gastos de hoy!",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour,
          minute,
        },
      });

      const entry: ScheduledNotification = {
        id: notifId,
        weekday,
        hour,
        minute,
      };
      const updated = [...notifications, entry];
      setNotifications(updated);
      await saveToStore(updated);
    },
    [notifications],
  );

  const removeNotification = React.useCallback(
    async (id: string) => {
      await Notifications.cancelScheduledNotificationAsync(id);
      const updated = notifications.filter((n) => n.id !== id);
      setNotifications(updated);
      await saveToStore(updated);
    },
    [notifications],
  );

  return { notifications, addNotification, removeNotification };
}

export { WEEKDAY_LABELS };
