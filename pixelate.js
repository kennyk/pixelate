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

const zoomButtons = document.querySelectorAll('.zoom-controls button');

zoomButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const zoom = btn.dataset.zoom;
    applyZoom(zoom === 'fit' ? 'fit' : parseInt(zoom));
    zoomButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
