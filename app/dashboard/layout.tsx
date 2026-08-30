import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { dashboardLogoutAction } from "@/app/dashboard/actions";
import { readAdminSession } from "@/lib/auth/session";
import "./dashboard.css";

export const metadata: Metadata = {
  title: { default: "Panel de productos", template: "%s | Store MAY" },
  robots: { index: false, follow: false }
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await readAdminSession();

  return (
    <div className="dashboard-shell">
      <header className="dashboard-topbar">
        <Link href={session ? "/dashboard" : "/"} className="dashboard-brand" aria-label="Store MAY">
          <Image src="/brand/store-may-cubos.png" alt="Store MAY" width={634} height={283} priority />
        </Link>
        {session ? (
          <>
            <nav className="dashboard-nav" aria-label="Administración">
              <Link href="/dashboard">Productos</Link>
              <Link href="/dashboard/importar">Importar catálogo</Link>
              <Link href="/dashboard/estadisticas">Estadísticas</Link>
              <Link href="/catalogo" target="_blank">Ver catálogo ↗</Link>
            </nav>
            <div className="dashboard-owner">
              <span>Sesión del dueño</span>
              <strong>{session.username}</strong>
              <form action={dashboardLogoutAction}><button type="submit">Salir</button></form>
            </div>
          </>
        ) : (
          <Link className="dashboard-public-link" href="/catalogo">Ver catálogo ↗</Link>
        )}
      </header>
      {children}
    </div>
  );
}
