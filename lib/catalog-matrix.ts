import "server-only";

import { fuzzy } from "fast-fuzzy";
import * as XLSX from "xlsx";
import { getDatabase } from "@/lib/db";
import {
  catalogMatrixColumns,
  maximumCatalogMatrixImages,
  type CatalogMatrixAssignment,
  type CatalogMatrixClassificationOverride,
  type CatalogMatrixImageMatch,
  type CatalogMatrixInventoryOverride,
  type CatalogMatrixPreview,
  type CatalogMatrixRow,
  type CatalogMatrixRowValues,
  type CatalogMatrixSummary
} from "@/lib/catalog-matrix-contract";
import type { UploadedProductImageReference } from "@/lib/catalog-import-contract";
import { deleteProductImageAssets, verifyProductImageAssets } from "@/lib/imagekit";
import {
  productCategories,
  productGenders,
  type ProductCategory,
  type ProductGender,
  type ProductStatus
} from "@/lib/product-options";

const maximumSpreadsheetBytes = 4 * 1024 * 1024;
const maximumRows = 500;
const allowedSpreadsheetExtensions = new Set(["xlsx", "csv"]);
const allowedImageExtensions = new Set(["jpg", "jpeg", "png", "webp", "avif"]);

type ParsedMatrixRow = CatalogMatrixRow & {
  article: string;
  model: string;
  brand: string;
  color: string;
  size: string;
  brandPrice: number;
  storePrice: number;
  productStatus: ProductStatus;
  productName: string;
};

type ExistingProduct = {
  id: string;
  code: string;
  name: string;
  brand: string;
  image_urls: string[];
};

type PlannedMatrixRow = ParsedMatrixRow & { existing: ExistingProduct | null };

export class CatalogMatrixError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogMatrixError";
  }
}

function displayValue(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).normalize("NFKC").trim();
}

function extension(fileName: string) {
  return fileName.toLocaleLowerCase("es").match(/\.([a-z0-9]+)$/)?.[1] ?? "";
}

export function normalizeCatalogMatchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/(?:\.(?:jpe?g|png|webp|avif))+$/i, "")
    .toLocaleLowerCase("es")
    .replace(/[_\-–—]+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizedFileKey(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase("es");
}

function productKey(name: string, brand: string) {
  return `${normalizeCatalogMatchText(name)}::${normalizeCatalogMatchText(brand)}`;
}

function parseCurrency(value: string) {
  const compact = value.replace(/[^0-9,.-]/g, "");
  if (!compact) return Number.NaN;
  const lastComma = compact.lastIndexOf(",");
  const lastDot = compact.lastIndexOf(".");
  let normalized = compact;

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalIndex = Math.max(lastComma, lastDot);
    const integer = compact.slice(0, decimalIndex).replace(/[.,]/g, "");
    normalized = `${integer}.${compact.slice(decimalIndex + 1).replace(/[.,]/g, "")}`;
  } else if (lastComma >= 0) {
    const decimals = compact.length - lastComma - 1;
    normalized = decimals > 0 && decimals <= 2
      ? `${compact.slice(0, lastComma).replace(/,/g, "")}.${compact.slice(lastComma + 1)}`
      : compact.replace(/,/g, "");
  } else if ((compact.match(/\./g) ?? []).length > 1) {
    const decimalIndex = compact.lastIndexOf(".");
    normalized = `${compact.slice(0, decimalIndex).replace(/\./g, "")}.${compact.slice(decimalIndex + 1)}`;
  }

  return Number(normalized);
}

function matrixValues(row: unknown[]) {
  return Object.fromEntries(
    catalogMatrixColumns.map((column, index) => [column, displayValue(row[index])])
  ) as CatalogMatrixRowValues;
}

function validateRequired(errors: string[], value: string, label: string, maximum: number) {
  if (!value) errors.push(`${label} está vacío.`);
  if (value.length > maximum) errors.push(`${label} es demasiado largo.`);
}

