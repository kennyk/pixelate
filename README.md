# pixelate

In-browser image pixelation tool. Drop an image, pick a target size, get a pixelated result. No uploads — everything runs client-side in vanilla JavaScript.

**Live:** [kremerman.me/pixelate](https://kremerman.me/pixelate)

## How it works

1. Load an image (file picker or drag-and-drop)
2. Choose target dimensions — presets (16x16 through 256x256) or custom
3. Click Pixelate
4. Download the result as PNG

The algorithm center-crops the source to match the target aspect ratio (no stretching), divides it into a grid, and averages the pixels in each cell. The output is the exact target size.

## Why would you make this?

The current generation of AI image agents is terrible at following pixel-dimension instructions. Ask for a 32x32 sprite and you'll get a 1024x1024 image of a sprite-shaped thing. Ask for 64x64 and you'll get something "small-looking" at whatever resolution the model feels like.

This was the simplest way to get correctly-sized pixel assets — generate an image with an AI agent, then pixelate it down to the actual dimensions needed. It exists as part of a ghetto assets pipeline for [Autobahnarchy](https://kremerman.me/autobahnarchy).

## Stack

Three files, no dependencies, no build step:

- `index.html`
- `style.css`
- `pixelate.js`
