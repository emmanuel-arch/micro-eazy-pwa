// ─────────────────────────────────────────────────────────────────────────────
// WHAT A CUSTOMER CAN ASK THE BUREAU FOR.
//
// The ecosystem already has a bureau catalogue — connected-suite/src/lib/crb/
// catalogue.ts, fourteen Metropol report types with codes, endpoints, tariffs
// and depth. That file is written for a CREDIT OFFICER choosing what to buy
// before lending. This one is the same reports written for the person they are
// about, which is a different job:
//
//   catalogue.ts   "Enhanced Credit Info — the credit file, plus who else is
//                   standing behind them."          (code 10, KES 55, depth 0.8)
//   here           "CRB Report — everything the bureau holds about you, in one
//                   document you can download and keep."
//
// `code` is the link between them, and it is the Metropol report-type number in
// both places. Nothing is renumbered here; when a report is wired up, the code
// is what says which one.
//
// ── ON THE PRICES ────────────────────────────────────────────────────────────
// ONLY the CRB Report carries one, and it is KES 150 — set commercially, not
// derived. The tariffs in catalogue.ts are what a LENDER pays Metropol per call
// (KES 10–90); they are wholesale, and printing a wholesale number on a
// customer's screen would be both wrong and a disclosure nobody intended. So the
// rest say "Soon" until there is a retail price list to read from, and the
// moment there is, it belongs in `price` below and nowhere else.
//
// ── EVERY ONE OF THESE IS CURRENTLY UNAVAILABLE ──────────────────────────────
// `available: false` on all of them, and the UI is required to honour it —
// Sheet, in CreditReport.jsx, is the single place a request is refused. This is
// not a placeholder to be quietly flipped: a bureau pull spends real money at
// Metropol and bills a real customer, and turning one on means a payment leg, a
// consent record and a receipt, none of which exist yet on this side.
// ─────────────────────────────────────────────────────────────────────────────

/** KES, formatted the way the rest of the app does it. */
export const ksh = (n) =>
  Number.isFinite(Number(n)) ? Number(n).toLocaleString('en-KE', { maximumFractionDigits: 0 }) : '—';

export const REPORTS = [
  {
    key: 'crb-report',
    // Metropol report type 12 — "Full Enhanced Credit Info", everything the
    // bureau holds in one call. The customer-facing product is the document it
    // produces, not the call.
    code: 12,
    name: 'CRB Report',
    tagline: 'See your credit information on CRB.',
    blurb:
      'Everything the bureau holds about you, in one document — every account, every balance, every enquiry any lender has made.',
    yields: [
      'Every credit account in your name',
      'Balances, arrears and repayment history',
      'Who has searched your file, and when',
      'Guarantors and anyone standing behind you',
    ],
    price: 150,
    featured: true,
    available: false,
    icon: 'report',
  },
  {
    key: 'clearance',
    // Not a Metropol report-type call — the bureau issues the certificate as its
    // own product. Left null rather than guessed; a wrong code here would be a
    // silent mis-pull the day this is wired.
    code: null,
    name: 'Clearance Certificate',
    tagline: 'Get a clearance certificate from CRB.',
    blurb:
      'The bureau’s signed statement that you carry no adverse listing — the document an employer, a landlord or a tender asks for.',
    yields: ['Signed and dated by the bureau', 'Valid for the period printed on it', 'Downloadable as a PDF'],
    price: null,
    available: false,
    icon: 'certificate',
  },
  {
    key: 'score',
    code: 3,
    name: 'Credit Score',
    tagline: 'Your number, and what moved it.',
    blurb:
      'The bureau’s score on you between 200 and 900, as at today — with the factors that put it where it is.',
    yields: ['Metro Score, 200–900', 'The date it was calculated', 'What is helping and what is hurting'],
    price: null,
    available: false,
    icon: 'gauge',
  },
  {
    key: 'loan-status',
    code: 2,
    name: 'Loan Status',
    tagline: 'Where you stand right now.',
    blurb:
      'Whether you are in default today, and whether you have ever been — the single question most lenders ask first.',
    yields: ['Current default status', 'Any historical default', 'The bureau’s delinquency code'],
    price: null,
    available: false,
    icon: 'pulse',
  },
  {
    key: 'accounts',
    code: 16,
    name: 'Accounts Summary',
    tagline: 'Every loan you are carrying.',
    blurb:
      'How many mobile loans you are juggling and what they cost you each month, added up in one place.',
    yields: ['Number of open accounts', 'Total monthly instalments', 'Exposure by lender type'],
    price: null,
    available: false,
    icon: 'stack',
  },
  {
    key: 'history',
    code: 22,
    name: '12-Month History',
    tagline: 'Whether you are improving.',
    blurb:
      'Your repayment behaviour month by month for a year, so you can see the direction rather than one moment.',
    yields: ['Twelve months of account status', 'Arrears trend', 'Months clean in a row'],
    price: null,
    available: false,
    icon: 'trend',
  },
  {
    key: 'identity',
    code: 1,
    name: 'Identity Verification',
    tagline: 'Confirm your ID is registered.',
    blurb:
      'Checks your national ID against the registry and confirms the names on it are the names the bureau holds.',
    yields: ['Registered names', 'Date of birth and gender', 'ID serial number'],
    price: null,
    available: false,
    icon: 'id',
  },
];

export const reportByKey = (key) => REPORTS.find((r) => r.key === key);

/** The headline product — what the landing page's call to action buys. */
export const HEADLINE = REPORTS[0];
