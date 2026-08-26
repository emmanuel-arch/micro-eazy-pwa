// ─────────────────────────────────────────────────────────────────────────────
// M-PESA RATIBA — auto-repayments the customer sets up and can stop.
//
// The PLAN IS NOT NEGOTIABLE FROM HERE, and that is the point of the screen.
// Amount, frequency, start and end are all derived server-side from the loan and
// its product: the instalment becomes the debit, the repayment unit becomes the
// frequency, the next due date the start. Nothing about the money is sent from
// this client, so there is no field here to get wrong and no way to authorise a
// standing order for the wrong amount.
//
// The customer authorises it on their own handset. The Ratiba callback — which
// reaches the server, not this browser — is what turns it ACTIVE, so this screen
// re-reads rather than assumes.
//
// Cancelling is given the same weight as setting up. An auto-debit somebody
// cannot find the off switch for is a complaint, not a feature.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useState } from 'react';
import { Screen, Card, Row, Chip, Button, State, Loading, Icon, money, when } from '../../components/eco/Surface';
import Identity, { errorState } from '../../components/eco/Identity';
import { ratibaOffer, ratibaSetup, ratibaCancel } from '../../lib/ecosystem';

const FREQ = {
  ONCE: 'once', DAILY: 'every day', WEEKLY: 'every week', MONTHLY: 'every month',
  BIMONTHLY: 'every 2 months', QUARTERLY: 'every 3 months',
  HALFYEAR: 'twice a year', YEARLY: 'once a year',
};

function RatibaFlow({ nationalId, onExpired }) {
  const [offer, setOffer] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try { setOffer(await ratibaOffer(nationalId)); }
    catch (e) { setErr(e); }
    finally { setLoading(false); }
  }, [nationalId]);

  useEffect(() => { load(); }, [load]);

  const setup = useCallback(async () => {
    setBusy(true); setNote('');
    try {
      const r = await ratibaSetup(nationalId);
      setNote(
        r.simulated
          ? 'Simulated for this lender — nothing was sent to Safaricom.'
          : 'Approve it on your phone. It becomes active once Safaricom confirms.',
      );
      await load();
    } catch (e) { setNote(e.message); }
    finally { setBusy(false); }
  }, [nationalId, load]);

  const cancel = useCallback(async () => {
    setBusy(true); setNote('');
    try {
      await ratibaCancel(nationalId, offer?.standingOrder?.id ?? offer?.standingOrderId);
      setConfirmCancel(false);
      await load();
    } catch (e) { setNote(e.message); }
    finally { setBusy(false); }
  }, [nationalId, offer, load]);

  if (loading) return <Loading rows={3} />;
  if (err) return errorState(err, { onExpired, onRetry: load });

  if (offer?.available === false) {
    return (
      <State
        icon={Icon.off}
        title="Not available yet"
        note={offer.message || 'This lender has not switched on M-PESA Ratiba.'}
      />
    );
  }

  const active = offer?.standingOrder || offer?.active;
  const plan = offer?.plan || offer?.standingOrder || {};

  if (active) {
    return (
      <>
        <Card
          title="Auto-repay is on"
          note="We will collect your instalment automatically. You can stop it at any time — it takes effect immediately."
        >
          <div style={{ marginTop: '0.9rem' }}>
            <Row label="Status" value={<Chip tone="good">Active</Chip>} />
            <Row label="Amount" value={money(plan.amount)} />
            <Row label="How often" value={FREQ[plan.frequency] || plan.frequency || '—'} />
            <Row label="Next collection" value={when(plan.nextDate ?? plan.startDate)} />
            <Row label="Runs until" value={when(plan.endDate)} />
          </div>
        </Card>

        {note && <Card delay={60}><p className="eco-card-note" style={{ margin: 0 }}>{note}</p></Card>}

        <Card delay={90}>
          {!confirmCancel ? (
            <Button quiet onClick={() => setConfirmCancel(true)}>Stop auto-repay</Button>
          ) : (
            <>
              <p className="eco-card-note" style={{ margin: '0 0 0.9rem' }}>
                Stopping it does not clear what you owe — you would go back to paying
                each instalment yourself.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <Button onClick={cancel} disabled={busy}>
                  {busy ? 'Stopping…' : 'Yes, stop it'}
                </Button>
                <Button quiet onClick={() => setConfirmCancel(false)}>Keep it running</Button>
              </div>
            </>
          )}
        </Card>
      </>
    );
  }

  return (
    <>
      <Card
        title="Never miss an instalment"
        note="M-PESA Ratiba collects your instalment automatically on the day it falls due. You approve it once on your phone, and you can stop it whenever you like."
      >
        <div style={{ marginTop: '0.9rem' }}>
          <Row label="Amount each time" value={money(plan.amount)} />
          <Row label="How often" value={FREQ[plan.frequency] || plan.frequency || '—'} />
          <Row label="First collection" value={when(plan.startDate)} />
          <Row label="Runs until" value={when(plan.endDate)} />
        </div>
        {note && (
          <p style={{ margin: '0.9rem 0 0', fontSize: '0.8125rem', color: 'var(--eco-warn)', lineHeight: 1.5 }}>
            {note}
          </p>
        )}
        <div style={{ marginTop: '1.2rem' }}>
          <Button onClick={setup} disabled={busy} icon={Icon.repeat}>
            {busy ? 'Setting up…' : 'Set up auto-repay'}
          </Button>
        </div>
      </Card>

      <Card delay={70}>
        <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--eco-ink-3)', flexShrink: 0, marginTop: 2 }}><Icon.shield size={18} /></span>
          <p className="eco-card-note" style={{ margin: 0 }}>
            These figures come from your loan, not from anything typed here — so the
            amount collected can only ever be your instalment.
          </p>
        </div>
      </Card>
    </>
  );
}

export default function Ratiba({ tenant }) {
  return (
    <Screen eyebrow={tenant?.name || 'Micro Eazy'} title="Auto-repay" back="/dashboard">
      <Identity>
        {({ nationalId, onExpired }) => <RatibaFlow nationalId={nationalId} onExpired={onExpired} />}
      </Identity>
    </Screen>
  );
}