function parseMatrixRow(rowNumber: number, values: CatalogMatrixRowValues): ParsedMatrixRow {
  const errors: string[] = [];
  validateRequired(errors, values.ARTICULO, "ARTICULO", 160);
  validateRequired(errors, values.MODELO, "MODELO", 160);
  validateRequired(errors, values.MARCA, "MARCA", 100);
  if (values.COLOR.length > 80) errors.push("COLOR es demasiado largo.");
  if (values.TALLA.length > 240) errors.push("TALLA es demasiado largo.");

  const brandPrice = parseCurrency(values["V. MARCA"]);
  const storePrice = parseCurrency(values["P.ECUA"]);
  if (!values["V. MARCA"] || !Number.isFinite(brandPrice) || brandPrice < 0 || brandPrice > 99999999.99) {
    errors.push("V. MARCA debe ser un precio válido, por ejemplo 120.00.");
  }
  if (!values["P.ECUA"] || !Number.isFinite(storePrice) || storePrice < 0 || storePrice > 99999999.99) {
    errors.push("P.ECUA debe ser un precio válido, por ejemplo 85.00.");
  }

  const inventoryState = (values.ESTADO || "STOCK").toLocaleUpperCase("es");
  if (inventoryState !== "STOCK" && inventoryState !== "SOLD") {
    errors.push("ESTADO debe decir STOCK o SOLD.");
  }

  const productName = [values.ARTICULO, values.MODELO].filter(Boolean).join(" ").trim();
  return {
    rowNumber,
    values,
    label: [values.MODELO, values.ARTICULO, values.MARCA].filter(Boolean).join(" · "),
    errors,
    duplicate: null,
    article: values.ARTICULO,
    model: values.MODELO,
    brand: values.MARCA,
    color: values.COLOR || "No especificado",
    size: values.TALLA || "Consultar",
    brandPrice,
    storePrice,
    productStatus: inventoryState === "SOLD" ? "agotado" : "disponible",
    productName
  };
}

function spreadsheetBytesAreValid(file: File, bytes: Uint8Array) {
  const fileExtension = extension(file.name);
  if (!allowedSpreadsheetExtensions.has(fileExtension)) return false;
  if (fileExtension === "csv") return !bytes.includes(0);
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

async function readCatalogMatrix(file: File) {
  if (!file.name || !allowedSpreadsheetExtensions.has(extension(file.name))) {
    throw new CatalogMatrixError("Selecciona una matriz .xlsx o .csv.");
  }
  if (!file.size || file.size > maximumSpreadsheetBytes) {
    throw new CatalogMatrixError("La matriz debe pesar menos de 4 MB.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!spreadsheetBytesAreValid(file, bytes)) {
    throw new CatalogMatrixError("El contenido no corresponde a un Excel o CSV válido.");
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(bytes, {
      type: "array",
      cellFormula: true,
      cellText: false,
      sheetRows: maximumRows + 10
    });
  } catch {
    throw new CatalogMatrixError("No se pudo abrir la matriz. Usa la plantilla del dashboard.");
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
  if (!sheet) throw new CatalogMatrixError("La matriz no contiene una hoja de productos.");
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: true,
    blankrows: true
  }) as unknown[][];
  if (!rows.length) throw new CatalogMatrixError("La matriz está vacía.");

  const requiredHeaders = catalogMatrixColumns.slice(0, 7);
  const normalizedHeaders = (row: unknown[]) => {
    const values = row.map((value) => displayValue(value).replace(/^\uFEFF/, "").toLocaleUpperCase("es"));
    while (values.length && !values.at(-1)) values.pop();
    return values;
  };
  const headerRowIndex = rows.slice(0, 10).findIndex((row) => {
    const headers = normalizedHeaders(row);
    const acceptedLength = headers.length === requiredHeaders.length || headers.length === catalogMatrixColumns.length;
    return acceptedLength && requiredHeaders.every((column, index) => headers[index] === column)
      && (headers.length === requiredHeaders.length || headers[7] === "ESTADO");
  });
  if (headerRowIndex < 0) {
    throw new CatalogMatrixError(
      `No se encontraron los encabezados ARTICULO, MODELO, MARCA, COLOR, TALLA, V. MARCA y P.ECUA en las primeras 10 filas.`
    );
  }
  if (rows.length - headerRowIndex - 1 > maximumRows) {
    throw new CatalogMatrixError(`Importa como máximo ${maximumRows} productos por matriz.`);
  }
  const sourceHasInventoryColumn = normalizedHeaders(rows[headerRowIndex]).length === catalogMatrixColumns.length;

  const formulaRows = new Set<number>();
  const range = sheet["!ref"] ? XLSX.utils.decode_range(sheet["!ref"]) : null;
  if (range) {
    for (let row = headerRowIndex + 1; row <= Math.min(range.e.r, headerRowIndex + maximumRows); row += 1) {
      for (let column = 0; column < catalogMatrixColumns.length; column += 1) {
        const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })] as XLSX.CellObject | undefined;
        if (cell?.f) formulaRows.add(row + 1);
      }
    }
  }

  const parsed: ParsedMatrixRow[] = [];
  for (let index = headerRowIndex + 1; index < rows.length; index += 1) {
    const raw = rows[index] ?? [];
    if (!raw.slice(0, catalogMatrixColumns.length).some((value) => displayValue(value))) continue;
    const values = matrixValues(raw);
    if (!values.TALLA) values.TALLA = "Consultar";
    if (!sourceHasInventoryColumn || !values.ESTADO) values.ESTADO = "STOCK";
    const row = parseMatrixRow(index + 1, values);
    if (formulaRows.has(row.rowNumber)) {
      row.errors.push("No uses fórmulas; pega los valores directamente.");
    }
    parsed.push(row);
  }
  if (!parsed.length) throw new CatalogMatrixError("No hay productos debajo de los encabezados.");
  return parsed;
}

