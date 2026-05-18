import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import React from "react";

const GLOBAL_KEY = "ui_goal_notifications_enabled";
const PREFS_PREFIX = "goal_notif_prefs_";
const IDS_PREFIX = "goal_notif_ids_";
const INDEX_KEY = "goal_notif_index";

export type RecurringFrequency = "weekly" | "monthly";

export type GoalRecurringPrefs = {
  enabled: boolean;
  frequency: RecurringFrequency;
  // weekday 1..7 (Sun..Sat) — used for weekly
  weekday: number;
  // day of month 1..28 — used for monthly
  dayOfMonth: number;
  hour: number;
  minute: number;
};

export type GoalNotifPrefs = {
  recurring: GoalRecurringPrefs;
};

type GoalNotifIds = {
  recurring: string[];
  quarter: string[];
  deadline: string[];
  milestonePct: number[];
};

export const DEFAULT_RECURRING: GoalRecurringPrefs = {
  enabled: false,
  frequency: "weekly",
  weekday: 2, // Lunes
  dayOfMonth: 1,
  hour: 9,
  minute: 0,
};

const emptyIds = (): GoalNotifIds => ({
  recurring: [],
  quarter: [],
  deadline: [],
  milestonePct: [],
});

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await SecureStore.getItemAsync(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  await SecureStore.setItemAsync(key, JSON.stringify(value));
}

async function loadIds(goalId: string): Promise<GoalNotifIds> {
  return readJson<GoalNotifIds>(IDS_PREFIX + goalId, emptyIds());
}

async function saveIds(goalId: string, ids: GoalNotifIds): Promise<void> {
  await writeJson(IDS_PREFIX + goalId, ids);
}

async function loadIndex(): Promise<string[]> {
  return readJson<string[]>(INDEX_KEY, []);
}

async function addToIndex(goalId: string): Promise<void> {
  const idx = await loadIndex();
  if (!idx.includes(goalId)) {
    idx.push(goalId);
    await writeJson(INDEX_KEY, idx);
  }
}

async function removeFromIndex(goalId: string): Promise<void> {
  const idx = await loadIndex();
  const next = idx.filter((g) => g !== goalId);
  await writeJson(INDEX_KEY, next);
}

export async function loadGoalNotifPrefs(
  goalId: string,
): Promise<GoalNotifPrefs> {
  return readJson<GoalNotifPrefs>(PREFS_PREFIX + goalId, {
    recurring: DEFAULT_RECURRING,
  });
}

async function saveGoalNotifPrefs(
  goalId: string,
  prefs: GoalNotifPrefs,
): Promise<void> {
  await writeJson(PREFS_PREFIX + goalId, prefs);
}

async function ensurePermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return true;
  const { status: asked } = await Notifications.requestPermissionsAsync();
  return asked === "granted";
}

async function cancelMany(ids: string[]): Promise<void> {
  await Promise.all(
    ids.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {}),
    ),
  );
}

type GoalLike = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  createdAt: string;
  deadline?: string | null;
  status?: string;
};

function fmtPct(curr: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((curr / target) * 100));
}

function fmtCurrency(n: number) {
  return n.toLocaleString("es-CO", { maximumFractionDigits: 0 });
}

async function scheduleRecurring(
  goal: GoalLike,
  r: GoalRecurringPrefs,
): Promise<string[]> {
  if (!r.enabled) return [];
  const pct = fmtPct(goal.currentAmount, goal.targetAmount);
  const content = {
    title: `💪 ${goal.name}`,
    body: `Recuerda aportar a tu meta. Llevas ${pct}% ($${fmtCurrency(goal.currentAmount)} / ${fmtCurrency(goal.targetAmount)}).`,
    data: { goalId: goal.id, kind: "recurring" },
  };

  let id: string;
  if (r.frequency === "weekly") {
    id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: r.weekday,
        hour: r.hour,
        minute: r.minute,
      },
    });
  } else {
    id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
        day: Math.max(1, Math.min(28, r.dayOfMonth)),
        hour: r.hour,
        minute: r.minute,
      },
    });
  }
  return [id];
}

async function scheduleAtDate(
  date: Date,
  content: Notifications.NotificationContentInput,
): Promise<string | null> {
  if (date.getTime() <= Date.now() + 60_000) return null;
  return Notifications.scheduleNotificationAsync({
    content,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });
}

async function scheduleQuarterReminders(goal: GoalLike): Promise<string[]> {
  if (!goal.deadline) return [];
  const start = new Date(goal.createdAt).getTime();
  const end = new Date(goal.deadline).getTime();
  if (!isFinite(start) || !isFinite(end) || end <= start) return [];

  const ids: string[] = [];
  const quarters: { label: string; pct: number }[] = [
    { label: "primer cuarto", pct: 0.25 },
    { label: "mitad", pct: 0.5 },
    { label: "tres cuartos", pct: 0.75 },
  ];

  for (const q of quarters) {
    const t = new Date(start + (end - start) * q.pct);
    const progress = fmtPct(goal.currentAmount, goal.targetAmount);
    const expected = Math.round(q.pct * 100);
    const id = await scheduleAtDate(t, {
      title: `📊 ${goal.name}`,
      body: `Vas en el ${q.label} del tiempo. Deberías ir cerca del ${expected}% y llevas ${progress}%.`,
      data: { goalId: goal.id, kind: "quarter", pct: q.pct },
    });
    if (id) ids.push(id);
  }
  return ids;
}

