import "server-only";

import * as XLSX from "xlsx";
import { getDatabase } from "@/lib/db";
import {
  catalogImportColumns,
  type CatalogImportColumn,
  type CatalogImportPreview,
  type CatalogImportPreviewRow,
  type CatalogImportRowValues,
  type CatalogImportSummary,
  type UploadedProductImageReference
} from "@/lib/catalog-import-contract";
import {
  productCategories,
  productGenders,
  productStatusOptions,
  type ProductCategory,
  type ProductGender,
  type ProductStatus
} from "@/lib/product-options";
import {
  deleteProductImageAssets,
  verifyProductImageAssets
} from "@/lib/imagekit";

const maximumSpreadsheetBytes = 4 * 1024 * 1024;
const maximumRows = 500;
const placeholderImageUrl = "/brand/store-may-logo.jpg";
const allowedSpreadsheetExtensions = new Set(["xlsx", "csv"]);
const allowedPhotoExtensions = new Set(["jpg", "jpeg", "png", "webp", "avif"]);

const stateByExcelLabel = new Map<string, ProductStatus>(
  productStatusOptions.map((option) => [option.label, option.value])
);

type ExistingProduct = {
  id: string;
  code: string;
  name: string;
  brand: string;
  image_urls: string[];
};

type ImportProductData = {
  name: string;
  description: string;
  brand: string;
  category: ProductCategory;
  type: string;
  color: string;
  gender: ProductGender;
  price: number;
  sizesAvailable: string;
  status: ProductStatus;
  photoFileName: string;
};

type PlannedRow = {
  preview: CatalogImportPreviewRow;
  data: ImportProductData;
  existing: ExistingProduct | null;
};

export class CatalogImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogImportError";
  }
}

function displayValue(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function fileExtension(fileName: string) {
  const match = fileName.trim().toLocaleLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? "";
}

function normalizedPhotoName(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase("es");
}

function productKey(name: string, brand: string) {
  return `${name.normalize("NFKC").trim().toLocaleLowerCase("es")}::${brand
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("es")}`;
}

function valuesFromRow(row: unknown[]) {
  return Object.fromEntries(
    catalogImportColumns.map((column, index) => [column, displayValue(row[index])])
  ) as CatalogImportRowValues;
}

function validateText(
  errors: string[],
  value: string,
  label: string,
  maximumLength: number,
  required = true
) {
  if (required && !value) errors.push(`El campo ${label} está vacío.`);
  if (value.length > maximumLength) errors.push(`${label} es demasiado largo.`);
}

function validateProductRow(
  values: CatalogImportRowValues,
  photoNameCounts: Map<string, number>
) {
  const errors: string[] = [];
  validateText(errors, values.nombre, "Nombre", 160);
  validateText(errors, values.descripcion, "Descripción", 2000, false);
  validateText(errors, values.marca, "Marca", 100);
  validateText(errors, values.tipo, "Tipo", 80);
  validateText(errors, values.color, "Color", 80);
  validateText(errors, values.tallas_disponibles, "Tallas disponibles", 240);

  if (!values.categoria) {
    errors.push("El campo Categoría está vacío.");
  } else if (!productCategories.includes(values.categoria as ProductCategory)) {
    errors.push(
      `La categoría '${values.categoria}' no existe. Usa ${productCategories.join(", ")}.`
    );
  }

  if (!values.genero) {
    errors.push("El campo Género está vacío.");
  } else if (!productGenders.includes(values.genero as ProductGender)) {
    errors.push(`El género '${values.genero}' no existe. Usa ${productGenders.join(", ")}.`);
  }

  if (!values.estado) {
    errors.push("El campo Estado está vacío.");
  } else if (!stateByExcelLabel.has(values.estado)) {
    errors.push(
      `El estado '${values.estado}' no existe. Usa ${productStatusOptions
        .map((option) => option.label)
        .join(", ")}.`
    );
  }

  const normalizedPrice = values.precio.replace(",", ".");
  const price = Number(normalizedPrice);
  if (!values.precio) {
    errors.push("El campo Precio está vacío.");
  } else if (!/^\d+(?:[.,]\d{1,2})?$/.test(values.precio) || !Number.isFinite(price)) {
    errors.push("El precio debe ser un número, por ejemplo 45.00.");
  } else if (price < 0 || price > 99999999.99) {
    errors.push("El precio está fuera del rango permitido.");
  }

  const photoName = normalizedPhotoName(values.nombre_archivo_foto);
  if (photoName) {
    if (/[\\/]/.test(values.nombre_archivo_foto)) {
      errors.push("En la foto escribe sólo el nombre del archivo, sin carpetas.");
    } else if (!allowedPhotoExtensions.has(fileExtension(photoName))) {
      errors.push("La foto debe ser JPG, PNG, WebP o AVIF.");
    } else if (!photoNameCounts.has(photoName)) {
      errors.push(`No se encontró la foto '${values.nombre_archivo_foto}' entre los archivos seleccionados.`);
    } else if ((photoNameCounts.get(photoName) ?? 0) > 1) {
      errors.push(`Hay más de una foto llamada '${values.nombre_archivo_foto}'. Deja sólo una.`);
    }
  }

  return {
    errors,
    data: {
      name: values.nombre,
      description: values.descripcion,
      brand: values.marca,
      category: values.categoria as ProductCategory,
      type: values.tipo,
      color: values.color,
      gender: values.genero as ProductGender,
      price,
      sizesAvailable: values.tallas_disponibles,
      status: stateByExcelLabel.get(values.estado) as ProductStatus,
      photoFileName: photoName
    } satisfies ImportProductData
  };
}

function spreadsheetBytesAreValid(file: File, bytes: Uint8Array) {
  const extension = fileExtension(file.name);
  if (!allowedSpreadsheetExtensions.has(extension)) return false;
  if (extension === "csv") return !bytes.includes(0);
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    [0x03, 0x05, 0x07].includes(bytes[2]) &&
    [0x04, 0x06, 0x08].includes(bytes[3])
  );
}

