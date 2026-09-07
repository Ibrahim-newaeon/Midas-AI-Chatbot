import { notFound } from "next/navigation";
import { MirrorCartView } from "@/components/mirror-cart-view";
import { isStoreCode, STORE_CODES } from "@/lib/stores";

export function generateStaticParams() {
  return STORE_CODES.map((store) => ({ store }));
}

export default async function MirrorCartPage({ params }: { params: Promise<{ store: string }> }) {
  const { store } = await params;
  if (!isStoreCode(store)) notFound();
  return (
    <div className="space-y-4">
      <h1 className="font-display text-[32px] leading-tight">Demo cart</h1>
      <MirrorCartView store={store} />
    </div>
  );
}
