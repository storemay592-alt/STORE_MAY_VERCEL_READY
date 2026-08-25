"use client";

import { useActionState } from "react";
import { dashboardLoginAction } from "@/app/dashboard/actions";
import { initialDashboardLoginState } from "@/lib/dashboard-state";

export function DashboardLoginForm() {
  const [state, action, pending] = useActionState(dashboardLoginAction, initialDashboardLoginState);

  return (
    <form className="dashboard-login-form" action={action}>
      <div className="dashboard-login-heading">
        <span>Acceso privado</span>
        <h1>Tu catálogo, bajo control.</h1>
        <p>Entra para publicar productos y revisar las consultas.</p>
      </div>
      <label className="dashboard-field">
        <span>Usuario</span>
        <input
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          autoFocus
        />
      </label>
      <label className="dashboard-field">
        <span>Contraseña</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {state.message ? <p className="dashboard-alert is-error" role="alert">{state.message}</p> : null}
      <button className="dashboard-button is-primary" type="submit" disabled={pending}>
        {pending ? "Comprobando…" : "Entrar al panel"}
      </button>
    </form>
  );
}
