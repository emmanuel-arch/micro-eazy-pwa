// ─────────────────────────────────────────────────────────────────────────────
// THE ECOSYSTEM SURFACE — the primitives every customer screen is built from.
//
// One file rather than seven, because these are small and always used together;
// splitting them would cost seven imports per screen and buy nothing.
//
// The rule that keeps the set coherent: NOTHING HERE FETCHES OR DECIDES. These
// are presentation only. Every screen owns its own data and its own states, and
// hands finished values down. That is what lets the same <Row> render a KES
// figure on the pay screen and a date on the Ratiba screen without either
// knowing about the other.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './eco.css';

/* ── Formatting ──────────────────────────────────────────────────────────── */

/**
 * Kenyan shillings, the way a customer reads them.
 *
 * Always two decimals: a repayment screen that shows "KES 4,500" next to "KES
 * 4,500.75" invites the question of whether the first one is rounded. It is
 * their money; show all of it.
 */
export function money(value, { currency = 'KES' } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${currency} ${n.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** A date a customer can read, in the order Kenyans write them. */
export function when(value) {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── Icons ───────────────────────────────────────────────────────────────── */

const Svg = ({ children, size = 20, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

export const Icon = {
  back: (p) => <Svg {...p}><path d="M15 18l-6-6 6-6" /></Svg>,
  arrow: (p) => <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>,
  upload: (p) => <Svg {...p}><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" /></Svg>,
  phone: (p) => <Svg {...p}><rect x="5" y="2" width="14" height="20" rx="2.5" /><path d="M12 18h.01" /></Svg>,
  shield: (p) => <Svg {...p}><path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z" /></Svg>,
  clock: (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>,
  repeat: (p) => <Svg {...p}><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" /></Svg>,
  ladder: (p) => <Svg {...p}><path d="M7 2v20M17 2v20M7 7h10M7 12h10M7 17h10" /></Svg>,
  eye: (p) => <Svg {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></Svg>,
  check: (p) => <Svg {...p}><path d="M20 6L9 17l-5-5" /></Svg>,
  alert: (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></Svg>,
  file: (p) => <Svg {...p}><path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V7l-5-5Z" /><path d="M14 2v5h5" /></Svg>,
  off: (p) => <Svg {...p}><path d="M18.36 6.64a9 9 0 11-12.73 0" /><path d="M12 2v10" /></Svg>,
};

/* ── The shell ───────────────────────────────────────────────────────────── */

/**
 * A customer screen.
 *
 * @param {string} eyebrow  small caps line above the title — usually the lender
 * @param {string} title    what this screen is
 * @param {string} [back]   route for the back control; defaults to history back
 */
export function Screen({ eyebrow, title, back, children }) {
  const navigate = useNavigate();
  return (
    <div className="eco">
      <div className="eco-ground" aria-hidden />
      <div className="eco-wash" aria-hidden />
      <div className="eco-content">
        <header className="eco-head eco-rise">
          <button
            type="button"
            className="eco-back"
            onClick={() => (back ? navigate(back) : navigate(-1))}
            aria-label="Go back"
          >
            <Icon.back size={18} />
          </button>
          <div>
            {eyebrow && <p className="eco-eyebrow">{eyebrow}</p>}
            <h1 className="eco-title">{title}</h1>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

/**
 * A card.
 *
 * `delay` staggers the entrance. Keep the total under ~250ms across a screen —
 * past that it stops reading as one surface arriving and starts reading as a
 * list being built, which is slower to use and feels slower still.
 */
export function Card({ title, note, delay = 0, className = '', children, ...rest }) {
  return (
    <section
      className={`eco-card eco-rise ${className}`}
      style={{ '--d': `${delay}ms` }}
      {...rest}
    >
      {title && <h2 className="eco-card-title">{title}</h2>}
      {note && <p className="eco-card-note">{note}</p>}
      {children}
    </section>
  );
}

/** One figure, said once. For screens that exist to deliver a single fact. */
export function Hero({ label, figure, note, tone, delay = 0 }) {
  return (
    <section className="eco-card eco-hero eco-rise" style={{ '--d': `${delay}ms` }}>
      {label && <p className="eco-hero-label">{label}</p>}
      <p
        className="eco-hero-figure"
        style={tone ? { color: `var(--eco-${tone})` } : undefined}
      >
        {figure}
      </p>
      {note && <p className="eco-card-note">{note}</p>}
    </section>
  );
}

export function Row({ label, value, tone }) {
  return (
    <div className="eco-row">
      <span className="eco-row-label">{label}</span>
      <span
        className="eco-row-value"
        style={tone ? { color: `var(--eco-${tone})` } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

export function Chip({ tone = 'mute', children }) {
  return <span className={`eco-chip eco-chip-${tone}`}>{children}</span>;
}

export function Button({ children, quiet, icon: I, ...rest }) {
  return (
    <button type="button" className={`eco-btn ${quiet ? 'eco-btn-quiet' : ''}`} {...rest}>
      {I && <I size={18} />}
      {children}
    </button>
  );
}

/**
 * An honest state.
 *
 * Used for empty, unavailable, offline and error alike, because they are the
 * same shape and the difference is the words. Every screen in this set is
 * required to have one: they all read live systems that can be down, and a
 * customer is owed a sentence about it rather than a spinner that never stops.
 */
export function State({ icon: I = Icon.alert, title, note, action, delay = 0 }) {
  return (
    <section className="eco-card eco-state eco-rise" style={{ '--d': `${delay}ms` }}>
      <div className="eco-state-icon"><I size={24} /></div>
      <h2 className="eco-state-title">{title}</h2>
      {note && <p className="eco-state-note">{note}</p>}
      {action && <div style={{ marginTop: '1.1rem' }}>{action}</div>}
    </section>
  );
}

/** The skeleton shown while a screen's first read is in flight. */
export function Loading({ rows = 3 }) {
  return (
    <section className="eco-card" aria-busy="true" aria-live="polite">
      <span className="visually-hidden" style={{ position: 'absolute', left: -9999 }}>Loading</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 12,
            borderRadius: 6,
            background: 'rgba(18,21,27,0.07)',
            marginBottom: i === rows - 1 ? 0 : 14,
            width: `${100 - i * 14}%`,
          }}
        />
      ))}
    </section>
  );
}
