// ─────────────────────────────────────────────────────────────────────────────
// TWO BRANDS, IN ORDER — the ecosystem, then the lender.
//
// This app sits at the apex of the ecosystem, so the first thing a customer sees
// is MICRO EAZY: the promise, the three commitments, the install. Only once we
// know which lender they belong to does the app repaint in that lender's colours
// and carry their name for the rest of the session.
//
// It is the same move the staff side already makes — microeazy.servicesuitecloud
// .com/login shows the ecosystem, then hands the person to their own branded
// console — and it exists for the same reason. The ecosystem is what is being
// sold; the lender is who the customer actually banks with. Showing only the
// second makes this look like one company's app. Showing only the first makes a
// customer wonder who is holding their money.
//
// ── THE BUG THIS FILE FIXES ──────────────────────────────────────────────────
// EntityCinfigurations returns a JSON **ARRAY** — `[{ EntityName, … }]`. The
// previous inline fetch in App.jsx read `data.EntityName` straight off the
// response, which on an array is `undefined`, so every field written to
// localStorage was undefined and the tenant theme never applied. Verified live
// against entity 3002 on 25 Aug 2026. `first()` below is the whole fix, and the
// reason this lives in one tested place instead of inline in a component.
// ─────────────────────────────────────────────────────────────────────────────

/** Micro Eazy's own tokens. Kept in sync with connected-suite/src/lib/microeazy/brand.ts. */
export const ECOSYSTEM = {
  name: 'Micro Eazy',
  tagline: 'Quick Loans. Better Living.',
  description:
    'Apply in minutes, get a decision you can see the reasons for, and repay from your phone.',
  colors: {
    navy: '#012863',
    navyDeep: '#00043a',
    /** Fills and gradients. NEVER a bed for white text — 3.90:1. */
    green: '#25950c',
    /** The call to action: navy type on this clears AA at 6.65:1. */
    lime: '#77c60b',
    /** Green TYPE on white needs this darker value — 5.47:1. */
    greenInk: '#1d7a09',
    paper: '#ffffff',
  },
  gradient: 'linear-gradient(165deg, #012863 0%, #00043a 100%)',
};

// ── THE ENTITY ID — one place, and this is it ────────────────────────────────
//
// 3005 is MICROMART FINTECH. It is the entity the Connected Suite is already
// pointed at (SERVICESUITE_ENTITYID_MICROMART=3005, MICROMART_FINTECH_ENTITYID
// =3005), and therefore the one whose book the six staff systems read.
//
// The app previously hard-coded "3002" — Micromart Africa Limited — in five
// separate files. That is a DIFFERENT entity with a different customer base and
// a different product list, so the borrower app and the staff console were
// showing two different books. Anything demonstrated on one would not reconcile
// against the other. Everything now reads this constant.
export const ENTITY_ID = import.meta.env.VITE_ENTITY_ID || '3005';

const CONFIG_URL =
  'https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/EntityCinfigurations';
const CACHE_KEY = 'configuration';

/**
 * Branding that is present but unusable.
 *
 * Entity 3005's configuration row is not filled in on Micromart's side: it
 * answers `primaryColor` and `secondaryColor` both `#000000`, and `ggDriveFolder`
 * the literal string "Failed". Those are VALUES, not absences, so a plain
 * `||` fallback accepts them and paints a black-on-black interface.
 *
 * Verified live, 25 Aug 2026. When Micromart fills the row in, this predicate
 * stops matching on its own and the real colours apply with no code change.
 */
function isUnusableColor(hex) {
  if (typeof hex !== 'string') return true;
  const v = hex.trim().toLowerCase();
  return v === '' || v === '#000000' || v === '#000' || v === '#ffffff' || v === '#fff';
}

/** A Google Drive file id becomes an <img> src. */
export const driveImage = (id) =>
  id ? `https://drive.google.com/uc?export=view&id=${id}` : null;

/**
 * The endpoint answers with an array of one. Tolerate both shapes rather than
 * asserting either — this is somebody else's API and it has changed before.
 */
function first(payload) {
  if (Array.isArray(payload)) return payload[0] || null;
  if (payload && typeof payload === 'object') return payload;
  return null;
}

/**
 * The `configuration` object as it has always been stored.
 *
 * DO NOT CHANGE THESE KEY NAMES. Eight call sites across Profile, Calculator,
 * Loan and LoanApplication read `configurationDataJson.EntityId` and
 * `.driveFolder` straight out of localStorage. This function exists so the
 * array fix could land without touching any of them.
 */
function toLegacyShape(raw) {
  const r = raw || {};
  return {
    EntityId: String(ENTITY_ID),
    EntityName: r.EntityName,
    primaryColor: r.primaryColor,
    secondaryColor: r.secondaryColor,
    // The API calls it ggDriveFolder; the cache has always called it driveFolder.
    driveFolder: cleanFolder(r.ggDriveFolder ?? r.driveFolder),
    PrimaryLogo: r.PrimaryLogo,
    lightLogo: r.lightLogo,
    logoIcon: r.logoIcon,
  };
}

/** "Failed" is what the API returns for a folder it could not resolve. */
function cleanFolder(v) {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return !s || s.toLowerCase() === 'failed' ? null : s;
}

