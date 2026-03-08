"use client";

type Props = {
  title: string;
  musicXml: string;
  getSvg: () => string | undefined;
};

const download = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
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
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG export failed."))), "image/png");
  });
};

export default function ExportButtons({ title, musicXml, getSvg }: Props) {
  const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, "_");

  return (
    <div className="button-row">
      <button
        type="button"
        onClick={() => {
          const svg = getSvg();
          if (!svg) return;
          download(new Blob([svg], { type: "image/svg+xml" }), `${safeName}.svg`);
        }}
      >
        Export SVG
      </button>
      <button
        type="button"
        onClick={async () => {
          const svg = getSvg();
          if (!svg) return;
          const png = await svgToPng(svg);
          download(png, `${safeName}.png`);
        }}
      >
        Export PNG
      </button>
      <button type="button" onClick={() => download(new Blob([musicXml], { type: "application/xml" }), `${safeName}.musicxml`)}>
        Export MusicXML
      </button>
      <button type="button" onClick={() => window.print()}>
        Print / PDF
      </button>
    </div>
  );
}
