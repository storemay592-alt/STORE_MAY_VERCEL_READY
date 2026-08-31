import type { UploadedProductImageReference } from "@/lib/catalog-import-contract";

export const maximumCatalogMatrixImages = 100;

export const catalogMatrixColumns = [
  "ARTICULO",
  "MODELO",
  "MARCA",
  "COLOR",
  "TALLA",
  "V. MARCA",
  "P.ECUA",
  "ESTADO"
] as const;

export type CatalogMatrixColumn = (typeof catalogMatrixColumns)[number];
export type CatalogMatrixRowValues = Record<CatalogMatrixColumn, string>;
export type CatalogMatrixInventoryState = "STOCK" | "SOLD";
export type CatalogMatrixMatchStatus = "matched" | "review" | "unmatched";

export type CatalogMatrixDuplicate = {
  id: string;
  code: string;
  name: string;
};

export type CatalogMatrixRow = {
  rowNumber: number;
  values: CatalogMatrixRowValues;
  label: string;
  errors: string[];
  duplicate: CatalogMatrixDuplicate | null;
};

export type CatalogMatrixAlternative = {
  rowNumber: number;
  label: string;
  confidence: number;
};

export type CatalogMatrixImageMatch = {
  imageName: string;
  assignedRowNumber: number | null;
  confidence: number;
  status: CatalogMatrixMatchStatus;
  alternatives: CatalogMatrixAlternative[];
};

export type CatalogMatrixPreview = {
  rows: CatalogMatrixRow[];
  imageMatches: CatalogMatrixImageMatch[];
  matchedCount: number;
  reviewCount: number;
  unmatchedCount: number;
  duplicateCount: number;
};

export type CatalogMatrixAssignment = {
  imageName: string;
  rowNumber: number;
};

export type CatalogMatrixInventoryOverride = {
  rowNumber: number;
  state: CatalogMatrixInventoryState;
};

export type CatalogMatrixClassificationOverride = {
  rowNumber: number;
  category: string;
  gender: string;
};

export type CatalogMatrixSummary = {
  importedCount: number;
  uploadedImageCount: number;
  additionalImageCount: number;
  missingPhotoCount: number;
  createdCount: number;
  updatedCount: number;
  skippedExistingCount: number;
  skippedRowCount: number;
  errors: Array<{ rowNumber: number; errors: string[] }>;
};

export type CatalogMatrixApiError = { ok: false; message: string };
export type CatalogMatrixMatchResponse =
  | ({ ok: true; preview: CatalogMatrixPreview })
  | CatalogMatrixApiError;
export type CatalogMatrixUploadResponse =
  | ({ ok: true; summary: CatalogMatrixSummary })
  | CatalogMatrixApiError;

export type CatalogMatrixUploadPayload = {
  spreadsheet: File;
  uploadedPhotos: UploadedProductImageReference[];
  assignments: CatalogMatrixAssignment[];
  selectedRowNumbers: number[];
  duplicateMode: "skip" | "create" | "update";
  category: string;
  gender: string;
};
