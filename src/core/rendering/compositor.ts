import type {
  BrushSettings,
  CustomBrushPreset,
  ImageLayer,
  PaintDocument,
  Stamp,
} from "../../types";
import { asciiCharacter } from "../brushes/registry";
export type RenderLayer = {
  id: string;
  type: "drawing" | "image";
  opacity: number;
};
export const renderPlan = (doc: PaintDocument): RenderLayer[] =>
  doc.layers
    .filter((l) => l.visible && l.opacity > 0)
    .map(({ id, type, opacity }) => ({ id, type, opacity }));
export type ImageResolver = (
  layer: ImageLayer,
) => CanvasImageSource | undefined;
function star(ctx: CanvasRenderingContext2D, size: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5,
      r = i % 2 ? size * 0.23 : size * 0.5;
    const x = Math.cos(a) * r,
      y = Math.sin(a) * r;
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.closePath();
}
export function drawStamp(
  ctx: CanvasRenderingContext2D,
  brush: BrushSettings,
  stamp: Stamp,
  custom?: CustomBrushPreset,
) {
  const pressure = stamp.pressure ?? 1,
    size = brush.size * stamp.scale * (brush.pressureSize ? pressure : 1);
  ctx.save();
  ctx.translate(stamp.x, stamp.y);
  ctx.rotate(((brush.rotation + stamp.rotation) * Math.PI) / 180);
  ctx.globalAlpha *= brush.opacity * (brush.pressureOpacity ? pressure : 1);
  ctx.fillStyle = brush.color;
  ctx.strokeStyle = brush.color;
  if (brush.type === "eraser") ctx.globalCompositeOperation = "destination-out";
  if (brush.type === "emoji" || brush.type === "ascii") {
    ctx.font = `${brush.fontWeight} ${size}px ${brush.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      brush.type === "emoji"
        ? brush.content
        : asciiCharacter(
            brush.content,
            brush.sequenceMode,
            stamp.sequenceIndex,
          ),
      0,
      0,
    );
  } else if (
    brush.type === "square" ||
    brush.type === "round" ||
    brush.type === "circle"
  ) {
    if (brush.type === "square") ctx.fillRect(-size / 2, -size / 2, size, size);
    else {
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (brush.type === "triangle") {
    ctx.beginPath();
    ctx.moveTo(0, -size / 2);
    ctx.lineTo(size / 2, size / 2);
    ctx.lineTo(-size / 2, size / 2);
    ctx.closePath();
    ctx.fill();
  } else if (brush.type === "star") {
    star(ctx, size);
    ctx.fill();
  } else if (brush.type === "custom" && custom) {
    const sx = size / custom.width;
    ctx.scale(sx, sx);
    for (const c of custom.commands)
      drawStamp(
        ctx,
        {
          ...brush,
          type: c.tool,
          size: c.size,
          color: c.color,
          content: c.content,
        },
        {
          x: c.x - custom.anchor.x,
          y: c.y - custom.anchor.y,
          rotation: c.rotation,
          scale: 1,
          sequenceIndex: 0,
        },
      );
  }
  ctx.restore();
}
export function composite(
  ctx: CanvasRenderingContext2D,
  doc: PaintDocument,
  images: ImageResolver,
  customBrushes: CustomBrushPreset[] = [],
) {
  ctx.clearRect(0, 0, doc.width, doc.height);
  if (doc.background.mode === "solid") {
    ctx.fillStyle = doc.background.color;
    ctx.fillRect(0, 0, doc.width, doc.height);
  }
  for (const layer of doc.layers) {
    if (!layer.visible || layer.opacity <= 0) continue;
    ctx.save();
    ctx.globalAlpha = layer.opacity;
    if (layer.type === "drawing") {
      if (layer.fill) {
        ctx.fillStyle = layer.fill;
        ctx.fillRect(0, 0, doc.width, doc.height);
      }
      for (const stroke of layer.strokes)
        for (const stamp of stroke.stamps)
          drawStamp(
            ctx,
            stroke.brush,
            stamp,
            customBrushes.find((b) => b.id === stroke.brush.customBrushId),
          );
    } else {
      const image = images(layer);
      if (image) {
        const c = layer.crop;
        ctx.translate(layer.x, layer.y);
        ctx.rotate((layer.rotation * Math.PI) / 180);
        ctx.scale(layer.scaleX, layer.scaleY);
        ctx.drawImage(
          image,
          c.x,
          c.y,
          c.width,
          c.height,
          -c.width / 2,
          -c.height / 2,
          c.width,
          c.height,
        );
      }
    }
    ctx.restore();
  }
}
