import { NextResponse } from "next/server";
import { runChat } from "@/lib/orchestrator";
import { sessionFromStoreCode } from "@/lib/stores";
import { ChatRequestSchema } from "@/lib/schemas";
import { safeRefusal, toTruth, verifySendGate } from "@/lib/verifier";
import { runWithCatalog } from "@/lib/catalogContext";
import { recordUnanswered } from "@/lib/learningQueue";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const ALLOW_ORIGIN = process.env.WIDGET_ORIGIN ?? "https://midasfurniture.com";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOW_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const limited = rateLimit(`chat:${ip}`);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { ...corsHeaders(), "Retry-After": String(limited.retryAfter) } },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400, headers: corsHeaders() });
  }

  const parsed = ChatRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400, headers: corsHeaders() });
  }

  const body = parsed.data;
  const catalog =
    body.session.catalog === "mirror" ? "mirror" : body.session.catalog === "import" ? "import" : "live";
  const tenantId = catalog === "import" ? body.session.tenant_id ?? null : null;
  const channel =
    body.session.channel === "whatsapp" || body.session.channel === "instagram"
      ? body.session.channel
      : "widget";
  const session = sessionFromStoreCode(body.session.store_code, {
    page_sku: body.session.page_sku ?? null,
    customer_logged_in: Boolean(body.session.customer_logged_in),
    chat_session_id: body.session.chat_session_id ?? null,
    catalog,
    channel,
    tenant_id: tenantId,
  });

  const messages = body.messages.filter((m) => m.content.length > 0).slice(-12);
  if (!messages.length && !body.image_data_url) {
    return NextResponse.json({ ok: false, error: "empty_message" }, { status: 400, headers: corsHeaders() });
  }

  try {
    const turn = await runWithCatalog(
      catalog,
      () =>
        runChat({
          session,
          messages,
          image_data_url: body.image_data_url,
        }),
      channel,
      tenantId,
    );
    const facts = (turn.ui.products ?? []).map((p) => toTruth(p, session.store_code));
    const gate = verifySendGate(turn, facts, session.store_code, undefined, {
      expectedCurrency: catalog === "import" ? facts[0]?.currency : undefined,
    });
    if (!gate.ok) {
      await recordUnanswered({
        store_code: session.store_code,
        query: messages.at(-1)?.content ?? "",
        reason: "send_gate",
        chat_session_id: session.chat_session_id,
      });
      const refusal = safeRefusal(session.language);
      return NextResponse.json(
        {
          ok: true,
          session,
          ...turn,
          ...refusal,
          used_tools: [...turn.used_tools, "send_gate"],
          gate: gate.reason,
        },
        { headers: corsHeaders() },
      );
    }
    return NextResponse.json({ ok: true, session, ...turn }, { headers: corsHeaders() });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "ASSISTANT_UNAVAILABLE", detail: err instanceof Error ? err.message : "unknown" },
      { status: 500, headers: corsHeaders() },
    );
  }
}
