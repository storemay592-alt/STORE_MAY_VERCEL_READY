"use client";

import { type DragEvent, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  catalogMatrixColumns,
  maximumCatalogMatrixImages,
  type CatalogMatrixInventoryState,
  type CatalogMatrixMatchResponse,
  type CatalogMatrixPreview,
  type CatalogMatrixSummary,
  type CatalogMatrixUploadResponse
} from "@/lib/catalog-matrix-contract";
import { productCategories, productGenders } from "@/lib/product-options";
import { uploadProductImagesDirectly } from "@/lib/imagekit-client";

type DuplicateMode = "skip" | "create" | "update";
type Phase = "idle" | "matching" | "saving";
type ImageDecision = { rowNumber: number | null; confirmed: boolean; ignored: boolean };
type RowClassification = {
  category: (typeof productCategories)[number];
  gender: (typeof productGenders)[number];
};

const matrixColumnLabels: Record<(typeof catalogMatrixColumns)[number], string> = {
  ARTICULO: "Artículo",
  MODELO: "Modelo",
  MARCA: "Marca",
  COLOR: "Color",
  TALLA: "Talla",
  "V. MARCA": "V. marca",
  "P.ECUA": "P. Ecuador",
  ESTADO: "Stock / vendido"
};

function normalizedFileName(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase("es");
}

function statusCopy(status: "matched" | "review" | "unmatched") {
  if (status === "matched") return "Match exitoso";
  if (status === "review") return "Duda / revisión";
  return "Sin match";
}

function mergeImageFiles(current: File[], incoming: File[]) {
  const byName = new Map(current.map((file) => [normalizedFileName(file.name), file]));
  for (const file of incoming) {
    if (file.type.startsWith("image/") && !byName.has(normalizedFileName(file.name))) {
      byName.set(normalizedFileName(file.name), file);
    }
  }
  return [...byName.values()].slice(0, maximumCatalogMatrixImages);
}

