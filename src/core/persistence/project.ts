import type { CustomBrushPreset, PaintDocument } from "../../types";
export function validateProject(value: unknown): value is PaintDocument {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<PaintDocument>;
  return (
    v.schemaVersion === 1 &&
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    Number.isInteger(v.width) &&
    Number.isInteger(v.height) &&
    v.width! > 0 &&
    v.height! > 0 &&
    v.width! * v.height! <= 32_000_000 &&
    Array.isArray(v.layers) &&
    v.layers.length > 0 &&
    v.layers.length <= 64 &&
    v.layers.every(
      (l) =>
        l &&
        typeof l.id === "string" &&
        (l.type === "drawing" || l.type === "image") &&
        typeof l.visible === "boolean" &&
        typeof l.opacity === "number",
    ) &&
    typeof v.selectedLayerId === "string"
  );
}
export function serializeProject(doc: PaintDocument) {
  return JSON.stringify(doc);
}
export function restoreProject(text: string) {
  const value: unknown = JSON.parse(text);
  if (!validateProject(value))
    throw new Error("Unsupported or malformed Paintmoji project.");
  return value;
}
export function validateBrushPreset(
  value: unknown,
): value is CustomBrushPreset {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<CustomBrushPreset>;
  return (
    v.schemaVersion === 1 &&
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    Number.isInteger(v.width) &&
    Number.isInteger(v.height) &&
    v.width! > 0 &&
    v.height! > 0 &&
    v.width! <= 64 &&
    v.height! <= 64 &&
    Array.isArray(v.commands) &&
    v.commands.length <= 4096 &&
    v.commands.every(
      (c) =>
        c &&
        typeof c.x === "number" &&
        typeof c.y === "number" &&
        typeof c.content === "string",
    )
  );
}
export function recoverPreferences(
  storage: Pick<Storage, "getItem">,
  key: string,
) {
  try {
    const value: unknown = JSON.parse(storage.getItem(key) ?? "null");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}
