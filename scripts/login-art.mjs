// ─────────────────────────────────────────────────────────────────────────────
// THE LOGIN PANEL'S PHOTOGRAPHY — sources in, web assets out.
//
//   npm run art:login
//
// The plates arrive from the image brief as ~2MB PNGs. PNG is the wrong
// container for a photograph — it is lossless, so it pays full price for sensor
// grain nobody can see — and these load on the sign-in screen of an app used on
// Kenyan mobile data. So the committed sources live in art/login/ (NOT served)
// and this script writes the WebP the app actually requests into
// public/images/login/.
//
// ── WHY THIS EXISTS AT ALL, AND WHY THE PATH MATTERS ────────────────────────
// src/lib/artwork.js asks for `/images/login/<id>.webp`, which is served from
// THIS project's public/ directory. The sources had been dropped into the
// Connected Suite's public/images/login/ instead — a different repo, a different
// deployment, a different origin. Nothing was broken and nothing 404'd in a way
// anyone would notice: vercel.json rewrites `/(.*)` to the SPA shell, so the
// missing .webp came back as index.html with HTTP 200, failed to decode, and
// IntroSlider quietly fell through to its tenant gradient. A panel that looks
// deliberately plain is indistinguishable from a panel whose art never shipped.
//
// ── THE ENCODE ───────────────────────────────────────────────────────────────
// 1400px wide is the panel's real ceiling: it occupies col-xl-8 — two thirds of
// the viewport — so on a 1920 screen it paints about 1280 CSS pixels, and the
// slides are object-fit: cover, which crops rather than upscales. Quality 80
// with effort 6 lands these around 120–180kB, which is the budget artwork.js
// names for something that loads before a customer can sign in.
//
// No JPEG twin here, unlike scripts/optimize-portal-bg.ts in the Suite. That
// asset is the FIRST paint of a funnel and buys its fallback cheaply; this one
// sits behind an <img onError> that already degrades to the tenant gradient, and
// every browser that can run this React 18 bundle decodes WebP.
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC_DIR = "art/login";
const OUT_DIR = "public/images/login";
const WIDTH = 1400;

async function main() {
  const entries = (await fs.readdir(SRC_DIR)).filter((f) => /\.(png|jpe?g|webp|tiff?)$/i.test(f));
  if (entries.length === 0) {
    console.error(`No source images in ${SRC_DIR}/ — nothing to do.`);
    process.exit(1);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  for (const file of entries.sort()) {
    const src = await fs.readFile(path.join(SRC_DIR, file));
    const meta = await sharp(src).metadata();

    const out = await sharp(src)
      .resize({ width: WIDTH, withoutEnlargement: true })
      .webp({ quality: 80, effort: 6 })
      .toBuffer();

    const name = `${path.basename(file, path.extname(file))}.webp`;
    await fs.writeFile(path.join(OUT_DIR, name), out);

    const outMeta = await sharp(out).metadata();
    console.log(
      `${file.padEnd(24)} ${meta.width}×${meta.height} ${(src.length / 1024 / 1024).toFixed(2)}MB` +
        `  →  ${name.padEnd(24)} ${outMeta.width}×${outMeta.height} ${(out.length / 1024).toFixed(0)}kB` +
        `  (${(100 - (out.length / src.length) * 100).toFixed(0)}% smaller)`,
    );
  }

  // The panel names four plates; two have been commissioned. Say which are still
  // missing rather than leaving it to be discovered on a projector — each one
  // absent is a slide that renders as a flat tenant gradient.
  const have = new Set((await fs.readdir(OUT_DIR)).map((f) => f.toLowerCase()));
  const wanted = ["ke-mama-mboga.webp", "ke-fundi.webp", "ke-duka.webp", "ke-boda.webp"];
  const missing = wanted.filter((w) => !have.has(w));
  if (missing.length) {
    console.log(
      `\n  Still to come (src/lib/artwork.js carries the prompt for each):\n` +
        missing.map((m) => `    · ${m}`).join("\n") +
        `\n  Those slides fall back to the tenant gradient until the file lands.\n`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
