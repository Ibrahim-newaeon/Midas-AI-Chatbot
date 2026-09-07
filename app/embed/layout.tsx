import type { ReactNode } from "react";

export default function EmbedLayout({ children }: { children: ReactNode }) {
  return <div className="h-dvh w-full overflow-hidden bg-transparent">{children}</div>;
}
