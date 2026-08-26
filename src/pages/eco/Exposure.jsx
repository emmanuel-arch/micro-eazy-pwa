// ─────────────────────────────────────────────────────────────────────────────
// EXPOSURE — what the credit system sees about this customer.
//
// Three sections, and each one is allowed to be empty for a different reason:
//
//   CRB          their bureau file — or "you have not permitted this", or
//                "your lender has not checked you yet". Those are different
//                answers and the screen says which.
//   THIS LENDER  what they owe here. The only figure this deployment can answer
//                for itself without asking anybody.
//   INTERCHANGE  exposure across other lenders. Not connected yet, and said so
//                plainly rather than rendered as an empty section that reads
//                like the customer owes nothing anywhere.
//
// ── WHY THERE IS NO REFRESH BUTTON ───────────────────────────────────────────
// A live bureau pull is billed to the lender per call, and the tariff scales
// with scrutiny. A refresh control on a customer's phone is a way to hand a
// lender a surprise invoice. The server reads the last stored report and this
// screen deliberately offers no way to ask for a new one — the spend decision
// belongs to the lender, in their console.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Screen, Card, Hero, Row, Chip, Button, State, Loading, Icon, money, when } from '../../components/eco/Surface';
import Identity, { errorState } from '../../components/eco/Identity';
import { exposure } from '../../lib/ecosystem';

const VERDICT_TONE = { CLEAR: 'good', CAUTION: 'warn', ADVERSE: 'bad' };
const BAND_TONE = { Excellent: 'good', Good: 'good', Fair: 'warn', Poor: 'bad' };

