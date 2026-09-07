import { z } from "zod";
import { STORE_CODES } from "@/lib/stores";

export const StoreCodeSchema = z.enum(STORE_CODES);

export const ChatRequestSchema = z.object({
  session: z
    .object({
      store_code: StoreCodeSchema,
      page_sku: z.string().min(1).max(64).nullable().optional(),
      customer_logged_in: z.boolean().optional(),
      chat_session_id: z.string().max(80).optional(),
      catalog: z.enum(["live", "mirror"]).optional(),
      channel: z.enum(["web", "widget", "whatsapp", "instagram"]).optional(),
    })
    .passthrough(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().max(4000),
      }),
    )
    .max(12)
    .default([]),
  image_data_url: z.string().max(2_500_000).nullable().optional(),
});

export type ChatRequestBody = z.infer<typeof ChatRequestSchema>;
