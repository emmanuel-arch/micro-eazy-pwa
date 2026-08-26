// ─────────────────────────────────────────────────────────────────────────────
// THE PREVIEW HARNESS — every ecosystem screen, without a live session.
//
//   /preview        the component gallery
//   /preview/crunch the Crunch Theatre, driven by the fixture below
//
// ── WHY THIS EXISTS ──────────────────────────────────────────────────────────
// Every one of the seven customer screens sits behind an SMS code, a national
// ID and, for the crunch, a real M-PESA payment. Which means the ONLY way to
// look at one is to pay for it, on a real handset, with a real statement — and
// that is not a loop anybody will run twenty times while getting the spacing
// right. So screens do not get looked at, and that is exactly how a product
// ships with its copy overflowing on a 360px phone.
//
// The harness breaks that. Fixtures below are shaped exactly like the server's
// responses, so a screen that renders correctly here renders correctly live.
//
// ── AND WHY IT IS SAFE ───────────────────────────────────────────────────────
// It is mounted only when `import.meta.env.DEV` is true or VITE_PREVIEW=1 is
// set at BUILD time. A production build tree-shakes the route out entirely —
// there is no URL to find, not merely one that refuses. It also touches no
// network and no session: nothing here can read or write a customer's data.
//
// The fixtures are deliberately UNFLATTERING. A demo fixture with round numbers
// and three short factors makes every layout look fine. This one has a betting
// factor, a long merchant string, a negative reason and an eight-item list,
// because those are the shapes that break a design.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Screen, Card, Hero, Row, Chip, Button, State, Loading, Icon, money, when,
} from '../../components/eco/Surface';
import CrunchTheatre from '../../components/eco/CrunchTheatre';
import Crunch from './Crunch';
import Pay from './Pay';
import Ratiba from './Ratiba';
import Why from './Why';
import Ladder from './Ladder';
import Exposure from './Exposure';
import Consent from './Consent';
import { installFixtures } from './fixtures';

/**
 * The real screens, rendered outside PrivateRoute.
 *
 * With no borrower session they open on the Identity gate — which is not a
 * limitation but the most-seen state in the whole set, and the one worth
 * reviewing hardest: it is the first thing every customer meets on every one of
 * these screens.
 */
const SCREENS = { crunch: Crunch, pay: Pay, ratiba: Ratiba, why: Why, ladder: Ladder, exposure: Exposure, consent: Consent };

export const CRUNCH_FIXTURE = {
  transactionCount: 1247,
  paidIn: 486320,
  paidOut: 451890,
  creditScore: {
    modelVersion: 'v0.9.2',
    score: 612,
    maxScore: 850,
    pd: 0.084,
    pdPercent: '8.4%',
    band: 'Fair — approved with conditions',
    tone: 'warn',
    decision: 'REFER',
    reasonCodes: [
      { code: 'R01', factor: 'Consistent business inflow', points: 74, direction: 'up',
        detail: '38 till and paybill receipts a month, steady across all six months.' },
      { code: 'R02', factor: 'Balance never fully drawn down', points: 41, direction: 'up',
        detail: 'Closing balance stayed above KES 2,000 on 171 of 182 days.' },
      { code: 'R03', factor: 'Betting outflow', points: 63, direction: 'down',
        detail: 'KES 31,400 to betting paybills over six months — 6.9% of everything paid out.' },
      { code: 'R04', factor: 'Borrowing from other lenders', points: 38, direction: 'down',
        detail: 'Four digital lenders active in the window, two overlapping in March.' },
      { code: 'R05', factor: 'Salary or regular inflow', points: 29, direction: 'up',
        detail: 'A recurring inflow near month-end in five of six months.' },
      { code: 'R06', factor: 'Late-night spending pattern', points: 17, direction: 'down',
        detail: '11% of outflow between 011:00 and 04:00, mostly to entertainment tills.' },
    ],
    breakdown: [],
  },
  sample: [
    { receipt: 'TFG4H2K9LM', details: 'NAIVAS SUPERMARKET LIMITED - WESTLANDS BRANCH', direction: 'out', amount: 3450, category: 'till' },
    { receipt: 'TFG5J1P0QR', details: 'Received from JANE W MUTHONI', direction: 'in', amount: 12000, category: 'income_received' },
    { receipt: 'TFG6K8N3ST', details: 'KPLC PREPAID', direction: 'out', amount: 1000, category: 'paybill' },
    { receipt: 'TFG7L4M2UV', details: 'Customer Withdrawal At Agent', direction: 'out', amount: 5000, category: 'withdraw' },
    { receipt: 'TFG8M6R5WX', details: 'Business payment from TILL 8842119', direction: 'in', amount: 8600, category: 'business_in' },
    { receipt: 'TFG9N7T1YZ', details: 'Safaricom Data Bundle', direction: 'out', amount: 250, category: 'paybill' },
  ],
  monthly: [],
  categories: [],
  affordability: { score: 61, band: 'Fair', recommendedMaxInstallment: 6400, reasons: [] },
  features: {},
};

