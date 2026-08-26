// ─────────────────────────────────────────────────────────────────────────────
// FIXTURES — the server's answers, without the server.
//
// ── WHY A FETCH SHIM AND NOT A `fixture` PROP ────────────────────────────────
// The obvious approach is to give every screen an optional `fixture` prop and
// skip the fetch when it is set. That approach previews a DIFFERENT CODE PATH
// from the one that ships: the loading state never renders, the error branch is
// unreachable, and the mapping from response shape to screen — which is where
// the bugs actually live — is bypassed entirely. A screen can pass that review
// and still be broken in production.
//
// So nothing here touches the screens. `installFixtures()` swaps `window.fetch`
// for the duration of the preview, and the screens fetch exactly as they always
// do: same client, same JSON parsing, same error handling, same states. What is
// previewed is what ships.
//
// It is installed only from the preview harness, which is itself removed from a
// production build.
//
// ── THE FIXTURES ARE DELIBERATELY UNFLATTERING ───────────────────────────────
// Round numbers and short strings make every layout look fine. These carry a
// 46-character merchant name, an adverse bureau verdict, two negative listings,
// a withdrawn permission and a six-item history — the shapes that break designs.
// ─────────────────────────────────────────────────────────────────────────────

const daysAgo = (n) => new Date(Date.now() - n * 86_400_000).toISOString();

