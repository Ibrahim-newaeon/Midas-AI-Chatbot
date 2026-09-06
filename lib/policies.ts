import type { WebsiteId } from "@/lib/stores";
import { getKnowledgeText, POLICY_TOPICS, type PolicyTopic } from "@/lib/knowledge";

export type { PolicyTopic };
export { POLICY_TOPICS };

const CUSTOMIZATION =
  "Midas does not offer customization. All products are ready-made by international factories and brands. We can help you find an in-stock alternative in a similar colour or fabric.";

const CUSTOMIZATION_AR =
  "لا نوفر خدمة التفصيل أو تغيير الأقمشة. منتجاتنا جاهزة من مصانع وعلامات عالمية. يمكننا مساعدتك في إيجاد بديل متوفر بلون أو قماش قريب.";

type Pack = Partial<Record<PolicyTopic, { en: string; ar: string }>>;

/** Used only if a knowledge markdown section is missing. Prefer editing `knowledge/<country>/*.md`. */
const fallbacks: Record<WebsiteId, Pack> = {
  kuwait: {
    customization: { en: CUSTOMIZATION, ar: CUSTOMIZATION_AR },
  },
  qatar: { customization: { en: CUSTOMIZATION, ar: CUSTOMIZATION_AR } },
  ksa: { customization: { en: CUSTOMIZATION, ar: CUSTOMIZATION_AR } },
  jordan: { customization: { en: CUSTOMIZATION, ar: CUSTOMIZATION_AR } },
  bahrain: { customization: { en: CUSTOMIZATION, ar: CUSTOMIZATION_AR } },
};

export function getPolicyText(website: WebsiteId, topic: PolicyTopic, language: "en" | "ar") {
  const fromFile = getKnowledgeText(website, topic, language);
  if (fromFile) return fromFile;
  const fallback = fallbacks[website][topic]?.[language];
  return fallback ?? "";
}