async function addDuplicateInformation(rows: ParsedMatrixRow[]): Promise<PlannedMatrixRow[]> {
  const validNames = [...new Set(rows.filter((row) => !row.errors.length).map((row) => row.productName.toLocaleLowerCase("es")))];
  if (!validNames.length) return rows.map((row) => ({ ...row, existing: null }));

  const sql = getDatabase();
  const existing = (await sql.query(
    `SELECT id, code, name, brand, image_urls
       FROM products
      WHERE lower(trim(name)) = ANY($1::text[])
      ORDER BY updated_at DESC`,
    [validNames]
  )) as ExistingProduct[];
  const byKey = new Map(existing.map((product) => [productKey(product.name, product.brand), product]));

  return rows.map((row) => {
    const product = byKey.get(productKey(row.productName, row.brand)) ?? null;
    return {
      ...row,
      existing: product,
      duplicate: product ? { id: product.id, code: product.code, name: product.name } : null
    };
  });
}

function candidateStrings(row: ParsedMatrixRow) {
  return [
    `${row.model} ${row.article}`,
    `${row.article} ${row.model}`,
    `${row.brand} ${row.model} ${row.article}`,
    row.model,
    row.article
  ].map(normalizeCatalogMatchText).filter(Boolean);
}

function containmentConfidence(imageName: string, candidate: string, brand: string) {
  const imageTokens = imageName.split(" ").filter((token) => token.length >= 3);
  const candidateTokens = new Set(candidate.split(" ").filter((token) => token.length >= 3));
  if (!imageTokens.length || !imageTokens.every((token) => candidateTokens.has(token))) return 0;

  if (imageTokens.length >= 2) return 96;
  const [onlyToken] = imageTokens;
  const brandTokens = new Set(brand.split(" ").filter(Boolean));
  return onlyToken.length >= 8 && !brandTokens.has(onlyToken) ? 92 : 0;
}

