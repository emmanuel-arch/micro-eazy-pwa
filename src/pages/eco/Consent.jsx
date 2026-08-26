// ─────────────────────────────────────────────────────────────────────────────
// PERMISSIONS — what the customer has agreed to, and how to take it back.
//
// ── WITHDRAWAL IS AS EASY AS GRANTING ────────────────────────────────────────
// One tap, same control, no confirmation maze, no "contact support". That is
// the whole reason this screen exists: consent that can only be given is not
// consent. Where a withdrawal has a consequence — the two permissions the
// assessment depends on — the consequence is stated BEFORE the toggle rather
// than discovered at the next application.
//
// ── EVERY CHANGE IS APPENDED, NEVER OVERWRITTEN ──────────────────────────────
// The server writes a new record each time and keeps the old ones, so the
// history below is not a nicety — it is the customer's own copy of the evidence
// the lender would produce if asked "what did they consent to on the day you ran
// that check?". Showing it is what makes the claim checkable.
//
// The screen sends ONLY the toggle that moved. The server carries every other
// permission forward, so a stale client can never silently clear something the
// customer never touched.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useState } from 'react';
import { Screen, Card, Chip, State, Loading, Icon, when } from '../../components/eco/Surface';
import Identity, { errorState } from '../../components/eco/Identity';
import { consentGet, consentSet } from '../../lib/ecosystem';

function Toggle({ on, busy, onChange, id }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-labelledby={id}
      disabled={busy}
      onClick={() => onChange(!on)}
      style={{
        flex: '0 0 auto',
        width: 50, height: 30,
        borderRadius: 999,
        border: '1px solid ' + (on ? 'transparent' : 'rgba(18,21,27,0.2)'),
        background: on ? 'var(--eco-good)' : 'rgba(18,21,27,0.1)',
        position: 'relative',
        cursor: busy ? 'wait' : 'pointer',
        opacity: busy ? 0.55 : 1,
        transition: 'background 0.18s ease',
        padding: 0,
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 3, left: on ? 23 : 3,
          width: 22, height: 22,
          borderRadius: 999,
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.28)',
          transition: 'left 0.18s cubic-bezier(0.16,1,0.3,1)',
        }}
      />
    </button>
  );
}

function ConsentFlow({ nationalId, onExpired }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState(null);
  const [note, setNote] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try { setD(await consentGet(nationalId)); }
    catch (e) { setErr(e); }
    finally { setLoading(false); }
  }, [nationalId]);

  useEffect(() => { load(); }, [load]);

  const change = useCallback(async (key, value) => {
    setBusyKey(key); setNote('');
    try {
      const r = await consentSet(nationalId, { [key]: value });
      setD((prev) => ({ ...prev, grants: r.grants, recordedAt: r.recordedAt ?? prev.recordedAt }));
      if (r.message && !r.unchanged) setNote(r.message);
      // Re-read so the history below reflects the record just written, rather
      // than going stale the moment the customer changes anything.
      consentGet(nationalId).then(setD).catch(() => {});
    } catch (e) {
      setNote(e.message);
    } finally {
      setBusyKey(null);
    }
  }, [nationalId]);

  if (loading) return <Loading rows={5} />;
  if (err) return errorState(err, { onExpired, onRetry: load });

  const catalogue = d?.catalogue || [];
  const grants = d?.grants || {};

  if (!catalogue.length) {
    return <State icon={Icon.shield} title="Nothing on file yet" note="Your permissions appear here once you have applied." />;
  }

  return (
    <>
      <Card
        title="What you have agreed to"
        note="Change any of these at any time. A change takes effect from the moment you make it."
      >
        <div style={{ marginTop: '1.1rem' }}>
          {catalogue.map((c, i) => {
            const on = grants[c.key] === true;
            const labelId = `consent-${c.key}`;
            return (
              <div
                key={c.key}
                style={{
                  display: 'flex', gap: '1rem', alignItems: 'flex-start',
                  padding: '0.95rem 0',
                  borderBottom: i === catalogue.length - 1 ? 0 : '1px solid var(--eco-line)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span id={labelId} style={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.35 }}>
                      {c.label}
                    </span>
                    {c.mandatory && <Chip tone="mute">Needed to apply</Chip>}
                  </div>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', lineHeight: 1.55, color: 'var(--eco-ink-2)' }}>
                    {c.detail}
                  </p>
                  {c.mandatory && on && (
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', lineHeight: 1.5, color: 'var(--eco-ink-3)' }}>
                      Turning this off stops a new application being scored. It does not
                      change a decision already made.
                    </p>
                  )}
                </div>
                <Toggle
                  id={labelId}
                  on={on}
                  busy={busyKey === c.key}
                  onChange={(v) => change(c.key, v)}
                />
              </div>
            );
          })}
        </div>

        {note && (
          <p
            role="status"
            style={{ margin: '1.1rem 0 0', fontSize: '0.8125rem', lineHeight: 1.55, color: 'var(--eco-warn)' }}
          >
            {note}
          </p>
        )}
      </Card>

      <Card delay={70}>
        <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--eco-ink-3)', flexShrink: 0, marginTop: 2 }}><Icon.shield size={18} /></span>
          <p className="eco-card-note" style={{ margin: 0 }}>
            Every change is kept as a dated record — including the ones you turn off.
            That history is what proves what you had agreed to on any given day, and
            you can read the same copy your lender holds.
          </p>
        </div>
      </Card>

      {!!d?.history?.length && (
        <Card title="Your record" delay={110}>
          <p className="eco-card-note" style={{ margin: '0 0 0.9rem' }}>
            {d.history.length} change{d.history.length === 1 ? '' : 's'} on file.
            Last updated {when(d.recordedAt)}.
          </p>

          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            style={{
              background: 'none', border: 0, padding: 0, cursor: 'pointer',
              color: 'var(--eco-accent)', fontSize: '0.8125rem', fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            {showHistory ? 'Hide' : 'Show'} the full record
          </button>

          {showHistory && (
            <div style={{ marginTop: '1rem' }}>
              {d.history.map((h) => {
                const on = catalogue.filter((c) => h.grants[c.key]);
                return (
                  <div key={h.id} style={{ padding: '0.7rem 0', borderBottom: '1px solid var(--eco-line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{when(h.at)}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--eco-ink-3)' }}>v{h.version}</span>
                    </div>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', lineHeight: 1.5, color: 'var(--eco-ink-2)' }}>
                      {on.length ? on.map((c) => c.label).join(' · ') : 'Nothing permitted'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </>
  );
}

export default function Consent({ tenant }) {
  return (
    <Screen eyebrow={tenant?.name || 'Micro Eazy'} title="Permissions" back="/dashboard">
      <Identity>
        {({ nationalId, onExpired }) => <ConsentFlow nationalId={nationalId} onExpired={onExpired} />}
      </Identity>
    </Screen>
  );
}
