import type { CustomBrushPreset, PaintDocument } from "../../types";
import { composite, type ImageResolver } from "../rendering/compositor";
export function safeFilename(name: string, extension: string) {
  return `${
    name
      .trim()
      .replace(/[^a-z0-9-_]+/gi, "-")
      .replace(/^-|-$/g, "") || "paintmoji"
  }.${extension}`;
}
export async function exportPng(
  doc: PaintDocument,
  images: ImageResolver,
  brushes: CustomBrushPreset[] = [],
) {
  const canvas = document.createElement("canvas");
  canvas.width = doc.width;
  canvas.height = doc.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is unavailable.");
  composite(ctx, doc, images, brushes);
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("PNG encoding failed.")),
      "image/png",
    ),
  );
}
export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
