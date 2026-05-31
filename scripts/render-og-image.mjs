import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const svg = readFileSync(join(here, "og-image.svg"));
const out = join(here, "..", "public", "og-image.png");

await sharp(svg, { density: 144 })
  .resize(1200, 630, { fit: "fill" })
  .png()
  .toFile(out);

const meta = await sharp(out).metadata();
console.log(`Wrote ${out} — ${meta.width}x${meta.height}`);
