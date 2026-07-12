import type { Crop, Point } from "../../types";
export function viewportToDocument(
  point: Point,
  rect: Pick<DOMRect, "left" | "top">,
  zoom: number,
  pan: Point,
): Point {
  return {
    x: (point.x - rect.left - pan.x) / zoom,
    y: (point.y - rect.top - pan.y) / zoom,
  };
}
export function documentToImageSource(
  point: Point,
  layer: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
  },
): Point {
  const dx = point.x - layer.x,
    dy = point.y - layer.y,
    a = (-layer.rotation * Math.PI) / 180;
  return {
    x: (dx * Math.cos(a) - dy * Math.sin(a)) / layer.scaleX,
    y: (dx * Math.sin(a) + dy * Math.cos(a)) / layer.scaleY,
  };
}
export function clampCrop(crop: Crop, width: number, height: number): Crop {
  const x = Math.max(0, Math.min(width, crop.x));
  const y = Math.max(0, Math.min(height, crop.y));
  return {
    x,
    y,
    width: Math.max(0, Math.min(width - x, crop.width)),
    height: Math.max(0, Math.min(height - y, crop.height)),
  };
}
