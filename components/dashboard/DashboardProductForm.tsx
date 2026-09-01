"use client";

import { FormEvent, useActionState, useEffect, useRef, useState, useTransition } from "react";
import type { CatalogProduct } from "@/lib/catalog-products";
import { initialDashboardActionState, type DashboardActionState } from "@/lib/dashboard-state";
import { productCategories, productGenders, productStatusOptions } from "@/lib/product-options";
import { uploadProductImagesDirectly } from "@/lib/imagekit-client";

type PreviewImage = { url: string; existing: boolean; file?: File };

export function DashboardProductForm({
  action,
  product
}: {
  action: (state: DashboardActionState, formData: FormData) => Promise<DashboardActionState>;
  product?: CatalogProduct;
}) {
  const [state, formAction, pending] = useActionState(action, initialDashboardActionState);
  const [dispatching, startTransition] = useTransition();
  const [previews, setPreviews] = useState<PreviewImage[]>(
    product?.imageUrls.map((url) => ({ url, existing: true })) ?? []
  );
  const objectUrls = useRef<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");

  const syncSelectedFiles = (items: PreviewImage[]) => {
    if (!fileInputRef.current) return;
    const transfer = new DataTransfer();
    items.forEach((item) => {
      if (item.file) transfer.items.add(item.file);
    });
    fileInputRef.current.files = transfer.files;
  };

  useEffect(() => () => objectUrls.current.forEach(URL.revokeObjectURL), []);

  useEffect(() => {
    if (state.status === "success" && !product) {
      formRef.current?.reset();
      objectUrls.current.forEach(URL.revokeObjectURL);
      objectUrls.current = [];
      setPreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [state.status, product]);

  const error = (name: string) => state.errors?.[name]?.[0];

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const newFiles = previews.flatMap((preview) => (preview.file ? [preview.file] : []));
    setUploading(true);
    setUploadError("");
    setUploadMessage(newFiles.length ? `Subiendo 0/${newFiles.length} fotos…` : "Guardando producto…");
    try {
      const uploaded = await uploadProductImagesDirectly(
        newFiles,
        (completed, total) => setUploadMessage(`Subiendo ${completed}/${total} fotos…`)
      );
      const formData = new FormData(form);
      formData.delete("images");
      formData.set("uploaded_image_references", JSON.stringify(uploaded));
      setUploadMessage("Guardando producto…");
      startTransition(() => formAction(formData));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "No se pudieron subir las imágenes.");
    } finally {
      setUploading(false);
      setUploadMessage("");
    }
  }

  return (
    <form ref={formRef} className="dashboard-product-form" onSubmit={submitProduct}>
      <section className="dashboard-media-editor" aria-labelledby="images-heading">
        <div className="dashboard-form-section-heading">
          <span>01</span>
          <div><h2 id="images-heading">Fotos del producto</h2><p>La primera será la portada del catálogo.</p></div>
        </div>

        <div className="dashboard-image-grid">
          {previews.map((preview, index) => (
            <figure className="dashboard-image-preview" key={`${preview.url}-${index}`}>
              <img src={preview.url} alt={`Vista previa ${index + 1}`} />
              {index === 0 ? <figcaption>Portada</figcaption> : null}
              {preview.existing ? <input type="hidden" name="existing_image_urls" value={preview.url} /> : null}
              <button
                type="button"
                aria-label={`Quitar imagen ${index + 1}`}
                onClick={() => {
                  setPreviews((current) => {
                    const removed = current[index];
                    if (!removed.existing) URL.revokeObjectURL(removed.url);
                    const next = current.filter((_, itemIndex) => itemIndex !== index);
                    syncSelectedFiles(next);
                    return next;
                  });
                }}
              >×</button>
            </figure>
          ))}
          {previews.length < 8 ? (
            <label className="dashboard-image-picker">
              <strong>+ Agregar fotos</strong>
              <span>JPG, PNG, WebP o AVIF</span>
              <small>Máximo 8 imágenes, 5 MB cada una</small>
              <input
                ref={fileInputRef}
                name="images"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                required={!product && previews.length === 0}
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []).slice(0, 8 - previews.length);
                  const next = files.map((file) => {
                    const url = URL.createObjectURL(file);
                    objectUrls.current.push(url);
                    return { url, existing: false, file };
                  });
                  setPreviews((current) => {
                    const combined = [...current, ...next];
                    syncSelectedFiles(combined);
                    return combined;
                  });
                }}
              />
            </label>
          ) : null}
        </div>
        {error("images") ? <p className="dashboard-field-error">{error("images")}</p> : null}
        {uploadError ? <p className="dashboard-field-error" role="alert">{uploadError}</p> : null}
      </section>

      <section className="dashboard-fields-editor" aria-labelledby="details-heading">
        <div className="dashboard-form-section-heading">
          <span>02</span>
          <div>
            <h2 id="details-heading">Información del producto</h2>
            <p>{product ? `${product.code} · Edita solo lo necesario` : "El código se crea automáticamente al guardar"}</p>
          </div>
        </div>

        <label className="dashboard-field is-wide">
          <span>Nombre *</span>
          <input name="name" defaultValue={product?.name} placeholder="Ej. Bolso Adidas Handbag White" required />
          {error("name") ? <small className="dashboard-field-error">{error("name")}</small> : null}
        </label>

        <label className="dashboard-field is-wide">
          <span>Descripción</span>
          <textarea name="description" defaultValue={product?.description} rows={5} placeholder="Describe el material, el estilo y los detalles importantes." />
        </label>

        <div className="dashboard-form-grid">
          <label className="dashboard-field">
            <span>Marca *</span>
            <input name="brand" defaultValue={product?.brand} placeholder="Adidas" required />
            {error("brand") ? <small className="dashboard-field-error">{error("brand")}</small> : null}
          </label>
          <label className="dashboard-field">
            <span>Categoría *</span>
            <select name="category" defaultValue={product?.category ?? "Mujer"} required>
              {productCategories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label className="dashboard-field">
            <span>Tipo *</span>
            <input name="type" defaultValue={product?.type} placeholder="Bolso, vestido, calzado…" required />
            {error("type") ? <small className="dashboard-field-error">{error("type")}</small> : null}
          </label>
          <label className="dashboard-field">
            <span>Color *</span>
            <input name="color" defaultValue={product?.color} placeholder="Negro" required />
          </label>
          <label className="dashboard-field">
            <span>Género *</span>
            <select name="gender" defaultValue={product?.gender ?? "Mujer"} required>
              {productGenders.map((gender) => <option key={gender}>{gender}</option>)}
            </select>
          </label>
          <label className="dashboard-field">
            <span>P. Marca (precio comercial)</span>
            <div className="dashboard-money-input"><b>$</b><input name="brand_price" type="number" min="0" step="0.01" defaultValue={product?.brandPrice ?? ""} placeholder="0.00" /></div>
            {error("brandPrice") ? <small className="dashboard-field-error">{error("brandPrice")}</small> : null}
          </label>
          <label className="dashboard-field">
            <span>P. Store MAY *</span>
            <div className="dashboard-money-input"><b>$</b><input name="price" type="number" min="0" step="0.01" defaultValue={product?.price} placeholder="0.00" required /></div>
            {error("price") ? <small className="dashboard-field-error">{error("price")}</small> : null}
          </label>
          <label className="dashboard-field is-wide">
            <span>Tallas disponibles *</span>
            <input name="sizes_available" defaultValue={product?.sizesAvailable ?? "Consultar"} placeholder="S, M, L o Consultar" required />
            {error("sizesAvailable") ? <small className="dashboard-field-error">{error("sizesAvailable")}</small> : null}
          </label>
          <label className="dashboard-field is-wide">
            <span>Estado *</span>
            <select name="status" defaultValue={product?.status ?? "disponible"} required>
              {productStatusOptions.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </label>
        </div>

        {state.message ? (
          <p className={`dashboard-alert ${state.status === "success" ? "is-success" : "is-error"}`} role={state.status === "error" ? "alert" : "status"}>
            {state.message}
          </p>
        ) : null}

        <div className="dashboard-form-actions">
          <a className="dashboard-button is-secondary" href="/dashboard">Cancelar</a>
          <button className="dashboard-button is-primary" type="submit" disabled={pending || dispatching || uploading}>
            {uploading || pending || dispatching
              ? uploadMessage || "Guardando…"
              : product
                ? "Guardar cambios"
                : "Guardar producto"}
          </button>
        </div>
      </section>
    </form>
  );
}