function confidenceFor(imageName: string, row: ParsedMatrixRow) {
  const normalizedImage = normalizeCatalogMatchText(imageName);
  if (normalizedImage.length < 2) return 0;
  const normalizedBrand = normalizeCatalogMatchText(row.brand);
  const candidates = candidateStrings(row);
  const best = Math.max(
    ...candidates.map((candidate) => {
      const fuzzyScore = fuzzy(normalizedImage, candidate, {
        ignoreCase: true,
        ignoreSymbols: true,
        normalizeWhitespace: true,
        useDamerau: true,
        useSellers: true
      });
      const partialScore = containmentConfidence(normalizedImage, candidate, normalizedBrand) / 100;
      return Math.max(fuzzyScore, partialScore);
    })
  );
  return Math.round(best * 100);
}

function matchImages(imageNames: string[], rows: ParsedMatrixRow[]): CatalogMatrixImageMatch[] {
  const validRows = rows.filter((row) => !row.errors.length);
  return imageNames.map((imageName) => {
    const ranked = validRows
      .map((row) => ({ rowNumber: row.rowNumber, label: row.label, confidence: confidenceFor(imageName, row) }))
      .sort((left, right) => right.confidence - left.confidence || left.rowNumber - right.rowNumber);
    const best = ranked[0];
    const runnerUp = ranked[1];
    const originalConfidence = best?.confidence ?? 0;
    const confidence = originalConfidence > 85 && runnerUp && originalConfidence - runnerUp.confidence < 4
      ? 85
      : originalConfidence;
    const status = confidence > 85 ? "matched" : confidence >= 60 ? "review" : "unmatched";
    return {
      imageName,
      assignedRowNumber: status === "unmatched" ? null : (best?.rowNumber ?? null),
      confidence,
      status,
      alternatives: ranked.slice(0, 5)
    };
  });
}

function validateImageNames(imageNames: string[]) {
  if (!imageNames.length) throw new CatalogMatrixError("Selecciona al menos una imagen del catálogo.");
  if (imageNames.length > maximumCatalogMatrixImages) {
    throw new CatalogMatrixError(`Selecciona hasta ${maximumCatalogMatrixImages} imágenes por lote.`);
  }
  const seen = new Set<string>();
  for (const name of imageNames) {
    if (!name || name.length > 255 || !allowedImageExtensions.has(extension(name))) {
      throw new CatalogMatrixError(`La imagen '${name || "sin nombre"}' no tiene un nombre o formato válido.`);
    }
    const key = normalizedFileKey(name);
    if (seen.has(key)) throw new CatalogMatrixError(`Hay dos imágenes llamadas '${name}'. Renombra una de ellas.`);
    seen.add(key);
  }
}

export async function previewCatalogMatrix(spreadsheet: File, imageNames: string[]): Promise<CatalogMatrixPreview> {
  validateImageNames(imageNames);
  const rows = await addDuplicateInformation(await readCatalogMatrix(spreadsheet));
  const imageMatches = matchImages(imageNames, rows);
  return {
    rows,
    imageMatches,
    matchedCount: imageMatches.filter((match) => match.status === "matched").length,
    reviewCount: imageMatches.filter((match) => match.status === "review").length,
    unmatchedCount: imageMatches.filter((match) => match.status === "unmatched").length,
    duplicateCount: rows.filter((row) => row.duplicate && !row.errors.length).length
  };
}

function publicWhatsappNumber() {
  return process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ?? "";
}

function assertCategoryAndGender(category: string, gender: string) {
  if (!productCategories.includes(category as ProductCategory)) {
    throw new CatalogMatrixError("Selecciona una categoría válida para el lote.");
  }
  if (!productGenders.includes(gender as ProductGender)) {
    throw new CatalogMatrixError("Selecciona un género válido para el lote.");
  }
  return { category: category as ProductCategory, gender: gender as ProductGender };
}

function assignmentMap(assignments: CatalogMatrixAssignment[]) {
  const result = new Map<string, number>();
  for (const assignment of assignments) {
    const key = normalizedFileKey(assignment.imageName);
    if (!key || !Number.isInteger(assignment.rowNumber) || result.has(key)) {
      throw new CatalogMatrixError("Las asignaciones manuales no son válidas. Vuelve a analizar el lote.");
    }
    result.set(key, assignment.rowNumber);
  }
  return result;
}