export function CatalogImportClient() {
  const [spreadsheet, setSpreadsheet] = useState<File | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [preview, setPreview] = useState<CatalogMatrixPreview | null>(null);
  const [decisions, setDecisions] = useState<Record<string, ImageDecision>>({});
  const [inventory, setInventory] = useState<Record<number, CatalogMatrixInventoryState>>({});
  const [classifications, setClassifications] = useState<Record<number, RowClassification>>({});
  const [category, setCategory] = useState<(typeof productCategories)[number]>("Mujer");
  const [gender, setGender] = useState<(typeof productGenders)[number]>("Mujer");
  const [duplicateMode, setDuplicateMode] = useState<DuplicateMode>("skip");
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState("");
  const [summary, setSummary] = useState<CatalogMatrixSummary | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const spreadsheetInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);

  const imagePreviews = useMemo(
    () => new Map(photos.map((file) => [normalizedFileName(file.name), URL.createObjectURL(file)])),
    [photos]
  );
  useEffect(() => () => imagePreviews.forEach((url) => URL.revokeObjectURL(url)), [imagePreviews]);

  const allValidRows = useMemo(() => preview?.rows.filter((row) => !row.errors.length) ?? [], [preview]);
  const importRows = useMemo(
    () => duplicateMode === "skip" ? allValidRows.filter((row) => !row.duplicate) : allValidRows,
    [allValidRows, duplicateMode]
  );
  const reconciliation = useMemo(() => {
    const assignedRows = new Set<number>();
    let pendingImages = 0;
    let ignoredImages = 0;
    for (const decision of Object.values(decisions)) {
      if (decision.ignored) ignoredImages += 1;
      else if (!decision.confirmed || decision.rowNumber === null) pendingImages += 1;
      else assignedRows.add(decision.rowNumber);
    }
    const missingRows = importRows.filter((row) => !assignedRows.has(row.rowNumber));
    const selectedRowNumbers = [...assignedRows];
    return {
      pendingImages,
      ignoredImages,
      missingRows,
      selectedRowNumbers,
      ready: selectedRowNumbers.length > 0 && pendingImages === 0
    };
  }, [decisions, importRows]);

  function resetAnalysis() {
    setPreview(null);
    setDecisions({});
    setInventory({});
    setClassifications({});
    setSummary(null);
    setMessage("");
  }

  function addPhotos(files: File[]) {
    setPhotos((current) => mergeImageFiles(current, files));
    resetAnalysis();
  }

  async function analyze(event: FormEvent) {
    event.preventDefault();
    if (!spreadsheet) return setMessage("Selecciona primero la matriz de Excel.");
    if (!photos.length) return setMessage("Selecciona las imágenes del catálogo.");

    setPhase("matching");
    setMessage("");
    setSummary(null);
    try {
      const formData = new FormData();
      formData.append("spreadsheet", spreadsheet);
      formData.append("image_names", JSON.stringify(photos.map((photo) => photo.name)));
      const response = await fetch("/api/match-catalog", {
        method: "POST",
        body: formData,
        credentials: "same-origin"
      });
      const result = (await response.json()) as CatalogMatrixMatchResponse;
      if (!result.ok) {
        setPreview(null);
        setMessage(result.message);
        return;
      }

      setPreview(result.preview);
      const duplicateRows = new Set(result.preview.rows.filter((row) => row.duplicate).map((row) => row.rowNumber));
      setDecisions(Object.fromEntries(result.preview.imageMatches.map((match) => {
        const existingProductImage = match.assignedRowNumber !== null && duplicateRows.has(match.assignedRowNumber);
        return [
          normalizedFileName(match.imageName),
          existingProductImage
            ? { rowNumber: null, confirmed: true, ignored: true }
            : { rowNumber: match.assignedRowNumber, confirmed: match.status === "matched", ignored: false }
        ];
      })));
      setInventory(Object.fromEntries(result.preview.rows.map((row) => [
        row.rowNumber,
        row.values.ESTADO.toLocaleUpperCase("es") === "SOLD" ? "SOLD" : "STOCK"
      ])));
      setClassifications(Object.fromEntries(result.preview.rows.map((row) => [
        row.rowNumber,
        { category, gender }
      ])));
    } catch {
      setMessage("No se pudo analizar el lote. Comprueba tu conexión e inténtalo otra vez.");
    } finally {
      setPhase("idle");
    }
  }

  function chooseRow(imageName: string, rowNumber: number | null) {
    const key = normalizedFileName(imageName);
    setDecisions((current) => ({
      ...current,
      [key]: { rowNumber, confirmed: rowNumber !== null, ignored: false }
    }));
  }

  function confirmSuggestion(imageName: string) {
    const key = normalizedFileName(imageName);
    setDecisions((current) => ({
      ...current,
      [key]: { ...current[key], confirmed: current[key]?.rowNumber !== null, ignored: false }
    }));
  }

  function ignoreImage(imageName: string) {
    const key = normalizedFileName(imageName);
    setDecisions((current) => ({
      ...current,
      [key]: { rowNumber: null, confirmed: true, ignored: true }
    }));
  }

  function reviewIgnoredImage(imageName: string) {
    const key = normalizedFileName(imageName);
    setDecisions((current) => ({
      ...current,
      [key]: { rowNumber: null, confirmed: false, ignored: false }
    }));
  }

  async function confirmUpload() {
    if (!spreadsheet || !preview || !reconciliation.ready) return;
    setPhase("saving");
    setMessage("");
    setSummary(null);
    try {
      const assignedFiles = photos.filter((photo) => {
        const decision = decisions[normalizedFileName(photo.name)];
        return decision?.confirmed && !decision.ignored && decision.rowNumber !== null;
      });
      const uploadedPhotos = await uploadProductImagesDirectly(assignedFiles, (completed, total) => {
        setProgress(`Subiendo imágenes ${completed}/${total}…`);
      });
      const assignments = assignedFiles.map((photo) => ({
        imageName: photo.name,
        rowNumber: decisions[normalizedFileName(photo.name)].rowNumber as number
      }));
      const selectedRows = new Set(reconciliation.selectedRowNumbers);

      setProgress("Guardando productos en una sola transacción…");
      const formData = new FormData();
      formData.append("spreadsheet", spreadsheet);
      formData.append("uploaded_photos", JSON.stringify(uploadedPhotos));
      formData.append("assignments", JSON.stringify(assignments));
      formData.append("selected_row_numbers", JSON.stringify(reconciliation.selectedRowNumbers));
      formData.append("inventory_overrides", JSON.stringify(importRows.filter((row) => selectedRows.has(row.rowNumber)).map((row) => ({
        rowNumber: row.rowNumber,
        state: inventory[row.rowNumber]
      }))));
      formData.append("classification_overrides", JSON.stringify(importRows.filter((row) => selectedRows.has(row.rowNumber)).map((row) => ({
        rowNumber: row.rowNumber,
        category: classifications[row.rowNumber]?.category ?? category,
        gender: classifications[row.rowNumber]?.gender ?? gender
      }))));
      formData.append("duplicate_mode", duplicateMode);
      formData.append("category", category);
      formData.append("gender", gender);

      const response = await fetch("/api/upload-catalog", {
        method: "POST",
        body: formData,
        credentials: "same-origin"
      });
      const result = (await response.json()) as CatalogMatrixUploadResponse;
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setSummary(result.summary);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo completar la importación.");
    } finally {
      setPhase("idle");
      setProgress("");
    }
  }

  function clearAll() {
    setSpreadsheet(null);
    setPhotos([]);
    setCategory("Mujer");
    setGender("Mujer");
    setDuplicateMode("skip");
    resetAnalysis();
    if (spreadsheetInput.current) spreadsheetInput.current.value = "";
    if (imageInput.current) imageInput.current.value = "";
  }

  return (
    <div className="matrix-import-workspace">
      <form className="matrix-import-intake" onSubmit={analyze}>
        <section className="matrix-intake-rail" aria-labelledby="matrix-file-heading">
          <span className="matrix-step-number">01</span>
          <div>
            <p className="matrix-kicker">Matriz de productos</p>
            <h2 id="matrix-file-heading">Carga el Excel</h2>
            <p>Acepta tu matriz habitual de siete columnas y también la plantilla con ESTADO. El archivo se procesa de forma privada en el servidor.</p>
            <a className="dashboard-button is-secondary" href="/plantillas/plantilla-store-may.xlsx" download>Descargar plantilla</a>
            <label className={`matrix-file-input ${spreadsheet ? "has-file" : ""}`}>
              <span>{spreadsheet ? "Matriz seleccionada" : "Seleccionar .xlsx o .csv"}</span>
              <strong>{spreadsheet?.name ?? "Ningún archivo"}</strong>
              <small>Máximo 4 MB</small>
              <input
                ref={spreadsheetInput}
                type="file"
                accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                disabled={phase !== "idle"}
                onChange={(event) => { setSpreadsheet(event.target.files?.[0] ?? null); resetAnalysis(); }}
              />
            </label>
          </div>
        </section>

        <section className="matrix-intake-rail" aria-labelledby="matrix-images-heading">
          <span className="matrix-step-number">02</span>
          <div>
            <p className="matrix-kicker">Banco de imágenes</p>
            <h2 id="matrix-images-heading">Arrastra las fotos limpias</h2>
            <p>El nombre de cada archivo se compara con MODELO y ARTICULO. Las fotos aún no se suben.</p>
            <label
              className={`matrix-dropzone ${dragActive ? "is-dragging" : ""} ${photos.length ? "has-files" : ""}`}
              onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => { event.preventDefault(); setDragActive(false); }}
              onDrop={(event: DragEvent<HTMLLabelElement>) => {
                event.preventDefault();
                setDragActive(false);
                addPhotos(Array.from(event.dataTransfer.files));
              }}
            >
              <strong>{photos.length ? `${photos.length} imágenes preparadas` : "Suelta aquí JPG, PNG, WebP o AVIF"}</strong>
              <span>o haz clic para buscarlas</span>
              <small>Hasta {maximumCatalogMatrixImages}, 5 MB por imagen</small>
              <input
                ref={imageInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                disabled={phase !== "idle"}
                onChange={(event) => addPhotos(Array.from(event.target.files ?? []))}
              />
            </label>
          </div>
        </section>

        <section className="matrix-batch-settings" aria-labelledby="matrix-settings-heading">
          <div>
            <p className="matrix-kicker">Datos del lote</p>
            <h2 id="matrix-settings-heading">Clasificación requerida</h2>
            <p>Estos valores se aplican inicialmente al lote; podrás corregirlos por producto antes de guardar.</p>
          </div>
          <label><span>Categoría</span><select value={category} onChange={(event) => setCategory(event.target.value as typeof category)}>{productCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Género</span><select value={gender} onChange={(event) => setGender(event.target.value as typeof gender)}>{productGenders.map((item) => <option key={item}>{item}</option>)}</select></label>
          <button className="dashboard-button is-primary" type="submit" disabled={!spreadsheet || !photos.length || phase !== "idle"}>
            {phase === "matching" ? "Analizando nombres…" : "Analizar y emparejar"}
          </button>
        </section>
      </form>

      {message ? <p className="dashboard-alert is-error matrix-import-alert" role="alert">{message}</p> : null}

      {preview ? (
        <>
          <section className="matrix-reconciliation" aria-labelledby="matrix-reconciliation-heading">
            <header className="matrix-review-heading">
              <div><p className="matrix-kicker">03 · Conciliación visual</p><h2 id="matrix-reconciliation-heading">Confirma cada relación</h2><p>Los amarillos necesitan confirmación. Los rojos deben asignarse o ignorarse.</p></div>
              <div className="matrix-status-summary" aria-label="Resumen de emparejamiento">
                <span className="is-match"><strong>{preview.matchedCount}</strong> seguros</span>
                <span className="is-review"><strong>{preview.reviewCount}</strong> por revisar</span>
                <span className="is-unmatched"><strong>{preview.unmatchedCount}</strong> sin match</span>
              </div>
            </header>

            <div className="matrix-match-list">
              {preview.imageMatches.map((match) => {
                const key = normalizedFileName(match.imageName);
                const decision = decisions[key] ?? { rowNumber: null, confirmed: false, ignored: false };
                const resolved = decision.confirmed && decision.rowNumber !== null;
                const visualStatus = decision.ignored ? "ignored" : resolved ? "matched" : match.status;
                return (
                  <article className={`matrix-match-row is-${visualStatus}`} key={match.imageName}>
                    <img src={imagePreviews.get(key)} alt={`Vista previa de ${match.imageName}`} />
                    <div className="matrix-match-file"><strong>{match.imageName}</strong><span>{match.confidence}% de confianza automática</span></div>
                    <span className={`matrix-match-badge is-${visualStatus}`}>
                      {decision.ignored ? "Ignorada" : resolved && match.status !== "matched" ? "Confirmado" : statusCopy(match.status)}
                    </span>
                    <label className="matrix-assignment-select">
                      <span>Asignar a</span>
                      <select value={decision.rowNumber ?? ""} disabled={decision.ignored || phase !== "idle"} onChange={(event) => chooseRow(match.imageName, event.target.value ? Number(event.target.value) : null)}>
                        <option value="">Seleccionar producto…</option>
                        {importRows.map((row) => <option key={row.rowNumber} value={row.rowNumber}>Fila {row.rowNumber} · {row.label}</option>)}
                      </select>
                    </label>
                    <div className="matrix-match-actions">
                      {!decision.confirmed && decision.rowNumber !== null ? <button type="button" onClick={() => confirmSuggestion(match.imageName)}>Confirmar</button> : null}
                      <button type="button" onClick={() => decision.ignored ? reviewIgnoredImage(match.imageName) : ignoreImage(match.imageName)}>{decision.ignored ? "Revisar" : "Ignorar"}</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="matrix-product-review" aria-labelledby="matrix-products-heading">
            <header className="matrix-review-heading">
              <div><p className="matrix-kicker">04 · Productos</p><h2 id="matrix-products-heading">Datos que se guardarán</h2><p>STOCK publica el producto. SOLD lo conserva en el panel y lo marca como agotado.</p></div>
              <span>{importRows.length} para importar · {preview.duplicateCount && duplicateMode === "skip" ? `${preview.duplicateCount} existentes omitidos · ` : ""}{preview.rows.length - allValidRows.length} bloqueadas</span>
            </header>
            <div className="matrix-table-scroll" tabIndex={0} aria-label="Productos de la matriz">
              <table className="matrix-product-table">
                <thead><tr><th>Fila</th>{catalogMatrixColumns.map((column) => <th key={column}>{matrixColumnLabels[column]}</th>)}<th>Categoría</th><th>Género</th><th>Revisión</th></tr></thead>
                <tbody>
                  {preview.rows.map((row) => (
                    <tr className={row.errors.length ? "has-error" : "is-valid"} key={row.rowNumber}>
                      <th scope="row">{row.rowNumber}</th>
                      {catalogMatrixColumns.map((column) => (
                        <td key={column}>{column === "ESTADO" && !row.errors.length ? (
                          <div className="matrix-inventory-toggle" aria-label={`Estado de la fila ${row.rowNumber}`}>
                            {(["STOCK", "SOLD"] as const).map((state) => (
                              <button className={(inventory[row.rowNumber] ?? "STOCK") === state ? `is-active is-${state.toLocaleLowerCase()}` : ""} key={state} type="button" onClick={() => setInventory((current) => ({ ...current, [row.rowNumber]: state }))}>{state}</button>
                            ))}
                          </div>
                        ) : row.values[column] || "—"}</td>
                      ))}
                      <td>
                        <select aria-label={`Categoría de la fila ${row.rowNumber}`} disabled={Boolean(row.errors.length)} value={classifications[row.rowNumber]?.category ?? category} onChange={(event) => setClassifications((current) => ({
                          ...current,
                          [row.rowNumber]: {
                            category: event.target.value as RowClassification["category"],
                            gender: current[row.rowNumber]?.gender ?? gender
                          }
                        }))}>
                          {productCategories.map((item) => <option key={item}>{item}</option>)}
                        </select>
                      </td>
                      <td>
                        <select aria-label={`Género de la fila ${row.rowNumber}`} disabled={Boolean(row.errors.length)} value={classifications[row.rowNumber]?.gender ?? gender} onChange={(event) => setClassifications((current) => ({
                          ...current,
                          [row.rowNumber]: {
                            category: current[row.rowNumber]?.category ?? category,
                            gender: event.target.value as RowClassification["gender"]
                          }
                        }))}>
                          {productGenders.map((item) => <option key={item}>{item}</option>)}
                        </select>
                      </td>
                      <td>{row.errors.length ? <ul>{row.errors.map((error) => <li key={error}>{error}</li>)}</ul> : row.duplicate ? <span className="matrix-duplicate">Existe: {row.duplicate.code}{duplicateMode === "skip" ? " · se omitirá" : ""}</span> : <span className="matrix-row-ready">Lista</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {preview.duplicateCount ? (
            <fieldset className="matrix-duplicate-choice">
              <legend>Hay {preview.duplicateCount} productos con el mismo nombre y marca</legend>
              <label><input type="radio" name="matrix-duplicate-mode" checked={duplicateMode === "skip"} onChange={() => setDuplicateMode("skip")} /><span><strong>Importar solo nuevos — recomendado</strong><small>Omite lo que ya existe. No borra ni modifica productos anteriores.</small></span></label>
              <label><input type="radio" name="matrix-duplicate-mode" checked={duplicateMode === "create"} onChange={() => setDuplicateMode("create")} /><span><strong>Crear copias nuevas</strong><small>Conserva el anterior y crea otro producto.</small></span></label>
              <label><input type="radio" name="matrix-duplicate-mode" checked={duplicateMode === "update"} onChange={() => setDuplicateMode("update")} /><span><strong>Actualizar existentes</strong><small>Actualiza datos y agrega las nuevas imágenes.</small></span></label>
            </fieldset>
          ) : null}

          <section className={`matrix-confirm-dock ${reconciliation.ready ? "is-ready" : ""}`} aria-live="polite">
            <div>
              <strong>{reconciliation.ready ? `${reconciliation.selectedRowNumbers.length} productos listos para guardar` : "Faltan decisiones"}</strong>
              <span>
                {reconciliation.pendingImages ? `${reconciliation.pendingImages} imágenes pendientes. ` : ""}
                {reconciliation.ready && reconciliation.missingRows.length ? `${reconciliation.missingRows.length} productos sin foto se omitirán en este lote. ` : ""}
                {!reconciliation.ready && !reconciliation.pendingImages && !reconciliation.selectedRowNumbers.length ? "Asigna al menos una fotografía a un producto. " : ""}
                {reconciliation.ignoredImages ? `${reconciliation.ignoredImages} imágenes ignoradas.` : ""}
              </span>
            </div>
            <button className="dashboard-button is-primary" type="button" disabled={!reconciliation.ready || phase !== "idle" || Boolean(summary)} onClick={confirmUpload}>
              {phase === "saving" ? progress || "Preparando…" : "Confirmar y subir a base de datos"}
            </button>
          </section>
        </>
      ) : null}

      {summary ? (
        <section className="matrix-import-result" aria-live="polite">
          <span>Importación terminada</span><h2>{summary.importedCount} productos sincronizados</h2><p>{summary.createdCount} creados, {summary.updatedCount} actualizados, {summary.skippedExistingCount} existentes omitidos y {summary.skippedRowCount} filas fuera de este lote.</p>
          {summary.errors.length ? <details><summary>Ver filas bloqueadas</summary><ul>{summary.errors.map((item) => <li key={item.rowNumber}>Fila {item.rowNumber}: {item.errors.join(" ")}</li>)}</ul></details> : null}
          <div><a className="dashboard-button is-primary" href="/dashboard">Ver productos</a><button className="dashboard-button is-secondary" type="button" onClick={clearAll}>Importar otro lote</button></div>
        </section>
      ) : null}
    </div>
  );
}
