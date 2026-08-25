export type DashboardActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string[]>;
};

export const initialDashboardActionState: DashboardActionState = { status: "idle" };

export type DashboardLoginState = {
  status: "idle" | "error";
  message?: string;
};

export const initialDashboardLoginState: DashboardLoginState = { status: "idle" };
