const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";

const FALLBACK_WIDTH = 1600;
const FALLBACK_HEIGHT = 900;

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const parseNumeric = (value?: string | null): number | undefined => {
  if (!value) return undefined;
  const match = value.match(/-?\d+(\.\d+)?/);
  if (!match) return undefined;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const measureSvgSize = (svg: SVGSVGElement): { width: number; height: number } => {
  const viewBox = svg.viewBox?.baseVal;
  if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
    return { width: viewBox.width, height: viewBox.height };
  }

  const width = svg.width?.baseVal?.value || parseNumeric(svg.getAttribute("width"));
  const height = svg.height?.baseVal?.value || parseNumeric(svg.getAttribute("height"));
  if (width && height) {
    return { width, height };
  }

  const bounds = svg.getBoundingClientRect();
  if (bounds.width > 0 && bounds.height > 0) {
    return { width: bounds.width, height: bounds.height };
  }

  return { width: FALLBACK_WIDTH, height: FALLBACK_HEIGHT };
};

export const buildStandaloneScoreSvg = (container: HTMLElement): string | undefined => {
  const pages = Array.from(container.querySelectorAll("svg"));
  if (!pages.length) return undefined;

  const exportDocument = document.implementation.createDocument(SVG_NS, "svg", null);
  const root = exportDocument.documentElement;
  root.setAttribute("xmlns", SVG_NS);
  root.setAttribute("xmlns:xlink", XLINK_NS);
  root.setAttribute("version", "1.1");

  let totalHeight = 0;
  let maxWidth = 0;

  for (const page of pages) {
    const { width, height } = measureSvgSize(page);
    const clone = exportDocument.importNode(page.cloneNode(true), true) as SVGSVGElement;

    clone.setAttribute("x", "0");
    clone.setAttribute("y", String(totalHeight));
    clone.setAttribute("width", String(width));
    clone.setAttribute("height", String(height));
    clone.setAttribute("overflow", "visible");
    clone.removeAttribute("style");

    root.appendChild(clone);
    totalHeight += height;
    maxWidth = Math.max(maxWidth, width);
  }

  root.setAttribute("width", String(maxWidth || FALLBACK_WIDTH));
  root.setAttribute("height", String(totalHeight || FALLBACK_HEIGHT));
  root.setAttribute("viewBox", `0 0 ${maxWidth || FALLBACK_WIDTH} ${totalHeight || FALLBACK_HEIGHT}`);

  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(exportDocument)}`;
};

export const openPrintWindowForSvg = (svgMarkup: string, title: string): void => {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) {
    throw new Error("Unable to open a print window. Please allow pop-ups and try again.");
  }

  const printableTitle = escapeHtml(title || "Score export");
  const printableSvg = svgMarkup.replace(/<\?xml[^>]*>\s*/i, "");

  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${printableTitle}</title>
    <style>
      @page { margin: 12mm; }
      html, body {
        margin: 0;
        background: #ffffff;
      }
      body {
        padding: 0;
      }
      .print-sheet {
        display: flex;
        justify-content: center;
        align-items: flex-start;
      }
      .print-sheet svg {
        display: block;
        width: 100%;
        height: auto;
      }
    </style>
  </head>
  <body>
    <main class="print-sheet">${printableSvg}</main>
  </body>
</html>`);
  printWindow.document.close();

  const triggerPrint = () => {
    printWindow.focus();
    printWindow.print();
  };

  if (printWindow.document.readyState === "complete") {
    triggerPrint();
    return;
  }

  printWindow.onload = triggerPrint;
};
