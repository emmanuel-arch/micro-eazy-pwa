// ─────────────────────────────────────────────────────────────────────────────
// THE ECOSYSTEM CLIENT — everything the customer portal used to do, from here.
//
// This app now speaks to TWO backends and it matters which is which:
//
//   micromart.js  → micromartafrica.co.ke. The lender's own core banking API.
//                   Accounts, balances, ledger, statements. Bearer-less; the
//                   session is a userId held in localStorage.
//
//   ecosystem.js  → THIS FILE. /api/portal/* on the Connected Suite, reached
//                   through the same-origin proxy in vercel.json. Everything the
//                   ecosystem adds on top of core banking: OTP identity, the
//                   M-Pesa statement crunch, STK self-pay, Ratiba standing
//                   orders, CRB and Interchange exposure, the decision
//                   explanation and the limit ladder.
//
// ── WHY EVERY CALL IS SAME-ORIGIN ────────────────────────────────────────────
// The borrower session issued by /api/portal/otp/verify is an httpOnly cookie
// with SameSite=Lax. Lax cookies are not attached to cross-site XHR, so calling
// the suite's hostname directly would verify the phone once and then be
// anonymous forever after. Every URL here is therefore RELATIVE — "/api/portal/…"
// — and vercel.json proxies it server-side. Never put an absolute origin in this
// file; it will appear to work on the OTP step and fail on everything else.
//
// ── THE TWO FACTORS ──────────────────────────────────────────────────────────
// Almost every route below wants { nationalId } in the body and takes the phone
// from the cookie. That is deliberate on the server's side: possession (the SIM
// that received the code) plus knowledge (the ID number), so a SIM swap alone
// does not open somebody's loan. The client's job is simply never to send a
// phone number in a body and never to cache the national ID anywhere but memory.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Which lender this deployment belongs to.
 *
 * The apex serves Micromart's customers, but every route below is multi-tenant
 * on the server, so this is configuration rather than a constant — standing up
 * a second lender's app is an env var, not a fork.
 */
export const LENDER_SLUG = import.meta.env.VITE_LENDER_SLUG || 'micromart';

const BASE = '/api/portal';

/** Thrown when the server says "verify your phone first" (HTTP 401 + needsOtp). */
export class NeedsOtpError extends Error {
  constructor(message) {
    super(message || 'Verify your phone number to continue.');
    this.name = 'NeedsOtpError';
    this.needsOtp = true;
  }
}

/** Any other refusal from the portal API, carrying the server's own wording. */
export class EcosystemError extends Error {
  constructor(message, status, payload) {
    super(message || 'Something went wrong. Please try again.');
    this.name = 'EcosystemError';
    this.status = status;
    this.payload = payload || {};
  }
}

/**
 * Parse a response that SHOULD be JSON.
 *
 * If the service worker or a proxy misfire ever returns the SPA shell for an
 * API call, response.json() throws a SyntaxError mentioning "<!doctype", which
 * is a baffling thing to show a customer. This turns it into a plain network
 * message and leaves the real cause in the console for us.
 */
async function readJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    console.error('[ecosystem] expected JSON, got:', text.slice(0, 200));
    throw new EcosystemError('We could not reach the service. Check your connection.', res.status);
  }
}

function raise(res, data) {
  if (res.status === 401 && data.needsOtp) throw new NeedsOtpError(data.message);
  throw new EcosystemError(data.message, res.status, data);
}

/** POST JSON to a portal route, with lenderSlug injected. */
async function post(path, body = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Same-origin by construction (see the header comment), but stated rather
    // than assumed so a future absolute URL fails loudly instead of silently
    // dropping the session.
    credentials: 'same-origin',
    body: JSON.stringify({ lenderSlug: LENDER_SLUG, ...body }),
  });
  const data = await readJson(res);
  if (!res.ok || data.success === false) raise(res, data);
  return data;
}

/** POST multipart to a portal route. Used only by the statement upload. */
async function postForm(path, fields, file, fileField = 'file') {
  const form = new FormData();
  form.append('lenderSlug', LENDER_SLUG);
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined && v !== null && v !== '') form.append(k, v);
  }
  if (file) form.append(fileField, file);

  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    credentials: 'same-origin',
    // NO Content-Type header: the browser must set it so the multipart boundary
    // is included. Setting it by hand produces a body the server cannot parse.
    body: form,
  });
  const data = await readJson(res);
  if (!res.ok || data.success === false) raise(res, data);
  return data;
}

