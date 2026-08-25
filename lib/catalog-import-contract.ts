export const catalogImportColumns = [
  "nombre",
  "descripcion",
  "marca",
  "categoria",
  "tipo",
  "color",
  "genero",
  "precio",
  "tallas_disponibles",
  "estado",
  "nombre_archivo_foto"
] as const;

export type CatalogImportColumn = (typeof catalogImportColumns)[number];

export type CatalogImportRowValues = Record<CatalogImportColumn, string>;

export type CatalogImportDuplicate = {
  id: string;
  code: string;
  name: string;
  brand: string;
};

export type CatalogImportPreviewRow = {
  rowNumber: number;
  values: CatalogImportRowValues;
  errors: string[];
  duplicate: CatalogImportDuplicate | null;
  photoMatched: boolean;
};

export type CatalogImportPreview = {
  rows: CatalogImportPreviewRow[];
  validCount: number;
  errorCount: number;
  duplicateCount: number;
};

export type CatalogImportSummary = {
  importedCount: number;
  createdCount: number;
  updatedCount: number;
  errorCount: number;
  errors: Array<{ rowNumber: number; errors: string[] }>;
};

export type UploadedProductImageReference = {
  originalName: string;
  url: string;
  fileId: string;
};

export type ProductImageUploadAuthorization = {
  token: string;
  expire: number;
  signature: string;
};

export type ProductImageUploadAuthResponse =
  | {
      ok: true;
      publicKey: string;
      folder: string;
      uploads: ProductImageUploadAuthorization[];
    }
  | CatalogImportApiError;

export type CatalogImportApiError = {
  ok: false;
  message: string;
};

export type CatalogImportPreviewResponse =
  | ({ ok: true } & CatalogImportPreview)
  | CatalogImportApiError;

export type CatalogImportConfirmResponse =
  | ({ ok: true; summary: CatalogImportSummary })
  | CatalogImportApiError;
