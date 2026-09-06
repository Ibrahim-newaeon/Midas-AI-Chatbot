import type { SessionContext, StoreCode } from "@/lib/stores";

export type StockStatus = "IN_STOCK" | "OUT_OF_STOCK";
export type MatchType = "exact" | "close" | "style";
export type ProductCta = "view" | "add_to_cart" | "handoff";

export type ProductDto = {
  sku: string;
  name: string;
  brand: string | null;
  image_url: string | null;
  url_key: string;
  pdp_url: string;
  regular_price: number;
  final_price: number;
  currency: SessionContext["currency"];
  discount_percent: number | null;
  stock_status: StockStatus;
  categories: string[];
  color: string | null;
  material: string | null;
  dimensions: string | null;
  fetched_at?: string;
  match_type?: MatchType;
};

export type ToolOk<T> = { ok: true } & T;
export type ToolErr = { ok: false; error: string; detail?: string };

export type SearchCatalogInput = {
  store_code: StoreCode;
  query?: string;
  category?: string | null;
  brand?: string | null;
  color?: string | null;
  material?: string | null;
  room?: string | null;
  max_price?: number | null;
  in_stock_only?: boolean;
  page_size?: number;
};

export type UiPayload = {
  products: Array<
    ProductDto & {
      title: string;
      ctas: ProductCta[];
    }
  >;
  ctas: ProductCta[];
  handoff: { show: boolean; reason: string | null };
};

export type AssistantTurn = {
  message: string;
  ui: UiPayload;
  used_tools: string[];
  engine: "rules" | "openai";
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatRequest = {
  session: SessionContext;
  messages: ChatMessage[];
  image_data_url?: string | null;
};