async function get(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}${path}${qs ? `?${qs}` : ''}`, {
    credentials: 'same-origin',
  });
  const data = await readJson(res);
  if (!res.ok || data.success === false) raise(res, data);
  return data;
}

// ── Identity ─────────────────────────────────────────────────────────────────

/** Is this browser already a verified borrower? Never throws — it is a probe. */
export async function session(phone) {
  try {
    return await get('/session', phone ? { phone } : {});
  } catch {
    return { authenticated: false };
  }
}

/** Sign out. "Not you?" */
export async function endSession() {
  await fetch(`${BASE}/session`, { method: 'DELETE', credentials: 'same-origin' });
}

/**
 * Send a verification code.
 *
 * Answers identically for any well-formed Kenyan number whether or not it is
 * known to the lender — do not build UI that infers "you have an account" from
 * a success here, because the server deliberately will not tell you.
 */
export const sendOtp = (phone) => post('/otp', { phone });

/** Exchange the code for a session cookie. */
export const verifyOtp = (phone, code) => post('/otp/verify', { phone, code });

/** Step 1: is there an account for this ID? Step 2: unlock it with the PIN. */
export const pinLookup = (nationalId) => post('/pin', { nationalId });
export const pinUnlock = (nationalId, pin) => post('/pin', { nationalId, pin });

// ── The loan ─────────────────────────────────────────────────────────────────

export const myLoan = (nationalId) => post('/my-loan', { nationalId });

/** Why the application was decided the way it was. Answers for bridged lenders too. */
export const decision = (nationalId) => post('/decision', { nationalId });

/** The limit ladder as the customer actually climbed it — both directions. */
export const ladder = (nationalId) => post('/ladder', { nationalId });

// ── Money ────────────────────────────────────────────────────────────────────

/**
 * "Pay now" — an STK push to the borrower's REGISTERED handset.
 *
 * The phone is never sent: the server takes it from the verified session, so
 * the worst possible misuse of this endpoint is paying somebody else's loan.
 * Hard rate-limited server-side (5 per 10 minutes) because an STK push is an
 * unsolicited PIN prompt on a real phone.
 */
export const payNow = (nationalId, amount) =>
  post('/pay', { nationalId, ...(amount ? { amount } : {}) });

// ── M-Pesa Ratiba (standing orders) ──────────────────────────────────────────

/**
 * The whole plan — amount, frequency, start, end — is DERIVED server-side from
 * the loan and its product. Nothing about the money is sent from here, which is
 * why there is no argument for it.
 */
export const ratibaOffer = (nationalId) => post('/standing-order', { nationalId, action: 'offer' });
export const ratibaSetup = (nationalId) => post('/standing-order', { nationalId, action: 'setup' });
export const ratibaCancel = (nationalId, standingOrderId) =>
  post('/standing-order', { nationalId, action: 'cancel', standingOrderId });

// ── The statement crunch ─────────────────────────────────────────────────────

/**
 * Three actions on one route:
 *   offer  → is it available, what does it cost, do I already hold a paid credit
 *   pay    → charge me (STK to the registered phone)
 *   status → has that payment landed
 */
export const crunchOffer = (nationalId) => post('/recrunch', { nationalId, action: 'offer' });
export const crunchPay = (nationalId) => post('/recrunch', { nationalId, action: 'pay' });
export const crunchStatus = (nationalId, intentId) =>
  post('/recrunch', { nationalId, action: 'status', intentId });

/**
 * Spend the credit: upload the M-Pesa statement PDF and get a fresh report.
 *
 * The credit is a one-shot latch on the server — a failed parse (wrong password,
 * not a statement) costs nothing, so retrying is safe and should be offered.
 */
export const crunchRun = (nationalId, intentId, file, password) =>
  postForm('/recrunch/run', { nationalId, intentId, password }, file);

// ── What the credit system sees ──────────────────────────────────────────────

/**
 * The customer's bureau file and their exposure.
 *
 * Reads the LAST STORED report — it never triggers a fresh bureau pull, because
 * a live pull is billed to the lender per call and an endpoint a customer can
 * refresh at will is a way to hand somebody a surprise invoice. Gated on the
 * `crbCheck` permission; withdrawing it stops this reading back too.
 */
export const exposure = (nationalId) => post('/exposure', { nationalId });

// ── Permissions ──────────────────────────────────────────────────────────────

/** Current grants, the catalogue that explains them, and the full history. */
export const consentGet = (nationalId) => get('/consent', { lenderSlug: LENDER_SLUG, nationalId });

/**
 * Change one or more permissions.
 *
 * Send ONLY what changed: the server carries every untouched permission forward
 * from the latest record, so a partial body can never silently clear something
 * the customer did not look at. Each change appends a new record rather than
 * editing the old one — the history is the evidence.
 */
export const consentSet = (nationalId, grants) => post('/consent', { nationalId, grants });

// ── KYC ──────────────────────────────────────────────────────────────────────

/** One step of the KYC pipeline: id | liveness | facematch | iprs | finalize. */
export const kycStep = (step, payload, sessionId, nationalId) =>
  post('/kyc', { step, payload, sessionId, nationalId });

// ── Guarantor / offers ───────────────────────────────────────────────────────

export const guarantee = (id, body) => post(`/guarantee/${id}`, body);
export const offer = (id, body) => post(`/offer/${id}`, body);
