import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { PANEL_ART, panelGradient, PANEL_SCRIM } from '../lib/artwork';

/**
 * The right half of the sign-in screen.
 *
 * Two things changed here and both were load-bearing:
 *
 * 1. It no longer points at `background-image-8.jpg`, which is an HTML document
 *    with a .jpg extension — the reason this panel renders as a flat brown
 *    rectangle on the live site. See lib/artwork.js.
 *
 * 2. The colour is the TENANT's, not the template's. Every lender in the
 *    ecosystem shares this app, so the panel is built from their two brand
 *    colours and the shared photography, rather than from a hard-coded theme
 *    class.
 *
 * Photographs are optional. Each slide independently falls back to the tenant
 * gradient if its file is absent, so the screen is correct today and gets
 * better as the plates arrive — no code change when they do.
 *
 * ── WHY THIS RENDERS AT TWO HEIGHTS ─────────────────────────────────────────
 * The panel used to be desktop-only: Login.jsx wrapped it in `d-none d-md-block`
 * and every phone got a bare white form. That is the wrong way round for this
 * app. Micro Eazy is an Android-first funnel — the handset is the PRIMARY
 * device, not the degraded one — so the photography, which is the only thing on
 * this screen that says who the app is for, was invisible to very nearly
 * everybody who actually signs in.
 *
 * So the panel is now a BAND above the form on a phone and the full right-hand
 * column on a desktop. `--eazy-panel-h` is the one number that differs; the copy
 * scales from the same breakpoint with clamp() rather than being written twice.
 * Login.jsx mounts exactly one instance either way — see the note there.
 */
// The panel's two measurements, as a stylesheet rather than a JS media query,
// so the FIRST paint is already the right height. A band sized from measured
// JS renders at one height and corrects after hydration, which on a phone is
// the form visibly jumping down the screen under the customer's thumb.
//
// 220px is deliberate: enough that the photograph reads as a photograph and one
// line of the promise can sit on it, short enough that the phone-number field is
// still above the fold on a 360×640 handset — the smallest screen this funnel is
// composed for.
const PANEL_CSS = `
.eazy-panel { --eazy-panel-h: 420px; }
@media (max-width: 767.98px) { .eazy-panel { --eazy-panel-h: 220px; } }
`;

const IntroSlider = ({ tenant }) => {
  // Which slide images failed to load. An <img> that 404s fires onError; the
  // SPA rewrite means a missing file arrives as an HTML page instead, which
  // also fails to decode and fires the same event. Both land here.
  const [broken, setBroken] = useState(() => new Set());
  const markBroken = (id) =>
    setBroken((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

  const gradient = panelGradient(tenant);

  return (
    <div
      className="eazy-panel card adminuiux-card position-relative overflow-hidden h-100 border-0"
      style={{ background: gradient, minHeight: 'var(--eazy-panel-h)' }}
    >
      <style>{PANEL_CSS}</style>
      {/* ── WHY THE SWIPER IS ABSOLUTELY POSITIONED ────────────────────────
          A Swiper sized with `height: 100%` inherits from a chain of parents
          that are themselves auto-height (card → card-body → row), so it
          resolves to zero and the slides render into nothing: the copy is
          present in the DOM, correct, and invisible. Filling the card by
          absolute positioning gives the slider a definite height from a single
          positioned ancestor and removes the chain entirely. */}
      <Swiper
        modules={[Pagination, Autoplay]}
        autoplay={{ delay: 5200, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop={PANEL_ART.length > 1}
        style={{ position: 'absolute', inset: 0, height: '100%', width: '100%' }}
      >
        {PANEL_ART.map((slide) => {
          const showPhoto = !broken.has(slide.id);
          return (
            <SwiperSlide key={slide.id}>
              <div style={{ position: 'relative', height: '100%', minHeight: 'var(--eazy-panel-h)' }}>
                {showPhoto && (
                  <img
                    src={slide.file}
                    alt={slide.alt}
                    onError={() => markBroken(slide.id)}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                )}

                {/* The scrim goes down even with no photograph: it keeps the
                    type at the same contrast either way, so the panel does not
                    visibly change weight when a plate is added. */}
                <div
                  aria-hidden
                  style={{ position: 'absolute', inset: 0, background: PANEL_SCRIM }}
                />

                <div
                  style={{
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    padding: 'clamp(1.25rem, 5vw, 3rem) clamp(1rem, 5vw, 2rem) clamp(2.5rem, 6vw, 4.5rem)',
                  }}
                >
                  <div style={{ maxWidth: '34rem' }}>
                    <h2
                      className="text-white mb-2 mb-md-3"
                      style={{
                        textWrap: 'balance',
                        lineHeight: 1.15,
                        fontSize: 'clamp(1.0625rem, 4.4vw, 1.75rem)',
                      }}
                    >
                      {slide.title}
                    </h2>
                    {/* The sub-line is the first thing to go when the band is
                        220px tall. The headline alone carries the slide there;
                        a squeezed second line only competes with the form. */}
                    <p
                      className="lead mb-0 d-none d-md-block"
                      style={{ color: 'rgba(255,255,255,0.82)' }}
                    >
                      {slide.description}
                    </p>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* The lender of record, quietly. The panel is the one place on the
          sign-in screen with room for it. */}
      {/* Desktop only: in a 220px band this line lands on the pagination dots,
          and the lender is already named in the footer under the form. */}
      {tenant?.resolved && (
        <p
          className="d-none d-md-block"
          style={{
            position: 'absolute',
            // Clear of the pagination dots, which Swiper pins to the bottom of
            // the container — at 1rem the two collided.
            bottom: '2.5rem',
            left: 0,
            right: 0,
            textAlign: 'center',
            margin: 0,
            fontSize: '0.6875rem',
            color: 'rgba(255,255,255,0.55)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          {tenant.name} · Powered by Micro Eazy
        </p>
      )}
    </div>
  );
};

export default IntroSlider;
