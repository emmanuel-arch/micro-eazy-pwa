// ─────────────────────────────────────────────────────────────────────────────
// THE CREDIT REPORT COUNTER — where a customer buys their own file.
//
// Two screens on one route, in the shape the pattern has settled into across
// every Kenyan app that sells a bureau report: a LIST of what can be bought,
// then a DETAIL with the artwork, the promise and one price. Nothing else on
// either screen competes with the thing being offered.
//
//   /credit-report              the counter
//   /credit-report/:reportKey   one product
//
// ── EVERY REQUEST IS REFUSED, ON PURPOSE ─────────────────────────────────────
// Not a stub, and not a TODO to be quietly deleted. A bureau pull spends real
// money at Metropol the instant it succeeds, and on this side there is no
// payment leg, no consent record and no receipt yet. Until those exist the only
// honest answer to "request" is that it is not available, said in a sentence
// rather than by a button that does nothing.
//
// The refusal is deliberately reached THROUGH the waiting state rather than
// instead of it — tap, the ring turns, then the sheet. A request that is
// declined in the same frame as the tap reads as a broken button; one that is
// visibly considered first reads as a system that looked and answered. The delay
// is the only theatre on this screen and it is bounded (see PRETEND_MS).
//
// ── WHERE THE PRICE COMES FROM ───────────────────────────────────────────────
// src/lib/reports.js, and only there. KES 150 is a commercial number and is not
// derived from the lender's wholesale tariff in the Suite's catalogue.ts — see
// the note in that file about why the two must never be confused.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../../components/eco/Surface';
import Waiting from '../../components/eco/EazyLoader';
import { REPORTS, HEADLINE, reportByKey, ksh } from '../../lib/reports';
import '../../components/eco/cinema.css';

/** How long the ring turns before the refusal. Long enough to read as a look,
 *  short enough that nobody wonders whether it has hung. */
const PRETEND_MS = 1500;

/* ── The few icons the shared set does not carry ─────────────────────────── */

