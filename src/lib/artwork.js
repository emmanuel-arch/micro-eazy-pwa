// ─────────────────────────────────────────────────────────────────────────────
// THE LOGIN PANEL — Kenya, on the right-hand half of the sign-in screen.
//
// Every lender in the ecosystem reuses THIS app. Nothing below is Micromart's:
// the colours come from the tenant record and the pictures are of the people who
// actually borrow here. A second lender changes an entity id and gets their own
// palette over the same photography, which is the point.
//
// ── WHY THE PANEL IS CURRENTLY A FLAT BROWN RECTANGLE ────────────────────────
// `public/assets/img/background-image/background-image-8.jpg` is not a JPEG. It
// is an HTML document — 111KB of `<!doctype html>` — saved with a .jpg
// extension, almost certainly a download that captured an error page. The
// browser cannot decode it, renders nothing, and the theme colour behind it
// shows through as the brown box on the live site today.
//
// It also hid itself twice over: the eleven REAL photographs in that folder are
// all misspelled `backgorund-image-N.jpg`, so the one correctly-spelled name was
// the broken one; and Vercel's SPA rewrite answers `/(.*)` with index.html, so
// requesting the file returns HTTP 200 and looks fine in a network tab.
//
// ── THE COMPOSITION RULE, WHICH IS NOT THE SUITE'S ───────────────────────────
// On the staff doors the sign-in card sits ON the artwork, so those plates keep
// their left third dark and empty. Here the card is in its own column and the
// photograph owns a full half — but the slider's copy is centred over it. So the
// rule for these is: KEEP THE CENTRE CALM. Subject to one side, or far enough
// back that a heading can sit across the middle without landing on a face.
//
// Every image is optional. With none of them present the panel renders a tenant
// gradient and reads as deliberate, so the app is never broken while photography
// is being commissioned.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Where the panel's photographs live. Optional by design — see the note above.
 *
 * `file` is served from /public. Supply WebP; a 1600×1800 portrait-ish crop at
 * quality 80 lands around 120–180kB, which is the right budget for something
 * that loads before a customer can sign in.
 */
export const PANEL_ART = [
  {
    id: 'mama-mboga',
    file: '/images/login/ke-mama-mboga.webp',
    title: 'Your business does not wait. Neither should your loan.',
    description:
      'Apply in minutes from your phone and get a decision you can see the reasons for.',
    alt: 'A Kenyan grocer arranging produce at her stall in the early morning.',
    prompt:
      'Editorial photograph, early morning golden light. A confident Kenyan woman in her forties — a mama mboga — arranging tomatoes and sukuma wiki at her roadside vegetable stall in Nairobi. Deep, rich dark skin rendered with true warmth and detail, never washed out or greyed. She is mid-task and unposed, glancing off-camera, quietly capable. Subject sits in the RIGHT third of the frame; the LEFT and CENTRE fall away into softly blurred market depth so a heading can sit across the middle without touching her face. Natural documentary colour, shallow depth of field, 35mm. No text, no logos, no watermark, no badge of any kind.',
  },
  {
    id: 'fundi',
    file: '/images/login/ke-fundi.webp',
    title: 'Tools, stock, rent — funded the same day.',
    description:
      'Working capital that arrives when the job does, repaid from the phone in your pocket.',
    alt: 'A Kenyan craftsman measuring timber in his workshop.',
    prompt:
      'Editorial photograph, warm workshop light through a doorway. A Kenyan fundi — a skilled carpenter in his thirties — measuring a length of timber in his open-air workshop, sawdust suspended in a shaft of light. Deep dark skin lit with warmth and clear detail in the shadows. Focused on the work, not the camera. Subject occupies the RIGHT of the frame; the LEFT and CENTRE recede into soft workshop depth. Honest documentary colour, no orange grade, shallow depth of field, 50mm. No text, no logos, no watermark, no badge of any kind.',
  },
  {
    id: 'duka-owner',
    file: '/images/login/ke-duka.webp',
    title: 'Every decision explained. Never a silent no.',
    description:
      'See exactly what your limit is built from — and what would move it.',
    alt: 'A Kenyan shopkeeper checking stock on her phone behind the counter.',
    prompt:
      'Editorial photograph, soft interior daylight. A Kenyan woman in her thirties behind the counter of her duka — a small neighbourhood shop — checking something on her phone, shelves of stock softly out of focus behind her. Deep dark skin rendered warmly with genuine detail and catchlight in the eyes. Calm, self-possessed, mid-thought. She sits to the RIGHT; the CENTRE of the frame is quiet shop interior. Natural colour, shallow depth of field, 35mm. No text, no logos, no watermark, no badge of any kind.',
  },
  {
    id: 'boda-rider',
    file: '/images/login/ke-boda.webp',
    title: 'Repay from your phone, wherever the day takes you.',
    description:
      'M-Pesa STK, standing orders and a statement you can actually read.',
    alt: 'A Kenyan boda boda rider pausing beside his motorcycle at dusk.',
    prompt:
      'Editorial photograph, late afternoon light. A young Kenyan boda boda rider standing beside his motorcycle at the edge of a busy Nairobi street, helmet under one arm, taking a moment. Deep dark skin with warm, true-to-life rendering and detail retained in the shadows. Dignified and unhurried, not a stock smile. Subject to the RIGHT of frame; the LEFT and CENTRE are softly blurred street depth and warm bokeh. Documentary colour, shallow depth of field, 50mm. No text, no logos, no watermark, no badge of any kind.',
  },
];

/**
 * A tenant-coloured gradient, used behind every plate and ALONE when no
 * photograph has been supplied yet.
 *
 * Built from the lender's own two colours so a second lender's panel is theirs
 * without any new artwork at all.
 */
export function panelGradient(tenant) {
  const a = tenant?.primary || '#012863';
  const b = tenant?.secondary || '#25950c';
  return `linear-gradient(150deg, ${a} 0%, ${a} 42%, ${b} 140%)`;
}

/**
 * The scrim that makes white type legible on ANY photograph.
 *
 * Heavier through the middle than at the edges, because that is exactly where
 * the slider's heading sits. Without this the copy is unreadable on a light
 * frame and nobody notices until it is on a projector.
 */
export const PANEL_SCRIM =
  'linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.62) 45%, rgba(0,0,0,0.72) 100%)';
