const DIACRITICS = /[\u064B-\u0652\u0640]/g;

const ARABIZI_DIGIT: Record<string, string> = {
  "2": "ء",
  "3": "ع",
  "5": "خ",
  "6": "ط",
  "7": "ح",
  "8": "غ",
  "9": "ص",
};

const ARABIZI_LEXICON: Array<[RegExp, string]> = [
  [/\bkanabaya?t?\b/gi, "كنبة"],
  [/\bkanaba\b/gi, "كنبة"],
  [/\bmajles\b/gi, "مجلس"],
  [/\bmajlis\b/gi, "مجلس"],
  [/\bdawaniya\b/gi, "ديوانية"],
  [/\bdiwaniya\b/gi, "ديوانية"],
  [/\bsufra\b/gi, "سفرة"],
  [/\btawla\b/gi, "طاولة"],
  [/\bkorsi\b/gi, "كرسي"],
  [/\bkursi\b/gi, "كرسي"],
  [/\bsereer\b/gi, "سرير"],
  [/\bsarir\b/gi, "سرير"],
  [/\bdolab\b/gi, "دولاب"],
  [/\bsajjada\b/gi, "سجادة"],
  [/\bsejada\b/gi, "سجادة"],
  [/\bthurayya\b/gi, "ثريا"],
  [/\bmaktab\b/gi, "مكتب"],
];

const SEATING_SYNONYMS = /مجلس|مجالس|ديوانية|ديوانيه|صالة جلوس|غرفة جلوس|ستنغ|أريكة|اريكة|اريكه|كنبة|كنب|sofa|sectional|majlis|majles|diwaniya|dawaniya/i;
const DINING_SYNONYMS = /سفرة|سفره|غرفة طعام|غرفة سفرة|طاولة طعام|dining/i;

export function normalizeArabic(input: string): string {
  return input
    .replace(DIACRITICS, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/\s+/g, " ")
    .trim();
}

export function looksLikeArabizi(token: string): boolean {
  return /^[a-z0-9']+$/i.test(token) && /[2356789]/.test(token);
}

export function transliterateArabiziDigits(text: string): string {
  return text
    .split(/\s+/)
    .map((t) => (looksLikeArabizi(t) ? t.replace(/[2356789]/g, (d) => ARABIZI_DIGIT[d] ?? d) : t))
    .join(" ");
}

export function expandArabiziLexicon(text: string): string {
  let out = text;
  for (const [re, ar] of ARABIZI_LEXICON) {
    out = out.replace(re, ar);
  }
  return out;
}

export function isSeatingIntent(text: string): boolean {
  return SEATING_SYNONYMS.test(text) && !DINING_SYNONYMS.test(text);
}

export function expandSearchQueries(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return ["furniture"];
  const withLexicon = expandArabiziLexicon(trimmed);
  const withDigits = transliterateArabiziDigits(withLexicon);
  const normalized = normalizeArabic(withDigits);
  const variants = new Set<string>([trimmed, withLexicon, withDigits, normalized].map((s) => s.replace(/\s+/g, " ").trim()));
  if (isSeatingIntent(withLexicon) || isSeatingIntent(trimmed)) {
    variants.add(`${normalized} كنبة كرسي طاولة وسط`);
    variants.add("sofa chair living coffee table centre");
  }
  return [...variants].filter(Boolean).slice(0, 4);
}