function Gallery() {
  return (
    <Screen eyebrow="Preview · not a real screen" title="Ecosystem components" back="/dashboard">
      <Card title="Theatre" note="The full Safaricom crunch sequence, driven by the fixture.">
        <div style={{ marginTop: '1rem' }}>
          <Link to="/preview/crunch" style={{ textDecoration: 'none' }}>
            <Button icon={Icon.arrow}>Open the Crunch Theatre</Button>
          </Link>
        </div>
      </Card>

      <Hero label="Hero figure" figure={money(48250)} note="One number, said once." delay={40} />

      <Card title="Rows" note="Label and value, aligned on the baseline." delay={80}>
        <div style={{ marginTop: '0.9rem' }}>
          <Row label="Next instalment" value={money(6400)} />
          <Row label="Due" value={when('2026-09-04')} />
          <Row label="Status" value={<Chip tone="good">On track</Chip>} />
          <Row label="Arrears" value={money(0)} tone="good" />
        </div>
      </Card>

      <Card title="Chips" delay={120}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.8rem' }}>
          <Chip tone="good">Approved</Chip>
          <Chip tone="warn">Referred</Chip>
          <Chip tone="bad">Declined</Chip>
          <Chip tone="mute">Draft</Chip>
        </div>
      </Card>

      <Card title="Buttons" delay={160}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.9rem' }}>
          <Button icon={Icon.phone}>Primary action</Button>
          <Button quiet>Quiet action</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Card>

      <State
        icon={Icon.off}
        title="An honest empty state"
        note="Every screen in this set reads a live system that can be down. This is the shape of saying so."
        action={<Button quiet>Try again</Button>}
        delay={200}
      />

      <div style={{ marginTop: '0.9rem' }}><Loading rows={3} /></div>
    </Screen>
  );
}

function TheatrePreview() {
  const stage = new URLSearchParams(window.location.search).get('stage') || undefined;
  // With a stage pinned the fixture is present from the first frame — there is
  // nothing to wait for, which is the point of pinning it.
  const instant = Boolean(stage);
  // Starts empty so the wait-in-extract behaviour is visible, then lands —
  // which is the timing that actually needs checking, not the happy instant.
  const [data, setData] = useState(instant ? CRUNCH_FIXTURE : null);
  React.useEffect(() => {
    if (instant) return undefined;
    const t = setTimeout(() => setData(CRUNCH_FIXTURE), 2600);
    return () => clearTimeout(t);
  }, []);
  return (
    <CrunchTheatre
      data={data}
      initialStage={stage}
      onDone={() => window.history.back()}
      onRetry={() => window.location.reload()}
    />
  );
}

export default function Preview({ mode }) {
  if (mode === 'crunch') return <TheatrePreview />;
  if (mode === 'screen') {
    // Swaps window.fetch before the screen mounts, so it runs its REAL loading,
    // error and success paths against fixture responses. See fixtures.js for
    // why this is a shim and not a prop.
    installFixtures();
    // The gate remembers a confirmed ID for the session. Seeding it means a
    // preview opens on the SCREEN rather than on the gate — the gate has its own
    // preview at ?s=pay with storage cleared.
    try { sessionStorage.setItem('eco_national_id', '31445872'); } catch { /* private mode */ }
    const name = new URLSearchParams(window.location.search).get('s') || 'pay';
    const S = SCREENS[name] || Pay;
    return <S tenant={{ name: 'MICROMART FINTECH', resolved: true }} />;
  }
  return <Gallery />;
}
