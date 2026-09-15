// ─────────────────────────────────────────────────────────────────────────────
// THE SESSION — and the one field that was missing from it.
//
// The stored session has always carried who the customer is (userId, account
// number, name, token). It never carried WHICH BOOK they are on, because until
// now the app assumed there was only one.
//
// `entityId` is that field. It is written once, by sign-in, from the book the
// customer was actually found in — and every authenticated call reads it from
// here rather than from a build-time constant. That is the whole mechanism by
// which one build serves both Micromart Africa and Micromart Fintech.
//
// ── WHY A MODULE AND NOT localStorage.getItem AT EACH CALL SITE ─────────────
// There were already four screens holding their own `const entityId = "3002"`
// and two more reading it from a different place. Every one of them was a place
// the answer could drift. One reader, one writer, one shape.
// ─────────────────────────────────────────────────────────────────────────────
import { DEFAULT_ENTITY_ID } from "./entity";

const SESSION_KEY = "session";

/** The stored session, or null. Never throws — a corrupt value reads as signed out. */
export function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || typeof s !== "object") return null;
    // An expired session is not a session. The app checked this in one place
    // and not the others, so a stale token could reach an API call.
    if (s.expiry && Date.now() > s.expiry) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function writeSession(session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* private browsing — the session lives for this tab only, which still works */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* nothing to clear */
  }
}

/**
 * The entity every authenticated call should carry.
 *
 * Signed in  → the book the customer was found in at sign-in.
 * Signed out → DEFAULT_ENTITY_ID, which only ever decorates the splash and
 *              sign-in screens. No authenticated call should reach this branch;
 *              if one does, it is a screen rendering before the session loaded,
 *              not a customer on the default book.
 */
export function activeEntityId() {
  const s = readSession();
  const id = Number(s?.entityId);
  return Number.isInteger(id) && id > 0 ? id : DEFAULT_ENTITY_ID;
}

/**
 * Stamp the resolved entity onto the cached branding config, synchronously.
 *
 * Five screens (Calculator, Loan, LoanApplication, Profile) read their entity
 * from `configuration.EntityId` rather than from the session. That indirection
 * is fine — but it is populated by an ASYNC fetch, and sign-in navigates to the
 * dashboard immediately. Without this, a Fintech customer can land on a screen
 * that is still holding the pre-login default and ask 3002 for their loans.
 *
 * So the entity is written the moment it is known, and the fetch that follows
 * only refreshes name, logo and colours.
 */
export function setConfigurationEntity(entityId) {
  try {
    const raw = localStorage.getItem("configuration");
    const cfg = raw ? JSON.parse(raw) : {};
    localStorage.setItem("configuration", JSON.stringify({ ...cfg, EntityId: String(entityId) }));
  } catch {
    /* branding is cosmetic; the session still carries the authoritative entity */
  }
}
