// ─────────────────────────────────────────────────────────────────────────────
// THE LADDER — the limit, as the customer actually climbed it.
//
// ── THE PROPERTY THAT MAKES THIS SCREEN TRUSTWORTHY ──────────────────────────
// It cannot promise a rung, because it has no power to grant one. Every row here
// is a GraduationEvent the engine already wrote; this screen only reads them
// back. A screen that could hint at a future limit would be a sales pitch, and
// customers would learn to discount it.
//
// ── THE LADDER GOES BOTH WAYS ────────────────────────────────────────────────
// `move` is not always "graduate" — the engine lowers limits too. Rendering only
// the increases would quietly hide every decrease, and a customer whose limit
// fell would find no explanation on the one screen built to explain limits.
// Both directions are shown, and labelled.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useState } from 'react';
import { Screen, Card, Hero, Chip, State, Loading, Icon, money, when } from '../../components/eco/Surface';
import Identity, { errorState } from '../../components/eco/Identity';
import { ladder } from '../../lib/ecosystem';

function Rung({ e, isLast }) {
  const down = e.direction === 'down' || Number(e.to) < Number(e.from);
  const tone = down ? 'bad' : 'good';
  return (
    <li style={{ display: 'flex', gap: '0.9rem', listStyle: 'none' }}>
      {/* The spine. Drawn per row rather than as one absolute line so it cannot
          drift out of alignment when a row wraps to two lines on a narrow phone. */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto' }}>
        <span
          aria-hidden
          style={{
            width: 11, height: 11, borderRadius: 999, marginTop: 5,
            background: `var(--eco-${tone})`,
            boxShadow: `0 0 0 3px color-mix(in srgb, var(--eco-${tone}) 18%, transparent)`,
          }}
        />
        {!isLast && <span aria-hidden style={{ flex: 1, width: 2, background: 'var(--eco-line)', marginTop: 4 }} />}
      </div>

      <div style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? 0 : '1.15rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.9375rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {money(e.to ?? e.limit)}
          </span>
          <Chip tone={tone}>{down ? 'Lowered' : 'Raised'}</Chip>
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--eco-ink-3)' }}>
            {when(e.at || e.createdAt)}
          </span>
        </div>
        {e.from != null && (
          <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: 'var(--eco-ink-3)' }}>
            from {money(e.from)}
          </p>
        )}
        {(e.reason || e.detail) && (
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.8125rem', lineHeight: 1.55, color: 'var(--eco-ink-2)' }}>
            {e.reason || e.detail}
          </p>
        )}
      </div>
    </li>
  );
}

function LadderFlow({ nationalId, onExpired }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try { setD(await ladder(nationalId)); }
    catch (e) { setErr(e); }
    finally { setLoading(false); }
  }, [nationalId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loading rows={4} />;
  if (err) return errorState(err, { onExpired, onRetry: load });

  const events = d?.events || d?.ladder || [];
  const current = d?.currentLimit ?? d?.limit ?? events[0]?.to;

  if (!events.length) {
    return (
      <>
        {current != null && (
          <Hero label="Your limit today" figure={money(current)} note="Repay on time and it grows." />
        )}
        <State
          icon={Icon.ladder}
          title="No changes yet"
          note="Every time your limit moves — up or down — the change and the reason for it appear here."
          delay={60}
        />
      </>
    );
  }

  return (
    <>
      <Hero
        label="Your limit today"
        figure={money(current)}
        note={`${events.length} change${events.length === 1 ? '' : 's'} on record.`}
      />

      <Card title="How it moved" note="Most recent first." delay={70}>
        <ul style={{ margin: '1rem 0 0', padding: 0 }}>
          {events.map((e, i) => (
            <Rung key={e.id || i} e={e} isLast={i === events.length - 1} />
          ))}
        </ul>
      </Card>

      <Card delay={130}>
        <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--eco-ink-3)', flexShrink: 0, marginTop: 2 }}><Icon.shield size={18} /></span>
          <p className="eco-card-note" style={{ margin: 0 }}>
            This screen reads a ladder you have already climbed. It cannot promise a
            next rung, and it will not pretend to.
          </p>
        </div>
      </Card>
    </>
  );
}

export default function Ladder({ tenant }) {
  return (
    <Screen eyebrow={tenant?.name || 'Micro Eazy'} title="Your limit" back="/dashboard">
      <Identity>
        {({ nationalId, onExpired }) => <LadderFlow nationalId={nationalId} onExpired={onExpired} />}
      </Identity>
    </Screen>
  );
}