async function scheduleDeadlineReminders(goal: GoalLike): Promise<string[]> {
  if (!goal.deadline) return [];
  const end = new Date(goal.deadline);
  if (!isFinite(end.getTime())) return [];

  const ids: string[] = [];
  const at = (offsetDays: number, hour = 9): Date => {
    const d = new Date(end);
    d.setDate(d.getDate() - offsetDays);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  const reminders: { date: Date; body: string }[] = [
    {
      date: at(7),
      body: `Quedan 7 días para tu meta «${goal.name}». Llevas ${fmtPct(goal.currentAmount, goal.targetAmount)}%.`,
    },
    {
      date: at(1),
      body: `¡Mañana vence «${goal.name}»! Llevas ${fmtPct(goal.currentAmount, goal.targetAmount)}%.`,
    },
    {
      date: at(0),
      body: `Hoy es la fecha límite de «${goal.name}». Llevas ${fmtPct(goal.currentAmount, goal.targetAmount)}%.`,
    },
  ];

  for (const r of reminders) {
    const id = await scheduleAtDate(r.date, {
      title: `⏰ ${goal.name}`,
      body: r.body,
      data: { goalId: goal.id, kind: "deadline" },
    });
    if (id) ids.push(id);
  }
  return ids;
}

export function useGoalNotifications() {
  const cancelForGoal = React.useCallback(async (goalId: string) => {
    const ids = await loadIds(goalId);
    await cancelMany([...ids.recurring, ...ids.quarter, ...ids.deadline]);
    await saveIds(goalId, { ...ids, recurring: [], quarter: [], deadline: [] });
  }, []);

  const purgeGoal = React.useCallback(
    async (goalId: string) => {
      await cancelForGoal(goalId);
      await SecureStore.deleteItemAsync(PREFS_PREFIX + goalId).catch(() => {});
      await SecureStore.deleteItemAsync(IDS_PREFIX + goalId).catch(() => {});
      await removeFromIndex(goalId);
    },
    [cancelForGoal],
  );

  const scheduleForGoal = React.useCallback(
    async (goal: GoalLike, prefs: GoalNotifPrefs) => {
      const globalRaw = await SecureStore.getItemAsync(GLOBAL_KEY);
      const globalEnabled = globalRaw === null ? true : globalRaw === "true";

      // Save prefs always (so user choice persists even if notifs are off globally)
      await saveGoalNotifPrefs(goal.id, prefs);
      await addToIndex(goal.id);

      // Cancel previous scheduled
      const prev = await loadIds(goal.id);
      await cancelMany([...prev.recurring, ...prev.quarter, ...prev.deadline]);

      const next: GoalNotifIds = {
        ...prev,
        recurring: [],
        quarter: [],
        deadline: [],
      };

      const isActive = !goal.status || goal.status === "active";
      if (!globalEnabled || !isActive) {
        await saveIds(goal.id, next);
        return;
      }

      const granted = await ensurePermissions();
      if (!granted) {
        await saveIds(goal.id, next);
        return;
      }

      try {
        next.recurring = await scheduleRecurring(goal, prefs.recurring);
        next.quarter = await scheduleQuarterReminders(goal);
        next.deadline = await scheduleDeadlineReminders(goal);
      } catch (err) {
        console.warn("Error scheduling goal notifications:", err);
      }
      await saveIds(goal.id, next);
    },
    [],
  );

  const checkMilestoneAndCleanup = React.useCallback(
    async (goal: GoalLike, prevAmount: number) => {
      if (goal.targetAmount <= 0) return;
      const ids = await loadIds(goal.id);
      const already = new Set(ids.milestonePct);
      const thresholds = [25, 50, 75, 100];
      const fired: number[] = [];
      for (const pct of thresholds) {
        const need = (pct / 100) * goal.targetAmount;
        if (already.has(pct)) continue;
        if (prevAmount < need && goal.currentAmount >= need) {
          fired.push(pct);
        }
      }
      if (fired.length === 0) return;

      const granted = await ensurePermissions();
      if (granted) {
        for (const pct of fired) {
          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: pct === 100 ? `🎉 ¡Meta cumplida!` : `🎯 ${goal.name}`,
                body:
                  pct === 100
                    ? `Alcanzaste el 100% de «${goal.name}». ¡Felicidades!`
                    : `Llegaste al ${pct}% de «${goal.name}».`,
                data: { goalId: goal.id, kind: "milestone", pct },
              },
              trigger: null,
            });
          } catch (err) {
            console.warn("Error firing milestone notif:", err);
          }
        }
      }

      const updated: GoalNotifIds = {
        ...ids,
        milestonePct: [...ids.milestonePct, ...fired],
      };

      // Si llegó al 100%, cancela recordatorios recurrentes / deadlines / quarters
      if (fired.includes(100)) {
        await cancelMany([...ids.recurring, ...ids.quarter, ...ids.deadline]);
        updated.recurring = [];
        updated.quarter = [];
        updated.deadline = [];
      }
      await saveIds(goal.id, updated);
    },
    [],
  );

  const cancelAll = React.useCallback(async () => {
    const idx = await loadIndex();
    for (const goalId of idx) {
      await cancelForGoal(goalId);
    }
  }, [cancelForGoal]);

  return {
    scheduleForGoal,
    cancelForGoal,
    purgeGoal,
    checkMilestoneAndCleanup,
    cancelAll,
    loadGoalNotifPrefs,
  };
}

export { loadIndex as loadGoalNotifIndex };
