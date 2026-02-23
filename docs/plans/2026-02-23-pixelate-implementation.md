# Pixelate Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a vanilla JS browser app that pixelates images via center-cropping and grid-cell averaging, hosted at kremerman.me/pixelate.

**Architecture:** Canvas-only approach. Single HTML page loads CSS and JS via relative paths. An offscreen canvas reads source pixel data, the pixelation algorithm averages grid cells, and an output canvas displays the result with CSS `image-rendering: pixelated` for zoom. No dependencies or build tools.

**Tech Stack:** Vanilla HTML/CSS/JS, Canvas API, GitHub Pages

---

### Task 1: HTML skeleton + dark theme CSS

**Files:**
- Create: `index.html`
- Create: `style.css`

**Step 1: Create index.html with full page structure**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>pixelate</title>
  <link rel="stylesheet" href="./style.css">
</head>
<body>
  <header>
    <h1>pixelate</h1>
  </header>

  <main>
    <section class="input-section">
      <div class="drop-zone" id="dropZone">
        <input type="file" id="fileInput" accept="image/*" hidden>
        <p class="drop-zone__prompt">Drop image here or click to browse</p>
        <img id="preview" class="drop-zone__preview" hidden>
      </div>

      <div class="controls">
        <div class="controls__presets">
          <h3>Presets</h3>
          <div class="preset-buttons">
            <button data-w="16" data-h="16">16x16</button>
            <button data-w="32" data-h="32">32x32</button>
            <button data-w="64" data-h="64">64x64</button>
            <button data-w="128" data-h="128">128x128</button>
            <button data-w="256" data-h="256">256x256</button>
          </div>
        </div>

        <div class="controls__custom">
          <h3>Custom</h3>
          <div class="custom-inputs">
            <label>W <input type="number" id="targetWidth" min="1" placeholder="width"></label>
            <label>H <input type="number" id="targetHeight" min="1" placeholder="height"></label>
          </div>
        </div>

        <button id="pixelateBtn" class="btn-primary" disabled>Pixelate</button>
      </div>
    </section>

    <section class="output-section" id="outputSection" hidden>
      <div class="output-display">
        <canvas id="outputCanvas"></canvas>
      </div>
      <div class="output-controls">
        <div class="zoom-controls">
          <button data-zoom="1">1x</button>
          <button data-zoom="2">2x</button>
          <button data-zoom="4">4x</button>
          <button data-zoom="8">8x</button>
          <button data-zoom="16">16x</button>
          <button data-zoom="fit">Fit</button>
        </div>
        <button id="downloadBtn" class="btn-primary">Download PNG</button>
      </div>
    </section>

    <p id="errorMsg" class="error-msg" hidden></p>
    <p id="warningMsg" class="warning-msg" hidden></p>
  </main>

  <script src="./pixelate.js"></script>
