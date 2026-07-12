import type { Layer, PaintDocument } from "../../types";
import { createDrawingLayer, id, touch } from "../document/model";
const update = (
  doc: PaintDocument,
  layers: Layer[],
  selectedLayerId = doc.selectedLayerId,
) => touch({ ...doc, layers, selectedLayerId });
export function addDrawingLayer(doc: PaintDocument) {
  const layer = createDrawingLayer(
    `Drawing ${String(doc.layers.length + 1).padStart(2, "0")}`,
  );
  return update(doc, [...doc.layers, layer], layer.id);
}
export function patchLayer(
  doc: PaintDocument,
  layerId: string,
  patch: Partial<Layer>,
) {
  return update(
    doc,
    doc.layers.map((layer) =>
      layer.id === layerId ? ({ ...layer, ...patch } as Layer) : layer,
    ),
  );
}
export function reorderLayer(
  doc: PaintDocument,
  layerId: string,
  delta: -1 | 1,
) {
  const from = doc.layers.findIndex((l) => l.id === layerId);
  const to = Math.max(0, Math.min(doc.layers.length - 1, from + delta));
  if (from < 0 || from === to) return doc;
  const layers = [...doc.layers];
  const [layer] = layers.splice(from, 1);
  if (layer) layers.splice(to, 0, layer);
  return update(doc, layers);
}
export function duplicateLayer(doc: PaintDocument, layerId: string) {
  const at = doc.layers.findIndex((l) => l.id === layerId);
  if (at < 0) return doc;
  const copy = structuredClone(doc.layers[at]!);
  copy.id = id("layer");
  copy.name += " copy";
  const layers = [...doc.layers];
  layers.splice(at + 1, 0, copy);
  return update(doc, layers, copy.id);
}
export function clearLayer(doc: PaintDocument, layerId: string) {
  const layer = doc.layers.find((l) => l.id === layerId);
  return layer?.type === "drawing"
    ? patchLayer(doc, layerId, { strokes: [] })
    : doc;
}
export function deleteLayer(doc: PaintDocument, layerId: string) {
  const layer = doc.layers.find((l) => l.id === layerId);
  if (
    !layer ||
    (layer.type === "drawing" &&
      doc.layers.filter((l) => l.type === "drawing").length === 1)
  )
    return doc;
  const layers = doc.layers.filter((l) => l.id !== layerId);
  return update(
    doc,
    layers,
    layers[
      Math.max(0, Math.min(layers.length - 1, doc.layers.indexOf(layer) - 1))
    ]!.id,
  );
}
