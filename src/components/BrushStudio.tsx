import { useMemo, useState } from "react";
import type { BrushCommand, CustomBrushPreset } from "../types";
import { id } from "../core/document/model";
type Props = {
  initial?: CustomBrushPreset;
  onSave: (brush: CustomBrushPreset) => void;
  onClose: () => void;
};
export function BrushStudio({ initial, onSave, onClose }: Props) {
  const [size, setSize] = useState(initial?.width ?? 16),
    [name, setName] = useState(initial?.name ?? "Untitled stamp"),
    [tool, setTool] = useState<BrushCommand["tool"]>("square"),
    [commands, setCommands] = useState<BrushCommand[]>(initial?.commands ?? []),
    [redo, setRedo] = useState<BrushCommand[]>([]),
    [zoom, setZoom] = useState(20),
    [spacing, setSpacing] = useState(initial?.spacing ?? 12),
    [anchor, setAnchor] = useState(
      initial?.anchor ?? { x: size / 2, y: size / 2 },
    );
  const cells = useMemo(
    () =>
      new Set(
        commands
          .filter((c) => c.tool !== "eraser")
          .map((c) => `${Math.floor(c.x)},${Math.floor(c.y)}`),
      ),
    [commands],
  );
  const stamp = (x: number, y: number) => {
    setCommands((items) => [
      ...items,
      {
        tool,
        x: x + 0.5,
        y: y + 0.5,
        size: 1,
        color: "#111111",
        content: tool === "emoji" ? "🌺" : "A",
        rotation: 0,
      },
    ]);
    setRedo([]);
  };
  const transform = (kind: "h" | "v" | "r") =>
    setCommands((items) =>
      items.map((c) =>
        kind === "h"
          ? { ...c, x: size - c.x }
          : kind === "v"
            ? { ...c, y: size - c.y }
            : { ...c, x: size - c.y, y: c.x },
      ),
    );
  const crop = () => {
    const live = commands.filter((c) => c.tool !== "eraser");
    if (!live.length) return;
    const minX = Math.floor(Math.min(...live.map((c) => c.x))),
      minY = Math.floor(Math.min(...live.map((c) => c.y))),
      maxX = Math.ceil(Math.max(...live.map((c) => c.x))),
      maxY = Math.ceil(Math.max(...live.map((c) => c.y)));
    setCommands(live.map((c) => ({ ...c, x: c.x - minX, y: c.y - minY })));
    setSize(Math.max(maxX - minX, maxY - minY));
  };
  const save = () => {
    const now = new Date().toISOString();
    onSave({
      schemaVersion: 1,
      id: initial?.id ?? id("brush"),
      name: name.trim() || "Untitled stamp",
      createdAt: initial?.createdAt ?? now,
      modifiedAt: now,
      width: size,
      height: size,
      anchor,
      spacing,
      defaultScale: 1,
      defaultRotation: 0,
      commands,
    });
  };
  return (
    <div className="modalBackdrop" role="presentation">
      <section
        className="studio"
        role="dialog"
        aria-modal="true"
        aria-labelledby="studio-title"
      >
        <header>
          <div>
            <span className="index">ST—01</span>
            <h2 id="studio-title">Custom brush studio</h2>
          </div>
          <button onClick={onClose} aria-label="Close brush studio">
            ×
          </button>
        </header>
        <div className="studioTools">
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Grid
            <select
              value={size}
              onChange={(e) => {
                const n = Number(e.target.value);
                setSize(n);
                setAnchor({ x: n / 2, y: n / 2 });
              }}
            >
              <option>8</option>
              <option>16</option>
              <option>24</option>
              <option>32</option>
              <option>48</option>
              <option>64</option>
            </select>
          </label>
          <label>
            Tool
            <select
              value={tool}
              onChange={(e) => setTool(e.target.value as BrushCommand["tool"])}
            >
              {[
                "emoji",
                "ascii",
                "circle",
                "square",
                "triangle",
                "star",
                "round",
                "eraser",
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Zoom
            <input
              type="range"
              min="8"
              max="32"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
          </label>
          <label>
            Spacing
            <input
              type="number"
              min="1"
              max="200"
              value={spacing}
              onChange={(e) => setSpacing(Number(e.target.value))}
            />
          </label>
        </div>
        <div
          className="studioGrid"
          style={{ gridTemplateColumns: `repeat(${size}, ${zoom}px)` }}
        >
          {Array.from({ length: size * size }, (_, i) => {
            const x = i % size,
              y = Math.floor(i / size);
            return (
              <button
                key={i}
                className={cells.has(`${x},${y}`) ? "filled" : ""}
                onPointerDown={(e) => {
                  e.preventDefault();
                  stamp(x, y);
                }}
                aria-label={`Cell ${x}, ${y}`}
              />
            );
          })}
        </div>
        <div className="studioActions">
          <button
            onClick={() => {
              const c = commands.at(-1);
              if (c) {
                setCommands(commands.slice(0, -1));
                setRedo([...redo, c]);
              }
            }}
          >
            Undo
          </button>
          <button
            onClick={() => {
              const c = redo.at(-1);
              if (c) {
                setCommands([...commands, c]);
                setRedo(redo.slice(0, -1));
              }
            }}
          >
            Redo
          </button>
          <button onClick={() => setCommands([])}>Clear</button>
          <button onClick={() => transform("h")}>Flip H</button>
          <button onClick={() => transform("v")}>Flip V</button>
          <button onClick={() => transform("r")}>Rotate 90°</button>
          <button onClick={crop}>Crop bounds</button>
          <button className="primary" onClick={save}>
            Save brush
          </button>
        </div>
        <p className="preview">
          Preview <b style={{ fontSize: 12 }}>◆</b>{" "}
          <b style={{ fontSize: 24 }}>◆</b> <b style={{ fontSize: 48 }}>◆</b> ·
          anchor {anchor.x},{anchor.y}
        </p>
      </section>
    </div>
  );
}
