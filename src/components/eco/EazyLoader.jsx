// ─────────────────────────────────────────────────────────────────────────────
// THE WAITING STATE — one ring, everywhere.
//
// The Crunch Theatre's loader was the only thing in this app that looked like a
// fintech product while it was working. This is that ring, rebuilt in Micro
// Eazy's own colours, and made available to every screen.
//
// Importing this module also RE-SKINS the template's `.loader10` and `.loader1`
// classes app-wide — that is what loader.css does, and it is why a screen using
// the old classes gets the new ring without being edited. See the long note at
// the top of loader.css for why that was the right trade.
//
// ── THREE THINGS, AND THE DIFFERENCE MATTERS ─────────────────────────────────
//   <Ring/>      just the mark. For putting inside something else.
//   <Waiting/>   the mark plus a sentence. For a wait long enough that the
//                customer deserves to be told what is being waited on.
//   <Waiting full/>  the same, over a scrim, for a wait that blocks the screen.
//
// The sentence is not decoration. Every wait in this app is a network call to
// somebody else's system — Micromart's core banking, the Suite, a bureau — and
// "Checking with your lender" is the difference between a slow screen and a
// screen that appears to have died.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import './loader.css';

/** The app icon, on the white chip. Same asset the install door promises. */
const MARK = '/brand/micro-eazy/icon-192.png';

/**
 * The ring on its own.
 *
 * @param {'sm'|'md'|'lg'} [size]  sm drops the chip — see loader.css
 * @param {string} [label]         accessible name; omit inside a labelled block
 */
export function Ring({ size = 'md', label = 'Loading', className = '' }) {
  return (
    <div
      className={`eazy-ring eazy-ring-${size} ${className}`}
      role="status"
      aria-label={label}
    >
      <span className="eazy-ring-track" aria-hidden />
      {size !== 'sm' && (
        <span className="eazy-ring-mark" aria-hidden>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img src={MARK} alt="" width="56" height="56" />
        </span>
      )}
    </div>
  );
}

/**
 * A wait with something to say.
 *
 * `full` covers the screen. `onDark` switches the scrim from white to navy —
 * pass it on the cinematic screens, where a white flash between a dark page and
 * its own loading state is the most jarring thing the app does.
 */
export default function Waiting({
  title = 'Just a moment',
  note,
  size = 'lg',
  full = false,
  onDark = false,
}) {
  const body = (
    <div className="eazy-wait">
      <Ring size={size} label={title} />
      <div>
        <p className="eazy-wait-title">{title}</p>
        {note && <p className="eazy-wait-note">{note}</p>}
      </div>
    </div>
  );

  if (!full) return body;

  return (
    <div
      className={`eazy-wait-full ${onDark ? 'on-dark' : ''}`}
      // aria-live rather than a dialog role: this is a status, and trapping
      // focus in a thing the customer cannot act on is worse than not trapping.
      role="status"
      aria-live="polite"
      style={{ display: 'grid', placeItems: 'center' }}
    >
      {body}
    </div>
  );
}
