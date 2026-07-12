import type { DrawingLayer, PaintDocument } from "../../types";
export const LIMITS = {
  maxDimension: 8192,
  maxMegapixels: 32,
  maxLayers: 64,
  maxHistory: 80,
  maxBrushDimension: 64,
  maxBrushPresets: 128,
} as const;
export const id = (prefix = "id") => `${prefix}-${crypto.randomUUID()}`;
export function createDrawingLayer(name = "Drawing 01"): DrawingLayer {
  return {
    id: id("layer"),
    type: "drawing",
    name,
    visible: true,
    opacity: 1,
    strokes: [],
  };
}
export function createDocument(width = 1024, height = 768): PaintDocument {
  const canvasLayer: DrawingLayer = {
    ...createDrawingLayer("Canvas / White"),
    fill: "#ffffff",
  };
  const layer = createDrawingLayer();
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: id("doc"),
    name: "Untitled Composition",
    width,
    height,
    background: { mode: "transparent", color: "#ffffff" },
    layers: [canvasLayer, layer],
    selectedLayerId: layer.id,
    createdAt: now,
    modifiedAt: now,
  };
}
export function ensureWhiteCanvasLayer(doc: PaintDocument): PaintDocument {
  if (
    doc.layers.some(
      (layer) => layer.type === "drawing" && layer.fill === "#ffffff",
    )
  ) {
    return doc;
  }
  const canvasLayer: DrawingLayer = {
    ...createDrawingLayer("Canvas / White"),
    fill: "#ffffff",
  };
  return {
    ...doc,
    layers: [canvasLayer, ...doc.layers],
    modifiedAt: new Date().toISOString(),
  };
}
export const selectedLayer = (doc: PaintDocument) =>
  doc.layers.find((layer) => layer.id === doc.selectedLayerId);
export function touch(doc: PaintDocument): PaintDocument {
  return { ...doc, modifiedAt: new Date().toISOString() };
}
