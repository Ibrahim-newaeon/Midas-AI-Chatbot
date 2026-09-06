import { NextResponse } from "next/server";
import { runChat } from "@/lib/orchestrator";
import { isStoreCode, sessionFromStoreCode, type SessionContext } from "@/lib/stores";
import type { ChatMessage } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: {
    session?: Partial<SessionContext> & { store_code?: string };
    messages?: ChatMessage[];
    image_data_url?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const code = body.session?.store_code;
  if (!isStoreCode(code)) {
    return NextResponse.json(
      { ok: false, error: "invalid_store", message: "Choose a Midas store view before quoting prices." },
      { status: 400 },
    );
  }

  const session = sessionFromStoreCode(code, {
    page_sku: body.session?.page_sku ?? null,
    customer_logged_in: Boolean(body.session?.customer_logged_in),
  });

  const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  if (!messages.length && !body.image_data_url) {
    return NextResponse.json({ ok: false, error: "empty_message" }, { status: 400 });
  }

  try {
    const turn = await runChat({
      session,
      messages,
      image_data_url: body.image_data_url,
    });
    return NextResponse.json({ ok: true, session, ...turn });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "chat_failed", detail: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
