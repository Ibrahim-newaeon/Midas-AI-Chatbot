export type ChatEvent =
  | "chat_open"
  | "chat_close"
  | "chat_first_message"
  | "chat_product_shown"
  | "chat_product_click"
  | "chat_add_to_cart"
  | "chat_handoff_human"
  | "chat_unanswered";

type Payload = Record<string, string | number | boolean | string[] | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function trackChat(event: ChatEvent, payload: Payload = {}) {
  if (typeof window === "undefined") return;
  const row = {
    event,
    event_id: `${event}-${Date.now()}`,
    ...payload,
  };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(row);
}
