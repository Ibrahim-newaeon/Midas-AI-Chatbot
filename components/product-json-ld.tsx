import type { MirrorProduct } from "@/lib/mirrorCatalog";
import { pdpUrl, type SessionContext } from "@/lib/stores";

export function ProductJsonLd({
  product,
  session,
}: {
  product: MirrorProduct;
  session: SessionContext;
}) {
  const price = product.byWebsite[session.website];
  const lang = session.language;
  const json = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name[lang],
    sku: product.sku,
    inLanguage: lang === "ar" ? "ar" : "en",
    brand: { "@type": "Brand", name: product.manufacturer },
    image: product.image_url,
    category: product.categories[lang][1] ?? product.categories[lang][0],
    offers: {
      "@type": "Offer",
      url: pdpUrl(session, product.url_key),
      priceCurrency: session.currency,
      price: price.final,
      availability:
        price.stock === "IN_STOCK" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
  );
}
