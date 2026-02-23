# Pixelate — Design Document

## Overview

A vanilla JS browser application that pixelates images. The user provides a source image and target dimensions in pixels. The app crops the source to match the target aspect ratio (center crop, no stretching), divides the cropped image into a grid, averages each grid cell's pixels, and produces a pixelated result. All processing is client-side — the image never leaves the user's machine.

Hosted at kremerman.me/pixelate via GitHub Pages.

## File Structure

```
pixelate/
├── index.html        # Page structure
├── style.css         # Dark theme styling
├── pixelate.js       # All application logic
```

No build tools, no dependencies. HTML loads CSS and JS via relative paths (`./style.css`, `./pixelate.js`) for correct resolution under the `/pixelate` subdirectory.

## Architecture

Canvas-only approach. A single HTML `<canvas>` element handles image processing, output display, and export. An offscreen canvas is used for reading source pixel data. The CSS property `image-rendering: pixelated` provides crisp zoom rendering.

JS logical sections:
- **DOM setup** — event listeners for file input, drag-and-drop, dimension controls, zoom, and download
- **Image loading** — reads file into an `Image` element, draws to offscreen canvas for pixel access
- **Cropping** — computes center-crop coordinates based on source vs. target aspect ratio
- **Pixelation** — iterates the grid, averages each cell's pixels, writes results to output canvas
- **Display & export** — renders output canvas with pixelated rendering for zoom, provides download via `canvas.toDataURL()`

## UI Layout

Dark theme matching kremerman.me aesthetic (dark background, purple/cyan accents).

Top to bottom:

1. **Header** — "pixelate" title styled to match site aesthetic
2. **Input section** (two parts side by side):
   - **Left:** Drop zone / file picker. Dashed border, "Drop image here or click to browse" text. Shows source thumbnail once loaded.
   - **Right:** Controls:
     - Dimension presets: 16x16, 32x32, 64x64, 128x128, 256x256
     - Custom dimension inputs: width and height number fields
     - "Pixelate" button
3. **Output section** (appears after processing):
   - Pixelated result canvas at actual pixel size
   - Zoom controls: 1x, 2x, 4x, 8x, 16x, Fit
   - Download PNG button

## Processing Pipeline

1. **Load** — File read via `FileReader` as data URL, set as `Image.src`. On load, source natural width/height are available.

2. **Crop calculation** — Compare aspect ratios:
   - Source wider than target ratio: `cropW = srcH * (targetW/targetH)`, `cropH = srcH`. X offset: `(srcW - cropW) / 2`.
   - Source taller than target ratio: `cropW = srcW`, `cropH = srcW * (targetH/targetW)`. Y offset: `(srcH - cropH) / 2`.
   - Ratios match: no crop.

3. **Draw cropped source** — Draw cropped region to offscreen canvas sized `cropW x cropH`. Extract pixel data with `getImageData()`.

4. **Average grid cells** — For each target pixel `(tx, ty)`:
   - Source rectangle: `x0 = tx * (cropW/targetW)`, `y0 = ty * (cropH/targetH)`, size `cellW = cropW/targetW` by `cellH = cropH/targetH`.
   - Sum R, G, B, A for all source pixels in rectangle, divide by count.

5. **Write output** — Canvas sized `targetW x targetH`. Use `fillRect(tx, ty, 1, 1)` with averaged color per target pixel.

6. **Display** — `image-rendering: pixelated` on canvas, scale via CSS width/height for zoom.

## Zoom & Download

**Zoom:**
- Default: actual size (1x)
- Zoom levels: 1x, 2x, 4x, 8x, 16x, Fit (scale to viewport width)
- Implemented via CSS `width`/`height` on canvas; canvas attributes stay at target dimensions
- `image-rendering: pixelated` for crisp edges at all levels

**Download:**
- "Download PNG" button
- `canvas.toDataURL('image/png')` at actual target dimensions (not zoomed)
- Temporary `<a>` element with `download="pixelated.png"`, triggered click
- Raw pixel-accurate PNG export

## Error Handling

- **No file selected** — "Pixelate" button disabled until image loaded
- **Non-image file** — `Image.onerror` triggers inline message: "Could not load file as an image"
- **Invalid dimensions** — "Pixelate" button disabled if width/height is empty, zero, or negative. Custom inputs constrained to positive integers.
- **Target larger than source** — Warning: "Target size exceeds source image size." Processing still allowed.

## Image Input

- File picker (click to browse)
- Drag-and-drop onto drop zone
- No clipboard paste support