/** The shape THIS module's consumers use. Never has undefined members. */
function normalise(raw) {
  const r = raw || {};
  // Fall back to the ecosystem palette when the lender's row is blank OR
  // unusable — see isUnusableColor(). Micro Eazy navy is a defensible ground
  // for any lender; #000000 on #000000 is not an interface.
  const primary = isUnusableColor(r.primaryColor) ? ECOSYSTEM.colors.navy : r.primaryColor;
  const secondary = isUnusableColor(r.secondaryColor) ? ECOSYSTEM.colors.green : r.secondaryColor;

  return {
    entityId: String(ENTITY_ID),
    name: r.EntityName || 'your lender',
    /**
     * EntityCinfigurations does not carry a tagline, and "Exceeding The
     * Incredible" was hard-coded into the sign-in page in two places. It is
     * configuration rather than a constant so the next lender on this app does
     * not inherit Micromart's strapline; empty simply renders nothing.
     */
    tagline: import.meta.env.VITE_LENDER_TAGLINE || '',
    primary,
    secondary,
    driveFolder: cleanFolder(r.ggDriveFolder ?? r.driveFolder),
    logo: driveImage(r.PrimaryLogo),
    logoLight: driveImage(r.lightLogo),
    icon: driveImage(r.logoIcon),
    /** False when we fell back to defaults — the UI can stay ecosystem-branded. */
    resolved: Boolean(r.EntityName),
    /**
     * True when the lender's colours were rejected rather than absent. Surfaced
     * so the app can say "branding not configured" in a diagnostic rather than
     * silently looking like Micro Eazy and leaving somebody to wonder why.
     */
    brandingFellBack: isUnusableColor(r.primaryColor),
  };
}

/** Whatever was cached last time, so a repeat visit repaints on the first frame. */
export function cachedTenant() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const tenant = normalise(parsed);
    // A cache written before the array fix has EntityName undefined. Treating it
    // as unresolved keeps the UI on ecosystem branding for the one frame before
    // loadTenant() replaces it, instead of flashing "your lender".
    return tenant.resolved ? tenant : null;
  } catch {
    return null;
  }
}

/**
 * Resolve the lender behind this deployment.
 *
 * Always returns a usable tenant. A failure here must never block the app: the
 * customer's loan does not depend on our knowing what colour to paint the
 * header, so a network error degrades to ecosystem branding and carries on.
 */
export async function loadTenant() {
  try {
    const res = await fetch(CONFIG_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: '',
        entityId: parseInt(ENTITY_ID, 10),
        requestFlag: 0,
      }),
    });
    if (!res.ok) throw new Error(`EntityCinfigurations ${res.status}`);

    const raw = first(await res.json());

    // Written in the LEGACY shape, because the rest of the app reads this key
    // directly. See toLegacyShape().
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(toLegacyShape(raw)));
    } catch {
      /* private mode, quota — the app works without the cache */
    }
    return normalise(raw);
  } catch (e) {
    console.warn('[tenant] falling back to ecosystem branding:', e.message);
    return cachedTenant() || normalise(null);
  }
}

/**
 * Paint the lender's colours onto the document.
 *
 * Written as CSS custom properties on :root so the whole Bootstrap/adminuiux
 * sheet follows without a rebuild, and so the ecosystem tokens stay available
 * alongside them — the two brands coexist on the same page rather than one
 * replacing the other.
 */
export function applyTenantTheme(tenant) {
  if (typeof document === 'undefined' || !tenant) return;
  const root = document.documentElement;

  root.style.setProperty('--tenant-primary', tenant.primary);
  root.style.setProperty('--tenant-secondary', tenant.secondary);
  root.style.setProperty('--bs-primary', tenant.primary);
  root.style.setProperty('--adminuiux-primary', tenant.primary);

  root.style.setProperty('--eazy-navy', ECOSYSTEM.colors.navy);
  root.style.setProperty('--eazy-lime', ECOSYSTEM.colors.lime);
  root.style.setProperty('--eazy-green-ink', ECOSYSTEM.colors.greenInk);

  // The browser chrome follows the lender too — on a phone in standalone mode
  // this is the status-bar colour, and it is the most visible half-second of the
  // whole handoff.
  // ── The template's own theme classes ──────────────────────────────────────
  // adminuiux paints .btn-theme, .text-theme-1 and friends from compiled CSS,
  // not from custom properties, so setting --bs-primary alone leaves the Sign In
  // button the template's stock brown on every lender's app. One injected rule
  // re-points those classes at the tenant colour. Kept as a single <style> node
  // that is replaced rather than appended, so repeated calls cannot stack.
  let sheet = document.getElementById('tenant-theme');
  if (!sheet) {
    sheet = document.createElement('style');
    sheet.id = 'tenant-theme';
    document.head.appendChild(sheet);
  }
  sheet.textContent = `
    .btn-theme, .btn-theme-1 {
      background-color: ${tenant.primary} !important;
      border-color: ${tenant.primary} !important;
      color: #fff !important;
    }
    .text-theme-1, .text-theme { color: ${tenant.primary} !important; }
    .bg-theme-1 { background-color: ${tenant.primary} !important; }
    a { color: ${tenant.primary}; }
  `;

  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = tenant.primary;

  if (tenant.resolved) document.title = `${tenant.name} · ${ECOSYSTEM.name}`;
}
