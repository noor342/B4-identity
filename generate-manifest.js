#!/usr/bin/env node
/* ─────────────────────────────────────────────
   generate-manifest.js
   Scans ./assets for media files and writes
   assets/manifest.json (no dependencies).
   Usage:  node generate-manifest.js
   ───────────────────────────────────────────── */

const fs   = require('fs');
const path = require('path');

const ASSETS_DIR    = path.join(__dirname, 'assets');
const MANIFEST_FILE = path.join(ASSETS_DIR, 'manifest.json');

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const GIF_EXTS   = new Set(['.gif']);
const VIDEO_EXTS = new Set(['.mp4', '.webm', '.mov']);

function getType(ext) {
  if (VIDEO_EXTS.has(ext)) return 'video';
  return 'image';                               // covers images + GIFs
}

// Natural/numeric-aware sort
function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

// ── Main ──
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  console.log('Created assets/ directory.');
}

const files = fs.readdirSync(ASSETS_DIR)
  .filter(function (f) {
    if (f === 'manifest.json') return false;
    if (f.startsWith('.'))     return false;
    var ext = path.extname(f).toLowerCase();
    return IMAGE_EXTS.has(ext) || GIF_EXTS.has(ext) || VIDEO_EXTS.has(ext);
  })
  .sort(naturalSort);

var manifest = files.map(function (file) {
  return {
    file: file,
    type: getType(path.extname(file).toLowerCase())
  };
});

fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf-8');

console.log('');
console.log('  ✓  manifest.json generated  —  ' + manifest.length + ' item(s)');
console.log('');

if (manifest.length === 0) {
  console.log('  ⚠  The assets/ folder is empty.');
  console.log('     Drop your media files there, then run this script again.');
  console.log('');
} else {
  manifest.forEach(function (item, i) {
    console.log('     ' + String(i + 1).padStart(3) + '. [' + item.type + ']  ' + item.file);
  });
  console.log('');
}
