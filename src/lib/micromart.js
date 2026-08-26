// ─────────────────────────────────────────────────────────────────────────────
// MICROMART'S OWN RAILS — one client for the API this app already lives on.
//
// This app has been talking to micromartafrica.co.ke since before the ecosystem
// existed, and those rails ALREADY WORK: the SMS goes out instantly under
// Micromart's own sender ID, the STK prompt lands on the handset, the OCR reads
// the ID card, FCM delivers the push. None of that is being replaced. This file
// exists so it stops being copy-pasted into every page.
//
// ── WHAT WAS LEARNED FROM THE EXISTING PAGES ─────────────────────────────────
// Three conventions were already in the code, in every page, slightly
// differently each time. They are encoded here once:
//
//   1. BEARER + ROLLING REFRESH. Every authenticated call sends
//      `Authorization: Bearer <session.token>` and the server MAY answer with an
//      `X-New-Token` header. When it does, that token replaces the stored one.
//      Miss the header and the session dies early for no visible reason —
//      Dashboard, Ledger and Contacts each implemented this by hand.
//
//   2. 401 MEANS SIGN OUT. Not retry, not refresh. LoanApplication had this
//      right; most pages did not check at all.
//
//   3. THE ENTITY ID SCOPES EVERYTHING. Customers, products, branding. See
//      ENTITY_ID in ./tenant — it is 3005 (MICROMART FINTECH), matching what the
//      Connected Suite reads. It was previously 3002 in five files, which is a
//      different entity with a different book.
//
// ── WHY NOT ROUTE THIS THROUGH THE ECOSYSTEM API ─────────────────────────────
// Because it would be strictly worse. Micromart's SMS already sends under their
// registered sender ID with no extra hop, their Repayment endpoint already
// reaches Daraja with their credentials, and both are live today. The ecosystem
// API (./ecosystem.js) adds what Micromart's core does NOT have — the statement
// crunch, CRB, the Interchange, the decision explanation — and nothing it does.
// Two clients, two jobs, no overlap.
// ─────────────────────────────────────────────────────────────────────────────
import { ENTITY_ID } from './tenant';

const BASE = 'https://micromartafrica.co.ke/MicromartAPI';
const APP = `${BASE}/Mobile/Application`;

/**
 * The entity id sent on the Repayment (STK) call.
 *
 * ⚠ THIS IS DELIBERATELY NOT ENTITY_ID. The two existing call sites — Loan.jsx
 * and LoanApplication.jsx — both send `EntityId: 7`, not 3002 and not 3005. A
 * single-digit value alongside four-digit entity ids strongly suggests a
 * different id space (a payment channel or paybill row) rather than a mistake,
 * and a wrong value here means the STK prompt never reaches the handset.
 *
 * So it is preserved exactly as it was, named, and made overridable — rather
 * than silently "corrected" to 3005 and discovered on stage. Confirm it with
 * Micromart, then set VITE_PAYMENTS_ENTITY_ID (or change this default) once.
 */
export const PAYMENTS_ENTITY_ID = Number(import.meta.env.VITE_PAYMENTS_ENTITY_ID || 7);

export class MicromartError extends Error {
  constructor(message, status, payload) {
    super(message || 'Micromart could not complete that request.');
    this.name = 'MicromartError';
    this.status = status;
    this.payload = payload || {};
  }
}

/** Raised on a 401 so callers can sign the customer out rather than retry. */
export class SessionExpiredError extends Error {
  constructor() {
    super('Your session has expired. Please sign in again.');
    this.name = 'SessionExpiredError';
    this.expired = true;
  }
}