function CrbSection({ crb }) {
  if (!crb.consented) {
    return (
      <Card title="Your credit reference" delay={0}>
        <p className="eco-card-note" style={{ margin: '0 0 1.1rem' }}>{crb.message}</p>
        <Link to="/permissions" style={{ textDecoration: 'none' }}>
          <Button quiet icon={Icon.shield}>Manage permissions</Button>
        </Link>
      </Card>
    );
  }

  if (!crb.available) {
    return (
      <Card title="Your credit reference" delay={0}>
        <p className="eco-card-note" style={{ margin: 0 }}>{crb.message}</p>
      </Card>
    );
  }

  const r = crb.report;
  return (
    <>
      <Hero
        label={r.bureau}
        figure={r.score}
        tone={BAND_TONE[r.band]}
        note={`${r.band} · checked ${when(crb.checkedAt)}`}
      />

      {r.stale && (
        <Card delay={40}>
          <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--eco-warn)', flexShrink: 0, marginTop: 2 }}><Icon.clock size={18} /></span>
            <p className="eco-card-note" style={{ margin: 0 }}>
              This file is more than three months old. Your lender refreshes it when you
              next apply — what it shows may have changed since.
            </p>
          </div>
        </Card>
      )}

      {r.sandbox && (
        <Card delay={50}>
          <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--eco-warn)', flexShrink: 0, marginTop: 2 }}><Icon.alert size={18} /></span>
            <p className="eco-card-note" style={{ margin: 0 }}>
              <strong>This is test data, not your file.</strong> Your lender's bureau
              subscription is still on test keys, which only answer for sample identities.
            </p>
          </div>
        </Card>
      )}

      <Card title="What the bureau holds" delay={70}>
        <div style={{ marginTop: '0.9rem' }}>
          <Row label="Verdict" value={<Chip tone={VERDICT_TONE[r.verdict] || 'mute'}>{r.verdict}</Chip>} />
          <Row label="Total exposure" value={money(r.totalExposure)} />
          <Row label="Accounts" value={`${r.accounts?.total ?? 0} · ${r.accounts?.active ?? 0} open`} />
          {Number(r.accounts?.npl) > 0 && (
            <Row label="Non-performing" value={r.accounts.npl} tone="bad" />
          )}
          <Row
            label="Worst arrears"
            value={r.worstArrearsDays ? `${r.worstArrearsDays} days` : 'None'}
            tone={r.worstArrearsDays > 30 ? 'bad' : undefined}
          />
          <Row label="Enquiries (6 months)" value={r.enquiriesLast6m ?? 0} />
        </div>
        {r.summary && (
          <p className="eco-card-note" style={{ margin: '1rem 0 0' }}>{r.summary}</p>
        )}
      </Card>

      {!!r.negativeListings?.length && (
        <Card
          title="Negative listings"
          note="Accounts a lender has reported as in difficulty. If you think one is wrong, the bureau must investigate it — start with your lender."
          delay={110}
        >
          <div style={{ marginTop: '0.9rem' }}>
            {r.negativeListings.map((l, i) => (
              <div
                key={i}
                style={{
                  padding: '0.75rem 0',
                  borderBottom: i === r.negativeListings.length - 1 ? 0 : '1px solid var(--eco-line)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{l.lender}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {money(l.amount)}
                  </span>
                </div>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--eco-ink-3)' }}>
                  {l.status} · since {when(l.since)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

// ── ACROSS OTHER LENDERS ─────────────────────────────────────────────────────
// The federated half. Five states, five different sentences, because only ONE of
// them means "you owe nothing elsewhere" and the other four would be a lie if
// they were rendered as that.
//
//   not-configured  this lender is not on the network
//   not-consented   the customer has not permitted the check
//   refused         the network declined or could not be reached
//   partial         an answer, but not every lender could be asked
//   ok              a complete answer
//
// A borrower reads this screen to understand their own position, and a screen
// that shows an empty section when a node timed out teaches them something false
// about their own record.

/** The collections ladder, in words a borrower would use about themselves. */
const BUCKET_WORDS = {
  prepayment: 'All up to date',
  due: 'Payment due',
  watch_1: 'Up to a month behind',
  watch_2: 'One to two months behind',
  watch_3: 'Two to three months behind',
  npl: 'More than three months behind',
};

const BUCKET_TONE = {
  prepayment: 'good', due: 'good',
  watch_1: 'warn', watch_2: 'warn', watch_3: 'warn',
  npl: 'bad',
};

function InterchangeSection({ ix }) {
  if (!ix) return null;

  // Not on the network, and said plainly rather than rendered as an empty
  // section that reads like the customer owes nothing anywhere.
  if (ix.connected === false) {
    return (
      <Card title="Across other lenders" delay={190}>
        <p className="eco-card-note" style={{ margin: 0 }}>{ix.message}</p>
        <div style={{ marginTop: '0.9rem' }}>
          <Chip tone="mute">Not switched on</Chip>
        </div>
      </Card>
    );
  }

  if (ix.state === 'not-consented') {
    return (
      <Card title="Across other lenders" delay={190}>
        <p className="eco-card-note" style={{ margin: '0 0 1.1rem' }}>{ix.message}</p>
        <Link to="/permissions" style={{ textDecoration: 'none' }}>
          <Button quiet icon={Icon.shield}>Manage permissions</Button>
        </Link>
      </Card>
    );
  }

  if (ix.state === 'refused') {
    return (
      <Card title="Across other lenders" delay={190}>
        <p className="eco-card-note" style={{ margin: 0 }}>{ix.message}</p>
        <div style={{ marginTop: '0.9rem' }}>
          <Chip tone="warn">Not checked</Chip>
        </div>
      </Card>
    );
  }

  const found = (ix.lenders ?? 0) > 0;

  // Nothing found. Still worth a card: "we asked and nobody reported a loan" is
  // a genuine, useful answer, and it is not the same as never having asked.
  if (!found) {
    return (
      <Card title="Across other lenders" delay={190}>
        <p className="eco-card-note" style={{ margin: 0 }}>{ix.message}</p>
        <div style={{ marginTop: '0.9rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Chip tone={ix.state === 'partial' ? 'warn' : 'good'}>
            {ix.state === 'partial' ? 'Partly checked' : 'Nothing reported'}
          </Chip>
          <Chip tone="mute">{ix.responded} of {ix.queried} lenders answered</Chip>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Across other lenders" delay={190}>
      <div style={{ marginTop: '0.4rem' }}>
        <Row label="Lenders reporting a loan" value={ix.lenders} />
        <Row label="Loans still running" value={ix.activeLoans} />
        {/* A RANGE, never a figure. The network is told bands and counts — the
            exact balance would identify a specific loan at a specific lender. */}
        <Row label="Owed elsewhere" value={ix.outstandingBand} />
        {ix.worstBucket && (
          <Row label="Furthest behind" value={BUCKET_WORDS[ix.worstBucket] || ix.worstBucket} />
        )}
        {ix.velocity14d > 0 && (
          <Row label="New loans in the last 14 days" value={ix.velocity14d} />
        )}
      </div>

      <div style={{ marginTop: '0.9rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {ix.worstBucket && (
          <Chip tone={BUCKET_TONE[ix.worstBucket] || 'mute'}>
            {BUCKET_WORDS[ix.worstBucket] || ix.worstBucket}
          </Chip>
        )}
        <Chip tone={ix.state === 'partial' ? 'warn' : 'mute'}>
          {ix.responded} of {ix.queried} lenders answered
        </Chip>
      </div>

      {/* The incompleteness is stated where the numbers are, not in a footnote.
          A customer who reads "you owe 25k–50k" needs to know in the same breath
          that the real figure may be higher. */}
      {ix.message && (
        <p className="eco-card-note" style={{ margin: '0.9rem 0 0' }}>{ix.message}</p>
      )}

      <p className="eco-card-note" style={{ margin: '0.9rem 0 0' }}>
        Other lenders are never told your name, ID number or phone number — only
        ranges and repayment status, and only because you permitted it.
      </p>
    </Card>
  );
}

function ExposureFlow({ nationalId, onExpired }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try { setD(await exposure(nationalId)); }
    catch (e) { setErr(e); }
    finally { setLoading(false); }
  }, [nationalId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loading rows={4} />;
  if (err) return errorState(err, { onExpired, onRetry: load });

  return (
    <>
      <CrbSection crb={d.crb} />

      <Card title={`With ${d.withThisLender?.lender || 'this lender'}`} delay={150}>
        <div style={{ marginTop: '0.9rem' }}>
          <Row
            label="Open loans"
            value={d.withThisLender?.openLoans ?? 0}
          />
        </div>
      </Card>

      <InterchangeSection ix={d.interchange} />

      <Card delay={230}>
        <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--eco-ink-3)', flexShrink: 0, marginTop: 2 }}><Icon.shield size={18} /></span>
          <p className="eco-card-note" style={{ margin: 0 }}>
            This is a copy of what your lender already holds. Nothing on this screen
            triggers a new check — you decide what is permitted under{' '}
            <Link to="/permissions" style={{ color: 'var(--eco-accent)' }}>Permissions</Link>.
          </p>
        </div>
      </Card>
    </>
  );
}

export default function Exposure({ tenant }) {
  return (
    <Screen eyebrow={tenant?.name || 'Micro Eazy'} title="Your credit file" back="/dashboard">
      <Identity>
        {({ nationalId, onExpired }) => <ExposureFlow nationalId={nationalId} onExpired={onExpired} />}
      </Identity>
    </Screen>
  );
}
