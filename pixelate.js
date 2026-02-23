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
