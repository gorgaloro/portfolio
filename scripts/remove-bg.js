#!/usr/bin/env node
/**
 * Background remover using sharp with flood-fill masking.
 * - Estimates background color from 4 corners (or use --bg).
 * - Builds a background mask via flood-fill from the image border under tolerance.
 * - Optionally feathers the mask edge for smoother anti-aliased edges.
 * - Can auto-trim transparent margins with optional padding.
 *
 * Usage:
 *   node scripts/remove-bg.js <inputPath> [--output <outputPath>] [--tol <0-255>] [--bg #RRGGBB]
 *                                  [--feather <radius>] [--seed <border|corners>] [--trim] [--pad <px>]
 *
 * Examples:
 *   node scripts/remove-bg.js "public/images/pm app logos/jira.jpg"
 *   node scripts/remove-bg.js input.jpg --output output.png --tol 60 --feather 1 --trim --pad 6
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--output' || a === '-o') {
      args.output = argv[++i];
    } else if (a === '--tol' || a === '-t') {
      args.tol = parseFloat(argv[++i]);
    } else if (a.startsWith('--tol=')) {
      args.tol = parseFloat(a.split('=')[1]);
    } else if (a === '--bg') {
      args.bg = argv[++i];
    } else if (a.startsWith('--bg=')) {
      args.bg = a.split('=')[1];
    } else if (a === '--feather' || a === '-f') {
      args.feather = parseFloat(argv[++i]);
    } else if (a.startsWith('--feather=')) {
      args.feather = parseFloat(a.split('=')[1]);
    } else if (a === '--seed') {
      args.seed = argv[++i];
    } else if (a.startsWith('--seed=')) {
      args.seed = a.split('=')[1];
    } else if (a === '--trim') {
      args.trim = true;
    } else if (a === '--no-trim' || a === '--keep-margins') {
      args.trim = false;
    } else if (a === '--pad' || a === '--padding') {
      args.pad = parseFloat(argv[++i]);
    } else if (a.startsWith('--pad=') || a.startsWith('--padding=')) {
      const [, value] = a.split('=');
      args.pad = parseFloat(value);
    } else if (a === '--help' || a === '-h') {
      args.help = true;
    } else {
      args._.push(a);
    }
  }
  return args;
}

function showHelp() {
  console.log(`\nBackground remover using sharp (flood-fill)\n\n` +
    `Usage: node scripts/remove-bg.js <inputPath> [--output <outputPath>] [--tol <0-255>] [--bg #RRGGBB] [--feather <radius>] [--seed <border|corners>]\n\n` +
    `Options:\n` +
    `  --output, -o  Output path (default: same directory with .png)\n` +
    `  --tol, -t     Tolerance threshold (default: 48)\n` +
    `  --bg          Background color to key out (hex, e.g. #f8f8f8). If omitted, uses corner average.\n` +
    `  --feather, -f Feather radius applied to mask (default: 1, 0 to disable)\n` +
    `  --seed        Seed strategy: 'border' (default) or 'corners'\n` +
    `  --trim        Trim away fully transparent margins (default: off)\n` +
    `  --pad         Pixels of padding to add back after trim (default: 0)\n`);
}

function hexToRgb(hex) {
  const m = /^#?([\da-fA-F]{2})([\da-fA-F]{2})([\da-fA-F]{2})$/.exec(hex || '');
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function colorDistanceSq(r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return dr * dr + dg * dg + db * db;
}

(async () => {
  try {
    const args = parseArgs(process.argv);
    if (args.help || args._.length === 0) {
      showHelp();
      process.exit(args.help ? 0 : 1);
    }

    const inputPath = args._[0];
    if (!fs.existsSync(inputPath)) {
      console.error(`Input not found: ${inputPath}`);
      process.exit(1);
    }

    const ext = path.extname(inputPath);
    const base = path.basename(inputPath, ext);
    const dir = path.dirname(inputPath);
    const outputPath = args.output || path.join(dir, `${base}.png`);
    const tol = Number.isFinite(args.tol) ? args.tol : 48; // slightly stronger default for JPEG
    const feather = Number.isFinite(args.feather) ? Math.max(0, args.feather) : 1;
    const trim = args.trim === undefined ? false : Boolean(args.trim);
    const pad = Number.isFinite(args.pad) ? Math.max(0, args.pad) : 0;
    const seedStrategy = (args.seed || 'border').toLowerCase();

    const baseImg = sharp(inputPath).ensureAlpha();
    const { data, info } = await baseImg.raw().toBuffer({ resolveWithObject: true });
    const { width, height, channels } = info; // expect 4 channels (RGBA)
    const getIdx = (x, y) => (y * width + x) * channels;

    const cornerCoords = [
      [0, 0],
      [width - 1, 0],
      [0, height - 1],
      [width - 1, height - 1],
    ];

    let bg;
    if (args.bg) {
      const rgb = hexToRgb(args.bg);
      if (!rgb) {
        console.error(`Invalid --bg value. Use #RRGGBB, e.g. #f8f8f8`);
        process.exit(1);
      }
      bg = rgb;
    } else {
      // Average the 4 corner colors
      let r = 0, g = 0, b = 0;
      for (const [x, y] of cornerCoords) {
        const i = getIdx(x, y);
        r += data[i + 0];
        g += data[i + 1];
        b += data[i + 2];
      }
      bg = [Math.round(r / 4), Math.round(g / 4), Math.round(b / 4)];
    }

    const tolSq = tol * tol;

    // Build background mask using flood-fill from border (or corners)
    const visited = new Uint8Array(width * height); // 0=unvisited,1=visited background
    const queue = [];

    function enqueue(x, y) {
      if (x < 0 || y < 0 || x >= width || y >= height) return;
      const idx = y * width + x;
      if (visited[idx]) return;
      const i = getIdx(x, y);
      const dSq = colorDistanceSq(data[i + 0], data[i + 1], data[i + 2], bg[0], bg[1], bg[2]);
      if (dSq <= tolSq) {
        visited[idx] = 1;
        queue.push([x, y]);
      }
    }

    if (seedStrategy === 'corners') {
      for (const [x, y] of cornerCoords) enqueue(x, y);
    } else {
      // Seed from entire border for robustness
      for (let x = 0; x < width; x++) { enqueue(x, 0); enqueue(x, height - 1); }
      for (let y = 0; y < height; y++) { enqueue(0, y); enqueue(width - 1, y); }
    }

    // 4-neighborhood flood fill
    while (queue.length) {
      const [x, y] = queue.shift();
      enqueue(x + 1, y);
      enqueue(x - 1, y);
      enqueue(x, y + 1);
      enqueue(x, y - 1);
    }

    // Create a mask: background=0, foreground=255
    const mask = Buffer.alloc(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        mask[idx] = visited[idx] ? 0 : 255;
      }
    }

    // Determine trim crop from mask if requested
    let crop = null;
    if (trim) {
      let minX = width;
      let maxX = -1;
      let minY = height;
      let maxY = -1;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          if (mask[idx] > 0) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX >= minX && maxY >= minY) {
        minX = Math.max(0, minX - pad);
        minY = Math.max(0, minY - pad);
        maxX = Math.min(width - 1, maxX + pad);
        maxY = Math.min(height - 1, maxY + pad);
        crop = {
          left: minX,
          top: minY,
          width: maxX - minX + 1,
          height: maxY - minY + 1,
        };
      }
    }

    // Optional feather using sharp's blur on the mask, then crop to selection
    let maskImg = sharp(mask, { raw: { width, height, channels: 1 } });
    if (feather > 0) {
      maskImg = maskImg.blur(feather);
    }
    if (crop) {
      maskImg = maskImg.extract(crop);
    }
    const maskBuffer = await maskImg.toBuffer();
    const outWidth = crop ? crop.width : width;
    const outHeight = crop ? crop.height : height;

    let basePipeline = sharp(inputPath).ensureAlpha();
    if (crop) {
      basePipeline = basePipeline.extract(crop);
    }

    await basePipeline
      .removeAlpha()
      .joinChannel(maskBuffer, { raw: { width: outWidth, height: outHeight, channels: 1 } })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(outputPath);

    console.log(`Saved: ${outputPath}\n` +
      `Background (estimated): rgb(${bg[0]}, ${bg[1]}, ${bg[2]}) | tol=${tol} | feather=${feather} | seed=${seedStrategy} | trim=${Boolean(crop)} | pad=${pad}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
