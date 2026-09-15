// ─────────────────────────────────────────────────────────────────────────────
// THE REALM GUARD — what happens to a handset when the app changes backend.
//
// ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
// The build serving pwa.servicesuitecloud.com today does not talk to Micromart
// at all. Its 42 API calls point at https://live.testapps.co.ke — the shared
// ServiceSuite platform on 213.148.17.198 — and it carries `EntityId: 7`, an
// entity on THAT platform. This repository is already correct and points at
// micromartafrica.co.ke with entity 3005. Deploying it is a BACKEND SWAP on
// devices that are already installed.
//
// localStorage does not know that. Every customer who has opened the app holds:
//
//   session         a token minted by live.testapps.co.ke, for a user id that
//                   means somebody else entirely on Micromart's book
//   configuration   { EntityId: 7, EntityName: "SERVICE SUITE TEST AREA", ... }
//                   including the logos and brand colours of the wrong company
//   account_info    a cached profile from the wrong book
//   account_photo   somebody's photo
//   alerts          somebody's notifications
//
// Without this file, the first thing a returning customer sees after the deploy
// is the old company's branding and a session that fails every call — or worse,
// a `configuration` that never refreshes because the fetch that would replace it
// failed, leaving entity 7 pinned in storage on a build that talks to Micromart.
//
// ── WHAT IT DOES ────────────────────────────────────────────────────────────
// Stamps the storage with the backend it belongs to. When the stamp does not
// match this build, everything this app owns is cleared and the customer signs
// in again — once, on the first open after the deploy. Signing in again is a
// small cost. Being shown another company's data is not.
//
// It must run BEFORE React renders, which is why main.jsx calls it at the top
// rather than in an effect: SessionContext reads localStorage during its own
// initialisation, and a guard that runs after that has already lost.
// ─────────────────────────────────────────────────────────────────────────────
import { MICROMART_ENTITIES } from "./entity";

/** The API this build talks to. Kept beside the entities because the PAIR is
 *  the realm — the same entity number means different companies on different
 *  hosts, which is precisely how entity 7 came to look plausible. */
const API_HOST = "micromartafrica.co.ke";

// The whole SET of books, not one: a build that serves {3002,3005} and one that
// serves {3005} are different realms, and a session minted under the second is
// not necessarily valid under the first.
const REALM = `${API_HOST}|${[...MICROMART_ENTITIES].sort((a, b) => a - b).join(",")}`;
const REALM_KEY = "apiRealm";

/** Every key this app writes. Anything not listed here survives a realm change,
 *  so add to this list when you add a key — a stale key is a data leak. */
const OWNED_KEYS = ["session", "configuration", "account_info", "account_photo", "alerts"];

export function enforceRealm() {
  try {
    if (localStorage.getItem(REALM_KEY) === REALM) return false;

    for (const key of OWNED_KEYS) localStorage.removeItem(key);
    localStorage.setItem(REALM_KEY, REALM);
    console.warn(`[realm] storage cleared — this build serves ${REALM}`);
    return true;
  } catch {
    // Private browsing, or a browser with site data blocked. Nothing was cached
    // in that case either, so there is nothing stale to clear.
    return false;
  }
}