async function readSpreadsheet(file: File) {
  if (!file.name || !allowedSpreadsheetExtensions.has(fileExtension(file.name))) {
    throw new CatalogImportError("Selecciona un archivo .xlsx o .csv.");
  }
  if (file.size === 0 || file.size > maximumSpreadsheetBytes) {
    throw new CatalogImportError("El archivo debe pesar menos de 4 MB.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!spreadsheetBytesAreValid(file, bytes)) {
    throw new CatalogImportError("El contenido no corresponde a un Excel o CSV válido.");
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(bytes, {
      type: "array",
      cellFormula: true,
      cellText: false,
      sheetRows: maximumRows + 2
    });
  } catch {
    throw new CatalogImportError("No se pudo abrir el archivo. Descarga la plantilla y vuelve a intentarlo.");
  }

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) throw new CatalogImportError("El archivo no contiene una hoja de productos.");
  const sheet = workbook.Sheets[firstSheetName];
  const range = sheet["!ref"] ? XLSX.utils.decode_range(sheet["!ref"]) : null;
  if (range && range.e.r > maximumRows) {
    throw new CatalogImportError(`Importa como máximo ${maximumRows} productos por archivo.`);
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: true,
    blankrows: true
  }) as unknown[][];
  if (!rows.length) throw new CatalogImportError("El archivo está vacío.");

  const actualHeaders = rows[0].map(displayValue);
  actualHeaders[0] = actualHeaders[0]?.replace(/^\uFEFF/, "") ?? "";
  const expectedHeaders = [...catalogImportColumns];
  const wrongHeaders =
    actualHeaders.slice(0, expectedHeaders.length).some((header, index) => header !== expectedHeaders[index]) ||
    actualHeaders.slice(expectedHeaders.length).some(Boolean);
  if (wrongHeaders || actualHeaders.length < expectedHeaders.length) {
    throw new CatalogImportError(
      `Las columnas no coinciden con la plantilla. Deben ser: ${expectedHeaders.join(", ")}.`
    );
  }

  const formulaRows = new Set<number>();
  if (range) {
    const lastRow = Math.min(range.e.r, maximumRows);
    for (let row = 1; row <= lastRow; row += 1) {
      for (let column = 0; column < catalogImportColumns.length; column += 1) {
        const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })] as XLSX.CellObject | undefined;
        if (cell?.f) formulaRows.add(row + 1);
      }
    }
  }

  return { rows, formulaRows };
}

async function loadExistingProducts(rows: Array<{ data: ImportProductData; errors: string[] }>) {
  const names = [...new Set(rows.filter((row) => !row.errors.length).map((row) => row.data.name.toLocaleLowerCase("es")))];
  if (!names.length) return new Map<string, ExistingProduct>();

  const sql = getDatabase();
  const existing = (await sql.query(
    `SELECT id, code, name, brand, image_urls
     FROM products
     WHERE lower(trim(name)) = ANY($1::text[])
     ORDER BY updated_at DESC`,
    [names]
  )) as ExistingProduct[];

  const byKey = new Map<string, ExistingProduct>();
  for (const product of existing) {
    const key = productKey(product.name, product.brand);
    if (!byKey.has(key)) byKey.set(key, product);
  }
  return byKey;
}

function photoNameCounts(photoNames: string[]) {
  const counts = new Map<string, number>();
  for (const originalName of photoNames.slice(0, maximumRows)) {
    const normalized = normalizedPhotoName(originalName);
    if (normalized) counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }
  return counts;
}

