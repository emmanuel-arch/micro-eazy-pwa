// ─────────────────────────────────────────────────────────────────────────────
// THE ECOSYSTEM GATE — one verification, seven screens.
//
// A customer signed into this app holds a MICROMART session: a bearer token in
// localStorage, issued by micromartafrica.co.ke. The ecosystem screens read a
// different system, and it will not accept that token — /api/portal/* requires
// its own borrower session, an httpOnly cookie minted by an SMS code, plus the
// national ID as a second factor.
//
// ── WHY TWO FACTORS, WHEN THEY ARE ALREADY SIGNED IN ─────────────────────────
// Because of what is behind these screens. A balance is one thing; the decision
// that produced it, the CRB file, and what other lenders can see are another. A
// SIM swap alone should not open them, so the server takes the phone from the
// cookie (possession) and requires the ID number in the body (knowledge). It
// never accepts a phone from the client, on any route.
//
// ── WHY IT IS A GATE AND NOT SEVEN COPIES ────────────────────────────────────
// Every one of the seven screens needs exactly this, and a customer should be
// asked once per session, not once per screen. `<Identity>` holds the verified
// state and hands `nationalId` down through a render prop. The session cookie
// does the rest — the second screen never asks again.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useState } from 'react';
import { Card, Button, State, Loading, Icon } from './Surface';
import { session, sendOtp, verifyOtp, NeedsOtpError } from '../../lib/ecosystem';

const ID_KEY = 'eco_national_id';

/** Remembered for the session only — it is a second factor, not a preference. */
function rememberId(v) {
  try { sessionStorage.setItem(ID_KEY, v); } catch { /* private mode */ }
}
function recallId() {
  try { return sessionStorage.getItem(ID_KEY) || ''; } catch { return ''; }
}

const field = {
  width: '100%',
  minHeight: 52,
  padding: '0 0.95rem',
  border: '1px solid rgba(18,21,27,0.16)',
  borderRadius: 14,
  background: '#fff',
  fontSize: '0.95rem',
  fontFamily: 'inherit',
  color: 'inherit',
};

const label = {
  display: 'block',
  fontSize: '0.6875rem',
  fontWeight: 600,
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  color: 'var(--eco-ink-3)',
  marginBottom: '0.4rem',
};

export default function Identity({ children }) {
  const [checking, setChecking] = useState(true);
  const [verified, setVerified] = useState(false);
  const [phoneMasked, setPhoneMasked] = useState('');

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [nationalId, setNationalId] = useState(recallId);
  const [idConfirmed, setIdConfirmed] = useState(() => Boolean(recallId()));

  useEffect(() => {
    let cancelled = false;
    session().then((s) => {
      if (cancelled) return;
      setVerified(Boolean(s.authenticated));
      setPhoneMasked(s.phoneMasked || '');
      setChecking(false);
    });
    return () => { cancelled = true; };
  }, []);

  const doSend = useCallback(async () => {
    setBusy(true); setError('');
    try {
      await sendOtp(phone);
      setSent(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }, [phone]);

  const doVerify = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const r = await verifyOtp(phone, code);
      setVerified(true);
      setPhoneMasked(r.phoneMasked || '');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }, [phone, code]);

  /**
   * Called by a screen when the SERVER says the session lapsed mid-use.
   * Dropping straight back to the code form is better than a dead screen.
   */
  const onExpired = useCallback(() => {
    setVerified(false);
    setSent(false);
    setCode('');
    setError('Your verification expired. Please request a new code.');
  }, []);

  if (checking) return <Loading rows={2} />;

  if (!verified) {
    return (
      <Card
        title={sent ? 'Enter the code' : 'Verify your phone'}
        note={
          sent
            ? `We sent a 6-digit code by SMS. It expires in a few minutes.`
            : 'These screens show your credit file, so we confirm it is you by SMS before opening them.'
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginTop: '1.1rem' }}>
          {!sent ? (
            <div>
              <label style={label} htmlFor="eco-phone">Phone number</label>
              <input
                id="eco-phone"
                style={field}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="07XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          ) : (
            <div>
              <label style={label} htmlFor="eco-code">6-digit code</label>
              <input
                id="eco-code"
                style={{ ...field, letterSpacing: '0.35em', fontVariantNumeric: 'tabular-nums' }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="······"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          )}

          {error && (
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--eco-bad)', lineHeight: 1.5 }}>
              {error}
            </p>
          )}

          {!sent ? (
            <Button onClick={doSend} disabled={busy || phone.replace(/\D/g, '').length < 9}>
              {busy ? 'Sending…' : 'Send me a code'}
            </Button>
          ) : (
            <>
              <Button onClick={doVerify} disabled={busy || code.length < 4}>
                {busy ? 'Checking…' : 'Verify'}
              </Button>
              <Button quiet onClick={() => { setSent(false); setCode(''); setError(''); }}>
                Use a different number
              </Button>
            </>
          )}
        </div>
      </Card>
    );
  }

  if (!idConfirmed) {
    return (
      <Card
        title="Confirm your ID number"
        note={`We have verified ${phoneMasked || 'your phone'}. Your national ID is the second check — it is what stops a swapped SIM from opening your file.`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginTop: '1.1rem' }}>
          <div>
            <label style={label} htmlFor="eco-id">National ID number</label>
            <input
              id="eco-id"
              style={field}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="12345678"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value.replace(/\s/g, ''))}
            />
          </div>
          <Button
            onClick={() => { rememberId(nationalId); setIdConfirmed(true); }}
            disabled={nationalId.length < 5}
            icon={Icon.arrow}
          >
            Continue
          </Button>
        </div>
      </Card>
    );
  }

  return children({ nationalId, phoneMasked, onExpired });
}

/**
 * Turn any thrown error into the right screen.
 *
 * Shared because all seven screens face the same three failures — the session
 * lapsed, the lender has not enabled this, or the service is unreachable — and
 * each deserves different words. A single "something went wrong" across all
 * three is what makes a product feel broken when it is merely unconfigured.
 */
export function errorState(err, { onExpired, onRetry } = {}) {
  if (err instanceof NeedsOtpError) {
    if (onExpired) onExpired();
    return (
      <State
        icon={Icon.shield}
        title="Your verification expired"
        note="For your security these screens time out. Request a new code to carry on."
      />
    );
  }
  const msg = err?.message || 'We could not reach the service.';
  const unavailable = /isn.t available|not available/i.test(msg);
  return (
    <State
      icon={unavailable ? Icon.off : Icon.alert}
      title={unavailable ? 'Not available for this lender' : 'We could not load this'}
      note={msg}
      action={onRetry ? <Button quiet onClick={onRetry}>Try again</Button> : null}
    />
  );
}
