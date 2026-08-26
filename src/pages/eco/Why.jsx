// ─────────────────────────────────────────────────────────────────────────────
// WHY — the screen that makes "never a silent no" true.
//
// It is one of the three promises made on the ecosystem's front door, and this
// is the only place it is kept. A customer who was declined is shown the actual
// reasons the engine recorded, in the order they weighed, with the thing they
// could change first.
//
// ── THE TONE RULE ────────────────────────────────────────────────────────────
// A decline is read by somebody who has just been refused money they needed. The
// copy does not soften it — softening reads as evasion, and evasion is what the
// screen exists to end — but it does not lecture either. It states what happened,
// what drove it, and what would move it. Nothing here says "unfortunately".
//
// ── WHY THIS ANSWERS WHERE /my-loan REFUSES ──────────────────────────────────
// For a bridged lender the LOAN BOOK lives in their own ServiceSuite, so my-loan
// correctly declines to guess. The DECISION is the other way round: the
// application was scored by our engine and the reasons were written by our model,
// so the row is ours to show. Micromart's customers are precisely the ones who
// most need this screen.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useState } from 'react';
import { Screen, Card, Hero, Chip, State, Loading, Icon, when } from '../../components/eco/Surface';
import Identity, { errorState } from '../../components/eco/Identity';
import { decision } from '../../lib/ecosystem';

const VERDICT = {
  APPROVED: { tone: 'good', label: 'Approved', line: 'Your application was approved.' },
  REFER: { tone: 'warn', label: 'Referred', line: 'Your application needs a person to look at it.' },
  REFERRED: { tone: 'warn', label: 'Referred', line: 'Your application needs a person to look at it.' },
  DECLINED: { tone: 'bad', label: 'Declined', line: 'Your application was not approved this time.' },
  REJECTED: { tone: 'bad', label: 'Declined', line: 'Your application was not approved this time.' },
};

function Reason({ r }) {
  const down = r.direction === 'down' || r.impact === 'negative';
  return (
    <div
      style={{
        display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
        padding: '0.85rem 0', borderBottom: '1px solid var(--eco-line)',
      }}
    >
      <span
        aria-hidden
        style={{
          flex: '0 0 auto', width: 8, height: 8, borderRadius: 999, marginTop: 7,
          background: down ? 'var(--eco-bad)' : 'var(--eco-good)',
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.35 }}>
          {r.factor || r.label || r.code}
        </div>
        {(r.detail || r.description) && (
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', lineHeight: 1.55, color: 'var(--eco-ink-2)' }}>
            {r.detail || r.description}
          </p>
        )}
      </div>
      {Number.isFinite(Number(r.points)) && (
        <span
          style={{
            flex: '0 0 auto', fontSize: '0.8125rem', fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: down ? 'var(--eco-bad)' : 'var(--eco-good)',
          }}
        >
          {down ? '−' : '+'}{Math.abs(Number(r.points))}
        </span>
      )}
    </div>
  );
}

function WhyFlow({ nationalId, onExpired }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try { setD(await decision(nationalId)); }
    catch (e) { setErr(e); }
    finally { setLoading(false); }
  }, [nationalId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loading rows={4} />;
  if (err) return errorState(err, { onExpired, onRetry: load });

  const reasons = d?.reasonCodes || d?.reasons || [];
  if (!d || (!d.decision && !reasons.length)) {
    return (
      <State
        icon={Icon.file}
        title="No decision on file yet"
        note="Once you apply, the reasons behind the answer appear here — whatever the answer is."
      />
    );
  }

  const v = VERDICT[String(d.decision || '').toUpperCase()] || { tone: 'mute', label: d.decision, line: '' };
  const helped = reasons.filter((r) => !(r.direction === 'down' || r.impact === 'negative'));
  const hurt = reasons.filter((r) => r.direction === 'down' || r.impact === 'negative');

  return (
    <>
      <Hero
        label={when(d.decidedAt || d.createdAt)}
        figure={v.label}
        tone={v.tone === 'mute' ? undefined : v.tone}
        note={v.line}
      />

      {!!hurt.length && (
        <Card
          title="What weighed against it"
          note="Listed heaviest first. These are the ones worth acting on."
          delay={60}
        >
          <div style={{ marginTop: '0.6rem' }}>
            {hurt.map((r, i) => <Reason key={r.code || i} r={r} />)}
          </div>
        </Card>
      )}

      {!!helped.length && (
        <Card title="What worked in your favour" delay={110}>
          <div style={{ marginTop: '0.6rem' }}>
            {helped.map((r, i) => <Reason key={r.code || i} r={r} />)}
          </div>
        </Card>
      )}

      <Card delay={160}>
        <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--eco-ink-3)', flexShrink: 0, marginTop: 2 }}><Icon.eye size={18} /></span>
          <p className="eco-card-note" style={{ margin: 0 }}>
            This is the record the decision was made from — not a summary written
            afterwards. If you think something here is wrong, your lender can see the
            same list and can tell you what evidence sits behind each line.
          </p>
        </div>
      </Card>

      {d.modelVersion && (
        <p
          style={{
            textAlign: 'center', margin: '1rem 0 0',
            fontSize: '0.6875rem', color: 'var(--eco-ink-3)',
          }}
        >
          Scored by model {d.modelVersion}
        </p>
      )}
    </>
  );
}

export default function Why({ tenant }) {
  return (
    <Screen eyebrow={tenant?.name || 'Micro Eazy'} title="Why this decision" back="/dashboard">
      <Identity>
        {({ nationalId, onExpired }) => <WhyFlow nationalId={nationalId} onExpired={onExpired} />}
      </Identity>
    </Screen>
  );
}
