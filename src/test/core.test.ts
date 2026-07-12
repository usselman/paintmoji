import { describe, expect, it, vi } from "vitest";
import {
  createDocument,
  createDrawingLayer,
  ensureWhiteCanvasLayer,
} from "../core/document/model";
import { deleteLayer, reorderLayer } from "../core/layers/layers";
import { renderPlan } from "../core/rendering/compositor";
import {
  clampCrop,
  documentToImageSource,
  viewportToDocument,
} from "../core/geometry/coordinates";
import {
  interpolateStamps,
  lineStamps,
  sampleStrokeSegment,
} from "../core/brushes/spacing";
import { asciiCharacter } from "../core/brushes/registry";
import { History } from "../core/history/history";
import {
  recoverPreferences,
  restoreProject,
  serializeProject,
  validateBrushPreset,
} from "../core/persistence/project";
describe("layers and export planning", () => {
  it("starts with a white canvas beneath the active drawing layer", () => {
    const d = createDocument();
    expect(d.layers).toHaveLength(2);
    expect(d.layers[0]).toMatchObject({
      type: "drawing",
      name: "Canvas / White",
      fill: "#ffffff",
    });
    expect(d.selectedLayerId).toBe(d.layers[1]!.id);
  });
  it("migrates older autosaves to include the white canvas", () => {
    const d = createDocument();
    d.layers = d.layers.filter(
      (layer) => !(layer.type === "drawing" && layer.fill),
    );
    const migrated = ensureWhiteCanvasLayer(d);
    expect(migrated.layers[0]).toMatchObject({
      name: "Canvas / White",
      fill: "#ffffff",
    });
    expect(ensureWhiteCanvasLayer(migrated)).toBe(migrated);
  });
  it("orders later layers above earlier layers", () => {
    const d = createDocument();
    const b = createDrawingLayer("top");
    d.layers.push(b);
    expect(renderPlan(d).map((x) => x.id)).toEqual([
      d.layers[0]!.id,
      d.layers[1]!.id,
      b.id,
    ]);
    expect(reorderLayer(d, b.id, -1).layers[1]!.id).toBe(b.id);
  });
  it("omits hidden layers and retains opacity", () => {
    const d = createDocument();
    d.layers.forEach((layer) => {
      layer.visible = false;
    });
    const b = createDrawingLayer();
    b.opacity = 0.4;
    d.layers.push(b);
    expect(renderPlan(d)).toEqual([
      { id: b.id, type: "drawing", opacity: 0.4 },
    ]);
  });
  it("protects the only drawing layer", () => {
    const d = createDocument();
    d.layers = [d.layers[1]!];
    d.selectedLayerId = d.layers[0]!.id;
    expect(deleteLayer(d, d.layers[0]!.id)).toBe(d);
  });
});
describe("geometry", () => {
  it("clamps crops", () =>
    expect(clampCrop({ x: -3, y: 8, width: 20, height: 20 }, 10, 10)).toEqual({
      x: 0,
      y: 8,
      width: 10,
      height: 2,
    }));
  it("converts viewport coordinates", () =>
    expect(
      viewportToDocument({ x: 30, y: 50 }, { left: 10, top: 10 }, 2, {
        x: 4,
        y: 6,
      }),
    ).toEqual({ x: 8, y: 17 }));
  it("inverts image transform", () => {
    const p = documentToImageSource(
      { x: 10, y: 12 },
      { x: 10, y: 10, scaleX: 2, scaleY: 2, rotation: 0 },
    );
    expect(p).toEqual({ x: 0, y: 1 });
  });
});
describe("brushes", () => {
  it("interpolates spacing", () =>
    expect(interpolateStamps({ x: 0, y: 0 }, { x: 10, y: 0 }, 2)).toHaveLength(
      5,
    ));
  it("preserves sub-spacing movement", () =>
    expect(sampleStrokeSegment({ x: 0, y: 0 }, { x: 0.2, y: 0.1 }, 20)).toEqual(
      [{ x: 0.2, y: 0.1, rotation: 0, scale: 1, sequenceIndex: 0 }],
    ));
  it("creates endpoint-inclusive brush lines", () => {
    const stamps = lineStamps({ x: 0, y: 0 }, { x: 10, y: 0 }, 4);
    expect(stamps).toHaveLength(4);
    expect(stamps[0]?.x).toBe(0);
    expect(stamps[1]?.x).toBeCloseTo(10 / 3);
    expect(stamps.at(-1)?.x).toBe(10);
  });
  it("cycles Unicode code points", () => {
    expect(asciiCharacter("A🌺B", "cycle", 1)).toBe("🌺");
    expect(asciiCharacter("XYZ", "random", 0, () => 0.5)).toBe("Y");
  });
  it("validates custom presets", () =>
    expect(
      validateBrushPreset({
        schemaVersion: 1,
        id: "b",
        name: "B",
        width: 8,
        height: 8,
        commands: [],
      }),
    ).toBe(true));
});
describe("history and persistence", () => {
  it("undoes and redoes", () => {
    const h = new History<number>();
    h.push({ label: "n", before: 1, after: 2 });
    expect(h.undo(2)).toBe(1);
    expect(h.redo(1)).toBe(2);
  });
  it("round trips projects", () => {
    const d = createDocument();
    expect(restoreProject(serializeProject(d)).id).toBe(d.id);
  });
  it("recovers malformed preferences", () =>
    expect(recoverPreferences({ getItem: vi.fn(() => "{") }, "x")).toEqual({}));
  it("rejects malformed projects", () =>
    expect(() => restoreProject("{}")).toThrow());
});
