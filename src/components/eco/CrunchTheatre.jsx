// ─────────────────────────────────────────────────────────────────────────────
// M-PESA STATEMENT CRUNCH THEATRE — the customer's ninety seconds.
//
// A full-screen, Safaricom-branded sequence run while the server reads six
// months of the customer's statement:
//
//   decrypt → parse → extract → ledger → audit → score → factors
//
// ── THE ONE RULE ─────────────────────────────────────────────────────────────
// The STAGING is theatre. The NUMBERS ARE REAL. The only invented thing on this
// screen is the receipt code that flickers in the feed before the server has
// answered — and the moment it does, every counter, every category, the dial and
// every factor is the customer's own statement. Nothing after `extract` is
// decoration.
//
// That distinction is not stylistic. This screen is shown to somebody about to
// be told what their credit is worth; a progress bar that lies about what it is
// doing is a small thing that makes the large thing untrustworthy.
//
// ── HOW THE TIMING WORKS ─────────────────────────────────────────────────────
// The stages advance on a timer, EXCEPT `extract`, which blocks until the
// server's data arrives. So a fast response still plays the full sequence (it
// reads as considered rather than skipped) and a slow one waits in the one stage
// where waiting makes narrative sense — "extracting transactions" is a truthful
// description of what the server is doing.
//
// `onDone` fires when the customer leaves; the parent owns what happens next.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from 'react';
import './crunch.css';

const GREEN = '#4cb749';
const AMBER = '#d97706';
const RED = '#e11d48';
const SLATE = '#94a3b8';

const RAIL = [
  { stage: 'unlock', label: 'Decrypt' },
  { stage: 'parse', label: 'Parse' },
  { stage: 'extract', label: 'Extract' },
  { stage: 'classify', label: 'Ledger' },
  { stage: 'audit', label: 'Audit' },
  { stage: 'score', label: 'Score' },
];

const DUR = { unlock: 700, parse: 800, extract: 1300, classify: 1100, audit: 1300, score: 1500, factors: 0 };

const easeOut = (p) => 1 - Math.pow(1 - p, 3);

/**
 * Count up to a real number. Never used for anything the server has not sent.
 *
 * ── THE VALUE MUST ALWAYS ARRIVE ─────────────────────────────────────────────
 * This drives the credit-score dial. If requestAnimationFrame is throttled or
 * never fires — a backgrounded tab, a phone that locked while the customer read
 * the SMS, a browser that suspends rAF under memory pressure — a naive
 * implementation leaves the counter at its initial 0, and the customer is shown
 * "0 out of 850" as their credit score. There is no worse failure on this
 * screen, and it degrades silently.
 *
 * So the animation is an ENHANCEMENT over a guaranteed value: a timer snaps to
 * the target after the duration regardless of whether a single frame rendered.
 */
function useCountUp(target, duration = 900, active = true) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active || !Number.isFinite(target)) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setV(target);
      return undefined;
    }

    // The guarantee. Fires whether or not the animation ever ran.
    const settle = setTimeout(() => setV(target), duration + 120);

    let raf = 0;
    const t0 = performance.now();
    const tick = (t) => {
      // CLAMPED AT BOTH ENDS, and the lower one is not theoretical: a rAF
      // timestamp can predate the performance.now() captured immediately
      // before it, making `p` negative. easeOut() of a negative p returns a
      // negative multiplier, so the dial rendered "−11 out of 850" and drew its
      // arc backwards on the first frame. Caught in the preview harness.
      const p = Math.max(0, Math.min(1, (t - t0) / duration));
      setV(p >= 1 ? target : target * easeOut(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
    };
  }, [target, duration, active]);
  return v;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