export async function uploadCatalogMatrix(input: {
  spreadsheet: File;
  uploadedPhotos: UploadedProductImageReference[];
  assignments: CatalogMatrixAssignment[];
  selectedRowNumbers: number[];
  inventoryOverrides: CatalogMatrixInventoryOverride[];
  classificationOverrides: CatalogMatrixClassificationOverride[];
  duplicateMode: "skip" | "create" | "update";
  category: string;
  gender: string;
}): Promise<CatalogMatrixSummary> {
  const fileIds = input.uploadedPhotos.map((photo) => photo.fileId).filter(Boolean);
  try {
    const classification = assertCategoryAndGender(input.category, input.gender);
    const verifiedPhotos = await verifyProductImageAssets(input.uploadedPhotos);
    const parsedRows = await readCatalogMatrix(input.spreadsheet);
    const overrides = new Map<number, "STOCK" | "SOLD">();
    for (const override of input.inventoryOverrides) {
      if (
        !Number.isInteger(override.rowNumber) ||
        (override.state !== "STOCK" && override.state !== "SOLD") ||
        overrides.has(override.rowNumber)
      ) {
        throw new CatalogMatrixError("Los estados STOCK/SOLD no son válidos.");
      }
      overrides.set(override.rowNumber, override.state);
    }
    for (const row of parsedRows) {
      const override = overrides.get(row.rowNumber);
      if (!override) continue;
      row.values.ESTADO = override;
      row.productStatus = override === "SOLD" ? "agotado" : "disponible";
      row.errors = row.errors.filter((error) => !error.startsWith("ESTADO debe"));
    }
    const rows = await addDuplicateInformation(parsedRows);
    const validRows = rows.filter((row) => !row.errors.length);
    if (!validRows.length) throw new CatalogMatrixError("La matriz no contiene filas válidas para importar.");
    const skippedExistingCount = input.duplicateMode === "skip"
      ? validRows.filter((row) => row.existing).length
      : 0;
    const eligibleRows = input.duplicateMode === "skip"
      ? validRows.filter((row) => !row.existing)
      : validRows;
    const selectedRowNumbers = new Set<number>();
    for (const rowNumber of input.selectedRowNumbers) {
      if (!Number.isInteger(rowNumber) || selectedRowNumbers.has(rowNumber)) {
        throw new CatalogMatrixError("La selección de productos del lote no es válida.");
      }
      selectedRowNumbers.add(rowNumber);
    }
    const eligibleRowNumbers = new Set(eligibleRows.map((row) => row.rowNumber));
    if (!selectedRowNumbers.size || [...selectedRowNumbers].some((rowNumber) => !eligibleRowNumbers.has(rowNumber))) {
      throw new CatalogMatrixError("Una fotografía está vinculada a un producto que no se puede importar.");
    }
    const rowsToImport = eligibleRows.filter((row) => selectedRowNumbers.has(row.rowNumber));
    const skippedWithoutPhotoCount = eligibleRows.length - rowsToImport.length;
    if (!rowsToImport.length) {
      if (verifiedPhotos.length) await deleteProductImageAssets(fileIds);
      return {
        importedCount: 0,
        uploadedImageCount: 0,
        additionalImageCount: 0,
        missingPhotoCount: skippedWithoutPhotoCount,
        createdCount: 0,
        updatedCount: 0,
        skippedExistingCount,
        skippedRowCount: rows.length - validRows.length + skippedWithoutPhotoCount,
        errors: rows.filter((row) => row.errors.length).map((row) => ({ rowNumber: row.rowNumber, errors: row.errors }))
      };
    }

    const classifications = new Map<number, { category: ProductCategory; gender: ProductGender }>();
    for (const override of input.classificationOverrides) {
      if (!Number.isInteger(override.rowNumber) || classifications.has(override.rowNumber)) {
        throw new CatalogMatrixError("Las categorías y géneros del lote no son válidos.");
      }
      classifications.set(
        override.rowNumber,
        assertCategoryAndGender(override.category, override.gender)
      );
    }
    for (const row of rowsToImport) {
      if (!classifications.has(row.rowNumber)) classifications.set(row.rowNumber, classification);
    }

    const byRow = new Map(rowsToImport.map((row) => [row.rowNumber, row]));
    const assignedRows = assignmentMap(input.assignments);
    const urlsByRow = new Map<number, string[]>();
    const photoByKey = new Map(verifiedPhotos.map((photo) => [normalizedFileKey(photo.originalName), photo]));

    if (photoByKey.size !== verifiedPhotos.length || assignedRows.size !== verifiedPhotos.length) {
      throw new CatalogMatrixError("La lista de imágenes cambió. Vuelve a analizar y confirmar el lote.");
    }
    for (const [imageKey, rowNumber] of assignedRows) {
      const photo = photoByKey.get(imageKey);
      if (!photo || !byRow.has(rowNumber)) {
        throw new CatalogMatrixError("Una imagen está asignada a una fila que ya no es válida.");
      }
      const current = urlsByRow.get(rowNumber) ?? [];
      current.push(photo.url);
      urlsByRow.set(rowNumber, current);
    }
    const missingPhotoRows = rowsToImport.filter((row) => !(urlsByRow.get(row.rowNumber)?.length));
    if (missingPhotoRows.length) {
      throw new CatalogMatrixError(
        `Falta asignar una imagen a ${missingPhotoRows.map((row) => `la fila ${row.rowNumber}`).join(", ")}.`
      );
    }

    const sql = getDatabase();
    const whatsappNumber = publicWhatsappNumber();
    let createdCount = 0;
    let updatedCount = 0;

    await sql.transaction((transaction) =>
      rowsToImport.map((row) => {
        const rowClassification = classifications.get(row.rowNumber) ?? classification;
        const newImages = urlsByRow.get(row.rowNumber) ?? [];
        const imageUrls = input.duplicateMode === "update" && row.existing
          ? [...newImages, ...(row.existing.image_urls ?? [])].slice(0, 8)
          : newImages.slice(0, 8);

        if (input.duplicateMode === "update" && row.existing) {
          updatedCount += 1;
          return transaction`
            UPDATE products
               SET name = ${row.productName},
                   description = ${`Modelo ${row.model}`},
                   brand = ${row.brand},
                   category = ${rowClassification.category},
                   type = ${row.article},
                   article = ${row.article},
                   model = ${row.model},
                   color = ${row.color},
                   gender = ${rowClassification.gender},
                   brand_price = ${row.brandPrice},
                   price = ${row.storePrice},
                   sizes_available = ${row.size},
                   status = ${row.productStatus},
                   image_urls = ${imageUrls},
                   whatsapp_number = ${whatsappNumber}
             WHERE id = ${row.existing.id}
             RETURNING id
          `;
        }

        createdCount += 1;
        return transaction`
          INSERT INTO products (
            name, description, brand, category, type, article, model, color, gender,
            brand_price, price, sizes_available, status, image_urls, whatsapp_number
          ) VALUES (
            ${row.productName}, ${`Modelo ${row.model}`}, ${row.brand}, ${rowClassification.category},
            ${row.article}, ${row.article}, ${row.model}, ${row.color}, ${rowClassification.gender},
            ${row.brandPrice}, ${row.storePrice}, ${row.size}, ${row.productStatus}, ${imageUrls},
            ${whatsappNumber}
          )
          RETURNING id
        `;
      })
    );

    return {
      importedCount: rowsToImport.length,
      uploadedImageCount: verifiedPhotos.length,
      additionalImageCount: Math.max(0, verifiedPhotos.length - rowsToImport.length),
      missingPhotoCount: skippedWithoutPhotoCount,
      createdCount,
      updatedCount,
      skippedExistingCount,
      skippedRowCount: rows.length - validRows.length + skippedWithoutPhotoCount,
      errors: rows
        .filter((row) => row.errors.length)
        .map((row) => ({ rowNumber: row.rowNumber, errors: row.errors }))
    };
  } catch (error) {
    await deleteProductImageAssets(fileIds);
    throw error;
  }
}
