import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  Eye,
  EyeOff,
  FileImage,
  Grid3X3,
  Layers,
  Minus,
  Move,
  Plus,
  Redo2,
  Save,
  Undo2,
  Upload,
} from "lucide-react";
import type {
  BrushSettings,
  CustomBrushPreset,
  ImageLayer,
  PaintDocument,
  Point,
  Stroke,
} from "../types";
import { defaultBrush, brushRegistry } from "../core/brushes/registry";
import { lineStamps, sampleStrokeSegment } from "../core/brushes/spacing";
import {
  createDocument,
  ensureWhiteCanvasLayer,
  id,
  selectedLayer,
} from "../core/document/model";
import {
  addDrawingLayer,
  clearLayer,
  deleteLayer,
  duplicateLayer,
  patchLayer,
  reorderLayer,
} from "../core/layers/layers";
import { History } from "../core/history/history";
import { composite } from "../core/rendering/compositor";
import { download, exportPng, safeFilename } from "../core/export/export";
import { importImage } from "../core/import/images";
import {
  restoreProject,
  serializeProject,
  validateBrushPreset,
  validateProject,
} from "../core/persistence/project";
import {
  loadAutosave,
  loadBrushes,
  saveAutosave,
  saveBrushes,
} from "../core/persistence/db";
import { BrushStudio } from "../components/BrushStudio";
type Status =
  "READY" | "DRAWING" | "IMPORTING" | "EXPORTING" | "SAVING" | "ERROR";
