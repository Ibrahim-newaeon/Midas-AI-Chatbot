import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { MirrorShell } from "@/components/mirror-shell";
import { isStoreCode, STORE_CODES } from "@/lib/stores";

export function generateStaticParams() {
  return STORE_CODES.map((store) => ({ store }));
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  if (!isStoreCode(store)) notFound();
  return <MirrorShell store={store}>{children}</MirrorShell>;
}
