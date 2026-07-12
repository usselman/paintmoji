import type { BrushSettings, BrushType } from "../../types";
import { asciiGroups, emojiGroups } from "./symbols";
export type ParamMeta = {
  key: keyof BrushSettings;
  label: string;
  type: "range" | "color" | "text" | "checkbox" | "select";
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
};
export type BrushDefinition = {
  type: BrushType;
  name: string;
  category: string;
  icon: string;
  defaults: Partial<BrushSettings>;
  params: ParamMeta[];
};
const shared: ParamMeta[] = [
  { key: "size", label: "Size", type: "range", min: 1, max: 256, step: 1 },
  {
    key: "opacity",
    label: "Opacity",
    type: "range",
    min: 0.01,
    max: 1,
    step: 0.01,
  },
  {
    key: "spacing",
    label: "Spacing",
    type: "range",
    min: 1,
    max: 200,
    step: 1,
  },
  { key: "color", label: "Color", type: "color" },
  { key: "pressureSize", label: "Pressure / size", type: "checkbox" },
  { key: "pressureOpacity", label: "Pressure / opacity", type: "checkbox" },
];
const def = (
  type: BrushType,
  name: string,
  icon: string,
  extra: ParamMeta[] = [],
): BrushDefinition => ({
  type,
  name,
  icon,
  category:
    type === "eraser" ? "Utility" : type === "custom" ? "Archive" : "Symbolic",
  defaults: {},
  params: [...shared, ...extra],
});
export const brushRegistry: Record<BrushType, BrushDefinition> = {
  emoji: def("emoji", "Emoji", "🌺", [
    {
      key: "content",
      label: "Emoji library",
      type: "select",
      options: Object.values(emojiGroups).flat(),
    },
  ]),
  ascii: def("ascii", "ASCII", "A", [
    {
      key: "content",
      label: "ASCII library",
      type: "select",
      options: Object.values(asciiGroups).flat(),
    },
    {
      key: "sequenceMode",
      label: "Sequence",
      type: "select",
      options: ["cycle", "random", "single"],
    },
    {
      key: "fontFamily",
      label: "Font",
      type: "select",
      options: ["ui-monospace", "monospace", "Arial", "Georgia"],
    },
  ]),
  circle: def("circle", "Circle", "●"),
  square: def("square", "Square", "■"),
  triangle: def("triangle", "Triangle", "▲"),
  star: def("star", "Star", "★"),
  round: def("round", "Solid round", "⬤"),
  eraser: def("eraser", "Eraser", "⌫"),
  custom: def("custom", "Custom stamp", "◇"),
};
export const defaultBrush: BrushSettings = {
  type: "emoji",
  size: 42,
  opacity: 1,
  spacing: 24,
  rotation: 0,
  rotationJitter: 0,
  positionJitter: 0,
  scaleJitter: 0,
  color: "#111111",
  pressureSize: true,
  pressureOpacity: false,
  content: "🌺",
  sequenceMode: "cycle",
  fontFamily: "ui-monospace",
  fontWeight: "700",
  gridAlign: false,
};
export function asciiCharacter(
  content: string,
  mode: BrushSettings["sequenceMode"],
  index: number,
  random = Math.random,
): string {
  const chars = Array.from(content || "A");
  if (mode === "single") return chars[0] ?? "A";
  return mode === "random"
    ? chars[Math.floor(random() * chars.length)]!
    : chars[index % chars.length]!;
}
