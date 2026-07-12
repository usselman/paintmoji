import type { ImageLayer } from "../../types";
import { id } from "../document/model";
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);
export async function importImage(
  file: File,
  docWidth: number,
  docHeight: number,
): Promise<ImageLayer> {
  if (!ALLOWED.has(file.type))
    throw new Error("Use PNG, JPEG, or WebP images.");
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Image read failed."));
    r.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Image decode failed."));
    i.src = dataUrl;
  });
  if (image.width * image.height > 40_000_000)
    throw new Error("Image exceeds the 40 MP safety limit.");
  const scale = Math.min(1, docWidth / image.width, docHeight / image.height);
  return {
    id: id("layer"),
    type: "image",
    name: file.name.replace(/\.[^.]+$/, ""),
    visible: true,
    opacity: 1,
    asset: {
      id: id("asset"),
      mimeType: file.type as "image/png" | "image/jpeg" | "image/webp",
      dataUrl,
      width: image.width,
      height: image.height,
    },
    x: docWidth / 2,
    y: docHeight / 2,
    scaleX: scale,
    scaleY: scale,
    rotation: 0,
    crop: { x: 0, y: 0, width: image.width, height: image.height },
  };
}
