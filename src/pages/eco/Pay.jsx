// ─────────────────────────────────────────────────────────────────────────────
// PAY NOW — an STK push the customer raises themselves.
//
// The amount is the only thing this screen sends. The PHONE is never sent: the
// server resolves it from the verified session and pushes to the number
// registered on the account, so the worst possible misuse of this endpoint is
// paying somebody else's loan.
//
// Rate-limited hard server-side (5 per 10 minutes) because an STK push is an
// unsolicited PIN prompt on a real handset, and an unthrottled one is a
// harassment tool rather than a feature.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useState } from 'react';
import { Screen, Card, Row, Button, State, Loading, Icon, money, when } from '../../components/eco/Surface';
import Identity, { errorState } from '../../components/eco/Identity';
import { myLoan, payNow } from '../../lib/ecosystem';

function PayFlow({ nationalId, onExpired }) {
  const [loan, setLoan] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(null);
  const [payErr, setPayErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const r = await myLoan(nationalId);
      setLoan(r);
      // Default to the instalment, not the balance: paying the instalment is
      // what keeps a loan current, and it is the number the customer was told.
      const due = r.nextInstalment ?? r.installment ?? r.amountDue;
      if (due) setAmount(String(Math.round(Number(due))));
    } catch (e) {
      setErr(e);
    } finally {
      setLoading(false);
    }
  }, [nationalId]);

  useEffect(() => { load(); }, [load]);

  const send = useCallback(async () => {
    setSending(true); setPayErr('');
    try {
      const r = await payNow(nationalId, Number(amount) || undefined);
      setSent(r);
    } catch (e) {
      setPayErr(e.message);
    } finally {
      setSending(false);
    }
  }, [nationalId, amount]);

  if (loading) return <Loading rows={3} />;
  if (err) return errorState(err, { onExpired, onRetry: load });

  if (sent) {
    return (
      <State
        icon={Icon.phone}
        title="Check your phone"
        note={
          sent.simulated
            ? 'Simulated for this lender — no real money moved.'
            : 'Enter your M-PESA PIN to approve the payment. It can take a moment to reflect.'
        }
        action={<Button quiet onClick={() => { setSent(null); load(); }}>Done</Button>}
      />
    );
  }

  const balance = loan?.balance ?? loan?.outstanding;

  return (
    <>
      <Card title="What you owe" delay={0}>
        <div style={{ marginTop: '0.9rem' }}>
          <Row label="Balance" value={money(balance)} />
          <Row label="Next instalment" value={money(loan?.nextInstalment ?? loan?.installment)} />
          <Row label="Due" value={when(loan?.dueDate ?? loan?.nextDueDate)} />
          {Number(loan?.arrears) > 0 && (
            <Row label="Arrears" value={money(loan.arrears)} tone="bad" />
          )}
        </div>
      </Card>

      <Card title="Pay by M-PESA" note="The prompt goes to the number registered on your account." delay={70}>
        <div style={{ marginTop: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <label
              htmlFor="pay-amt"
              style={{
                display: 'block', fontSize: '0.6875rem', fontWeight: 600,
                letterSpacing: '0.09em', textTransform: 'uppercase',
                color: 'var(--eco-ink-3)', marginBottom: '0.4rem',
              }}
            >
              Amount (KES)
            </label>
            <input
              id="pay-amt"
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
              style={{
                width: '100%', minHeight: 56, padding: '0 0.95rem',
                border: '1px solid rgba(18,21,27,0.16)', borderRadius: 14,
                background: '#fff', fontSize: '1.25rem', fontWeight: 600,
                fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[loan?.nextInstalment ?? loan?.installment, balance]
              .filter((v) => Number(v) > 0)
              .map((v, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAmount(String(Math.round(Number(v))))}
                  style={{
                    flex: '1 1 auto', minHeight: 40, padding: '0 0.8rem',
                    border: '1px solid rgba(18,21,27,0.16)', borderRadius: 11,
                    background: 'transparent', cursor: 'pointer',
                    fontSize: '0.8125rem', fontFamily: 'inherit', color: 'var(--eco-ink-2)',
                  }}
                >
                  {i === 0 ? 'Instalment' : 'Full balance'} · {money(v)}
                </button>
              ))}
          </div>

          {payErr && (
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--eco-bad)', lineHeight: 1.5 }}>{payErr}</p>
          )}

          <Button onClick={send} disabled={sending || !Number(amount)} icon={Icon.phone}>
            {sending ? 'Sending…' : `Send prompt for ${money(Number(amount) || 0)}`}
          </Button>
        </div>
      </Card>
    </>
  );
}

export default function Pay({ tenant }) {
  return (
    <Screen eyebrow={tenant?.name || 'Micro Eazy'} title="Pay your loan" back="/dashboard">
      <Identity>
        {({ nationalId, onExpired }) => <PayFlow nationalId={nationalId} onExpired={onExpired} />}
      </Identity>
    </Screen>
  );
}