/** The ONLY synthetic value on this screen, and only before the server answers. */
const fakeReceipt = () =>
  'U' + CHARS[Math.floor(Math.random() * 26)] +
  Array.from({ length: 8 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');

const ksh = (n) =>
  Number.isFinite(Number(n))
    ? Number(n).toLocaleString('en-KE', { maximumFractionDigits: 0 })
    : '—';

function SafaricomLoader() {
  return (
    <div className="saf-loader">
      <span className="saf-loader-pulse" aria-hidden />
      <span className="saf-loader-ring" aria-hidden />
      <span className="saf-loader-mark">
        <img src="/mpesa/safaricom-25.gif" alt="Safaricom" width="80" />
      </span>
    </div>
  );
}

/** The live posting feed. Real rows once `data` lands; placeholders before. */
function ExtractStage({ data }) {
  const [feed, setFeed] = useState([]);
  const idRef = useRef(0);

  useEffect(() => {
    const iv = setInterval(() => {
      const id = idRef.current++;
      const sample = data?.sample?.length ? data.sample[id % data.sample.length] : null;
      setFeed((f) => [
        {
          id,
          receipt: sample?.receipt || fakeReceipt(),
          details: sample?.details || 'Reading entry…',
          amount: sample?.amount ?? null,
          direction: sample?.direction || (id % 3 === 0 ? 'in' : 'out'),
        },
        ...f,
      ].slice(0, 6));
    }, 260);
    return () => clearInterval(iv);
  }, [data]);

  return (
    <div className="crunch-card crunch-stage">
      <div className="crunch-feed">
        {feed.map((r) => (
          <div className="crunch-feed-row" key={r.id}>
            <span className="crunch-receipt">{r.receipt}</span>
            <span className="crunch-detail">{r.details}</span>
            <span className={`crunch-amt ${r.direction}`}>
              {r.amount == null ? '···' : `${r.direction === 'in' ? '+' : '−'}${ksh(r.amount)}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Figures({ data }) {
  const txns = useCountUp(data?.transactionCount ?? 0, 900);
  const inAmt = useCountUp(data?.paidIn ?? 0, 1100);
  const outAmt = useCountUp(data?.paidOut ?? 0, 1100);
  return (
    <div className="crunch-card crunch-stage">
      <div className="crunch-figs">
        <div className="crunch-fig">
          <div className="crunch-fig-v">{Math.round(txns).toLocaleString('en-KE')}</div>
          <div className="crunch-fig-l">Transactions</div>
        </div>
        <div className="crunch-fig">
          <div className="crunch-fig-v" style={{ color: GREEN }}>{ksh(inAmt)}</div>
          <div className="crunch-fig-l">Paid in</div>
        </div>
        <div className="crunch-fig">
          <div className="crunch-fig-v">{ksh(outAmt)}</div>
          <div className="crunch-fig-l">Paid out</div>
        </div>
      </div>
    </div>
  );
}

const toneColor = (tone) =>
  tone === 'good' ? GREEN : tone === 'warn' ? AMBER : tone === 'high' || tone === 'bad' ? RED : SLATE;

function ScoreDial({ score, max, tone }) {
  const shown = useCountUp(score ?? 0, 1400);
  const pct = max ? Math.min(1, (shown || 0) / max) : 0;
  const R = 74;
  const C = 2 * Math.PI * R;
  const colour = toneColor(tone);
  return (
    <div className="crunch-dial">
      <svg width="168" height="168" viewBox="0 0 168 168" aria-hidden>
        <circle cx="84" cy="84" r={R} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="11" />
        <circle
          cx="84" cy="84" r={R} fill="none"
          stroke={colour} strokeWidth="11" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
        />
      </svg>
      <div className="crunch-dial-mid">
        <div className="crunch-dial-score" style={{ color: colour }}>{Math.round(shown)}</div>
        <div className="crunch-dial-max">out of {max ?? '—'}</div>
      </div>
    </div>
  );
}

export default function CrunchTheatre({ data, error, onDone, onRetry, initialStage }) {
  // `initialStage` exists for the preview harness so a designer can jump straight
  // to the stage being worked on instead of sitting through eight seconds of
  // sequence for every tweak. Production never passes it.
  const [stage, setStage] = useState(initialStage || 'unlock');
  const waiting = stage === 'extract' && !data && !error;

  useEffect(() => {
    if (stage === 'factors' || waiting) return undefined;
    const order = [...RAIL.map((r) => r.stage), 'factors'];
    const next = order[order.indexOf(stage) + 1];
    if (!next) return undefined;
    const t = setTimeout(() => setStage(next), DUR[stage]);
    return () => clearTimeout(t);
  }, [stage, waiting]);

  // A refusal from the server ends the sequence immediately. Continuing to
  // animate "auditing" over a failed parse would be the screen lying.
  if (error) {
    return (
      <div className="crunch" role="alertdialog" aria-label="Statement could not be read">
        <div className="crunch-bg" aria-hidden />
        <div className="crunch-inner">
          <div className="crunch-card" style={{ textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '1.15rem', margin: '0 0 0.5rem' }}>
              We could not read that statement
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.72)', lineHeight: 1.6, margin: 0 }}>
              {error}
            </p>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginTop: '0.9rem' }}>
              This did not use up your refresh — you can try again with the right file
              or the right password at no extra cost.
            </p>
          </div>
          <div className="crunch-actions">
            {onRetry && <button type="button" className="crunch-btn" onClick={onRetry}>Try again</button>}
            <button type="button" className="crunch-btn crunch-btn-quiet" onClick={onDone}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  const COPY = {
    unlock: ['Decrypting your statement', 'Unlocking the password-protected PDF from Safaricom'],
    parse: ['Reading the document', 'Rebuilding every page, line and column'],
    extract: ['Extracting transactions', waiting ? 'Scanning your statement…' : 'Posting each entry to the ledger'],
    classify: ['Posting to ledgers', 'Classifying every shilling in and out'],
    audit: ['Running the audit', 'Reconciling balances and testing behaviour'],
    score: ['Your credit score', 'Built from six months of real cashflow'],
    factors: ['Your score, explained', 'Every factor, positive and negative'],
  };

  const railIdx = RAIL.findIndex((r) => r.stage === stage);
  const activeIdx = stage === 'factors' ? RAIL.length : railIdx;
  const score = data?.creditScore;
  const [title, sub] = COPY[stage];

  return (
    <div className="crunch" role="dialog" aria-label="Reading your M-Pesa statement">
      <div className="crunch-bg" aria-hidden />
      <div className="crunch-inner">
        {stage !== 'factors' && <SafaricomLoader />}

        <div className="crunch-rail">
          {RAIL.map((r, i) => (
            <div
              key={r.stage}
              className={`crunch-rail-seg ${i < activeIdx ? 'done' : ''} ${i === activeIdx ? 'active' : ''}`}
              style={{ '--dur': `${DUR[r.stage]}ms` }}
            >
              <span className="crunch-rail-bar"><span className="crunch-rail-fill" /></span>
              <div className="crunch-rail-label">{r.label}</div>
            </div>
          ))}
        </div>

        <div className="crunch-head">
          <div className="crunch-swap" key={stage}>
            <h1>{title}</h1>
            <p aria-live="polite">{sub}</p>
          </div>
        </div>

        {stage === 'extract' && <ExtractStage data={data} />}
        {(stage === 'classify' || stage === 'audit') && <Figures data={data} />}

        {stage === 'score' && score && (
          <div className="crunch-stage">
            <ScoreDial score={score.score} max={score.maxScore} tone={score.tone} />
            <p style={{ textAlign: 'center', marginTop: '0.9rem', fontSize: '0.85rem', fontWeight: 600 }}>
              {score.band}
            </p>
          </div>
        )}

        {stage === 'factors' && (
          <>
            {score && (
              <div className="crunch-stage" style={{ textAlign: 'center' }}>
                <ScoreDial score={score.score} max={score.maxScore} tone={score.tone} />
                <p style={{ marginTop: '0.8rem', fontSize: '0.85rem', fontWeight: 600 }}>{score.band}</p>
              </div>
            )}
            {!!score?.reasonCodes?.length && (
              <div className="crunch-card crunch-stage">
                {score.reasonCodes.map((r) => (
                  <div className="crunch-factor" key={r.code}>
                    <span
                      className="crunch-factor-dot"
                      style={{ background: r.direction === 'up' ? GREEN : RED }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="crunch-factor-name">{r.factor}</div>
                      <div className="crunch-factor-detail">{r.detail}</div>
                    </div>
                    <span
                      className="crunch-factor-pts"
                      style={{ color: r.direction === 'up' ? GREEN : RED }}
                    >
                      {r.direction === 'up' ? '+' : '−'}{Math.abs(r.points)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="crunch-actions">
              <button type="button" className="crunch-btn" onClick={onDone}>
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