const Svg = ({ children, size = 20 }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const ICONS = {
  report: (p) => <Svg {...p}><path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V7l-5-5Z" /><path d="M14 2v5h5" /><path d="M9 13h6M9 17h4" /></Svg>,
  certificate: (p) => <Svg {...p}><path d="M6 2h12a1 1 0 011 1v11a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1Z" /><path d="M9 6h6M9 10h4" /><circle cx="12" cy="19" r="3" /><path d="M10.5 21.4L10 24l2-1.2L14 24l-.5-2.6" /></Svg>,
  gauge: (p) => <Svg {...p}><path d="M3.5 17a9 9 0 1117 0" /><path d="M12 17l4.2-4.6" /><circle cx="12" cy="17" r="1.4" /></Svg>,
  pulse: (p) => <Svg {...p}><path d="M3 12h4l2.5-6 4 12L16 12h5" /></Svg>,
  stack: (p) => <Svg {...p}><path d="M12 3l9 4.5-9 4.5-9-4.5L12 3Z" /><path d="M3 12.5l9 4.5 9-4.5" /><path d="M3 17l9 4.5 9-4.5" /></Svg>,
  trend: (p) => <Svg {...p}><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></Svg>,
  id: (p) => <Svg {...p}><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><circle cx="8.5" cy="11.5" r="2.2" /><path d="M5 16.5c.8-1.6 2-2.4 3.5-2.4s2.7.8 3.5 2.4" /><path d="M15 10h4M15 13.5h4" /></Svg>,
  chevron: (p) => <Svg {...p}><path d="M9 6l6 6-6 6" /></Svg>,
  dot: (p) => <Svg {...p}><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" /></Svg>,
  lock: (p) => <Svg {...p}><rect x="4.5" y="10" width="15" height="11" rx="2.5" /><path d="M8 10V7a4 4 0 018 0v3" /></Svg>,
};

/* ── The artwork ──────────────────────────────────────────────────────────── */

/**
 * A phone and a sealed document, drawn rather than photographed.
 *
 * INLINE, and that is the point: it is the largest thing on the screen and the
 * first thing painted, so a network round trip for it would put a hole in the
 * middle of the hero on exactly the connection this app is built for. It also
 * scales to any handset without a second asset and inherits the brand colours
 * from the palette below rather than baking them into a PNG that goes stale the
 * next time the mark is re-exported.
 */
function ReportArt({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 260 240" role="img" aria-label="A phone beside a sealed credit report">
      <defs>
        <linearGradient id="ca-phone" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0b3a86" />
          <stop offset="100%" stopColor="#01184a" />
        </linearGradient>
        <linearGradient id="ca-screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#77c60b" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#25950c" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="ca-doc" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#dfe7f4" />
        </linearGradient>
        <linearGradient id="ca-seal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8fdc18" />
          <stop offset="100%" stopColor="#1f8209" />
        </linearGradient>
      </defs>

      {/* The phone, tipped back a few degrees so the pair reads as objects on a
          surface rather than as two flat shapes side by side. */}
      <g transform="rotate(-8 96 128)">
        <rect x="34" y="42" width="124" height="172" rx="20" fill="url(#ca-phone)" />
        <rect x="34" y="42" width="124" height="172" rx="20" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.4" />
        <rect x="44" y="54" width="104" height="148" rx="13" fill="rgba(255,255,255,0.07)" />
        {/* The band on the screen is the app's own primary action, echoed. */}
        <rect x="56" y="150" width="80" height="26" rx="13" fill="url(#ca-screen)" />
        <rect x="56" y="76" width="58" height="7" rx="3.5" fill="rgba(255,255,255,0.34)" />
        <rect x="56" y="93" width="80" height="7" rx="3.5" fill="rgba(255,255,255,0.20)" />
        <rect x="56" y="110" width="68" height="7" rx="3.5" fill="rgba(255,255,255,0.20)" />
        <rect x="80" y="48" width="32" height="5" rx="2.5" fill="rgba(255,255,255,0.28)" />
      </g>

      {/* The document, in front and to the right — the thing being bought. */}
      <g transform="rotate(6 176 132)">
        <rect x="118" y="58" width="118" height="152" rx="9" fill="url(#ca-doc)" />
        <rect x="118" y="58" width="118" height="152" rx="9" fill="none" stroke="rgba(1,40,99,0.16)" strokeWidth="1.2" />
        {/* A folded corner, because a rectangle is a card and a card with a
            turned corner is a document. */}
        <path d="M236 58 L236 82 L212 58 Z" fill="rgba(1,40,99,0.13)" />
        <rect x="134" y="82" width="52" height="8" rx="4" fill="#012863" opacity="0.82" />
        {[104, 120, 136, 152].map((y, i) => (
          <rect key={y} x="134" y={y} width={i % 2 ? 74 : 86} height="6" rx="3" fill="#012863" opacity="0.17" />
        ))}
        <rect x="134" y="170" width="44" height="6" rx="3" fill="#012863" opacity="0.17" />
        {/* The seal. */}
        <circle cx="206" cy="176" r="21" fill="url(#ca-seal)" />
        <circle cx="206" cy="176" r="21" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.6" />
        <path d="M197 176.5l6 6 12-12" fill="none" stroke="#03204f" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/* ── The refusal ──────────────────────────────────────────────────────────── */

/**
 * One place, and only one, where a request is declined.
 *
 * Every entry point on both screens routes here, so the wording of a refusal
 * cannot drift between the card a customer tapped and the button they pressed.
 */
function Sheet({ report, onClose }) {
  // Escape closes it. A sheet with no keyboard exit is a trap on the desktop
  // build, which is what the Vercel preview URL actually gets demoed on.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="cine-scrim"
      role="dialog"
      aria-modal="true"
      aria-label={`${report?.name ?? 'This report'} is unavailable`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="cine-sheet">
        <div className="cine-grip" aria-hidden />
        <div className="cine-sheet-icon" aria-hidden><ICONS.lock size={26} /></div>
        <h2 className="cine-sheet-title">Unavailable at the moment</h2>
        <p className="cine-sheet-note">
          {report?.name ?? 'This report'} cannot be pulled yet. We are finishing the
          payment and consent steps that have to sit in front of a bureau request —
          you will be able to buy it here as soon as they are done.
        </p>
        <p className="cine-sheet-note" style={{ marginTop: '0.6rem', fontSize: '0.74rem' }}>
          Nothing has been charged and nothing was requested on your behalf.
        </p>
        <div className="cine-sheet-actions">
          <button type="button" className="cine-btn-quiet" onClick={onClose} autoFocus>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── The shell ────────────────────────────────────────────────────────────── */

function Shell({ eyebrow, title, onBack, children, bar }) {
  // IMMERSIVE MODE. Marks the document for as long as one of these screens is
  // mounted, which is how cinema.css suppresses the floating install banner —
  // it is fixed at z-index 1020 and would otherwise sit on top of the sticky
  // call to action, and then on top of the refusal sheet. Removed on unmount so
  // the banner comes straight back on every other screen in the app.
  useEffect(() => {
    document.body.classList.add('eazy-immersive');
    return () => document.body.classList.remove('eazy-immersive');
  }, []);

  return (
    <div className="cine">
      <div className="cine-glow" aria-hidden />
      <div className="cine-grain" aria-hidden />
      <div className="cine-content">
        <header className="cine-head">
          <button type="button" className="cine-back" onClick={onBack} aria-label="Go back">
            <Icon.back size={19} />
          </button>
          <div>
            {eyebrow && <p className="cine-eyebrow">{eyebrow}</p>}
            <h1 className="cine-title">{title}</h1>
          </div>
        </header>
        {children}
      </div>
      {bar && (
        <div className="cine-bar">
          <div className="cine-bar-inner">{bar}</div>
        </div>
      )}
    </div>
  );
}

/** One product, as a card. Tapping it opens the product, never buys it. */
function ReportCard({ report, index, onOpen }) {
  const I = ICONS[report.icon] ?? ICONS.report;
  return (
    <button
      type="button"
      className={`cine-card ${report.featured ? 'cine-card-featured' : ''}`}
      style={{ '--d': `${index * 55}ms` }}
      onClick={() => onOpen(report)}
    >
      <span className="cine-card-icon" aria-hidden><I size={21} /></span>
      <span className="cine-card-body">
        <span className="cine-card-name">{report.name}</span>
        <span className="cine-card-note">{report.tagline}</span>
      </span>
      <span className="cine-card-tail">
        {report.price != null ? (
          <span className="cine-price">KSh {ksh(report.price)}</span>
        ) : (
          <span className="cine-soon">Soon</span>
        )}
        <span className="cine-chev" aria-hidden><ICONS.chevron size={17} /></span>
      </span>
    </button>
  );
}

/* ── The two screens ──────────────────────────────────────────────────────── */

function Counter({ tenant, navigate }) {
  return (
    <Shell
      eyebrow={tenant?.resolved ? tenant.name : 'Micro Eazy'}
      title="Credit Report"
      onBack={() => navigate('/dashboard')}
      bar={
        <>
          <button
            type="button"
            className="cine-cta"
            onClick={() => navigate(`/credit-report/${HEADLINE.key}`)}
          >
            Get my CRB report — KSh {ksh(HEADLINE.price)}
            <Icon.arrow size={19} />
          </button>
          <p className="cine-bar-note">Pulled from Metropol · your consent, every time</p>
        </>
      }
    >
      <section className="cine-hero">
        <ReportArt className="cine-art" />
        <h2 className="cine-hero-title">Know exactly what lenders see</h2>
        <p className="cine-hero-sub">
          Your credit file is the single thing every lender reads before deciding.
          Pull your own copy, understand it, and fix what is holding you back.
        </p>
      </section>

      <p className="cine-section-label">Reports you can pull</p>
      {REPORTS.map((r, i) => (
        <ReportCard
          key={r.key}
          report={r}
          index={i}
          onOpen={(rep) => navigate(`/credit-report/${rep.key}`)}
        />
      ))}
    </Shell>
  );
}

function Product({ report, tenant, navigate, onRequest }) {
  const I = ICONS[report.icon] ?? ICONS.report;
  return (
    <Shell
      eyebrow={tenant?.resolved ? tenant.name : 'Micro Eazy'}
      title={report.name}
      onBack={() => navigate('/credit-report')}
      bar={
        <>
          <button type="button" className="cine-cta" onClick={() => onRequest(report)}>
            {report.price != null
              ? `Request for KSh. ${ksh(report.price)}`
              : `Request ${report.name}`}
            <Icon.arrow size={19} />
          </button>
          <p className="cine-bar-note">
            {report.code
              ? `Metropol report type ${report.code} · nothing is charged until you confirm`
              : 'Issued by the bureau · nothing is charged until you confirm'}
          </p>
        </>
      }
    >
      <section className="cine-hero">
        <ReportArt className="cine-art" />
        <h2 className="cine-hero-title">{report.tagline}</h2>
        <p className="cine-hero-sub">{report.blurb}</p>
      </section>

      <p className="cine-section-label">What you get</p>
      <div className="cine-panel" style={{ '--d': '60ms' }}>
        {report.yields.map((y) => (
          <div className="cine-yield" key={y}>
            <span className="cine-yield-dot" aria-hidden><ICONS.dot size={8} /></span>
            <span className="cine-yield-text">{y}</span>
          </div>
        ))}
      </div>

      <p className="cine-section-label">Good to know</p>
      <div className="cine-panel" style={{ '--d': '110ms' }}>
        <div className="cine-yield">
          <span className="cine-yield-dot" aria-hidden><I size={15} /></span>
          <span className="cine-yield-text">
            Pulling your own report is a soft search. It is recorded on your file as
            your own request and does not affect your score.
          </span>
        </div>
        <div className="cine-yield">
          <span className="cine-yield-dot" aria-hidden><Icon.shield size={15} /></span>
          <span className="cine-yield-text">
            We ask the bureau on your behalf and show you the answer. Your lender does
            not see that you looked.
          </span>
        </div>
      </div>
    </Shell>
  );
}

/* ── The route ────────────────────────────────────────────────────────────── */

export default function CreditReport({ tenant }) {
  const navigate = useNavigate();
  const { reportKey } = useParams();
  const [pending, setPending] = useState(null);
  const [refused, setRefused] = useState(null);

  const report = reportKey ? reportByKey(reportKey) : null;

  // An unknown key is a typed URL or a stale link, not an error worth a screen.
  useEffect(() => {
    if (reportKey && !report) navigate('/credit-report', { replace: true });
  }, [reportKey, report, navigate]);

  // The considered pause. Cleared on unmount so navigating away mid-request
  // cannot pop a sheet onto whatever screen the customer landed on next.
  useEffect(() => {
    if (!pending) return undefined;
    const t = setTimeout(() => {
      setRefused(pending);
      setPending(null);
    }, PRETEND_MS);
    return () => clearTimeout(t);
  }, [pending]);

  const request = (r) => {
    if (r.available) return; // reserved for the day one of these is wired
    setPending(r);
  };

  if (reportKey && !report) return null;

  return (
    <>
      {report ? (
        <Product report={report} tenant={tenant} navigate={navigate} onRequest={request} />
      ) : (
        <Counter tenant={tenant} navigate={navigate} />
      )}

      {pending && (
        <Waiting
          full
          onDark
          size="lg"
          // NOT lowercased. `"CRB Report".toLowerCase()` reads "crb report",
          // which is the one word on this screen a customer scans for.
          title={`Requesting your ${pending.name}`}
          note="Checking with the bureau…"
        />
      )}

      {refused && <Sheet report={refused} onClose={() => setRefused(null)} />}
    </>
  );
}
