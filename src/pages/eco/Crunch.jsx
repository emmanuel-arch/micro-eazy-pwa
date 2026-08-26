// ─────────────────────────────────────────────────────────────────────────────
// THE STATEMENT CRUNCH — customer side.
//
// Four states, in order, and the customer is only ever in one of them:
//
//   OFFER    what a refresh costs, and whether they already hold one
//   PAYING   an STK prompt on their own handset, then polling for it to land
//   UPLOAD   the statement PDF, and its password if Safaricom set one
//   THEATRE  the crunch itself, and the score at the end of it
//
// ── THE PROPERTY WORTH PROTECTING ────────────────────────────────────────────
// The paid refresh is a ONE-SHOT CREDIT, latched on the server. A failed parse —
// wrong password, wrong document, a photo of a statement — costs the customer
// NOTHING, and the retry path says so out loud. Somebody who has just paid and
// then picked the wrong file is exactly the person most likely to assume they
// have been charged twice, and exactly the person least likely to try again.
//
// ── WHAT THIS SCREEN NEVER DOES ──────────────────────────────────────────────
// It never sends a phone number. The STK goes to the handset registered on the
// account, resolved server-side from the verified session, so the worst thing a
// misuse of this screen can achieve is paying somebody else's fee.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Screen, Card, Row, Button, State, Loading, Chip, Icon, money } from '../../components/eco/Surface';
import Identity, { errorState } from '../../components/eco/Identity';
import CrunchTheatre from '../../components/eco/CrunchTheatre';
import { crunchOffer, crunchPay, crunchStatus, crunchRun } from '../../lib/ecosystem';

const MAX_BYTES = 15 * 1024 * 1024;

