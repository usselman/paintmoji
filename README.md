# PM—01 Paint / Moji

Paintmoji is a symbolic drawing instrument: a playful canvas for painting with emoji, ASCII, geometry, solid marks, imported imagery, and brushes authored by the user. It is a distinct companion to [Dither Quest](https://github.com/usselman/dither-quest), sharing its dense neo-brutalist instrument language while adapting the system to drawing, layers, and reusable stamp construction.

## Development

```sh
npm install
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

Vite builds with the `/paintmoji/` base path for GitHub Pages. Deploy the generated `dist/` directory from CI or a Pages branch.

## Working model

The visible canvas is a presentation surface, not project state. New documents begin with a white `Canvas / White` drawing layer beneath the selected transparent drawing layer. Versioned documents retain ordered drawing and image layers. Drawing layers contain completed strokes, optional retained fills, and interpolated brush stamps; image layers retain their original data, source-space crop, position, scale, and rotation. Only visible layers are composited, in array order, with later layers visually above earlier ones.

Pointer Events support mouse, touch, and pen input with pointer capture and optional pressure-to-size/opacity. Sub-spacing pointer movement is preserved for micro drawing, fast gaps are interpolated, and a held pointer emits stamps on animation frames. One completed gesture is one history operation. The Brush Line tool previews and places the active emoji, ASCII, shape, or custom stamp at even intervals between two endpoints. The renderer is imperative and requestAnimationFrame-batched.

## Controls

- `Cmd/Ctrl+Z` undo; `Cmd/Ctrl+Shift+Z` redo
- `Cmd/Ctrl+S` export editable `.paintmoji` project; `Cmd/Ctrl+E` export PNG
- `B` solid brush; `E` eraser; `G` grid; `[` and `]` brush size
- `0` reset zoom; `-` and `+` zoom; hold Space and drag to pan
- Delete/Backspace deletes the active layer when permitted

Shortcuts do not run while editing form fields.

## Layers, images, and crop

The layer stack supports drawing/image layers, selection, visibility, rename, opacity, ordering, duplication, clearing, and guarded deletion of the final required drawing layer. PNG, JPEG, and WebP files import centered as nondestructive image layers and fit within the document. Select an image layer, choose **Move image**, then drag directly on the canvas; the gesture is undoable. Position, scale, rotation, centering, and crop reset are also available numerically. Crop values live in source-image coordinates and are clamped by core geometry helpers.

## Brushes and custom brush studio

Built-ins are emoji, ASCII, circle, square, triangle, star, solid round, and eraser. Emoji and ASCII instruments expose broad symbol-library dropdowns. ASCII uses `Array.from`, supports cycling, random choice, and safe system fonts. Registry metadata supplies dynamic controls.

The studio provides 8–64 cell grids, symbolic tools, isolated undo/redo, clear, flip, rotate, transparent-bound crop, zoom, anchor metadata, spacing, previews, and reusable presets. Presets are versioned JSON with editable commands and metadata; binary-heavy state and autosave live in IndexedDB. Brush presets can be renamed by editing, duplicated, deleted, imported, and exported as `.pmbrush` files. Malformed or oversized input is rejected.

## Export and persistence

PNG uses a dedicated exact-dimension compositor. It includes only visible layers with their order, opacity, source crop, and transforms; it never includes the checkerboard, grid, cursor, selection, viewport transform, or UI. Editable `.paintmoji` JSON preserves document metadata, layers, strokes, imported image data, visibility, transforms, and crops. Autosave and brushes use schema-versioned IndexedDB records; malformed persisted state falls back to a usable new document.

## Architecture

- `src/core/document`, `layers`, and `history`: retained state and bounded command history
- `src/core/brushes`: typed registry, metadata, ASCII selection, and spacing interpolation
- `src/core/rendering` and `export`: deterministic compositing and stamp rendering
- `src/core/geometry`: viewport, document, transformed-image, and crop coordinates
- `src/core/import` and `persistence`: validated images, projects, preferences, and IndexedDB
- `src/components/BrushStudio.tsx`: isolated grid brush-authoring workflow

## Known limitations

The initial production foundation does not yet include draggable crop handles, freeform image aspect-lock/fill controls, dirty-region cache invalidation, thumbnails generated from actual layer pixels, custom-dimension brush grids, or editable historical brush sessions after raster-only external conversion. Imported image data is embedded in project JSON, so large projects are intentionally bounded but can still be sizable. Canvas resize/crop-to-content UI is deferred; new documents retain the current dimensions.