</body>
</html>
```

**Step 2: Create style.css with dark theme**

Full dark theme with purple/cyan accents matching kremerman.me:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #0a0a0a;
  color: #e0e0e0;
  font-family: 'Courier New', monospace;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
}

header h1 {
  font-size: 2.5rem;
  letter-spacing: 0.3em;
  text-transform: lowercase;
  background: linear-gradient(90deg, #a855f7, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 2rem;
}

main {
  width: 100%;
  max-width: 900px;
}

/* Input section - side by side */
.input-section {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
}

/* Drop zone */
.drop-zone {
  flex: 1;
  border: 2px dashed #333;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  padding: 1rem;
  position: relative;
}

.drop-zone:hover,
.drop-zone--active {
  border-color: #a855f7;
  background: rgba(168, 85, 247, 0.05);
}

.drop-zone__prompt {
  color: #666;
  text-align: center;
}

.drop-zone__preview {
  max-width: 100%;
  max-height: 180px;
  border-radius: 4px;
}

/* Controls */
.controls {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.controls h3 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #888;
  margin-bottom: 0.5rem;
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.preset-buttons button {
  background: #1a1a1a;
  border: 1px solid #333;
  color: #e0e0e0;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.85rem;
  transition: border-color 0.2s, background 0.2s;
}

.preset-buttons button:hover {
  border-color: #06b6d4;
}

.preset-buttons button.active {
  border-color: #06b6d4;
  background: rgba(6, 182, 212, 0.1);
}

.custom-inputs {
  display: flex;
  gap: 1rem;
}

.custom-inputs label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #888;
}

.custom-inputs input {
  width: 80px;
  background: #1a1a1a;
  border: 1px solid #333;
  color: #e0e0e0;
  padding: 0.4rem;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.85rem;
}

.custom-inputs input:focus {
  outline: none;
  border-color: #a855f7;
}

.btn-primary {
  background: linear-gradient(90deg, #a855f7, #06b6d4);
  border: none;
  color: #fff;
  padding: 0.6rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  font-size: 1rem;
  font-weight: bold;
  letter-spacing: 0.05em;
  transition: opacity 0.2s;
  margin-top: auto;
}

.btn-primary:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-primary:not(:disabled):hover {
  opacity: 0.85;
}

/* Output section */
.output-section {
  border-top: 1px solid #222;
  padding-top: 2rem;
}

.output-display {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  overflow: auto;
  max-height: 70vh;
  background: #111;
  border-radius: 8px;
  padding: 1rem;
}

#outputCanvas {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.output-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.zoom-controls {
  display: flex;
  gap: 0.5rem;
}

.zoom-controls button {
  background: #1a1a1a;
  border: 1px solid #333;
  color: #e0e0e0;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.85rem;
  transition: border-color 0.2s, background 0.2s;
}

.zoom-controls button:hover {
  border-color: #a855f7;
}

.zoom-controls button.active {
  border-color: #a855f7;
  background: rgba(168, 85, 247, 0.1);
}

/* Messages */
.error-msg {
  color: #ef4444;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.warning-msg {
  color: #f59e0b;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}
```

**Step 3: Create empty pixelate.js placeholder**

```js
// pixelate.js — application logic
```

**Step 4: Open index.html in browser and verify**

Open `index.html` in the browser. Verify:
- Dark background with purple/cyan gradient title
- Drop zone and controls side by side
- Preset buttons and custom inputs visible
- Pixelate button disabled
- Output section hidden

**Step 5: Commit**

```bash
git add index.html style.css pixelate.js
git commit -m "feat: add HTML skeleton and dark theme CSS"
```

---

### Task 2: File input and drag-and-drop

**Files:**
- Modify: `pixelate.js`

**Step 1: Implement image loading logic**

```js
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const dropPrompt = dropZone.querySelector('.drop-zone__prompt');
const errorMsg = document.getElementById('errorMsg');
const pixelateBtn = document.getElementById('pixelateBtn');

let sourceImage = null;

// Click to browse
dropZone.addEventListener('click', () => fileInput.click());

// File selected via picker
fileInput.addEventListener('change', () => {
  if (fileInput.files.length) {
    loadFile(fileInput.files[0]);
  }
});

// Drag-and-drop
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drop-zone--active');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drop-zone--active');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drop-zone--active');
  if (e.dataTransfer.files.length) {
    loadFile(e.dataTransfer.files[0]);
  }
});

function loadFile(file) {
  hideError();
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      sourceImage = img;
      preview.src = e.target.result;
      preview.hidden = false;
      dropPrompt.hidden = true;
      updatePixelateButton();
    };
    img.onerror = () => {
      showError('Could not load file as an image');
      sourceImage = null;
      updatePixelateButton();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.hidden = false;
}

function hideError() {
  errorMsg.hidden = true;
}

function updatePixelateButton() {
  const w = parseInt(document.getElementById('targetWidth').value);
  const h = parseInt(document.getElementById('targetHeight').value);
  pixelateBtn.disabled = !(sourceImage && w > 0 && h > 0);
}
```

**Step 2: Verify in browser**

