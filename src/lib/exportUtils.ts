import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { Expense, Payment, Product, Sale } from "./types";

const currencyFormatter = (value: number) => {
  const currency = localStorage.getItem("jcb-currency") || "ARS";
  return new Intl.NumberFormat(currency === "USD" ? "es-US" : "es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "USD" ? 2 : 0,
  }).format(value);
};

const formatDate = (v: string) => {
  if (!v) return "";
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(v.length === 10 ? v + "T12:00:00-03:00" : v));
};

let cachedBrandMark: string | null = null;
async function loadBrandMark(): Promise<string | null> {
  if (cachedBrandMark) return cachedBrandMark;
  try {
    const res = await fetch("/brand/jb-mark.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        cachedBrandMark = String(reader.result);
        resolve(cachedBrandMark);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function applyDocumentHeaderAndWatermark(doc: jsPDF, mark: string | null, title: string, subtitle: string) {
  const totalPages = doc.getNumberOfPages();
  const brandColor: [number, number, number] = [139, 44, 245]; // #8b2cf5

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Header bar on first page
    if (i === 1) {
      doc.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
      doc.rect(0, 0, 210, 32, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(title, 14, 16);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(subtitle, 14, 24);
      doc.text(`Generado el: ${formatDate(new Date().toISOString())}`, 145, 24);
    }

    // Watermark
    if (mark) {
      doc.saveGraphicsState();
      doc.setGState(new (doc as any).GState({ opacity: 0.06 }));
      doc.addImage(mark, "PNG", 55, 90, 100, 100, "watermark", "FAST");
      doc.restoreGraphicsState();
    }

    // Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text("JCB Developement — Gestión Financiera", 14, 287);
    doc.text(`Página ${i} de ${totalPages}`, 196, 287, { align: "right" });
  }
}

export interface FinancialExportData {
  sales: Sale[];
  products: Product[];
  expenses: Expense[];
  payments: Payment[];
  totals: {
    revenue: number;
    cost: number;
    expense: number;
    gross: number;
    net: number;
    margin: number;
  };
  periodLabel: string;
}

/**
 * Generates a complete, beautiful multi-section PDF report
 */
export async function exportFinancialPDF(data: FinancialExportData) {
  const brandMark = await loadBrandMark();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setProperties({
    title: `Reporte Financiero - ${data.periodLabel}`,
    author: "JCB Developement",
    subject: "Resumen de ventas, productos y gastos",
  });

  const { totals, sales, products, expenses, periodLabel } = data;

  // --- KPI Cards Section ---
  const startY = 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text(`Resumen General (${periodLabel})`, 14, startY);

  const cardWidth = 42;
  const cardHeight = 20;
  const gap = 4;
  const kpis = [
    { label: "Ventas Totales", val: currencyFormatter(totals.revenue), color: [139, 44, 245] },
    { label: "Costos de Venta", val: currencyFormatter(totals.cost), color: [100, 116, 139] },
    { label: "Gastos Operativos", val: currencyFormatter(totals.expense), color: [225, 29, 72] },
    { label: "Ganancia Neta", val: currencyFormatter(totals.net), color: [16, 185, 129] },
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (cardWidth + gap);
    const y = startY + 4;

    doc.setFillColor(248, 246, 252);
    doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text(kpi.label, x + 3, y + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, x + 3, y + 14);
  });

  let currentY = startY + cardHeight + 12;

  // --- Table 1: Indicadores Financieros ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text("1. Métricas Financieras Principales", 14, currentY);

  autoTable(doc, {
    startY: currentY + 3,
    head: [["Indicador", "Monto / Valor", "Porcentaje de Ventas"]],
    body: [
      ["Ingresos por Ventas", currencyFormatter(totals.revenue), "100.0%"],
      ["Costo Directo de Mercadería", currencyFormatter(totals.cost), totals.revenue ? `${((totals.cost / totals.revenue) * 100).toFixed(1)}%` : "0%"],
      ["Ganancia Bruta", currencyFormatter(totals.gross), totals.revenue ? `${((totals.gross / totals.revenue) * 100).toFixed(1)}%` : "0%"],
      ["Gastos de Operación", currencyFormatter(totals.expense), totals.revenue ? `${((totals.expense / totals.revenue) * 100).toFixed(1)}%` : "0%"],
      ["Ganancia Neta Final", currencyFormatter(totals.net), `${totals.margin.toFixed(1)}%`],
    ],
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 3.5 },
    headStyles: { fillColor: [139, 44, 245], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 248, 255] },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // --- Table 2: Desglose de Ventas (Máximo 25 más recientes) ---
  if (sales.length > 0) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(`2. Detalle de Ventas (${sales.length} registros)`, 14, currentY);

    const salesRows = sales.slice(0, 25).map((s) => [
      formatDate(s.sold_at),
      s.sale_items?.map((i) => `${i.quantity}x ${i.products?.name || "Prod"}`).join(", ") || "Venta",
      s.payment_method || "N/A",
      s.status === "completed" ? "Completada" : s.status,
      currencyFormatter(Number(s.total)),
      currencyFormatter(Number(s.profit)),
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [["Fecha", "Productos", "Método", "Estado", "Total", "Ganancia"]],
      body: salesRows,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
      columnStyles: {
        4: { fontStyle: "bold", halign: "right" },
        5: { fontStyle: "bold", textColor: [16, 185, 129], halign: "right" },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // --- Table 3: Catálogo de Productos y Precios ---
  if (products.length > 0) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(`3. Resumen de Catálogo de Productos (${products.length} ítems)`, 14, currentY);

    const prodRows = products.slice(0, 25).map((p) => {
      const margin = p.sale_price ? (((p.sale_price - p.cost_price) / p.sale_price) * 100).toFixed(1) + "%" : "0%";
      return [
        p.name,
        p.category || "Sin categoría",
        currencyFormatter(p.sale_price),
        currencyFormatter(p.cost_price),
        currencyFormatter(p.sale_price - p.cost_price),
        margin,
      ];
    });

    autoTable(doc, {
      startY: currentY + 3,
      head: [["Producto", "Categoría", "Precio Venta", "Costo", "Ganancia U.", "Margen %"]],
      body: prodRows,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255] },
      columnStyles: {
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right", fontStyle: "bold", textColor: [16, 185, 129] },
        5: { halign: "right" },
      },
    });
  }

  applyDocumentHeaderAndWatermark(
    doc,
    brandMark,
    "REPORTE FINANCIERO Y OPERATIVO",
    `Período: ${data.periodLabel} | JCB Developement`
  );

  doc.save(`reporte-financiero-${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Generates a full multi-sheet Excel file (.xlsx)
 */
export function exportFinancialExcel(data: FinancialExportData) {
  const wb = XLSX.utils.book_new();
  const { totals, sales, products, expenses, payments, periodLabel } = data;

  // --- Sheet 1: Resumen General ---
  const summaryData = [
    ["REPORTE FINANCIERO - JCB DEVELOPEMENT"],
    [`Período de análisis: ${periodLabel}`],
    [`Fecha de generación: ${formatDate(new Date().toISOString())}`],
    [],
    ["MÉTRICA", "VALOR (ARS/USD)", "% SOBRE VENTAS"],
    ["Ventas Totales (Ingresos)", totals.revenue, 1],
    ["Costo Directo de Ventas", totals.cost, totals.revenue ? totals.cost / totals.revenue : 0],
    ["Ganancia Bruta", totals.gross, totals.revenue ? totals.gross / totals.revenue : 0],
    ["Gastos Operativos", totals.expense, totals.revenue ? totals.expense / totals.revenue : 0],
    ["Ganancia Neta Final", totals.net, totals.margin / 100],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen General");

  // --- Sheet 2: Ventas ---
  const salesHeaders = ["ID", "Fecha", "Productos Vendidos", "Método de Pago", "Estado", "Total Venta", "Costo Total", "Ganancia"];
  const salesRows = sales.map((s) => [
    s.id,
    formatDate(s.sold_at),
    s.sale_items?.map((i) => `${i.quantity}x ${i.products?.name || "Producto"}`).join("; ") || "Venta",
    s.payment_method,
    s.status,
    Number(s.total),
    Number(s.total_cost),
    Number(s.profit),
  ]);
  const wsSales = XLSX.utils.aoa_to_sheet([salesHeaders, ...salesRows]);
  wsSales["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 45 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsSales, "Ventas");

  // --- Sheet 3: Productos ---
  const prodHeaders = ["ID", "Nombre de Producto", "Categoría", "Precio de Venta", "Costo de Compra", "Ganancia Unit.", "Margen %", "Precios por Escala"];
  const prodRows = products.map((p) => [
    p.id,
    p.name,
    p.category || "Sin categoría",
    p.sale_price,
    p.cost_price,
    p.sale_price - p.cost_price,
    p.sale_price ? (p.sale_price - p.cost_price) / p.sale_price : 0,
    p.tier_prices?.map((t) => `>=${t.minQty}: $${t.unitPrice}`).join(" | ") || "Único",
  ]);
  const wsProducts = XLSX.utils.aoa_to_sheet([prodHeaders, ...prodRows]);
  wsProducts["!cols"] = [{ wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsProducts, "Productos");

  // --- Sheet 4: Gastos ---
  const expHeaders = ["ID", "Nombre de Gasto", "Categoría", "Fecha", "Monto", "Descripción"];
  const expRows = expenses.map((e) => [
    e.id,
    e.name,
    e.category,
    formatDate(e.expense_date),
    Number(e.amount),
    e.description || "",
  ]);
  const wsExpenses = XLSX.utils.aoa_to_sheet([expHeaders, ...expRows]);
  wsExpenses["!cols"] = [{ wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsExpenses, "Gastos");

  // --- Sheet 5: Pagos ---
  const payHeaders = ["ID", "Concepto", "Método", "Fecha", "Monto", "Estado", "Notas"];
  const payRows = payments.map((p) => [
    p.id,
    p.concept,
    p.payment_method,
    formatDate(p.payment_date),
    Number(p.amount),
    p.status,
    p.notes || "",
  ]);
  const wsPayments = XLSX.utils.aoa_to_sheet([payHeaders, ...payRows]);
  wsPayments["!cols"] = [{ wch: 15 }, { wch: 25 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsPayments, "Pagos");

  // Write Excel file
  XLSX.writeFile(wb, `dashboard-financiero-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Single table PDF export helper
 */
export async function exportTablePDF(title: string, headers: string[], rows: (string | number)[][], fileName: string) {
  const brandMark = await loadBrandMark();
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  autoTable(doc, {
    startY: 38,
    head: [headers],
    body: rows.map((r) => r.map((cell) => String(cell))),
    theme: "striped",
    styles: { fontSize: 8.5, cellPadding: 3.5 },
    headStyles: { fillColor: [139, 44, 245], textColor: [255, 255, 255] },
  });

  applyDocumentHeaderAndWatermark(
    doc,
    brandMark,
    title.toUpperCase(),
    `Exportación de datos | JCB Developement`
  );

  doc.save(`${fileName}.pdf`);
}

/**
 * Single table Excel export helper
 */
export function exportTableExcel(sheetName: string, headers: string[], rows: (string | number)[][], fileName: string) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}
