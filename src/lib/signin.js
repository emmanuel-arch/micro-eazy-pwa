// ─────────────────────────────────────────────────────────────────────────────
// FINDING THE CUSTOMER'S BOOK.
//
// This app serves Micromart FINTECH (3005) only. Before a password is checked,
// the phone number is looked up with Micromart's own GetEntity endpoint, which
// runs sp_MobileAppEntityCheck: it counts Borrowers with that PhoneNumber across
// the whole database and answers
//
//   <entity id>   exactly one record, on that book
//   -1            no record anywhere
//   -2            more than one record (a duplicate, or one person on two books)
//
// That lookup is what lets the app tell a customer the TRUE reason it cannot
// sign them in. Login alone cannot: it answers "Invalid account number or
// password" for a wrong password and for a missing account alike.
//
// ── THE ANSWERS ─────────────────────────────────────────────────────────────
//   ok             on 3005 and the password is right. Scope the session to it.
//   bad-password   on 3005, password refused.
//   referred       on a REFERRED book (3002). Contact customer support; no
//                  session, and never "create an account" — that is a duplicate.
//   not-registered no record at all (or only at another company on the shared
//                  server). Offer registration on 3005.
//   several        more than one record and no working sign-in on 3005 or a
//                  referred book. A data fault: contact customer support.
//   unreachable    could not reach Micromart. NOT "not registered": telling a
//                  real customer to register because their signal dropped is how
//                  a duplicate account gets opened.
//
// ── WHY PROBING LOGIN IS STILL SAFE AS A FALLBACK ───────────────────────────
// Login has no side effect, so when the lookup itself cannot answer (or answers
// -2) the books are asked with the password instead. Password RESET is the
// opposite — it mints a password and sends an SMS — so it only ever runs on the
// one served book, and only once the lookup has placed the customer there.
// ─────────────────────────────────────────────────────────────────────────────
import { MICROMART_ENTITIES, REFERRED_ENTITIES, entityName } from "./entity";

const API = "https://micromartafrica.co.ke/MicromartAPI/Mobile/Application";

/**
 * A Kenyan number in the form Borrowers.PhoneNumber stores it: 2547XXXXXXXX /
 * 2541XXXXXXXX. Accepts 07…, 01…, 7…, 1…, +254…, 254…, with spaces or dashes.
 * Returns null for anything that is not one.
 */
export function toMsisdn(raw) {
  const d = String(raw ?? "").replace(/\D/g, "");
  let n = null;
  if (/^254[17]\d{8}$/.test(d)) n = d;
  else if (/^0[17]\d{8}$/.test(d)) n = `254${d.slice(1)}`;
  else if (/^[17]\d{8}$/.test(d)) n = `254${d}`;
  return n;
}

/**
 * Which book is this phone number on? Never throws.
 * @returns {Promise<{kind:"served",entityId:number}
 *                 | {kind:"referred",entityId:number,name:string}
 *                 | {kind:"none"} | {kind:"several"} | {kind:"unreachable"}>}
 */
export async function lookupBook(phone) {
  const msisdn = toMsisdn(phone);
  if (!msisdn) return { kind: "unreachable" };
  try {
    const res = await fetch(`${API}/GetEntity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: msisdn }),
    });
    if (!res.ok) return { kind: "unreachable" };
    const result = Number((await res.json())?.result);
    if (!Number.isInteger(result) || result === 0) return { kind: "unreachable" };
    if (result === -1) return { kind: "none" };
    if (result === -2) return { kind: "several" };
    if (MICROMART_ENTITIES.includes(result)) return { kind: "served", entityId: result };
    if (REFERRED_ENTITIES.includes(result)) return { kind: "referred", entityId: result, name: entityName(result) };
    // A customer of another company on the shared ServiceSuite server has no
    // Micromart account of either kind: they may open a Fintech one.
    return { kind: "none" };
  } catch {
    return { kind: "unreachable" };
  }
}

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

/** Try the password on the served book(s), then on the referred ones. */
async function probeBooks(account, password) {
  const served = await Promise.all(MICROMART_ENTITIES.map((e) => attemptLogin(account, password, e)));
  const hit = served.find((r) => r.ok);
  if (hit) return { kind: "ok", entityId: hit.entityId, data: hit.data };

  // The referred probe only ever answers "this is somebody else's customer": its
  // token is discarded, never stored, and no screen opens on that book.
  const referred = await Promise.all(REFERRED_ENTITIES.map((e) => attemptLogin(account, password, e)));
  const known = referred.find((r) => r.ok);
  if (known) return { kind: "referred", entityId: known.entityId, name: entityName(known.entityId) };

  return { kind: "refused", reachable: served.some((r) => r.reachable), message: served.find((r) => r.message)?.message ?? "" };
}

/**
 * Sign in to Micromart Fintech.
 * @returns {Promise<{kind:"ok",entityId:number,data:object}
 *                 | {kind:"bad-password",message:string}
 *                 | {kind:"referred",entityId:number,name:string}
 *                 | {kind:"not-registered"}
 *                 | {kind:"several"}
 *                 | {kind:"unreachable"}>}
 */
export async function signInAcrossBooks(account, password) {
  const book = await lookupBook(account);

  if (book.kind === "referred") return book;
  if (book.kind === "none") return { kind: "not-registered" };

  if (book.kind === "served") {
    const r = await attemptLogin(account, password, book.entityId);
    if (r.ok) return { kind: "ok", entityId: book.entityId, data: r.data };
    return r.reachable ? { kind: "bad-password", message: r.message } : { kind: "unreachable" };
  }

  // "several" or "unreachable": the lookup could not place them, so the password
  // decides — the same probe the app used before the lookup existed.
  const probe = await probeBooks(account, password);
  if (probe.kind !== "refused") return probe;
  if (!probe.reachable) return { kind: "unreachable" };
  return book.kind === "several" ? { kind: "several" } : { kind: "bad-password", message: probe.message };
}

/**
 * Reset a Fintech password. ONE book, and only once the lookup has placed the
 * customer on it: this endpoint mints a password and sends an SMS, so it is
 * never fired on a guess.
 * @returns {Promise<{kind:"ok",entityId:number}
 *                 | {kind:"referred",entityId:number,name:string}
 *                 | {kind:"not-registered"} | {kind:"several"} | {kind:"none"}
 *                 | {kind:"unreachable"}>}
 */
export async function resetPasswordAcrossBooks(account) {
  const book = await lookupBook(account);
  if (book.kind === "referred" || book.kind === "several") return book;
  if (book.kind === "none") return { kind: "not-registered" };

  // Placed on the served book — or the lookup could not answer, in which case
  // the served book alone is asked, exactly as before.
  const targets = book.kind === "served" ? [book.entityId] : MICROMART_ENTITIES;
  let reachedSomething = false;
  for (const entityId of targets) {
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
