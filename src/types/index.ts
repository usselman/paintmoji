export type Id = string;
export type Point = { x: number; y: number; pressure?: number };
export type Crop = { x: number; y: number; width: number; height: number };
export type BrushType =
  | "emoji"
  | "ascii"
  | "circle"
  | "square"
  | "triangle"
  | "star"
  | "round"
  | "eraser"
  | "custom";
export type BrushSettings = {
  type: BrushType;
  size: number;
  opacity: number;
  spacing: number;
  rotation: number;
  rotationJitter: number;
  positionJitter: number;
  scaleJitter: number;
  color: string;
  pressureSize: boolean;
  pressureOpacity: boolean;
  content: string;
  sequenceMode: "cycle" | "random" | "single";
  fontFamily: string;
  fontWeight: string;
  gridAlign: boolean;
  customBrushId?: Id;
};
export type Stamp = Point & {
  rotation: number;
  scale: number;
  sequenceIndex: number;
};
export type Stroke = { id: Id; brush: BrushSettings; stamps: Stamp[] };
export type LayerBase = {
  id: Id;
  name: string;
  visible: boolean;
  opacity: number;
};
export type DrawingLayer = LayerBase & {
  type: "drawing";
  strokes: Stroke[];
  fill?: string;
};
export type ImageAsset = {
  id: Id;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  dataUrl: string;
  width: number;
  height: number;
};
export type ImageLayer = LayerBase & {
  type: "image";
  asset: ImageAsset;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  crop: Crop;
};
export type Layer = DrawingLayer | ImageLayer;
export type PaintDocument = {
  schemaVersion: 1;
  id: Id;
  name: string;
  width: number;
  height: number;
  background: { mode: "transparent" | "solid"; color: string };
  layers: Layer[];
  selectedLayerId: Id;
  createdAt: string;
  modifiedAt: string;
};
export type BrushCommand = {
  tool: Exclude<BrushType, "custom">;
  x: number;
  y: number;
  size: number;
  color: string;
  content: string;
  rotation: number;
};
export type CustomBrushPreset = {
  schemaVersion: 1;
  id: Id;
  name: string;
  createdAt: string;
  modifiedAt: string;
  width: number;
  height: number;
  anchor: Point;
  spacing: number;
  defaultScale: number;
  defaultRotation: number;
  commands: BrushCommand[];
  thumbnail?: string;
  tags?: string[];
};
