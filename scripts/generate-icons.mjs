// scripts/generate-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "public", "logo.svg");
const OUT = join(ROOT, "public", "icons");

mkdirSync(OUT, { recursive: true });

const sizes = [16, 32, 48, 180, 192, 512];

for (const size of sizes) {
  await sharp(SRC)
    .resize(size, size)
    .png()
    .toFile(join(OUT, `icon-${size}.png`));
  console.log(`✓ icon-${size}.png`);
}

console.log("Done.");