- Click drop zone, pick an image file, see thumbnail preview
- Drag an image onto the drop zone, see thumbnail preview
- Try a non-image file (e.g., .txt), see error message
- Verify Pixelate button stays disabled (no dimensions yet)

**Step 3: Commit**

```bash
git add pixelate.js
git commit -m "feat: add file input and drag-and-drop image loading"
```

---

### Task 3: Dimension controls (presets + custom)

**Files:**
- Modify: `pixelate.js`

**Step 1: Add dimension control wiring**

Append to `pixelate.js`:

```js
const targetWidthInput = document.getElementById('targetWidth');
const targetHeightInput = document.getElementById('targetHeight');
const presetButtons = document.querySelectorAll('.preset-buttons button');

// Preset buttons
presetButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const w = btn.dataset.w;
    const h = btn.dataset.h;
    targetWidthInput.value = w;
    targetHeightInput.value = h;
    presetButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    updatePixelateButton();
  });
});

// Custom inputs
targetWidthInput.addEventListener('input', () => {
  presetButtons.forEach((b) => b.classList.remove('active'));
  updatePixelateButton();
});

targetHeightInput.addEventListener('input', () => {
  presetButtons.forEach((b) => b.classList.remove('active'));
  updatePixelateButton();
});
```

**Step 2: Verify in browser**

- Click a preset button, see it highlighted, see values in custom inputs
- Type custom values, see preset deselected
- Load an image + set dimensions, see Pixelate button become enabled
- Clear dimensions, see Pixelate button become disabled

**Step 3: Commit**

```bash
git add pixelate.js
git commit -m "feat: add dimension preset and custom input controls"
```

---

### Task 4: Pixelation algorithm (crop + average + render)

**Files:**
- Modify: `pixelate.js`

This is the core logic. Append to `pixelate.js`:

**Step 1: Implement the pixelation pipeline**

```js
const outputSection = document.getElementById('outputSection');
const outputCanvas = document.getElementById('outputCanvas');
const warningMsg = document.getElementById('warningMsg');

pixelateBtn.addEventListener('click', pixelate);

function pixelate() {
  hideError();
  warningMsg.hidden = true;

  const targetW = parseInt(targetWidthInput.value);
  const targetH = parseInt(targetHeightInput.value);
  const srcW = sourceImage.naturalWidth;
  const srcH = sourceImage.naturalHeight;

  // Warning if target exceeds source
  if (targetW > srcW || targetH > srcH) {
    warningMsg.textContent = 'Target size exceeds source image size.';
    warningMsg.hidden = false;
  }

  // Crop calculation — center crop to match target aspect ratio
  let cropX = 0;
  let cropY = 0;
  let cropW = srcW;
  let cropH = srcH;

  const srcAspect = srcW / srcH;
  const targetAspect = targetW / targetH;

  if (srcAspect > targetAspect) {
    // Source is wider — crop horizontally
    cropW = Math.round(srcH * targetAspect);
    cropX = Math.round((srcW - cropW) / 2);
  } else if (srcAspect < targetAspect) {
    // Source is taller — crop vertically
    cropH = Math.round(srcW / targetAspect);
    cropY = Math.round((srcH - cropH) / 2);
  }

  // Draw cropped source to offscreen canvas
  const offscreen = document.createElement('canvas');
  offscreen.width = cropW;
  offscreen.height = cropH;
  const offCtx = offscreen.getContext('2d');
  offCtx.drawImage(sourceImage, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  const imageData = offCtx.getImageData(0, 0, cropW, cropH);
  const pixels = imageData.data;

  // Set up output canvas at target dimensions
  outputCanvas.width = targetW;
  outputCanvas.height = targetH;
  const outCtx = outputCanvas.getContext('2d');

  // Average grid cells
  for (let ty = 0; ty < targetH; ty++) {
    for (let tx = 0; tx < targetW; tx++) {
      const x0 = Math.floor(tx * cropW / targetW);
      const y0 = Math.floor(ty * cropH / targetH);
      const x1 = Math.floor((tx + 1) * cropW / targetW);
      const y1 = Math.floor((ty + 1) * cropH / targetH);

      let r = 0, g = 0, b = 0, a = 0, count = 0;

      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * cropW + x) * 4;
          r += pixels[i];
          g += pixels[i + 1];
          b += pixels[i + 2];
          a += pixels[i + 3];
          count++;
        }
      }

      if (count === 0) count = 1;
      outCtx.fillStyle = `rgba(${Math.round(r / count)},${Math.round(g / count)},${Math.round(b / count)},${(a / count / 255).toFixed(3)})`;
      outCtx.fillRect(tx, ty, 1, 1);
    }
  }

  // Show output section
  outputSection.hidden = false;
  applyZoom(8); // Default to 8x so result is visible
}
```

