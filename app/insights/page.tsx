import { merchandisingInsight } from "@/lib/learningQueue";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const insight = await merchandisingInsight();
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <p className="font-display text-[36px] leading-tight text-ink">Asked, not stocked</p>
      <p className="text-[15px] text-text-muted">
        Clusters from unanswered chat turns. This is a merchandising review queue. Nothing here writes the
        knowledge pack or the synonym list.
      </p>
      <p className="text-[13px] text-text-muted">
        {insight.total} events · generated {insight.generated_at}
      </p>
      {!insight.asked_not_stocked.length ? (
        <p className="text-[15px] text-text-muted">No unanswered clusters yet. Ask for something the catalog does not have.</p>
      ) : (
        <ul className="space-y-3">
          {insight.asked_not_stocked.map((row) => (
            <li key={row.key} className="midas-card space-y-1 p-4">
              <p className="font-semibold text-ink">
                {row.key || "(empty)"} · {row.count}
              </p>
              <p className="text-[13px] text-text-muted">
                {row.stores.join(", ")} · {row.reasons.join(", ")}
              </p>
              <p className="text-[14px] text-ink">{row.sample_queries[0]}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
