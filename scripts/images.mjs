// Génère les images web (WebP) à partir des originaux de photos-src/.
// Photos : 960 px et 1920 px de large, qualité 74. Écussons : 160 px.
import sharp from "sharp";
import { readdirSync, mkdirSync } from "node:fs";
import { join, parse } from "node:path";

const SRC = "photos-src";
mkdirSync("public/img", { recursive: true });
mkdirSync("public/crests", { recursive: true });

for (const f of readdirSync(SRC)) {
  const { name, ext } = parse(f);
  if (!/\.(jpe?g|png)$/i.test(ext)) continue;
  const input = join(SRC, f);
  if (name.startsWith("crest-")) {
    await sharp(input).resize(160, 160, { fit: "inside" }).webp({ quality: 85 }).toFile(`public/crests/${name.slice(6)}.webp`);
    continue;
  }
  for (const w of [960, 1920]) {
    await sharp(input).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 74 }).toFile(`public/img/${name}-${w}.webp`);
  }
}
console.log("Images générées.");
