// ─────────────────────────────────────────────────────────────────────────────
// Generate the Micro Eazy app icon set from the master lockup.
//
//   node scripts/brand-icons.mjs
//
// ── THE BUG THIS EXISTS TO FIX ───────────────────────────────────────────────
// The icons that shipped were PALETTE PNGs with no tRNS chunk — opaque, every
// one of them, with the mark sitting on a hard white square. On Windows 11's
// dark Start menu and in a dark macOS dock that reads as a white sticker stuck
// onto the UI, which is exactly what it looked like next to the other apps.
//
// `logo-transparent.png` is the only asset with a real alpha channel, so it is
// the source of truth. Everything below is derived from it; nothing is hand-cut.
//
// ── WHAT GETS MADE, AND WHY EACH ONE IS DIFFERENT ────────────────────────────
//
//   icon-192 / icon-512      purpose "any" — TRANSPARENT. This is the one that
//                            sits in the Start menu and the taskbar, and the
//                            transparency is the entire point.
//
//   icon-maskable-512        purpose "maskable" — Android and Chrome CROP this
//                            to whatever shape the launcher uses (circle,
//                            squircle, rounded square). A transparent maskable
//                            icon gets cropped to a transparent blob, so this
//                            one is deliberately FILLED, with the mark inside
//                            the 80% safe zone the spec reserves.
//
//   apple-touch-icon         iOS ignores alpha and composites onto BLACK, so a
//                            transparent icon there renders as a black tile.
//                            Filled for the same reason as above.
//
//   Both filled tiles use BRAND_TILE, not navy — see the note on that constant.
//
//   favicon                  32px, transparent, for the browser tab.
//
// The mark is cropped out of the lockup by scanning the alpha channel rather
// than by hard-coded pixel offsets, so re-exporting the logo at another size
// does not silently produce a lopsided icon.
// ─────────────────────────────────────────────────────────────────────────────
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SRC = "public/brand/micro-eazy/logo-transparent.png";
const OUT = "public/brand/micro-eazy";

/** Deep navy, sampled from the lockup — the darkest brand colour by area. */
const BRAND_NAVY = "#002060";

/**
 * The tile colour for the two icons that CANNOT be transparent.
 *
 * Not navy, which was the first instinct and was wrong: half the mark is navy
 * #002060, so a navy tile swallowed the left stroke of the M entirely. Not pure
 * white either — a hard #FFF square is the "sticker stuck on the desktop" look
 * this whole exercise is about. A very light cool neutral reads as a deliberate
 * brand tile and lets both the navy and the green hold their edges.
 */
const BRAND_TILE = { r: 0xf4, g: 0xf7, b: 0xfc, alpha: 1 };

/**
 * The wordmark sits to the right of the mark. This is the fraction of the
 * canvas width to search within for the mark's own alpha bounds — past the
 * arrow tip, short of the "M" of "Micro". Measured, not guessed: the arrow tip
 * ends at 0.449 of the width and the "M" of "Micro" begins at 0.484, so this
 * sits in the gap. Widen it and the icon grows a sliver of somebody else's
 * letter down its right edge.
 */
const MARK_SEARCH_WIDTH = 0.455;

/**
 * And stop above the tagline. "Quick Loans. Better Living." runs the full width
 * of the lockup, so a full-height alpha scan drags its underline and the top of
 * a "Q" into the icon's bounding box and shoves the mark off-centre.
 */
// The mark's own foot sits at 0.674 of the height and the tagline's green dash
// begins at 0.723, so the cut goes between them. At 0.72 a speck of that dash
// survived in the bottom-right of every transparent icon.
const MARK_SEARCH_HEIGHT = 0.70;

/** Breathing room around the mark inside a square icon. */
const ANY_PADDING = 0.06;

/**
 * Maskable icons are cropped to a shape by the launcher. The spec guarantees
 * only the middle 80% survives, so the mark is sized to sit inside that circle.
 */
const MASKABLE_SAFE = 0.62;

/** Alpha bounding box of a region — where the actual ink is. */
async function alphaBounds(src, searchWidthFraction, searchHeightFraction) {
  const img = sharp(src).ensureAlpha();
  const { width, height } = await img.metadata();
  const limit = Math.round(width * searchWidthFraction);
  const vLimit = Math.round(height * searchHeightFraction);

  const raw = await sharp(src).ensureAlpha().extract({ left: 0, top: 0, width: limit, height: vLimit }).raw().toBuffer();

  let minX = limit, minY = vLimit, maxX = -1, maxY = -1;
  for (let y = 0; y < vLimit; y++) {
    for (let x = 0; x < limit; x++) {
      // 24 rather than 0: the lockup has a faint antialiased halo, and treating
      // it as ink pads every icon with invisible slack.
      if (raw[(y * limit + x) * 4 + 3] > 24) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error("No opaque pixels found — is the source really transparent?");
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/** The mark, trimmed to its ink, as a PNG buffer with alpha intact. */
async function markBuffer() {
  const box = await alphaBounds(SRC, MARK_SEARCH_WIDTH, MARK_SEARCH_HEIGHT);
  console.log(`  mark found at ${box.width}×${box.height} (x${box.left}, y${box.top})`);
  return sharp(SRC).ensureAlpha().extract(box).png().toBuffer();
}

/** Centre the mark on a square canvas at `scale` of the canvas, over `background`. */
async function square(mark, size, scale, background) {
  const inner = Math.round(size * scale);
  const fitted = await sharp(mark)
    .resize(inner, inner, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  const meta = await sharp(fitted).metadata();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: fitted,
        left: Math.round((size - meta.width) / 2),
        top: Math.round((size - meta.height) / 2),
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function main() {
  await mkdir(OUT, { recursive: true });
  console.log(`\n  Micro Eazy icon set  \x1b[2m← ${SRC}\x1b[0m`);

  const mark = await markBuffer();
  const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
  const tile = BRAND_TILE;

  const jobs = [
    ["icon-192.png", 192, 1 - ANY_PADDING * 2, transparent, "transparent"],
    ["icon-512.png", 512, 1 - ANY_PADDING * 2, transparent, "transparent"],
    ["icon-maskable-512.png", 512, MASKABLE_SAFE, tile, "brand tile, 80% safe zone"],
    ["apple-touch-icon.png", 180, 0.74, tile, "brand tile (iOS flattens alpha to black)"],
    ["favicon-32.png", 32, 1, transparent, "transparent"],
    ["favicon-64.png", 64, 1, transparent, "transparent"],
  ];

  for (const [name, size, scale, bg, note] of jobs) {
    const buf = await square(mark, size, scale, bg);
    await sharp(buf).toFile(`${OUT}/${name}`);
    console.log(`  \x1b[32m✓\x1b[0m ${name.padEnd(24)} ${String(size).padStart(3)}px  \x1b[2m${note}\x1b[0m`);
  }

  // A wide lockup for the splash screen and the sign-in header, capped so a
  // 443KB PNG is not shipped to a phone on Kenyan mobile data.
  await sharp(SRC).ensureAlpha().resize(720, null, { fit: "inside" }).png({ compressionLevel: 9, quality: 90 }).toFile(`${OUT}/lockup-720.png`);
  console.log(`  \x1b[32m✓\x1b[0m ${"lockup-720.png".padEnd(24)} 720px  \x1b[2mtransparent wordmark lockup\x1b[0m`);

  console.log("");
}

main().catch((e) => {
  console.error(`\n  ${e.message}\n`);
  process.exit(1);
});