function CrunchFlow({ nationalId, onExpired }) {
  const [phase, setPhase] = useState('loading'); // loading|offer|paying|upload|theatre
  const [offer, setOffer] = useState(null);
  const [err, setErr] = useState(null);

  const [intentId, setIntentId] = useState(null);
  const [payNote, setPayNote] = useState('');

  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [uploadErr, setUploadErr] = useState('');

  const [report, setReport] = useState(null);
  const [crunchErr, setCrunchErr] = useState('');

  const pollRef = useRef(null);

  const load = useCallback(async () => {
    setPhase('loading'); setErr(null);
    try {
      const o = await crunchOffer(nationalId);
      setOffer(o);
      // An unused credit already paid for skips straight to the upload — asking
      // somebody to pay twice because they closed the tab is indefensible.
      setPhase(o.hasUnusedIntent || o.intentId ? 'upload' : 'offer');
      if (o.intentId) setIntentId(o.intentId);
    } catch (e) {
      setErr(e);
      setPhase('error');
    }
  }, [nationalId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => () => clearInterval(pollRef.current), []);

  const startPayment = useCallback(async () => {
    setPhase('paying');
    setPayNote('Sending the request to your phone…');
    try {
      const r = await crunchPay(nationalId);
      setIntentId(r.intentId);
      setPayNote(
        r.simulated
          ? 'Simulated for this lender — no real money moved.'
          : 'Enter your M-PESA PIN on your phone to approve.',
      );

      // Poll rather than wait on a callback: the STK confirmation reaches the
      // server, not this browser, and a customer who backgrounds the app to
      // enter their PIN must find it resolved when they come back.
      clearInterval(pollRef.current);
      let tries = 0;
      pollRef.current = setInterval(async () => {
        tries += 1;
        try {
          const s = await crunchStatus(nationalId, r.intentId);
          if (s.status === 'SUCCESS') {
            clearInterval(pollRef.current);
            setPhase('upload');
          } else if (s.status === 'FAILED' || s.status === 'CANCELLED') {
            clearInterval(pollRef.current);
            setPayNote(s.message || 'The payment was not completed.');
            setPhase('offer');
          }
        } catch { /* a dropped poll is not a failed payment; keep trying */ }
        if (tries > 40) { // ~2 minutes
          clearInterval(pollRef.current);
          setPayNote('We have not seen the payment yet. It may still arrive — check back shortly.');
          setPhase('offer');
        }
      }, 3000);
    } catch (e) {
      setPayNote(e.message);
      setPhase('offer');
    }
  }, [nationalId]);

  const run = useCallback(async () => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setUploadErr('That file is larger than 15MB. Send the statement PDF Safaricom emailed you, not a scan.');
      return;
    }
    setUploadErr('');
    setPhase('theatre');
    setReport(null);
    setCrunchErr('');
    try {
      const r = await crunchRun(nationalId, intentId, file, password);
      setReport(r);
    } catch (e) {
      setCrunchErr(e.message);
    }
  }, [file, password, intentId, nationalId]);

  if (phase === 'loading') return <Loading rows={3} />;
  if (phase === 'error') return errorState(err, { onExpired, onRetry: load });

  if (phase === 'theatre') {
    return (
      <CrunchTheatre
        data={report}
        error={crunchErr}
        onRetry={() => { setCrunchErr(''); setPhase('upload'); }}
        onDone={() => { setPhase('upload'); load(); }}
      />
    );
  }

  if (phase === 'paying') {
    return (
      <State
        icon={Icon.phone}
        title="Check your phone"
        note={payNote}
        action={<Button quiet onClick={() => { clearInterval(pollRef.current); setPhase('offer'); }}>Cancel</Button>}
      />
    );
  }

  if (phase === 'upload') {
    return (
      <>
        <Card
          title="Send us your M-PESA statement"
          note="In M-PESA, go to My Account → M-PESA Statement and request the last 6 months by email. Send us that PDF exactly as it arrives."
        >
          <div style={{ marginTop: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <label
              htmlFor="crunch-file"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.8rem',
                padding: '1rem', borderRadius: 14, cursor: 'pointer',
                border: `1.5px dashed ${file ? 'var(--eco-good)' : 'rgba(18,21,27,0.2)'}`,
                background: file ? 'rgba(29,122,9,0.05)' : 'rgba(18,21,27,0.02)',
              }}
            >
              <span style={{ color: file ? 'var(--eco-good)' : 'var(--eco-ink-3)' }}>
                {file ? <Icon.check size={22} /> : <Icon.upload size={22} />}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600 }}>
                  {file ? file.name : 'Choose your statement PDF'}
                </span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--eco-ink-3)', marginTop: 2 }}>
                  {file ? `${(file.size / 1024 / 1024).toFixed(1)}MB` : 'PDF, up to 15MB'}
                </span>
              </span>
              <input
                id="crunch-file"
                type="file"
                accept="application/pdf,.pdf"
                style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
                onChange={(e) => { setFile(e.target.files?.[0] || null); setUploadErr(''); }}
              />
            </label>

            <div>
              <label
                htmlFor="crunch-pw"
                style={{
                  display: 'block', fontSize: '0.6875rem', fontWeight: 600,
                  letterSpacing: '0.09em', textTransform: 'uppercase',
                  color: 'var(--eco-ink-3)', marginBottom: '0.4rem',
                }}
              >
                PDF password (usually your ID number)
              </label>
              <input
                id="crunch-pw"
                type="text"
                autoComplete="off"
                placeholder="Leave blank if it opens without one"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%', minHeight: 52, padding: '0 0.95rem',
                  border: '1px solid rgba(18,21,27,0.16)', borderRadius: 14,
                  background: '#fff', fontSize: '0.95rem', fontFamily: 'inherit',
                }}
              />
            </div>

            {uploadErr && (
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--eco-bad)', lineHeight: 1.5 }}>
                {uploadErr}
              </p>
            )}

            <Button onClick={run} disabled={!file} icon={Icon.arrow}>
              Read my statement
            </Button>
          </div>
        </Card>

        <Card delay={70}>
          <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--eco-ink-3)', flexShrink: 0, marginTop: 2 }}><Icon.shield size={18} /></span>
            <p className="eco-card-note" style={{ margin: 0 }}>
              Your statement is read once and turned into a report. If the file will not
              open — wrong password, wrong document — <strong>it costs you nothing</strong> and
              you can try again.
            </p>
          </div>
        </Card>
      </>
    );
  }

  // ── OFFER ────────────────────────────────────────────────────────────────
  if (offer && offer.available === false) {
    return (
      <State
        icon={Icon.off}
        title="Not available for this lender"
        note={offer.message || 'This lender has not switched on statement refreshes yet.'}
      />
    );
  }

  return (
    <>
      <Card
        title="Refresh your credit report"
        note="Send us your latest M-PESA statement and we will rebuild your report from the last six months of real cashflow — the same analysis your lender sees."
      >
        <div style={{ marginTop: '1.1rem' }}>
          <Row label="What it costs" value={money(offer?.amount ?? offer?.price ?? 0)} />
          <Row label="What you get" value="A fresh Internal Report" />
          <Row
            label="Paid from"
            value={<Chip tone="mute">Your registered M-PESA line</Chip>}
          />
        </div>
        {payNote && (
          <p style={{ margin: '0.9rem 0 0', fontSize: '0.8125rem', color: 'var(--eco-warn)', lineHeight: 1.5 }}>
            {payNote}
          </p>
        )}
        <div style={{ marginTop: '1.2rem' }}>
          <Button onClick={startPayment} icon={Icon.phone}>
            Pay {money(offer?.amount ?? offer?.price ?? 0)} by M-PESA
          </Button>
        </div>
      </Card>

      <Card delay={70}>
        <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--eco-ink-3)', flexShrink: 0, marginTop: 2 }}><Icon.phone size={18} /></span>
          <p className="eco-card-note" style={{ margin: 0 }}>
            The prompt goes to the number registered on your account. We never ask you to
            type a phone number here, and we cannot send it anywhere else.
          </p>
        </div>
      </Card>
    </>
  );
}

export default function Crunch({ tenant }) {
  return (
    <Screen
      eyebrow={tenant?.name || 'Micro Eazy'}
      title="Statement crunch"
      back="/dashboard"
    >
      <Identity>
        {({ nationalId, onExpired }) => (
          <CrunchFlow nationalId={nationalId} onExpired={onExpired} />
        )}
      </Identity>
    </Screen>
  );
}
