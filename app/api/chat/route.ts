import { NextResponse } from "next/server";
import { runChat } from "@/lib/orchestrator";
import { sessionFromStoreCode } from "@/lib/stores";
import { ChatRequestSchema } from "@/lib/schemas";
import { safeRefusal, toTruth, verifySendGate } from "@/lib/verifier";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 });
  }

  const parsed = ChatRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 });
  }

  const body = parsed.data;
  const session = sessionFromStoreCode(body.session.store_code, {
    page_sku: body.session.page_sku ?? null,
    customer_logged_in: Boolean(body.session.customer_logged_in),
    chat_session_id: body.session.chat_session_id ?? null,
  });

  const messages = body.messages.filter((m) => m.content.length > 0).slice(-12);
  if (!messages.length && !body.image_data_url) {
    return NextResponse.json({ ok: false, error: "empty_message" }, { status: 400 });
  }

  try {
    const turn = await runChat({
      session,
      messages,
      image_data_url: body.image_data_url,
    });
    const facts = (turn.ui.products ?? []).map((p) => toTruth(p, session.store_code));
    const gate = verifySendGate(turn, facts, session.store_code);
    if (!gate.ok) {
      const refusal = safeRefusal(session.language);
      return NextResponse.json({
        ok: true,
        session,
        ...turn,
        ...refusal,
        used_tools: [...turn.used_tools, "send_gate"],
        gate: gate.reason,
      });
    }
    return NextResponse.json({ ok: true, session, ...turn });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "ASSISTANT_UNAVAILABLE", detail: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
