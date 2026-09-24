import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const archiveDir = path.join(process.cwd(), 'archive', 'assets');
if (!fs.existsSync(archiveDir)) {
  fs.mkdirSync(archiveDir, { recursive: true });
}

// 1. Optimize logo-sticker.png
const stickerPath = path.join(process.cwd(), 'public', 'icons', 'logo-sticker.png');
const stickerBackup = path.join(archiveDir, 'logo-sticker-original.png');
if (!fs.existsSync(stickerBackup)) {
  fs.copyFileSync(stickerPath, stickerBackup);
  console.log(`Backed up original logo-sticker.png to ${stickerBackup}`);
}

const stickerBuf = await sharp(stickerBackup)
  .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9, quality: 90 })
  .toBuffer();

fs.writeFileSync(stickerPath, stickerBuf);
console.log(`Optimized logo-sticker.png: ${stickerBuf.length} bytes (was 672115 bytes)`);

// 2. Optimize x-29-adv-logo.jpeg
const logoPath = path.join(process.cwd(), 'public', 'icons', 'x-29-adv-logo.jpeg');
const logoBackup = path.join(archiveDir, 'x-29-adv-logo-original.jpeg');
if (!fs.existsSync(logoBackup)) {
  fs.copyFileSync(logoPath, logoBackup);
  console.log(`Backed up original x-29-adv-logo.jpeg to ${logoBackup}`);
}

const logoBuf = await sharp(logoBackup)
  .resize(192, 192, { fit: 'cover' })
  .jpeg({ quality: 85, mozjpeg: true })
  .toBuffer();

fs.writeFileSync(logoPath, logoBuf);
console.log(`Optimized x-29-adv-logo.jpeg: ${logoBuf.length} bytes (was 88550 bytes)`);
