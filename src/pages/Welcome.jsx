// ─────────────────────────────────────────────────────────────────────────────
// THE APEX DOOR — the first screen in the ecosystem.
//
// A customer arriving at microeazy.servicesuitecloud.com meets MICRO EAZY here:
// the name, the promise, the three commitments, and the install. One tap later
// they are in their own lender's app, in their own lender's colours. Ecosystem
// first, lender second — the same order the staff side uses.
//
// ── THE BUG THIS SCREEN REPLACES ─────────────────────────────────────────────
// The previous landing page (connected-suite, InstallDoor.tsx) rendered its call
// to action as `<PrimaryButton href="/">`. On this host `/` is rewritten to the
// landing page itself, so "Get started" navigated to the screen it was already
// on. It was not unclickable — it was a loop, which looks identical to a dead
// button and trapped every visitor on the first screen.
//
// The rule that keeps it fixed: this component never links to "/". It links to
// an explicit next step, and `onContinue` is passed in by the router so the
// destination is decided in one place, by App.jsx, rather than guessed here.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { ECOSYSTEM } from '../lib/tenant';

const C = ECOSYSTEM.colors;

/** iOS cannot be prompted programmatically; it has to be told where to tap. */
function isIosSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ reports itself as a Mac; the touch count is what separates an
    // iPad from a desktop Safari.
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  );
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

const PROOFS = [
  ['phone', 'A decision in minutes, from your phone'],
  ['eye', 'Every decision explained — never a silent no'],
  ['shield', 'Your data, your report, your consent'],
];

function ProofIcon({ kind }) {
  const common = {
    width: 15,
    height: 15,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.4,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  if (kind === 'phone') {
    return (
      <svg {...common}>
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M12 18h.01" />
      </svg>
    );
  }
  if (kind === 'eye') {
    return (
      <svg {...common}>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default function Welcome({ tenant, onContinue }) {
  const [deferred, setDeferred] = useState(null);
  const [installing, setInstalling] = useState(false);
  const [standalone, setStandalone] = useState(isStandalone);
  const ios = isIosSafari();

  useEffect(() => {
    // Chrome fires this only once the manifest, the icons and HTTPS all check
    // out, so its arrival doubles as the installability test passing.
    const onPrompt = (e) => {
      e.preventDefault(); // suppress Chrome's mini-infobar; we present it ourselves
      setDeferred(e);
    };
    const onInstalled = () => {
      setDeferred(null);
      setStandalone(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    setInstalling(true);
    try {
      await deferred.prompt();
      await deferred.userChoice;
      // A dismissed prompt cannot be re-fired — the event is spent — so it is
      // dropped either way rather than leaving a button that silently does
      // nothing on a second tap.
      setDeferred(null);
    } finally {
      setInstalling(false);
    }
  }

  const canInstall = Boolean(deferred) && !standalone;
  const showIosCoaching = ios && !standalone && !canInstall;

  return (
    <main
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        overflowX: 'clip',
        padding: `max(2rem, env(safe-area-inset-top)) 1.25rem max(2rem, env(safe-area-inset-bottom))`,
        background: ECOSYSTEM.gradient,
      }}
    >
      {/* Atmosphere: two green blooms, felt rather than seen. */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute', top: '-22%', right: '-28%',
            width: '78vw', height: '78vw', borderRadius: '9999px',
            background: `radial-gradient(circle, ${C.lime}40 0%, transparent 68%)`,
            filter: 'blur(46px)',
          }}
        />
        <div
          style={{
            position: 'absolute', bottom: '-26%', left: '-32%',
            width: '86vw', height: '86vw', borderRadius: '9999px',
            background: `radial-gradient(circle, ${C.green}38 0%, transparent 70%)`,
            filter: 'blur(52px)',
          }}
        />
      </div>

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          width: '100%',
          maxWidth: '20rem',
          margin: '0 auto',
        }}
      >
        {/* The tile: not the wordmark, the ACTUAL icon that is about to land on
            the home screen, at the radius Android will give it. */}
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div
            style={{
              display: 'grid', placeItems: 'center',
              height: 92, width: 92, borderRadius: 22, background: '#fff',
              boxShadow: '0 22px 50px -12px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.14)',
            }}
          >
            <img
              src="/brand/micro-eazy/icon-512.png"
              alt=""
              width={92}
              height={92}
              style={{ height: 92, width: 92, borderRadius: 22 }}
            />
          </div>

          <h1 style={{ marginTop: '1.75rem', fontSize: '2rem', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.022em', color: '#fff' }}>
            {ECOSYSTEM.name}
          </h1>
          <p style={{ marginTop: '0.5rem', fontSize: '0.95rem', fontWeight: 600, letterSpacing: '-0.006em', color: C.lime }}>
            {ECOSYSTEM.tagline}
          </p>
          <p style={{ marginTop: '1rem', fontSize: '0.875rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.70)' }}>
            {ECOSYSTEM.description}
          </p>
        </div>

        {/* The three commitments — not features. Each one is a screen that exists. */}
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.75rem' }}>
          {PROOFS.map(([kind, text]) => (
            <li key={kind} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span
                style={{
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                  height: 28, width: 28, borderRadius: '9999px',
                  background: 'rgba(255,255,255,0.10)', color: C.lime,
                }}
              >
                <ProofIcon kind={kind} />
              </span>
              <span style={{ fontSize: '0.8125rem', lineHeight: 1.4, color: 'rgba(255,255,255,0.80)' }}>
                {text}
              </span>
            </li>
          ))}
        </ul>

        {/* ── The action ──────────────────────────────────────────────────────
            Lime on navy TEXT is the only pairing on this ground that clears AA
            (6.65:1); white on the brand green would be 3.90:1. */}
        <div>
          {canInstall ? (
            <button
              type="button"
              onClick={install}
              disabled={installing}
              style={primaryButton}
            >
              {installing ? 'Opening…' : `Install ${ECOSYSTEM.name}`}
            </button>
          ) : (
            <button type="button" onClick={onContinue} style={primaryButton}>
              Get started
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          )}

          {showIosCoaching && (
            <p style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.75rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.6)' }}>
              To install: tap <strong style={{ color: '#fff' }}>Share</strong>, then{' '}
              <strong style={{ color: '#fff' }}>Add to Home Screen</strong>.
            </p>
          )}

          {canInstall && (
            <button type="button" onClick={onContinue} style={secondaryButton}>
              Continue in the browser
            </button>
          )}
        </div>

        {/* The lender of record, named. This is the ONLY tenant-branded element
            on this screen — the handoff has not happened yet, and pretending
            otherwise would make the ecosystem look like one lender's app. */}
        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.6875rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.45)' }}>
          {tenant?.resolved
            ? `Funded and serviced by ${tenant.name} · Powered by BirgenAI`
            : 'Funded and serviced by licensed Kenyan lenders · Powered by BirgenAI'}
        </p>
      </div>
    </main>
  );
}

const primaryButton = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  width: '100%',
  minHeight: 52,
  border: 'none',
  borderRadius: 16,
  background: ECOSYSTEM.colors.lime,
  color: ECOSYSTEM.colors.navy,
  fontSize: '1rem',
  fontWeight: 700,
  letterSpacing: '-0.01em',
  cursor: 'pointer',
};

const secondaryButton = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  minHeight: 44,
  marginTop: '0.75rem',
  border: 'none',
  background: 'transparent',
  borderRadius: 16,
  color: 'rgba(255,255,255,0.65)',
  fontSize: '0.875rem',
  fontWeight: 500,
  cursor: 'pointer',
};
