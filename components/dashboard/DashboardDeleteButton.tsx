"use client";

import { useState } from "react";

export function DashboardDeleteButton({
  action,
  productName
}: {
  action: () => Promise<void>;
  productName: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button className="dashboard-link-button is-danger" type="button" onClick={() => setConfirming(true)}>
        Eliminar
      </button>
    );
  }

  return (
    <div className="dashboard-delete-confirm" role="group" aria-label={`Eliminar ${productName}`}>
      <span>¿Eliminar?</span>
      <form action={action}><button type="submit">Sí</button></form>
      <button type="button" onClick={() => setConfirming(false)}>No</button>
    </div>
  );
}
