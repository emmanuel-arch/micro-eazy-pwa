// ─────────────────────────────────────────────────────────────────────────────
// FINDING THE CUSTOMER'S BOOK.
//
// The Login endpoint takes an entityId and answers for that book alone. It does
// not tell you which book a customer is on — so the only way to find out, with
// the API as it stands, is to ask each book in turn.
//
// ── WHY A PARALLEL PROBE IS SAFE HERE ───────────────────────────────────────
// Login has no side effect. It either returns a borrower or it does not, and
// asking twice costs two reads against one lender's own database. Both books
// belong to Micromart, so the credential never crosses a tenant boundary.
//
// Password RESET is the opposite — it mints a new password and sends an SMS —
// so resetPassword() below goes through the books ONE AT A TIME and stops at
// the first that answers. A customer must never get two reset messages because
// the app was unsure who they were.
//
// ── THE FOUR ANSWERS, AND WHY "NONE" IS NOT THE DEFAULT ─────────────────────
//   ok           found in exactly one book. Scope the session to it.
//   ambiguous    found in more than one. Refuse and send them to admin: two
//                records for one person is a data fault, and opening whichever
//                answered first shows somebody a balance that may not be theirs.
//   none         reached every book, found in none. Wrong password, or not
//                registered — the API's own message says which.
//   unreachable  could not reach ANY book. This is NOT "none", and the
//                difference matters: telling a ten-year customer they are not
//                registered because their bus went through a tunnel invites
//                them to register a second time, and a duplicate account is
//                exactly what the rest of this work exists to clean up.
// ─────────────────────────────────────────────────────────────────────────────
import { MICROMART_ENTITIES, REFERRED_ENTITIES, entityName } from "./entity";

const API = "https://micromartafrica.co.ke/MicromartAPI/Mobile/Application";

/** One book, one attempt. Never throws — the caller needs every result. */
async function attemptLogin(account, password, entityId) {
  try {
    const res = await fetch(`${API}/Login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        AccountNumber: account,
        password,
        entityId: Number(entityId),
      }),
    });

    if (!res.ok) {
      let message = "";
      try {
        const body = await res.json();
        message = body?.message ?? "";
      } catch {
        /* a non-JSON error body is still a refusal, just an unhelpful one */
      }
      return { entityId, ok: false, reachable: true, message };
    }

    const data = await res.json();
    // A 200 with no borrower is a refusal wearing a success code. Trusting the
    // status alone would sign somebody in against an empty record.
    if (!data || !data.borrowerId) {
      return { entityId, ok: false, reachable: true, message: data?.message ?? "" };
    }
    return { entityId, ok: true, reachable: true, data };
  } catch {
    return { entityId, ok: false, reachable: false, message: "" };
  }
}

/**
 * Sign in on the book(s) this app serves; if refused, recognise a customer of a
 * REFERRED book so they are sent to support rather than told to register.
 *
 * The referred probe only ever answers "this is somebody else's customer": its
 * token is discarded, never stored, and no screen opens on that book. A 3002
 * customer who mistypes their password is refused by both books and so lands on
 * "none" — the API returns the same "Invalid account number or password" for a
 * missing account and a wrong password, so the two cannot be told apart here.
 *
 * @returns {Promise<{kind:"ok",entityId:number,data:object}
 *                 | {kind:"ambiguous",entityIds:number[],names:string[]}
 *                 | {kind:"referred",entityId:number,name:string}
 *                 | {kind:"none",message:string}
 *                 | {kind:"unreachable"}>}
 */
export async function signInAcrossBooks(account, password) {
  const results = await Promise.all(
    MICROMART_ENTITIES.map((entityId) => attemptLogin(account, password, entityId)),
  );

  const hits = results.filter((r) => r.ok);

  if (hits.length === 1) {
    return { kind: "ok", entityId: hits[0].entityId, data: hits[0].data };
  }

  if (hits.length > 1) {
    const entityIds = hits.map((h) => h.entityId);
    return { kind: "ambiguous", entityIds, names: entityIds.map(entityName) };
  }

  const referred = await Promise.all(
    REFERRED_ENTITIES.map((entityId) => attemptLogin(account, password, entityId)),
  );
  const known = referred.find((r) => r.ok);
  if (known) return { kind: "referred", entityId: known.entityId, name: entityName(known.entityId) };

  // Nothing matched on the served book. Was that an answer, or was it silence?
  // Only the SERVED book's reachability counts: a referred book being down must
  // not turn a real refusal into "could not reach".
  if (!results.some((r) => r.reachable)) return { kind: "unreachable" };

  const message = results.find((r) => r.message)?.message ?? "";
  return { kind: "none", message };
}

/**
 * Reset across the books, ONE AT A TIME, stopping at the first that accepts.
 *
 * Sequential on purpose: this endpoint mints a password and sends an SMS. A
 * parallel probe would send a customer on two books two different passwords,
 * and they would have no way to tell which one is for which.
 *
 * That does mean a genuinely dual-book customer is reset on the FIRST book only
 * and never learns they are on two. Detecting that without a side effect needs
 * an account-existence endpoint the API does not offer. It is a transitional
 * gap: the duplicate merge and the identity lock on Borrowers remove the case
 * itself, which is the real fix.
 */
export async function resetPasswordAcrossBooks(account) {
  let reachedSomething = false;

  for (const entityId of MICROMART_ENTITIES) {
    try {
      const res = await fetch(`${API}/ResetPassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          AccountNumber: account,
          password: account,
          entityId: Number(entityId),
        }),
      });
      reachedSomething = true;
      if (res.ok) return { kind: "ok", entityId };
    } catch {
      /* try the next book; the flag below records that none answered */
    }
  }

  return reachedSomething ? { kind: "none" } : { kind: "unreachable" };
}
