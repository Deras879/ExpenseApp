// Tipos y helpers para la feature de Metas (Goals).

export type GoalStatus = "active" | "completed" | "archived";

export interface GoalMovement {
  id: string;
  type: "deposit" | "withdraw";
  amount: number;
  note?: string;
  createdAt: string; // ISO
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; // ISO date
  icon: string; // emoji
  color: string; // hex (acento de tarjeta)
  status: GoalStatus;
  createdAt: string;
  completedAt?: string;
  movements: GoalMovement[];
}

export const formatGoalCurrency = (value: number): string =>
  value.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

export const formatGoalDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const goalProgress = (g: Goal): number => {
  if (g.targetAmount <= 0) return 0;
  return Math.min(1, g.currentAmount / g.targetAmount);
};

export const goalStatusLabel: Record<GoalStatus, string> = {
  active: "Activa",
  completed: "Completada",
  archived: "Archivada",
};

export const goalStatusColor: Record<GoalStatus, string> = {
  active: "#1457f6",
  completed: "#16a34a",
  archived: "#6b7280",
};
