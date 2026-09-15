// ─────────────────────────────────────────────────────────────────────────────
// READING A KENYAN ID FROM MICROMART'S OCR REPLY — both card generations.
//
// POST MicromartAPI/vision/ocr/id answers { extractedText, idInfo }. idInfo is
// Micromart's own parse, and it reads "the line after each label":
//
//   · The older ID (the green card most customers still carry) has no SURNAME
//     and GIVEN NAMES — it prints one FULL NAMES line. idInfo.surname is always
//     null for it, so every one of those customers was told "Invalid ID data".
//   · When a value is not where the label expects, the NEXT LABEL is taken as
//     the value: idInfo.sex came back "DISTRICT OF BIRTH" and dateOfBirth "SEX".
//
// So idInfo is used only where a value has the right SHAPE, and every field is
// otherwise read from extractedText the way connected-suite's Vision parser
// (lib/kyc/vision.ts) reads the same card — proven on a real green ID:
//
//   ID number   7–8 digits, nearest after "ID NUMBER". The serial number is 9+
//               digits, which is how the two are told apart when OCR interleaves
//               "SERIAL NUMBER" and "ID NUMBER".
//   names       SURNAME + GIVEN NAMES (new card), else FULL NAMES (old card).
//   sex         the one MALE / FEMALE on the card.
//   birth date  the EARLIEST date on the card: the front carries only birth,
//               issue and (new card) expiry, and birth always comes first.
//
// Names follow Micromart's own Borrowers convention — firstName is the first
// given name, otherName everything else (e.g. 170497 is "Emmanuel" / "Birgen").
// ─────────────────────────────────────────────────────────────────────────────

const LABEL_WORDS = /^(JAMHURI|YA|REPUBLIC|OF|KENYA|SERIAL|NUMBER|ID|IDENTITY|CARD|NATIONAL|FULL|NAMES?|SURNAME|GIVEN|DATE|BIRTH|SEX|MALE|FEMALE|DISTRICT|PLACE|ISSUE|EXPIRY|NATIONALITY|HOLDER'?S?|SIGN\.?|SIGNATURE|SPECIMEN|HARAMBEE|GK|KEN)$/;

const lineWords = (l) => l.split(/\s+/).filter(Boolean).map((w) => w.replace(/[.:,]/g, ""));
const isLabelLine = (l) => {
  const w = lineWords(l).filter(Boolean);
  return w.length > 0 && w.every((x) => LABEL_WORDS.test(x));
};
const isNameLine = (l) => /^[A-Z][A-Z'\- ]*$/.test(l) && !isLabelLine(l);
const titleCase = (s) => s.toLowerCase().replace(/(^|[\s'-])([a-z])/g, (_, p, c) => p + c.toUpperCase());

/** "05. 05. 2002" → { iso: "2002-05-05", t } — any separator OCR mangles it into. */
function datesIn(line) {
  const out = [];
  const re = /(\d{1,2})\s*[.\-/]\s*(\d{1,2})\s*[.\-/]\s*(\d{4})/g;
  let m;
  while ((m = re.exec(line))) {
    const d = Number(m[1]), mo = Number(m[2]), y = Number(m[3]);
    const date = new Date(y, mo - 1, d);
    if (y >= 1900 && date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d) {
      out.push({ iso: `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`, t: date.getTime() });
    }
  }
  return out;
}

/** The value on a label's line or one of the next few non-label lines. */
function afterLabel(lines, labelRe, accept, reach = 3) {
  for (let i = 0; i < lines.length; i++) {
    if (!labelRe.test(lines[i])) continue;
    const own = lines[i].replace(labelRe, "").trim();
    if (own && accept(own)) return own;
    for (let j = i + 1; j <= Math.min(i + reach, lines.length - 1); j++) {
      if (accept(lines[j])) return lines[j];
    }
  }
  return null;
}

/**
 * @returns {{ ok: true, idNumber: string, firstName: string, otherName: string, sex: "male"|"female", dob: string }
 *         | { ok: false, missing: string[] }}
 */
export function readKenyanId(reply) {
  const info = reply?.idInfo ?? {};
  const lines = String(reply?.extractedText ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim().toUpperCase())
    .filter(Boolean);

  // ── ID number ─────────────────────────────────────────────────────────────
  let idNumber = /^\d{7,8}$/.test(String(info.idNumber ?? "").trim()) ? String(info.idNumber).trim() : null;
  if (!idNumber) {
    const labelled = afterLabel(lines, /ID\s*(NUMBER|NO)\.?\s*:?/, (l) => /\b\d{7,8}\b/.test(l) && !/\d{9,}/.test(l.replace(/\s/g, "")));
    idNumber = labelled?.match(/\b\d{7,8}\b/)?.[0] ?? null;
  }
  if (!idNumber) {
    for (const l of lines) {
      if (datesIn(l).length) continue;
      const m = l.match(/\b\d{7,8}\b/);
      if (m) { idNumber = m[0]; break; }
    }
  }

  // ── Names ─────────────────────────────────────────────────────────────────
  const shapedName = (v) => typeof v === "string" && isNameLine(v.trim().toUpperCase());
  let surname = shapedName(info.surname) ? info.surname.trim().toUpperCase() : afterLabel(lines, /^SURNAME\b/, isNameLine);
  let given = shapedName(info.givenNames) && info.surname ? info.givenNames.trim().toUpperCase() : afterLabel(lines, /^GIVEN\s*NAMES?\b/, isNameLine);
  let words;
  if (surname && given) {
    words = [...lineWords(given), ...lineWords(surname)];
  } else {
    const full = afterLabel(lines, /FULL\s*NAMES?/, (l) => isNameLine(l) && lineWords(l).length >= 2);
    words = full ? lineWords(full) : [];
  }
  const firstName = words.length >= 2 ? titleCase(words[0]) : null;
  const otherName = words.length >= 2 ? titleCase(words.slice(1).join(" ")) : null;

  // ── Sex ───────────────────────────────────────────────────────────────────
  const infoSex = String(info.sex ?? "").trim().toUpperCase();
  let sex = infoSex === "MALE" || infoSex === "FEMALE" ? infoSex : null;
  if (!sex) sex = lines.find((l) => l === "MALE" || l === "FEMALE") ?? lines.map((l) => l.match(/\b(FEMALE|MALE)\b/)?.[1]).find(Boolean) ?? null;

  // ── Date of birth: the earliest date on the card ─────────────────────────
  const dates = [...lines.flatMap(datesIn), ...datesIn(String(info.dateOfBirth ?? ""))]
    .filter((d) => d.t <= Date.now())
    .sort((a, b) => a.t - b.t);
  const dob = dates[0]?.iso ?? null;

  const missing = [
    !idNumber && "ID number",
    !(firstName && otherName) && "full name",
    !sex && "sex",
    !dob && "date of birth",
  ].filter(Boolean);
  if (missing.length) return { ok: false, missing };
  return { ok: true, idNumber, firstName, otherName, sex: sex.toLowerCase(), dob };
}
