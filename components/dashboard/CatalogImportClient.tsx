"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import {
  catalogImportColumns,
  type CatalogImportConfirmResponse,
  type CatalogImportPreview,
  type CatalogImportPreviewResponse,
  type CatalogImportSummary
} from "@/lib/catalog-import-contract";
import { uploadProductImagesDirectly } from "@/lib/imagekit-client";

const columnLabels: Record<(typeof catalogImportColumns)[number], string> = {
  nombre: "Nombre",
  descripcion: "Descripción",
  marca: "Marca",
  categoria: "Categoría",
  tipo: "Tipo",
  color: "Color",
  genero: "Género",
  precio: "Precio",
  tallas_disponibles: "Tallas",
  estado: "Estado",
  nombre_archivo_foto: "Foto"
};

type DuplicateMode = "create" | "update";

function photoSummary(files: File[]) {
  if (!files.length) return "Ninguna foto seleccionada";
  if (files.length === 1) return files[0].name;
  return `${files.length} fotos seleccionadas`;
}

export function CatalogImportClient() {
  const [spreadsheet, setSpreadsheet] = useState<File | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [preview, setPreview] = useState<CatalogImportPreview | null>(null);
  const [summary, setSummary] = useState<CatalogImportSummary | null>(null);
  const [duplicateMode, setDuplicateMode] = useState<DuplicateMode>("create");
  const [message, setMessage] = useState("");
  const [phase, setPhase] = useState<"idle" | "reviewing" | "saving">("idle");
  const [uploadProgress, setUploadProgress] = useState("");
  const spreadsheetInput = useRef<HTMLInputElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  const selectedPhotoNames = useMemo(() => photos.map((photo) => photo.name), [photos]);

  const resetReview = () => {
    setPreview(null);
    setSummary(null);
    setMessage("");
  };

  async function review(event: FormEvent) {
    event.preventDefault();
    if (!spreadsheet) {
      setMessage("Selecciona primero el archivo Excel o CSV.");
      return;
    }

    setPhase("reviewing");
    setMessage("");
    setSummary(null);
    const formData = new FormData();
    formData.append("spreadsheet", spreadsheet);
    formData.append("photo_names", JSON.stringify(selectedPhotoNames));

    try {
      const response = await fetch("/api/dashboard/import/preview", {
        method: "POST",
        body: formData,
        credentials: "same-origin"
      });
      const result = (await response.json()) as CatalogImportPreviewResponse;
      if (!result.ok) {
        setPreview(null);
        setMessage(result.message);
        return;
      }
      setPreview(result);
    } catch {
      setMessage("No se pudo revisar el archivo. Comprueba tu conexión e inténtalo nuevamente.");
    } finally {
      setPhase("idle");
    }
  }

  async function confirmImport() {
    if (!spreadsheet || !preview?.validCount) return;
    setPhase("saving");
    setMessage("");
    setSummary(null);
    setUploadProgress("");

    try {
      const referencedPhotoNames = new Set(
        preview.rows
          .filter((row) => !row.errors.length && row.values.nombre_archivo_foto)
          .map((row) => row.values.nombre_archivo_foto.normalize("NFKC").trim().toLocaleLowerCase("es"))
      );
      const referencedPhotos = photos.filter((photo) =>
        referencedPhotoNames.has(photo.name.normalize("NFKC").trim().toLocaleLowerCase("es"))
      );
      const uploadedPhotos = await uploadProductImagesDirectly(
        referencedPhotos,
        (completed, total) => setUploadProgress(`Subiendo fotos ${completed}/${total}…`)
      );
      setUploadProgress("Guardando productos…");
      const formData = new FormData();
      formData.append("spreadsheet", spreadsheet);
      formData.append("duplicate_mode", duplicateMode);
      formData.append("uploaded_photos", JSON.stringify(uploadedPhotos));
      const response = await fetch("/api/dashboard/import/confirm", {
        method: "POST",
        body: formData,
        credentials: "same-origin"
      });
      const result = (await response.json()) as CatalogImportConfirmResponse;
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setSummary(result.summary);
    } catch {
      setMessage("No se pudo completar la importación. Ninguna fila incompleta fue guardada.");
    } finally {
      setPhase("idle");
      setUploadProgress("");
    }
  }

  function clearAll() {
    setSpreadsheet(null);
    setPhotos([]);
    setPreview(null);
    setSummary(null);
    setMessage("");
    setDuplicateMode("create");
    if (spreadsheetInput.current) spreadsheetInput.current.value = "";
    if (photoInput.current) photoInput.current.value = "";
  }

  return (
    <div className="catalog-import-workspace">
      <form className="catalog-import-setup" onSubmit={review}>
        <section className="catalog-import-step" aria-labelledby="import-template-heading">
          <span className="catalog-import-number">01</span>
          <div className="catalog-import-step-copy">
            <h2 id="import-template-heading">Descarga y completa la plantilla</h2>
            <p>Conserva los encabezados. Puedes borrar la fila de ejemplo cuando agregues tus productos.</p>
            <a
              className="dashboard-button is-secondary catalog-import-download"
              href="/plantillas/plantilla-store-may.xlsx"
              download="plantilla-store-may.xlsx"
            >
              Descargar plantilla .xlsx ↓
            </a>
          </div>
        </section>

        <section className="catalog-import-step" aria-labelledby="import-files-heading">
          <span className="catalog-import-number">02</span>
          <div className="catalog-import-step-copy">
            <h2 id="import-files-heading">Selecciona el Excel y las fotos</h2>
            <p>El nombre escrito en la última columna debe coincidir con el nombre real de cada foto.</p>
            <div className="catalog-import-pickers">
              <label className={`catalog-import-picker ${spreadsheet ? "has-file" : ""}`}>
                <span>Archivo de productos</span>
                <strong>{spreadsheet?.name ?? "Elegir Excel o CSV"}</strong>
                <small>Máximo 4 MB</small>
                <input
                  ref={spreadsheetInput}
                  type="file"
                  accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                  disabled={phase !== "idle"}
                  onChange={(event) => {
                    setSpreadsheet(event.target.files?.[0] ?? null);
                    resetReview();
                  }}
                />
              </label>

              <label className={`catalog-import-picker ${photos.length ? "has-file" : ""}`}>
                <span>Fotos del lote</span>
                <strong>{photoSummary(photos)}</strong>
                <small>Hasta 60 · JPG, PNG, WebP o AVIF</small>
                <input
                  ref={photoInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  multiple
                  disabled={phase !== "idle"}
                  onChange={(event) => {
                    setPhotos(Array.from(event.target.files ?? []).slice(0, 60));
                    resetReview();
                  }}
                />
              </label>
            </div>

            {photos.length ? (
              <details className="catalog-import-file-list">
                <summary>Ver nombres de las {photos.length} fotos</summary>
                <ul>{photos.map((photo, index) => <li key={`${photo.name}-${index}`}>{photo.name}</li>)}</ul>
              </details>
            ) : null}

            <button className="dashboard-button is-primary" type="submit" disabled={!spreadsheet || phase !== "idle"}>
              {phase === "reviewing" ? "Revisando…" : "Revisar antes de importar"}
            </button>
          </div>
        </section>
      </form>

      {message ? <p className="dashboard-alert is-error catalog-import-message" role="alert">{message}</p> : null}

      {preview ? (
        <section className="catalog-import-review" aria-labelledby="catalog-import-review-heading">
          <header className="catalog-import-review-heading">
            <div>
              <span>03 · Vista previa</span>
              <h2 id="catalog-import-review-heading">Revisa antes de guardar</h2>
              <p>Las filas rojas no se importarán. Corrige el Excel o continúa sólo con las filas listas.</p>
            </div>
            <div className="catalog-import-totals" aria-label="Resumen de validación">
              <span><strong>{preview.validCount}</strong> listas</span>
              <span className={preview.errorCount ? "has-errors" : ""}><strong>{preview.errorCount}</strong> con error</span>
              <span><strong>{preview.duplicateCount}</strong> existentes</span>
            </div>
          </header>

          <div className="catalog-import-table-scroll" tabIndex={0} aria-label="Tabla de productos revisados">
            <table className="catalog-import-table">
              <thead>
                <tr>
                  <th>Fila</th>
                  {catalogImportColumns.map((column) => <th key={column}>{columnLabels[column]}</th>)}
                  <th>Revisión</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr className={row.errors.length ? "has-error" : "is-valid"} key={row.rowNumber}>
                    <th scope="row">{row.rowNumber}</th>
                    {catalogImportColumns.map((column) => (
                      <td key={column} title={row.values[column]}>{row.values[column] || "—"}</td>
                    ))}
                    <td className="catalog-import-row-status">
                      {row.errors.length ? (
                        <ul>{row.errors.map((error) => <li key={error}>{error}</li>)}</ul>
                      ) : row.duplicate ? (
                        <span className="is-duplicate">Ya existe: {row.duplicate.code}</span>
                      ) : (
                        <span className="is-ready">Lista</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {preview.duplicateCount ? (
            <fieldset className="catalog-import-duplicates">
              <legend>¿Qué hacemos con los {preview.duplicateCount} productos que ya existen?</legend>
              <label>
                <input
                  type="radio"
                  name="duplicate-mode"
                  value="create"
                  checked={duplicateMode === "create"}
                  onChange={() => setDuplicateMode("create")}
                />
                <span><strong>Crear productos nuevos</strong><small>Recomendado: no modifica lo que ya está publicado.</small></span>
              </label>
              <label>
                <input
                  type="radio"
                  name="duplicate-mode"
                  value="update"
                  checked={duplicateMode === "update"}
                  onChange={() => setDuplicateMode("update")}
                />
                <span><strong>Actualizar los existentes</strong><small>Reemplaza sus datos; conserva la foto anterior si la fila no trae una nueva.</small></span>
              </label>
            </fieldset>
          ) : null}

          <div className="catalog-import-confirm-bar">
            <p>
              Se guardarán <strong>{preview.validCount}</strong> productos.
              {preview.errorCount ? ` Se ignorarán ${preview.errorCount} filas con error.` : " No se encontraron errores."}
            </p>
            <button
              className="dashboard-button is-primary"
              type="button"
              disabled={!preview.validCount || phase !== "idle" || Boolean(summary)}
              onClick={confirmImport}
            >
              {phase === "saving" ? uploadProgress || "Preparando…" : "Confirmar importación"}
            </button>
          </div>
        </section>
      ) : null}

      {summary ? (
        <section className="catalog-import-result" aria-live="polite">
          <span>Importación terminada</span>
          <h2>{summary.importedCount} productos importados correctamente ✅</h2>
          <p>
            {summary.createdCount} creados · {summary.updatedCount} actualizados · {summary.errorCount} filas con error ignoradas.
          </p>
          {summary.errors.length ? (
            <details>
              <summary>Ver detalle de las filas con error</summary>
              <ul>
                {summary.errors.map((error) => (
                  <li key={error.rowNumber}>Fila {error.rowNumber}: {error.errors.join(" ")}</li>
                ))}
              </ul>
            </details>
          ) : null}
          <div>
            <a className="dashboard-button is-primary" href="/dashboard">Ver productos</a>
            <button className="dashboard-button is-secondary" type="button" onClick={clearAll}>Importar otro archivo</button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