export const FIXTURES = {
  '/api/portal/session': () => ({ authenticated: true, phoneMasked: '07** *** 412' }),

  '/api/portal/exposure': () => ({
    success: true,
    crb: {
      consented: true,
      available: true,
      checkedAt: daysAgo(41),
      report: {
        bureau: 'Metropol CRB',
        reference: 'MC-2026-0084412',
        checkedAt: daysAgo(41),
        score: 574,
        band: 'Fair',
        probabilityOfDefault: 0.19,
        accounts: { total: 11, active: 4, closed: 7, npl: 2 },
        totalExposure: 184300,
        worstArrearsDays: 64,
        enquiriesLast6m: 9,
        negativeListings: [
          { lender: 'Springboard Capital Micro-Lending Limited', amount: 42800, status: 'In arrears 90+ days', since: daysAgo(210) },
          { lender: 'Zuri Credit', amount: 9600, status: 'Written off', since: daysAgo(430) },
        ],
        verdict: 'CAUTION',
        summary:
          'Four active facilities and two non-performing. Enquiry volume is high for the period, which lenders read as active shopping for credit.',
        mode: 'live',
        stale: false,
      },
      message: null,
    },
    withThisLender: { lender: 'MICROMART FINTECH', openLoans: 1 },
    // Deliberately the PARTIAL state with real exposure, not the clean one: it is
    // the shape that has to carry a range, a bucket, a velocity figure, a chip
    // row and a caveat sentence all at once. The all-green "nothing reported"
    // card is the layout that hides every alignment problem.
    interchange: {
      connected: true,
      state: 'partial',
      lenders: 3,
      activeLoans: 4,
      outstandingBand: '100k–250k',
      worstBucket: 'npl',
      velocity14d: 2,
      queried: 5,
      responded: 4,
      asOf: new Date().toISOString(),
      message:
        'Some lenders could not be reached, so you may owe more elsewhere than is shown here.',
    },
  }),

  '/api/portal/consent': () => ({
    success: true,
    catalogue: [
      { key: 'mpesaAnalysis', label: 'Analyse my M-PESA statement', detail: 'To assess affordability from my cashflow.', mandatory: true },
      { key: 'automatedScoring', label: 'Use automated credit scoring', detail: 'An AI model helps decide; a human reviews adverse outcomes.', mandatory: true },
      { key: 'crbCheck', label: 'Check my credit reference (CRB)', detail: "Via the lender's licensed bureau.", mandatory: false },
      { key: 'ecosystemExposure', label: 'Check what I owe other lenders in this network', detail: 'They are told ranges and repayment status — never my name, ID number or phone number.', mandatory: true },
      { key: 'iprs', label: 'Verify my ID against the national register', detail: 'Confirms the ID belongs to me.', mandatory: false },
      { key: 'modelImprovement', label: 'Use my de-identified data to improve models', detail: 'Aggregated, never sold.', mandatory: false },
      { key: 'crossBorder', label: 'Process data with secure overseas AI services', detail: 'Minimised & masked per the Data Protection Act.', mandatory: false },
      { key: 'geoTagging', label: 'Record my business and home location', detail: "Captured once so an officer can find you — not ongoing tracking.", mandatory: false },
    ],
    // One deliberately OFF, so the screen is reviewed in a mixed state rather
    // than the all-green one that hides every alignment problem.
    grants: {
      mpesaAnalysis: true, automatedScoring: true, crbCheck: true, ecosystemExposure: true,
      iprs: true, modelImprovement: false, crossBorder: false, geoTagging: true,
    },
    version: '2026-06-30',
    recordedAt: daysAgo(12),
    history: [
      { id: 'c6', at: daysAgo(12), version: '2026-06-30', grants: { mpesaAnalysis: true, automatedScoring: true, crbCheck: true, iprs: true, geoTagging: true } },
      { id: 'c5', at: daysAgo(30), version: '2026-06-30', grants: { mpesaAnalysis: true, automatedScoring: true, crbCheck: true, iprs: true, modelImprovement: true, geoTagging: true } },
      { id: 'c4', at: daysAgo(96), version: '2026-06-30', grants: { mpesaAnalysis: true, automatedScoring: true, crbCheck: true, iprs: true } },
      { id: 'c3', at: daysAgo(180), version: '2026-01-14', grants: { mpesaAnalysis: true, automatedScoring: true } },
      { id: 'c2', at: daysAgo(240), version: '2026-01-14', grants: { mpesaAnalysis: true } },
      { id: 'c1', at: daysAgo(365), version: '2026-01-14', grants: {} },
    ],
  }),

  '/api/portal/ladder': () => ({
    success: true,
    currentLimit: 32000,
    events: [
      { id: 'g4', to: 32000, from: 24000, direction: 'up', at: daysAgo(18), reason: 'Six consecutive on-time repayments.' },
      { id: 'g3', to: 24000, from: 30000, direction: 'down', at: daysAgo(74), reason: 'A repayment fell 21 days late in March, and the limit was reduced while the account recovered.' },
      { id: 'g2', to: 30000, from: 18000, direction: 'up', at: daysAgo(150), reason: 'Cashflow improved and the statement refresh showed steady business inflow.' },
      { id: 'g1', to: 18000, from: 0, direction: 'up', at: daysAgo(300), reason: 'Opening limit on first approval.' },
    ],
  }),

  '/api/portal/decision': () => ({
    success: true,
    decision: 'REFER',
    decidedAt: daysAgo(3),
    modelVersion: 'v0.9.2',
    reasonCodes: [
      { code: 'R03', factor: 'Betting outflow', points: 63, direction: 'down', detail: 'KES 31,400 to betting paybills over six months — 6.9% of everything paid out.' },
      { code: 'R04', factor: 'Borrowing from other lenders', points: 38, direction: 'down', detail: 'Four digital lenders active in the window, two overlapping in March.' },
      { code: 'R06', factor: 'Late-night spending pattern', points: 17, direction: 'down', detail: '11% of outflow between 23:00 and 04:00, mostly to entertainment tills.' },
      { code: 'R01', factor: 'Consistent business inflow', points: 74, direction: 'up', detail: '38 till and paybill receipts a month, steady across all six months.' },
      { code: 'R02', factor: 'Balance never fully drawn down', points: 41, direction: 'up', detail: 'Closing balance stayed above KES 2,000 on 171 of 182 days.' },
    ],
  }),

  '/api/portal/my-loan': () => ({
    success: true,
    balance: 18420.5,
    nextInstalment: 6400,
    dueDate: daysAgo(-4),
    arrears: 0,
  }),

  '/api/portal/standing-order': (body) => {
    if (body?.action === 'offer') {
      return {
        success: true,
        available: true,
        plan: { amount: 6400, frequency: 'MONTHLY', startDate: daysAgo(-4), endDate: daysAgo(-124) },
      };
    }
    return { success: true, simulated: true };
  },

  '/api/portal/recrunch': (body) => {
    if (body?.action === 'offer') return { success: true, available: true, amount: 50, hasUnusedIntent: false };
    return { success: true, intentId: 'int_demo', simulated: true, status: 'SUCCESS' };
  },
};

/**
 * Swap window.fetch for one that answers the portal API from FIXTURES.
 *
 * Anything not listed falls through to the real network, so a screen reaching
 * for an endpoint nobody wrote a fixture for fails loudly rather than silently
 * receiving an empty object.
 */
export function installFixtures() {
  if (typeof window === 'undefined' || window.__ecoFixtures) return;
  window.__ecoFixtures = true;

  const real = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url ?? '';
    const path = url.split('?')[0];
    const make = FIXTURES[path];
    if (!make) return real(input, init);

    let body = null;
    try { body = init.body ? JSON.parse(init.body) : null; } catch { /* FormData */ }

    // A real round trip is never instant, and a screen whose loading state has
    // only ever been seen for zero milliseconds has not been reviewed.
    //
    // EXCEPT inside an iframe: headless Chrome's --virtual-time-budget advances
    // timers on the top document but not in child frames, so on the device wall
    // this timeout never fires and every panel sits in its skeleton forever. The
    // loading state is reviewed by opening the route directly, where the delay
    // still applies.
    const framed = (() => {
      try { return window.top !== window.self; } catch { return true; }
    })();
    if (!framed) await new Promise((r) => setTimeout(r, 420));

    if (init.method === 'DELETE') return new Response('{}', { status: 200 });

    const data = make(body);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}