async function buildImportPlan(spreadsheet: File, selectedPhotoNames: string[]) {
  const { rows, formulaRows } = await readSpreadsheet(spreadsheet);
  const selectedPhotos = photoNameCounts(selectedPhotoNames);
  const candidates: Array<{
    rowNumber: number;
    values: CatalogImportRowValues;
    errors: string[];
    data: ImportProductData;
  }> = [];

  for (let index = 1; index < rows.length; index += 1) {
    const rawRow = rows[index] ?? [];
    if (!rawRow.slice(0, catalogImportColumns.length).some((value) => displayValue(value))) continue;
    const rowNumber = index + 1;
    const values = valuesFromRow(rawRow);
    const validated = validateProductRow(values, selectedPhotos);
    if (formulaRows.has(rowNumber)) {
      validated.errors.push("No uses fórmulas en esta fila; escribe los valores directamente.");
    }
    candidates.push({ rowNumber, values, errors: validated.errors, data: validated.data });
  }

  if (!candidates.length) {
    throw new CatalogImportError("No se encontraron productos debajo de los encabezados.");
  }

  const seenInFile = new Map<string, number>();
  for (const candidate of candidates) {
    if (!candidate.data.name || !candidate.data.brand) continue;
    const key = productKey(candidate.data.name, candidate.data.brand);
    const firstRow = seenInFile.get(key);
    if (firstRow) {
      candidate.errors.push(
        `Este mismo nombre y marca ya aparecen en la fila ${firstRow}. Deja una sola fila.`
      );
    } else {
      seenInFile.set(key, candidate.rowNumber);
    }
  }

  const existingByKey = await loadExistingProducts(candidates);
  const plannedRows: PlannedRow[] = candidates.map((candidate) => {
    const existing = existingByKey.get(productKey(candidate.data.name, candidate.data.brand)) ?? null;
    return {
      data: candidate.data,
      existing,
      preview: {
        rowNumber: candidate.rowNumber,
        values: candidate.values,
        errors: candidate.errors,
        duplicate: existing
          ? { id: existing.id, code: existing.code, name: existing.name, brand: existing.brand }
          : null,
        photoMatched: Boolean(
          candidate.data.photoFileName && selectedPhotos.get(candidate.data.photoFileName) === 1
        )
      }
    };
  });

  const preview: CatalogImportPreview = {
    rows: plannedRows.map((row) => row.preview),
    validCount: plannedRows.filter((row) => row.preview.errors.length === 0).length,
    errorCount: plannedRows.filter((row) => row.preview.errors.length > 0).length,
    duplicateCount: plannedRows.filter(
      (row) => row.preview.errors.length === 0 && Boolean(row.existing)
    ).length
  };

  return { preview, plannedRows };
}

export async function previewCatalogImport(spreadsheet: File, selectedPhotoNames: string[]) {
  return (await buildImportPlan(spreadsheet, selectedPhotoNames)).preview;
}

function publicWhatsappNumber() {
  return process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ?? "";
}

export async function confirmCatalogImport(
  spreadsheet: File,
  uploadedPhotos: UploadedProductImageReference[],
  duplicateMode: "create" | "update"
): Promise<CatalogImportSummary> {
  const fileIds = uploadedPhotos.map((photo) => photo.fileId).filter(Boolean);
  try {
    const verifiedPhotos = await verifyProductImageAssets(uploadedPhotos);
    const { preview, plannedRows } = await buildImportPlan(
      spreadsheet,
      verifiedPhotos.map((photo) => photo.originalName)
    );
    const validRows = plannedRows.filter((row) => row.preview.errors.length === 0);
    if (!validRows.length) throw new CatalogImportError("No hay filas válidas para importar.");

    const urls = new Map(
      verifiedPhotos.map((photo) => [normalizedPhotoName(photo.originalName), photo.url])
    );
    const whatsappNumber = publicWhatsappNumber();
    const sql = getDatabase();
    let createdCount = 0;
    let updatedCount = 0;

    await sql.transaction((transaction) =>
      validRows.map((row) => {
        const photoUrl = row.data.photoFileName ? urls.get(row.data.photoFileName) : "";
        const imageUrls = photoUrl
          ? [photoUrl]
          : duplicateMode === "update" && row.existing?.image_urls?.length
            ? row.existing.image_urls
            : [placeholderImageUrl];

        if (duplicateMode === "update" && row.existing) {
          updatedCount += 1;
          return transaction`
            UPDATE products
            SET name = ${row.data.name},
                description = ${row.data.description},
                brand = ${row.data.brand},
                category = ${row.data.category},
                type = ${row.data.type},
                color = ${row.data.color},
                gender = ${row.data.gender},
                price = ${row.data.price},
                sizes_available = ${row.data.sizesAvailable},
                status = ${row.data.status},
                image_urls = ${imageUrls},
                whatsapp_number = ${whatsappNumber}
            WHERE id = ${row.existing.id}
            RETURNING id
          `;
        }

        createdCount += 1;
        return transaction`
          INSERT INTO products (
            name, description, brand, category, type, color, gender, price,
            sizes_available, status, image_urls, whatsapp_number
          ) VALUES (
            ${row.data.name}, ${row.data.description}, ${row.data.brand}, ${row.data.category},
            ${row.data.type}, ${row.data.color}, ${row.data.gender}, ${row.data.price},
            ${row.data.sizesAvailable}, ${row.data.status}, ${imageUrls}, ${whatsappNumber}
          )
          RETURNING id
        `;
      })
    );

    return {
      importedCount: validRows.length,
      createdCount,
      updatedCount,
      errorCount: preview.errorCount,
      errors: preview.rows
        .filter((row) => row.errors.length)
        .map((row) => ({ rowNumber: row.rowNumber, errors: row.errors }))
    };
  } catch (error) {
    await deleteProductImageAssets(fileIds);
    throw error;
  }
}