**Step 2: Add a temporary applyZoom stub**

```js
function applyZoom(level) {
  if (level === 'fit') {
    const containerWidth = outputCanvas.parentElement.clientWidth;
    const scale = containerWidth / outputCanvas.width;
    outputCanvas.style.width = containerWidth + 'px';
    outputCanvas.style.height = (outputCanvas.height * scale) + 'px';
  } else {
    outputCanvas.style.width = (outputCanvas.width * level) + 'px';
    outputCanvas.style.height = (outputCanvas.height * level) + 'px';
  }
}
```

**Step 3: Verify in browser**

- Load an image, select 32x32, click Pixelate
- See the pixelated output appear, zoomed to 8x
- Try a non-square preset on a non-square image, verify center cropping looks correct
- Try target dimensions larger than source, see warning message

**Step 4: Commit**

```bash
git add pixelate.js
git commit -m "feat: implement pixelation algorithm with center crop and grid averaging"
```

---

### Task 5: Zoom controls

**Files:**
- Modify: `pixelate.js`

**Step 1: Wire up zoom buttons**

Append to `pixelate.js`:

```js
const zoomButtons = document.querySelectorAll('.zoom-controls button');

zoomButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const zoom = btn.dataset.zoom;
    applyZoom(zoom === 'fit' ? 'fit' : parseInt(zoom));
    zoomButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
```

**Step 2: Verify in browser**

- Pixelate an image, then click each zoom button
- 1x should show tiny actual-size pixels
- 16x should show large squares
- Fit should scale to fill the container width
- Active button should have highlighted border

**Step 3: Commit**

```bash
git add pixelate.js
git commit -m "feat: add zoom controls for pixelated output"
```

---

### Task 6: Download PNG

**Files:**
- Modify: `pixelate.js`

**Step 1: Implement download**

Append to `pixelate.js`:

```js
const downloadBtn = document.getElementById('downloadBtn');

downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'pixelated.png';
  link.href = outputCanvas.toDataURL('image/png');
  link.click();
});
```

**Step 2: Verify in browser**

- Pixelate an image, click Download PNG
- File saved as `pixelated.png`
- Open the downloaded file, verify it is at the exact target dimensions (not zoomed)

**Step 3: Commit**

```bash
git add pixelate.js
git commit -m "feat: add PNG download for pixelated output"
```

---

### Task 7: Polish and final verification

**Files:**
- Modify: `style.css` (if needed)
- Modify: `pixelate.js` (if needed)

**Step 1: End-to-end testing**

Test the full workflow in the browser:
1. Load page — dark theme, drop zone visible, Pixelate button disabled
2. Drop a landscape image — preview appears
3. Click 64x64 preset — button highlighted, values set
4. Click Pixelate — output appears at 8x zoom
5. Click through zoom levels — all work correctly
6. Click Download PNG — file downloads at 64x64
7. Drop a portrait image — preview updates
8. Enter custom dimensions (100x50) — preset deselects
9. Click Pixelate — output shows center-cropped result
10. Try a non-image file — error message appears
11. Try target larger than source — warning appears

**Step 2: Fix any issues found**

Address any visual or functional issues discovered during testing.

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: polish and final adjustments"
```
