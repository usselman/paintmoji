import type { Point, Stamp } from "../../types";
export function interpolateStamps(
  from: Point,
  to: Point,
  spacing: number,
  startIndex = 0,
): Stamp[] {
  const dx = to.x - from.x,
    dy = to.y - from.y,
    distance = Math.hypot(dx, dy);
  if (!distance) return [];
  const count = Math.floor(distance / Math.max(0.5, spacing));
  return Array.from({ length: count }, (_, i) => {
    const t = ((i + 1) * spacing) / distance;
    return {
      x: from.x + dx * t,
      y: from.y + dy * t,
      pressure:
        (from.pressure ?? 1) + ((to.pressure ?? 1) - (from.pressure ?? 1)) * t,
      rotation: 0,
      scale: 1,
      sequenceIndex: startIndex + i,
    };
  });
}

const stampAt = (point: Point, sequenceIndex: number): Stamp => ({
  ...point,
  rotation: 0,
  scale: 1,
  sequenceIndex,
});

/** Preserve tiny pointer movements while filling larger gaps at the requested spacing. */
export function sampleStrokeSegment(
  from: Point,
  to: Point,
  spacing: number,
  startIndex = 0,
): Stamp[] {
  const interpolated = interpolateStamps(from, to, spacing, startIndex);
  const last = interpolated.at(-1);
  if (!last || Math.hypot(last.x - to.x, last.y - to.y) > 0.01)
    interpolated.push(stampAt(to, startIndex + interpolated.length));
  return interpolated;
}

/** Generate a deterministic endpoint-inclusive line using the active brush spacing. */
export function lineStamps(from: Point, to: Point, spacing: number): Stamp[] {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  if (distance === 0) return [stampAt(from, 0)];
  const steps = Math.max(1, Math.ceil(distance / Math.max(0.5, spacing)));
  return Array.from({ length: steps + 1 }, (_, index) => {
    const t = index / steps;
    return stampAt(
      {
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t,
        pressure:
          (from.pressure ?? 1) +
          ((to.pressure ?? 1) - (from.pressure ?? 1)) * t,
      },
      index,
    );
  });
}
