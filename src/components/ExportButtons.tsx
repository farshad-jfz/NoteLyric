"use client";

import type { ExportFormat } from "@/lib/app/types";

type Props = {
  title: string;
  musicXml: string;
  getSvg: () => string | undefined;
  defaultFormat?: ExportFormat;
  onSave?: () => void;
  onFavorite?: () => void;
  isSaved?: boolean;
  isFavorite?: boolean;
};

const download = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

const svgToPng = async (svg: string): Promise<Blob> => {
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Unable to rasterize score."));
    img.src = url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.width || 1600;
  canvas.height = img.height || 900;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable.");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed."))), "image/png");
  });
};

export default function ExportButtons({ title, musicXml, getSvg, defaultFormat = "png", onSave, onFavorite, isSaved, isFavorite }: Props) {
  const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, "_");

  const exportSvg = () => {
    const svg = getSvg();
    if (!svg) return;
    download(new Blob([svg], { type: "image/svg+xml" }), `${safeName}.svg`);
  };

  const exportPng = async () => {
    const svg = getSvg();
    if (!svg) return;
    const png = await svgToPng(svg);
    download(png, `${safeName}.png`);
  };

  const exportMusicXml = () => {
    download(new Blob([musicXml], { type: "application/xml" }), `${safeName}.musicxml`);
  };

  const quickExport = () => {
    if (defaultFormat === "svg") {
      exportSvg();
      return;
    }
    if (defaultFormat === "musicxml") {
      exportMusicXml();
      return;
    }
    if (defaultFormat === "pdf") {
      window.print();
      return;
    }
    void exportPng();
  };

  return (
    <div className="action-cluster">
      <button type="button" className="button button--primary" onClick={quickExport}>
        Quick export ({defaultFormat.toUpperCase()})
      </button>
      <button type="button" className="button button--ghost" onClick={exportSvg}>
        Export SVG
      </button>
      <button type="button" className="button button--ghost" onClick={() => void exportPng()}>
        Export PNG
      </button>
      <button type="button" className="button button--ghost" onClick={exportMusicXml}>
        Export MusicXML
      </button>
      <button type="button" className="button button--ghost" onClick={() => window.print()}>
        Print / PDF
      </button>
      {onSave ? (
        <button type="button" className={isSaved ? "button button--ghost is-selected" : "button button--ghost"} onClick={onSave}>
          {isSaved ? "Saved" : "Save to Library"}
        </button>
      ) : null}
      {onFavorite ? (
        <button type="button" className={isFavorite ? "button button--ghost is-selected" : "button button--ghost"} onClick={onFavorite}>
          {isFavorite ? "Favorited" : "Favorite"}
        </button>
      ) : null}
    </div>
  );
}
