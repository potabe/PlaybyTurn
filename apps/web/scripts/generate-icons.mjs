/**
 * scripts/generate-icons.mjs
 * Generates all PWA icon sizes from the source image.
 * Run: node scripts/generate-icons.mjs
 */

import sharp from "sharp";
import { existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(
  __dirname,
  "../../..",
  "C:/Users/Primananda/.gemini/antigravity/brain/9c9256d4-476c-43a5-bbc3-4b9241650e30/urturn_app_icon_1779729755912.png"
);
const OG_SRC = resolve(
  __dirname,
  "../../..",
  "C:/Users/Primananda/.gemini/antigravity/brain/9c9256d4-476c-43a5-bbc3-4b9241650e30/urturn_og_image_1779729778726.png"
);
const DEST = resolve(__dirname, "../public/icons");
const OG_DEST = resolve(__dirname, "../public");

if (!existsSync(DEST)) mkdirSync(DEST, { recursive: true });

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of SIZES) {
  await sharp(SRC)
    .resize(size, size, { fit: "cover" })
    .png()
    .toFile(`${DEST}/icon-${size}x${size}.png`);
  console.log(`✅ icon-${size}x${size}.png`);
}

// Apple touch icon (180x180)
await sharp(SRC)
  .resize(180, 180, { fit: "cover" })
  .png()
  .toFile(`${DEST}/apple-touch-icon.png`);
console.log("✅ apple-touch-icon.png");

// Favicon (32x32)
await sharp(SRC)
  .resize(32, 32, { fit: "cover" })
  .png()
  .toFile(`${OG_DEST}/favicon-32x32.png`);
console.log("✅ favicon-32x32.png");

// Favicon (16x16)
await sharp(SRC)
  .resize(16, 16, { fit: "cover" })
  .png()
  .toFile(`${OG_DEST}/favicon-16x16.png`);
console.log("✅ favicon-16x16.png");

// OG image
await sharp(OG_SRC)
  .resize(1200, 630, { fit: "cover" })
  .jpeg({ quality: 90 })
  .toFile(`${OG_DEST}/og-image.jpg`);
console.log("✅ og-image.jpg");

console.log("\n🎉 All icons generated!");
