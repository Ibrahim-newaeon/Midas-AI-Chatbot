export type ChatChannel = "web" | "widget" | "whatsapp" | "instagram";

export const MIDAS_AI_UTM = {
  source: "Midas_AI",
  campaign: "Chatbot",
} as const;

/** Exact medium strings requested for GA/GTM. */
export function utmMediumForChannel(channel: string | null | undefined): "widget" | "whatsapp" | "Instagram" {
  const key = (channel ?? "web").toLowerCase();
  if (key === "whatsapp") return "whatsapp";
  if (key === "instagram") return "Instagram";
  return "widget";
}

export function withMidasAiUtm(url: string, channel: string | null | undefined = "web"): string {
  if (!url) return url;
  const medium = utmMediumForChannel(channel);
  try {
    const absolute = /^https?:\/\//i.test(url);
    const parsed = new URL(url, "https://midasfurniture.com");
    parsed.searchParams.set("utm_source", MIDAS_AI_UTM.source);
    parsed.searchParams.set("utm_medium", medium);
    parsed.searchParams.set("utm_campaign", MIDAS_AI_UTM.campaign);
    if (absolute) return parsed.toString();
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    const params = new URLSearchParams({
      utm_source: MIDAS_AI_UTM.source,
      utm_medium: medium,
      utm_campaign: MIDAS_AI_UTM.campaign,
    });
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}${params.toString()}`;
  }
}