export function readSession() {
  try {
    const raw = localStorage.getItem('session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Persist a rotated bearer token.
 *
 * The server hands back X-New-Token on ordinary calls; dropping it is what makes
 * a session expire "randomly" partway through a visit.
 */
function rotateToken(res) {
  const next = res.headers.get('X-New-Token');
  if (!next) return;
  try {
    const s = readSession();
    if (!s) return;
    s.token = next;
    localStorage.setItem('session', JSON.stringify(s));
  } catch {
    /* storage unavailable — the current token still works for this call */
  }
}

async function readBody(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text || '' };
  }
}

/**
 * One call to Micromart.
 *
 * @param {string} path      e.g. "Repayment" — appended to the Application base
 * @param {object} [opts]
 * @param {object} [opts.body]   JSON body; omit for GET
 * @param {string} [opts.method] defaults to POST when a body is present
 * @param {boolean} [opts.auth]  attach the bearer token (default true)
 */
export async function call(path, { body, method, auth = true, headers = {} } = {}) {
  const session = readSession();
  const res = await fetch(`${APP}/${path}`, {
    method: method || (body !== undefined ? 'POST' : 'GET'),
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(auth && session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  rotateToken(res);
  if (res.status === 401) throw new SessionExpiredError();

  const data = await readBody(res);
  if (!res.ok) throw new MicromartError(data.message, res.status, data);
  return data;
}

/** EntityCinfigurations answers an array of one; several others do the same. */
export const unwrap = (d) => (Array.isArray(d) ? d[0] ?? null : d);

// ── Identity ─────────────────────────────────────────────────────────────────

export const login = (accountNumber, password) =>
  call('Login', {
    auth: false,
    body: { AccountNumber: accountNumber, password, entityId: parseInt(ENTITY_ID, 10) },
  });

/**
 * Registration — this is the call that sends the welcome/verification SMS, and
 * it goes out under Micromart's own registered sender ID with no work from us.
 */
export const register = (payload) =>
  call('Registration', {
    auth: false,
    body: { ...payload, entityId: parseInt(ENTITY_ID, 10) },
  });

export const resetPassword = (payload) =>
  call('ResetPassword', { auth: false, body: { ...payload, entityId: parseInt(ENTITY_ID, 10) } });

export const changePassword = (payload) => call('ChangePassword', { body: payload });

// ── The book ─────────────────────────────────────────────────────────────────

export const accountPreview = (userId) => call('AccountPreview', { body: userId });
export const loans = (payload) => call('Loans', { body: payload });
export const loanDetails = (payload) => call('LoanDetails', { body: payload });
export const loanPreview = (payload) => call('LoanPreview', { body: payload });
export const accountStatement = (payload) => call('AccountStatement', { body: payload });
export const ledger = (payload) => call('GetAccountLeger', { body: payload });

/**
 * The product list, scoped to the entity.
 *
 * ⚠ The previous call site sent `EntityId: parseInt(sessionData.userId)` — the
 * BORROWER's id in the entity field — so the product list was being requested
 * for an entity that does not exist. That is fixed here by taking the entity
 * from configuration, where it belongs.
 */
export const availableLoanProducts = (phoneNumber) =>
  call('AvailableLoanProducts', {
    body: {
      PhoneNumber: phoneNumber ? String(phoneNumber) : '',
      EntityId: parseInt(ENTITY_ID, 10),
      RequestFlag: 0,
    },
  });

// ── Money ────────────────────────────────────────────────────────────────────

/**
 * The STK push, through Micromart's own Daraja credentials.
 *
 * This is the single implementation of what Loan.jsx and LoanApplication.jsx
 * each had a copy of. The copy in Loan.jsx had a fault worth naming: its failure
 * branch called `setStkPromptrt(...)`, which is not a function, so a REFUSED
 * push threw a ReferenceError, fell into the outer catch, and showed the generic
 * "Error sending payment request, try again" instead of the reason Safaricom
 * gave. Every declined payment looked like a network problem.
 *
 * Returning the server's message plainly is the fix; the caller decides how to
 * show it.
 */
export async function requestStkPush({ amount, phoneNumber }) {
  const data = await call('Repayment', {
    body: {
      Amount: amount,
      PhoneNumber: phoneNumber,
      EntityId: PAYMENTS_ENTITY_ID,
    },
  });
  return {
    ok: true,
    message: data.message || 'STK push sent. Check your phone to complete the payment.',
    raw: data,
  };
}

// ── Documents, KYC, notifications ────────────────────────────────────────────

export const uploadFile = async (file, fields = {}) => {
  const session = readSession();
  const form = new FormData();
  form.append('file', file);
  for (const [k, v] of Object.entries(fields)) form.append(k, v);

  const res = await fetch(`${BASE}/api/app/UploadFile`, {
    method: 'POST',
    // No Content-Type: the browser must set the multipart boundary.
    headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {},
    body: form,
  });
  rotateToken(res);
  if (res.status === 401) throw new SessionExpiredError();
  const data = await readBody(res);
  if (!res.ok) throw new MicromartError(data.message, res.status, data);
  return data;
};

/** Micromart's own ID-card OCR. Already live — no third party needed. */
export const ocrId = async (file) => {
  const session = readSession();
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/vision/ocr/id`, {
    method: 'POST',
    headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {},
    body: form,
  });
  rotateToken(res);
  const data = await readBody(res);
  if (!res.ok) throw new MicromartError(data.message, res.status, data);
  return data;
};

export const alerts = (userId) => call('GetAlerts', { body: userId });
export const notifications = (payload) => call('GetNotifications', { body: payload });
export const updateNotification = (payload) => call('UpdateNotification', { body: payload });
export const registerFcm = (payload) => call('registerFCM', { body: payload });
export const officesList = () =>
  call('GetOfficesList', { body: { EntityId: parseInt(ENTITY_ID, 10) } });
