import { redirect } from "next/navigation";
import { DashboardLoginForm } from "@/components/dashboard/DashboardLoginForm";
import { readAdminSession } from "@/lib/auth/session";

export default async function DashboardLoginPage() {
  if (await readAdminSession()) redirect("/dashboard");

  return (
    <main className="dashboard-login-page">
      <section className="dashboard-login-stage">
        <div className="dashboard-login-visual" aria-hidden="true">
          <span>STORE MAY / CONTROL</span>
          <div className="dashboard-login-folio"><b>M</b><b>A</b><b>Y</b></div>
          <p>Publicar. Corregir. Consultar.</p>
        </div>
        <DashboardLoginForm />
      </section>
    </main>
  );
}
