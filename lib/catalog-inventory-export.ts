import * as XLSX from "xlsx";
import type { CatalogProduct } from "@/lib/catalog-products";

const matrixHeaders = [
  "ARTICULO",
  "MODELO",
  "MARCA",
  "COLOR",
  "TALLA",
  "V. MARCA",
  "P.ECUA",
  "ESTADO"
] as const;

const detailHeaders = [
  "ID INTERNO",
  "CODIGO",
  "NOMBRE",
  "DESCRIPCION",
  "ARTICULO",
  "MODELO",
  "MARCA",
  "CATEGORIA",
  "TIPO",
  "COLOR",
  "GENERO",
  "TALLAS DISPONIBLES",
  "P. MARCA",
  "P. STORE MAY",
  "ESTADO",
  "WHATSAPP",
  "IMAGEN 1",
  "IMAGEN 2",
  "IMAGEN 3",
  "IMAGEN 4",
  "IMAGEN 5",
  "IMAGEN 6",
  "IMAGEN 7",
  "IMAGEN 8",
  "FECHA DE CREACION",
  "ULTIMA MODIFICACION"
] as const;

function inventoryStatus(product: CatalogProduct) {
  return product.status === "agotado" ? "SOLD" : "STOCK";
}

function setCurrencyFormat(sheet: XLSX.WorkSheet, columns: number[], firstDataRow: number, lastDataRow: number) {
  for (const column of columns) {
    for (let row = firstDataRow; row <= lastDataRow; row += 1) {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })] as XLSX.CellObject | undefined;
      if (cell) cell.z = '"$"#,##0.00';
    }
  }
}

function setDateFormat(sheet: XLSX.WorkSheet, columns: number[], firstDataRow: number, lastDataRow: number) {
  for (const column of columns) {
    for (let row = firstDataRow; row <= lastDataRow; row += 1) {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })] as XLSX.CellObject | undefined;
      if (cell) cell.z = "yyyy-mm-dd hh:mm";
    }
  }
}

function configureSheet(sheet: XLSX.WorkSheet, columnWidths: number[], lastColumn: number) {
  sheet["!cols"] = columnWidths.map((wch) => ({ wch }));
  sheet["!autofilter"] = { ref: `A1:${XLSX.utils.encode_col(lastColumn)}1` };
  sheet["!freeze"] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft", state: "frozen" };
}

export function buildCatalogInventoryWorkbook(products: CatalogProduct[]) {
  const matrixRows = products.map((product) => [
    product.article,
    product.model,
    product.brand,
    product.color,
    product.sizesAvailable,
    product.brandPrice,
    product.price,
    inventoryStatus(product)
  ]);
  const matrixSheet = XLSX.utils.aoa_to_sheet([[...matrixHeaders], ...matrixRows], { cellDates: true });
  configureSheet(matrixSheet, [30, 32, 18, 18, 20, 14, 14, 12], matrixHeaders.length - 1);
  setCurrencyFormat(matrixSheet, [5, 6], 1, matrixRows.length);

  const detailRows = products.map((product) => [
    product.id,
    product.code,
    product.name,
    product.description,
    product.article,
    product.model,
    product.brand,
    product.category,
    product.type,
    product.color,
    product.gender,
    product.sizesAvailable,
    product.brandPrice,
    product.price,
    inventoryStatus(product),
    product.whatsappNumber,
    ...Array.from({ length: 8 }, (_, index) => product.imageUrls[index] ?? ""),
    product.createdAt,
    product.updatedAt
  ]);
  const detailSheet = XLSX.utils.aoa_to_sheet([[...detailHeaders], ...detailRows], { cellDates: true });
  configureSheet(
    detailSheet,
    [38, 14, 38, 54, 30, 32, 18, 16, 30, 18, 14, 20, 14, 14, 12, 18, 46, 46, 46, 46, 46, 46, 46, 46, 20, 20],
    detailHeaders.length - 1
  );
  setCurrencyFormat(detailSheet, [12, 13], 1, detailRows.length);
  setDateFormat(detailSheet, [24, 25], 1, detailRows.length);

  const workbook = XLSX.utils.book_new();
  workbook.Props = {
    Title: "Inventario actual Store MAY",
    Subject: "Matriz de precios y detalle completo de productos",
    Author: "Store MAY",
    Company: "Store MAY",
    CreatedDate: new Date()
  };
  XLSX.utils.book_append_sheet(workbook, matrixSheet, "Matriz actual");
  XLSX.utils.book_append_sheet(workbook, detailSheet, "Detalle plataforma");

  return XLSX.write(workbook, { type: "array", bookType: "xlsx", compression: true }) as ArrayBuffer;
}