type ToolMode = "freehand" | "line" | "move-image";
const history = new History<PaintDocument>(80);
export function App() {
  const [doc, setDoc] = useState(createDocument),
    [brush, setBrush] = useState<BrushSettings>(() => ({ ...defaultBrush })),
    [toolMode, setToolMode] = useState<ToolMode>("freehand"),
    [zoom, setZoom] = useState(1),
    [pan, setPan] = useState<Point>({ x: 0, y: 0 }),
    [grid, setGrid] = useState(false),
    [status, setStatus] = useState<Status>("READY"),
    [message, setMessage] = useState("Instrument initialized."),
    [pointer, setPointer] = useState<Point>({ x: 0, y: 0 }),
    [brushes, setBrushes] = useState<CustomBrushPreset[]>([]),
    [studio, setStudio] = useState<CustomBrushPreset | null | false>(false),
    [, refresh] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null),
    viewportRef = useRef<HTMLDivElement>(null),
    strokeRef = useRef<Stroke | undefined>(undefined),
    lastRef = useRef<Point | undefined>(undefined),
    startRef = useRef<Point | undefined>(undefined),
    beforeGestureRef = useRef<PaintDocument | undefined>(undefined),
    imageDragRef = useRef<
      { layerId: string; pointer: Point; x: number; y: number } | undefined
    >(undefined),
    holdRafRef = useRef(0),
    panRef = useRef<{ start: Point; origin: Point } | undefined>(undefined),
    keysRef = useRef({ space: false }),
    imageCache = useRef(new Map<string, HTMLImageElement>()),
    raf = useRef(0),
    importRef = useRef<HTMLInputElement>(null),
    projectRef = useRef<HTMLInputElement>(null),
    brushImportRef = useRef<HTMLInputElement>(null);
  const active = selectedLayer(doc),
    hs = history.status;
  // Image decode completion schedules the current renderer; the callback is intentionally stable for cache identity.
  const resolveImage = useCallback((layer: ImageLayer) => {
    let image = imageCache.current.get(layer.asset.id);
    if (!image) {
      image = new Image();
      image.onload = () => schedule();
      image.src = layer.asset.dataUrl;
      imageCache.current.set(layer.asset.id, image);
    }
    return image.complete ? image : undefined;
    // Image decode completion calls the current scheduling closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = doc.width * dpr;
    canvas.height = doc.height * dpr;
    canvas.style.width = `${doc.width * zoom}px`;
    canvas.style.height = `${doc.height * zoom}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    composite(ctx, doc, resolveImage, brushes);
  }, [doc, zoom, resolveImage, brushes]);
  const schedule = useCallback(() => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(render);
  }, [render]);
  useEffect(schedule, [schedule]);
  useEffect(() => {
    void loadBrushes()
      .then((v) => {
        if (v?.every(validateBrushPreset)) setBrushes(v);
      })
      .catch(() => setMessage("Brush archive reset after invalid storage."));
    void loadAutosave()
      .then((v) => {
        if (validateProject(v)) setDoc(ensureWhiteCanvasLayer(v));
      })
      .catch(() => setMessage("Autosave unavailable; fresh document loaded."));
  }, []);
  useEffect(() => {
    const t = setTimeout(
      () => void saveAutosave(doc).catch(() => undefined),
      700,
    );
    return () => clearTimeout(t);
  }, [doc]);
  const change = useCallback(
    (next: PaintDocument, label: string) => {
      if (next === doc) return;
      history.push({ before: doc, after: next, label });
      setDoc(next);
      refresh((x) => x + 1);
    },
    [doc],
  );
  const undo = useCallback(() => {
      setDoc((d) => history.undo(d));
      refresh((x) => x + 1);
    }, []),
    redo = useCallback(() => {
      setDoc((d) => history.redo(d));
      refresh((x) => x + 1);
    }, []);
  const point = (e: React.PointerEvent): Point => {
    const r = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / zoom,
      y: (e.clientY - r.top) / zoom,
      pressure: e.pressure || 1,
    };
  };
  const showStroke = useCallback(
    (stroke: Stroke) =>
      setDoc((current) => ({
        ...current,
        layers: current.layers.map((layer) =>
          layer.id === current.selectedLayerId && layer.type === "drawing"
            ? {
                ...layer,
                strokes: [
                  ...layer.strokes.filter((item) => item.id !== stroke.id),
                  stroke,
                ],
              }
            : layer,
        ),
      })),
    [],
  );
  const startHeldStamping = useCallback(() => {
    let previous = 0;
    const tick = (time: number) => {
      const stroke = strokeRef.current,
        cursor = lastRef.current;
      if (!stroke || !cursor || toolMode !== "freehand") return;
      if (time - previous >= 16) {
        stroke.stamps.push({
          ...cursor,
          rotation: 0,
          scale: 1,
          sequenceIndex: stroke.stamps.length,
        });
        showStroke(stroke);
        previous = time;
      }
      holdRafRef.current = requestAnimationFrame(tick);
    };
    holdRafRef.current = requestAnimationFrame(tick);
  }, [showStroke, toolMode]);
  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (keysRef.current.space) {
      panRef.current = { start: { x: e.clientX, y: e.clientY }, origin: pan };
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    const p = point(e);
    beforeGestureRef.current = doc;
    if (active?.type === "image" && toolMode === "move-image") {
      imageDragRef.current = {
        layerId: active.id,
        pointer: p,
        x: active.x,
        y: active.y,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
      setStatus("DRAWING");
      return;
    }
    if (active?.type !== "drawing") {
      setMessage(
        "Select a drawing layer, or choose Move image for an image layer.",
      );
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = p;
    lastRef.current = p;
    strokeRef.current = {
      id: id("stroke"),
      brush: { ...brush },
      stamps: [{ ...p, rotation: 0, scale: 1, sequenceIndex: 0 }],
    };
    showStroke(strokeRef.current);
    if (toolMode === "freehand") startHeldStamping();
    setStatus("DRAWING");
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (panRef.current) {
      setPan({
        x: panRef.current.origin.x + e.clientX - panRef.current.start.x,
        y: panRef.current.origin.y + e.clientY - panRef.current.start.y,
      });
      return;
    }
    const p = point(e);
    setPointer(p);
    const imageDrag = imageDragRef.current;
    if (imageDrag) {
      setDoc((current) =>
        patchLayer(current, imageDrag.layerId, {
          x: imageDrag.x + p.x - imageDrag.pointer.x,
          y: imageDrag.y + p.y - imageDrag.pointer.y,
        }),
      );
      return;
    }
    const stroke = strokeRef.current,
      last = lastRef.current,
      start = startRef.current;
    if (!stroke || !last || !start) return;
    const spacing = Math.max(0.5, brush.size * (brush.spacing / 100));
    if (toolMode === "line") stroke.stamps = lineStamps(start, p, spacing);
    else
      stroke.stamps.push(
        ...sampleStrokeSegment(last, p, spacing, stroke.stamps.length),
      );
    lastRef.current = p;
    showStroke(stroke);
  };
  const up = () => {
    panRef.current = undefined;
    cancelAnimationFrame(holdRafRef.current);
    const before = beforeGestureRef.current;
    const label = imageDragRef.current
      ? "Move image"
      : toolMode === "line"
        ? "Brush line"
        : "Stroke";
    if (before && (strokeRef.current || imageDragRef.current))
      setDoc((current) => {
        const after = { ...current, modifiedAt: new Date().toISOString() };
        history.push({ label, before, after });
        return after;
      });
    strokeRef.current = undefined;
    lastRef.current = undefined;
    startRef.current = undefined;
    imageDragRef.current = undefined;
    beforeGestureRef.current = undefined;
    setStatus("READY");
    refresh((x) => x + 1);
  };
  const doExport = useCallback(async () => {
    try {
      setStatus("EXPORTING");
      download(
        await exportPng(doc, resolveImage, brushes),
        safeFilename(doc.name, "png"),
      );
      setMessage("Visible layers composited at exact document dimensions.");
      setStatus("READY");
    } catch (e) {
      setStatus("ERROR");
      setMessage(e instanceof Error ? e.message : "Export failed.");
    }
  }, [doc, resolveImage, brushes]);
  const saveProject = useCallback(() => {
    setStatus("SAVING");
    download(
      new Blob([serializeProject(doc)], { type: "application/json" }),
      safeFilename(doc.name, "paintmoji"),
    );
    setStatus("READY");
  }, [doc]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
      keysRef.current.space = e.code === "Space";
      const mod = e.metaKey || e.ctrlKey,
        k = e.key.toLowerCase();
      if (mod && k === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      } else if (mod && k === "s") {
        e.preventDefault();
        saveProject();
      } else if (mod && k === "e") {
        e.preventDefault();
        void doExport();
      } else if (k === "b") setBrush((b) => ({ ...b, type: "round" }));
      else if (k === "e") setBrush((b) => ({ ...b, type: "eraser" }));
      else if (k === "g") setGrid((v) => !v);
      else if (k === "0") setZoom(1);
      else if (k === "-") setZoom((z) => Math.max(0.1, z - 0.1));
      else if (k === "+" || k === "=") setZoom((z) => Math.min(8, z + 0.1));
      else if (k === "[")
        setBrush((b) => ({ ...b, size: Math.max(1, b.size - 2) }));
      else if (k === "]")
        setBrush((b) => ({ ...b, size: Math.min(256, b.size + 2) }));
      else if ((k === "delete" || k === "backspace") && active) {
        e.preventDefault();
        change(deleteLayer(doc, active.id), "Delete layer");
      }
    };
    const ku = (e: KeyboardEvent) => {
      if (e.code === "Space") keysRef.current.space = false;
    };
    addEventListener("keydown", key);
    addEventListener("keyup", ku);
    return () => {
      removeEventListener("keydown", key);
      removeEventListener("keyup", ku);
    };
  }, [active, change, doc, doExport, redo, saveProject, undo]);
  const tools = Object.values(brushRegistry).filter((b) => b.type !== "custom"),
    def = brushRegistry[brush.type];
  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brandIndex">PM—01</span>
          <strong>
            PAINT /<br />
            MOJI
          </strong>
          <span>symbolic drawing instrument</span>
        </div>
        <div className="headerMeta">
          <small>ACTIVE DOCUMENT</small>
          <b>{doc.name}</b>
        </div>
        <div className="headerMeta">
          <small>ACTIVE LAYER</small>
          <b>{active?.name}</b>
        </div>
        <div className="headerMeta">
          <small>ACTIVE BRUSH</small>
          <b>{def.name}</b>
        </div>
        <button
          onClick={() =>
            change(createDocument(doc.width, doc.height), "New document")
          }
        >
          <Plus /> New
        </button>
        <button data-action="undo" onClick={undo} disabled={!hs.undo}>
          <Undo2 /> Undo
        </button>
        <button data-action="redo" onClick={redo} disabled={!hs.redo}>
          <Redo2 /> Redo
        </button>
        <button onClick={() => importRef.current?.click()}>
          <FileImage /> Image
        </button>
        <button onClick={() => projectRef.current?.click()}>
          <Upload /> Project
        </button>
        <button onClick={saveProject}>
          <Save /> Save
        </button>
        <button className="primary" onClick={() => void doExport()}>
          <Download /> PNG
        </button>
        <input
          ref={importRef}
          hidden
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              setStatus("IMPORTING");
              const l = await importImage(f, doc.width, doc.height);
              change(
                { ...doc, layers: [...doc.layers, l], selectedLayerId: l.id },
                "Import image",
              );
              setStatus("READY");
            } catch (err) {
              setStatus("ERROR");
              setMessage(String(err));
            }
          }}
        />
        <input
          ref={projectRef}
          hidden
          type="file"
          accept=".paintmoji,application/json"
          onChange={async (e) => {
            try {
              const f = e.target.files?.[0];
              if (f) change(restoreProject(await f.text()), "Import project");
            } catch (err) {
              setStatus("ERROR");
              setMessage(String(err));
            }
          }}
        />
      </header>
      <aside className="panel left">
        <section>
          <h2>
            <i>01</i> Brush matrix
          </h2>
          <div className="toolGrid">
            {tools.map((t) => (
              <button
                key={t.type}
                className={brush.type === t.type ? "active" : ""}
                aria-pressed={brush.type === t.type}
                onClick={() => setBrush((b) => ({ ...b, type: t.type }))}
              >
                <b>{t.icon}</b>
                <span>{t.name}</span>
              </button>
            ))}
          </div>
        </section>
        <section>
          <h2>
            <i>02</i> Tool library
          </h2>
          <div className="modeGrid">
            <button
              className={toolMode === "freehand" ? "active" : ""}
              aria-pressed={toolMode === "freehand"}
              onClick={() => setToolMode("freehand")}
            >
              ✦ Freehand
            </button>
            <button
              className={toolMode === "line" ? "active" : ""}
              aria-pressed={toolMode === "line"}
              onClick={() => setToolMode("line")}
            >
              <Minus /> Brush line
            </button>
            <button
              className={toolMode === "move-image" ? "active" : ""}
              aria-pressed={toolMode === "move-image"}
              onClick={() => setToolMode("move-image")}
            >
              <Move /> Move image
            </button>
          </div>
          <button onClick={() => setGrid(!grid)} aria-pressed={grid}>
            <Grid3X3 /> Grid {grid ? "on" : "off"}
          </button>
          <label>
            Zoom{" "}
            <input
              type="range"
              min=".1"
              max="4"
              step=".1"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
          </label>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
          >
            Reset viewport
          </button>
        </section>
        <section>
          <h2>
            <i>03</i> Custom brush archive
          </h2>
          <button className="primary full" onClick={() => setStudio(null)}>
            + Author brush
          </button>
          {brushes.map((b) => (
            <div className="archive" key={b.id}>
              <button
                onClick={() =>
                  setBrush((s) => ({
                    ...s,
                    type: "custom",
                    customBrushId: b.id,
                    spacing: b.spacing,
                  }))
                }
              >
                {b.name}
              </button>
              <button title="Edit" onClick={() => setStudio(b)}>
                ✎
              </button>
              <button
                title="Duplicate"
                onClick={() => {
                  const copy = {
                    ...structuredClone(b),
                    id: id("brush"),
                    name: `${b.name} copy`,
                  };
                  const next = [...brushes, copy];
                  setBrushes(next);
                  void saveBrushes(next);
                }}
              >
                ⧉
              </button>
              <button
                title="Export"
                onClick={() =>
                  download(
                    new Blob([JSON.stringify(b)], { type: "application/json" }),
                    safeFilename(b.name, "pmbrush"),
                  )
                }
              >
                ⇩
              </button>
              <button
                title="Delete"
                onClick={() => {
                  const next = brushes.filter((x) => x.id !== b.id);
                  setBrushes(next);
                  void saveBrushes(next);
                }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            className="full"
            onClick={() => brushImportRef.current?.click()}
          >
            Import brush preset
          </button>
          <input
            ref={brushImportRef}
            hidden
            type="file"
            accept=".pmbrush,application/json"
            onChange={async (e) => {
              try {
                const f = e.target.files?.[0];
                if (!f) return;
                const v: unknown = JSON.parse(await f.text());
                if (!validateBrushPreset(v))
                  throw new Error("Malformed or unsafe brush preset.");
                const next = [...brushes, v];
                setBrushes(next);
                await saveBrushes(next);
              } catch (err) {
                setStatus("ERROR");
                setMessage(String(err));
              }
            }}
          />
        </section>
      </aside>
      <section className="viewport" ref={viewportRef}>
        <span className="viewportLabel">COMPOSITE / LIVE</span>
        <div
          className={`canvasWrap ${grid ? "showGrid" : ""}`}
          style={{ transform: `translate(${pan.x}px,${pan.y}px)` }}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            aria-label="Paintmoji drawing canvas"
          />
        </div>
        <div className="viewtools">
          <button onClick={() => setZoom((z) => Math.max(0.1, z - 0.1))}>
            −
          </button>
          <b>{Math.round(zoom * 100)}%</b>
          <button onClick={() => setZoom((z) => Math.min(8, z + 0.1))}>
            +
          </button>
        </div>
      </section>
      <aside className="panel right">
        <section>
          <h2>
            <i>05</i> Active instrument
          </h2>
          {def.params.map((p) => {
            const value = brush[p.key];
            return (
              <label className="control" key={p.key}>
                <span>{p.label}</span>
                {p.type === "range" ? (
                  <>
                    <input
                      type="range"
                      min={p.min}
                      max={p.max}
                      step={p.step}
                      value={String(value)}
                      onChange={(e) =>
                        setBrush({ ...brush, [p.key]: Number(e.target.value) })
                      }
                    />
                    <output>
                      {typeof value === "number"
                        ? value.toFixed(value < 2 ? 2 : 0)
                        : String(value)}
                    </output>
                  </>
                ) : p.type === "checkbox" ? (
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(e) =>
                      setBrush({ ...brush, [p.key]: e.target.checked })
                    }
                  />
                ) : p.type === "select" ? (
                  <select
                    value={String(value)}
                    onChange={(e) =>
                      setBrush({ ...brush, [p.key]: e.target.value })
                    }
                  >
                    {p.options?.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={p.type}
                    value={String(value)}
                    onChange={(e) =>
                      setBrush({ ...brush, [p.key]: e.target.value })
                    }
                  />
                )}
              </label>
            );
          })}
        </section>
        <section>
          <h2>
            <i>04</i> Layer stack
          </h2>
          <button
            className="full"
            onClick={() => change(addDrawingLayer(doc), "Add layer")}
          >
            <Layers /> Add drawing layer
          </button>
          <div className="layers">
            {[...doc.layers].reverse().map((l) => (
              <article
                key={l.id}
                className={l.id === doc.selectedLayerId ? "selected" : ""}
                onClick={() => setDoc({ ...doc, selectedLayerId: l.id })}
              >
                <button
                  aria-label={l.visible ? "Hide layer" : "Show layer"}
                  aria-pressed={l.visible}
                  onClick={(e) => {
                    e.stopPropagation();
                    change(
                      patchLayer(doc, l.id, { visible: !l.visible }),
                      "Layer visibility",
                    );
                  }}
                >
                  {l.visible ? <Eye /> : <EyeOff />}
                </button>
                <div className="thumb">{l.type === "image" ? "IMG" : "✦"}</div>
                <div>
                  <input
                    aria-label="Layer name"
                    value={l.name}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      setDoc(patchLayer(doc, l.id, { name: e.target.value }))
                    }
                  />
                  <small>
                    {l.type.toUpperCase()} · {Math.round(l.opacity * 100)}%
                  </small>
                </div>
                <div className="layerOps">
                  <button
                    title="Move up"
                    onClick={(e) => {
                      e.stopPropagation();
                      change(reorderLayer(doc, l.id, 1), "Reorder layer");
                    }}
                  >
                    ↑
                  </button>
                  <button
                    title="Move down"
                    onClick={(e) => {
                      e.stopPropagation();
                      change(reorderLayer(doc, l.id, -1), "Reorder layer");
                    }}
                  >
                    ↓
                  </button>
                  <button
                    title="Duplicate"
                    onClick={(e) => {
                      e.stopPropagation();
                      change(duplicateLayer(doc, l.id), "Duplicate layer");
                    }}
                  >
                    ⧉
                  </button>
                  <button
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      change(deleteLayer(doc, l.id), "Delete layer");
                    }}
                  >
                    ×
                  </button>
                </div>
                <input
                  aria-label="Layer opacity"
                  className="opacity"
                  type="range"
                  min="0"
                  max="1"
                  step=".01"
                  value={l.opacity}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    setDoc(
                      patchLayer(doc, l.id, {
                        opacity: Number(e.target.value),
                      }),
                    )
                  }
                  onPointerUp={() => change(doc, "Layer opacity")}
                />
                {l.type === "drawing" && (
                  <button
                    className="clear"
                    onClick={(e) => {
                      e.stopPropagation();
                      change(clearLayer(doc, l.id), "Clear layer");
                    }}
                  >
                    Clear
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>
        {active?.type === "image" && (
          <section>
            <h2>
              <i>06</i> Image transform
            </h2>
            {(["x", "y", "scaleX", "scaleY", "rotation"] as const).map((k) => (
              <label className="control" key={k}>
                <span>{k}</span>
                <input
                  type="number"
                  step={k.startsWith("scale") ? 0.01 : 1}
                  value={active[k]}
                  onChange={(e) =>
                    setDoc(
                      patchLayer(doc, active.id, {
                        [k]: Number(e.target.value),
                      }),
                    )
                  }
                />
              </label>
            ))}
            <button
              onClick={() =>
                change(
                  patchLayer(doc, active.id, {
                    x: doc.width / 2,
                    y: doc.height / 2,
                  }),
                  "Center image",
                )
              }
            >
              Center
            </button>
            <button
              onClick={() =>
                change(
                  patchLayer(doc, active.id, {
                    crop: {
                      x: 0,
                      y: 0,
                      width: active.asset.width,
                      height: active.asset.height,
                    },
                  }),
                  "Reset crop",
                )
              }
            >
              Reset crop
            </button>
            <p className="hint">
              Crop is stored non-destructively in source-image coordinates.
              Numeric crop editing is preserved in the project format.
            </p>
          </section>
        )}
      </aside>
      <footer className="status" aria-live="polite">
        <span>
          {status} / {message}
        </span>
        <span>
          {doc.width} × {doc.height} PX
        </span>
        <span>ZOOM {Math.round(zoom * 100)}%</span>
        <span>LAYER {active?.name}</span>
        <span>BRUSH {def.name}</span>
        <span>
          X {pointer.x.toFixed(0)} Y {pointer.y.toFixed(0)}
        </span>
        <span>
          HISTORY {hs.undo}/{hs.redo}
        </span>
      </footer>
      {studio !== false && (
        <BrushStudio
          initial={studio ?? undefined}
          onClose={() => setStudio(false)}
          onSave={(preset) => {
            const next = [...brushes.filter((b) => b.id !== preset.id), preset];
            setBrushes(next);
            void saveBrushes(next);
            setStudio(false);
            setBrush({
              ...brush,
              type: "custom",
              customBrushId: preset.id,
              spacing: preset.spacing,
            });
          }}
        />
      )}
    </main>
  );
}
