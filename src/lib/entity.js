// ─────────────────────────────────────────────────────────────────────────────
// THE ENTITY POLICY — which of Micromart's books a request belongs to.
//
// Ten companies share one ServiceSuite database, partitioned only by EntityID.
// Every Mobile/Application/* endpoint reads it to decide WHICH BOOK answers, so
// an app that sends the wrong value does not get an error — it gets somebody
// else's product list, or none at all.
//
// ── WHAT THIS FILE USED TO SAY, AND WHY IT WAS THE WRONG SHAPE ──────────────
// It exported ONE number, ENTITY_ID, read from VITE_ENTITY_ID at build time.
// That is a build-time answer to a per-customer question. This app serves BOTH
// of Micromart's books, and which one a customer belongs to is a fact about
// that customer, discovered when they sign in.
//
// Pinning the build to 3005 locks out every Micromart Africa customer. Pinning
// it to 3002 locks out the fintech book — and it silently did, because four
// screens (Login, Password, Register, Settings) never imported this file at all
// and carried their own `const entityId = "3002"`. Correcting the number would
// not have fixed anything; the shape had to change.
//
// ── THE RULE ────────────────────────────────────────────────────────────────
// Look the customer up across every book this app serves, then:
//
//   in BOTH books   → refuse, and say to contact admin. Two records for one
//                     person is a data fault; guessing which to open shows
//                     somebody a balance that may not be theirs.
//   in ONE book     → scope the whole session to that book. Every later call
//                     carries it.
//   in NEITHER      → offer registration.
//
// The lookup needs the network, so it lives in ./signin.js. This file only says
// which books exist and which to assume before we know.
//
// ── THREE ENTITIES THAT ARE NOT THE SAME THING ──────────────────────────────
//   MICROMART_ENTITIES      the books to search at sign-in
//   DEFAULT_ENTITY_ID       the book to assume BEFORE sign-in — branding, the
//                           splash, anything drawn before we know who is holding
//                           the phone
//   REGISTRATION_ENTITY_ID  the book a NEW self-service customer joins
//
// Conflating them is how `EntityId: 7` survived in production: one number was
// asked to mean four things and was wrong for three of them.
// ─────────────────────────────────────────────────────────────────────────────

/** Parse a comma-separated list of entity ids, dropping anything implausible.
 *  The Int32 ceiling is deliberate: a phone number parsed as an entity
 *  overflows it, which is the bug that made AvailableLoanProducts return
 *  nothing — parseInt("254721797735") is not an entity, it is an MSISDN. */
function parseEntityList(raw, fallback) {
  const out = String(raw ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0 && n <= 2147483647);
  return out.length ? out : fallback;
}

/**
 * The books this app serves, in the order they are searched.
 *
 *   3002 — MICROMART AFRICA LTD  (the SME / field book)
 *   3005 — MICROMART FINTECH     (the app book — Micro Eazy products live here)
 *
 * 3003 is Micromart Check off and 3004 Micromart IPF (verified against BsEntity,
 * 8 Sep 2026 — an older comment here called 3003 "Axe Boresha", which is wrong).
 * Neither is served by this app today; adding one is an entry in VITE_ENTITY_IDS
 * and nothing else.
 */
export const MICROMART_ENTITIES = parseEntityList(import.meta.env.VITE_ENTITY_IDS, [3002, 3005]);

/**
 * The book assumed before a customer has identified themselves.
 *
 * It decides the lender name, logo and colours on the splash and sign-in
 * screens, and nothing else — the moment sign-in resolves, the session's own
 * entity takes over. Both Micromart books brand identically, so this is close
 * to cosmetic; it is configurable because "close to" is not "entirely".
 */
export const DEFAULT_ENTITY_ID =
  Number(import.meta.env.VITE_DEFAULT_ENTITY_ID) || MICROMART_ENTITIES[0];

/**
 * Where a NEW customer registering through this app is created.
 *
 * 3005, because self-service registration is the fintech book's premise: its
 * products (30219 Micro Eazy, 30220 Micro Eazy Monthly, 30221 Micro Chap Chap)
 * are the ones an app customer can be sold, and its single branch — unit 129,
 * Main Office — is where a customer with no relationship officer belongs.
 * Registering into 3002 would create a customer a field RO is expected to own,
 * and nobody would.
 */
export const REGISTRATION_ENTITY_ID =
  Number(import.meta.env.VITE_REGISTRATION_ENTITY_ID) || 3005;

/**
 * Where a NEW customer opens an account: the Micro Eazy app.
 *
 * Self-service registration only ever created customers on 3005, and the
 * fintech book's front door is Micro Eazy — its onboarding runs the ID check,
 * the dual-book precheck and the identity lock that this app's form skips. This
 * app (portal.servicesuitecloud.com) signs EXISTING customers of either book in;
 * every road to a new Fintech account leads to microeazy.servicesuitecloud.com.
 */
export const FINTECH_APP_ORIGIN = (
  import.meta.env.VITE_FINTECH_APP_ORIGIN || "https://microeazy.servicesuitecloud.com"
).replace(/\/$/, "");

/** Human label, for anything a customer or an admin will read. */
export function entityName(id) {
  const n = Number(id);
  if (n === 3002) return "Micromart Africa";
  if (n === 3005) return "Micromart Fintech";
  if (n === 3003) return "Micromart Check off";
  if (n === 3004) return "Micromart IPF";
  return `entity ${id}`;
}

if (!MICROMART_ENTITIES.includes(REGISTRATION_ENTITY_ID)) {
  // Registering into a book the app cannot then sign in to strands the customer
  // at their first login, with no error that points back here.
  console.error(
    `[entity] REGISTRATION_ENTITY_ID ${REGISTRATION_ENTITY_ID} is not in MICROMART_ENTITIES [${MICROMART_ENTITIES}] — a new customer could register and then fail to sign in.`,
  );
}
