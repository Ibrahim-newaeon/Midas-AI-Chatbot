import { STORE_MAP, type StoreCode, type WebsiteId } from "./stores";

export type MirrorStock = "IN_STOCK" | "OUT_OF_STOCK";
export type MirrorDepartment = "living" | "dining" | "bedrooms";
export type MirrorNavSlug = MirrorDepartment | "offers";

export type MirrorPrice = {
  regular: number;
  final: number;
  stock: MirrorStock;
};

export type MirrorProduct = {
  sku: string;
  url_key: string;
  manufacturer: string;
  department: MirrorDepartment;
  image_url: string;
  name: { en: string; ar: string };
  categories: { en: string[]; ar: string[] };
  byWebsite: Record<WebsiteId, MirrorPrice>;
};

export const MIRROR_NAV: Record<
  MirrorNavSlug,
  { id: number; slug: MirrorNavSlug; en: string; ar: string; magentoEn: string; magentoAr: string }
> = {
  living: { id: 21, slug: "living", en: "Living", ar: "المعيشة", magentoEn: "Living Rooms", magentoAr: "غرف معيشة" },
  dining: { id: 31, slug: "dining", en: "Dining", ar: "السفرة", magentoEn: "Dining Rooms", magentoAr: "غرف سفرة" },
  bedrooms: { id: 41, slug: "bedrooms", en: "Bedrooms", ar: "غرف النوم", magentoEn: "Bedrooms", magentoAr: "غرف نوم" },
  offers: { id: 96, slug: "offers", en: "Offers", ar: "عروض", magentoEn: "Exclusive Deals", magentoAr: "عروض حصرية" },
};

export const MIRROR_NAV_SLUGS = Object.keys(MIRROR_NAV) as MirrorNavSlug[];

export const MIRROR_SALE_CATEGORY = {
  id: MIRROR_NAV.offers.id,
  en: MIRROR_NAV.offers.magentoEn,
  ar: MIRROR_NAV.offers.magentoAr,
};

const SALE_EN = "Exclusive Deals";
const SALE_AR = "عروض حصرية";

function img(path: string) {
  return `https://midasfurniture.com/media/catalog/product/${path}?optimize=high&fit=bounds&height=&width=`;
}

function book(
  kw: [number, number],
  qa: [number, number],
  sa: [number, number],
  jo: [number, number],
  bh: [number, number],
  oos: WebsiteId[] = [],
): Record<WebsiteId, MirrorPrice> {
  const row = (website: WebsiteId, pair: [number, number]): MirrorPrice => ({
    regular: pair[0],
    final: pair[1],
    stock: oos.includes(website) ? "OUT_OF_STOCK" : "IN_STOCK",
  });
  return {
    kuwait: row("kuwait", kw),
    qatar: row("qatar", qa),
    ksa: row("ksa", sa),
    jordan: row("jordan", jo),
    bahrain: row("bahrain", bh),
  };
}

function cats(
  department: MirrorDepartment,
  extraEn: string[],
  extraAr: string[],
  onOffer: boolean,
): { en: string[]; ar: string[] } {
  const root = {
    living: { en: ["Home Furniture", "Living Rooms"], ar: ["أثاث منزلي", "غرف معيشة"] },
    dining: { en: ["Home Furniture", "Dining Rooms"], ar: ["أثاث منزلي", "غرف سفرة"] },
    bedrooms: { en: ["Home Furniture", "Bedrooms"], ar: ["أثاث منزلي", "غرف نوم"] },
  }[department];
  return {
    en: [...root.en, ...extraEn, ...(onOffer ? [SALE_EN] : [])],
    ar: [...root.ar, ...extraAr, ...(onOffer ? [SALE_AR] : [])],
  };
}

/** Demo-only prices per website. Not FX conversions of each other. */
export const MIRROR_PRODUCTS: MirrorProduct[] = [
  {
    sku: "170423",
    url_key: "ovalo-velvet-sectional-sofa-7-pcs-white-living-room-midas",
    manufacturer: "Ashley",
    department: "living",
    image_url: img("1/1/11-170423_n.webp"),
    name: {
      en: "OVALO VELVET SECTIONAL SOFA 7 PCS WHITE",
      ar: "كنب أوفالو مخمل مقطعي 7 قطع أبيض",
    },
    categories: cats("living", ["Sofas", "Sectional Sofas"], ["كنب", "كنب مقطعي"], true),
    byWebsite: book([1645, 1395], [6200, 4980], [7100, 5750], [590, 475], [198, 159]),
  },
  {
    sku: "161621",
    url_key: "casai-sectional-sofa-living-rooms-midas",
    manufacturer: "Midas",
    department: "living",
    image_url: img("1/1/11-161621_q.webp"),
    name: { en: "CASAI SECTIONAL SOFA BEIGE", ar: "كنبة زاوية كاساي لون بيج" },
    categories: cats("living", ["Sofas", "Sectional Sofas"], ["كنب", "كنب مقطعي"], true),
    byWebsite: book([865, 735], [3450, 2890], [3990, 3180], [305, 255], [125, 95]),
  },
  {
    sku: "151369",
    url_key: "sossia-sectional-sofa-9-pcs-living-rooms-midas",
    manufacturer: "Midas",
    department: "living",
    image_url: img("1/1/11-151369_x.webp"),
    name: { en: "SOSSIA SECTIONAL SOFA 9 PCS", ar: "طقم كنبة زاوية 9 قطع سوسسيا لون رمادي" },
    categories: cats("living", ["Sofas", "Sectional Sofas"], ["كنب", "كنب مقطعي"], false),
    byWebsite: book([1595, 1350], [5980, 4920], [6890, 5590], [575, 485], [195, 155]),
  },
  {
    sku: "158133",
    url_key: "pumita-sectional-sofa-6-pcs-living-rooms-midas",
    manufacturer: "Midas",
    department: "living",
    image_url: img("1/1/11-158133_w.webp"),
    name: { en: "PUMITA SECTIONAL SOFA 6 PCS", ar: "طقم كنبة زاوية 6 قطع بوميتا لون رمادي" },
    categories: cats("living", ["Sofas", "Sectional Sofas"], ["كنب", "كنب مقطعي"], false),
    byWebsite: book([1285, 1028], [4890, 3920], [5480, 4290], [465, 369], [168, 129]),
  },
  {
    sku: "146489",
    url_key: "kaela-sectional-sofa-5-pcs-tiffany-146489-midas",
    manufacturer: "Midas",
    department: "living",
    image_url: img("1/1/11-146489_m.webp"),
    name: { en: "KAELA SECTIONAL SOFA 5 PCS - TIFFANY", ar: "طقم كنبة زاوية 5 قطع كايلا - تيفاني" },
    categories: cats("living", ["Sofas", "Sectional Sofas"], ["كنب", "كنب مقطعي"], true),
    byWebsite: book([899, 449], [3590, 1795], [3980, 1990], [325, 159], [119, 59]),
  },
  {
    sku: "158473",
    url_key: "jazzu-sectional-sofa-6-pcs-living-rooms-midas",
    manufacturer: "Midas",
    department: "living",
    image_url: img("1/1/11-158473_m.webp"),
    name: { en: "JAZZU SECTIONAL SOFA 6 PCS GREY", ar: "طقم كنبة زاوية 6 قطع جازو لون رمادي" },
    categories: cats("living", ["Sofas", "Sectional Sofas"], ["كنب", "كنب مقطعي"], true),
    byWebsite: book([959, 815], [3850, 3180], [4290, 3490], [345, 289], [125, 99]),
  },
  {
    sku: "156319",
    url_key: "winsome-swivel-chair-living-rooms-midas",
    manufacturer: "Ashley",
    department: "living",
    image_url: img("1/5/156319.webp"),
    name: { en: "WINSOME SWIVEL CHAIR BEIGE", ar: "كرسي دوار وينسوم لون بيج" },
    categories: cats("living", ["Chairs", "Ashley Homestore"], ["كراسي", "Ashley Homestore"], false),
    byWebsite: book([265, 225], [1090, 895], [1280, 990], [95, 79], [38, 29]),
  },
  {
    sku: "166178",
    url_key: "surmour-coffee-table-living-rooms-midas",
    manufacturer: "Ashley",
    department: "living",
    image_url: img("1/6/166178.webp"),
    name: { en: "SURMOUR COFFEE TABLE GREY", ar: "طاولة قهوة سرمور لون رمادي" },
    categories: cats("living", ["Center Tables", "Ashley Homestore"], ["طاولات وسط", "Ashley Homestore"], true),
    byWebsite: book([199, 169], [795, 655], [890, 720], [72, 59], [28, 22]),
  },
  {
    sku: "152723",
    url_key: "jorlaina-dining-table-set-6-chairs-dining-rooms-midas-saudi-arabia",
    manufacturer: "Ashley",
    department: "dining",
    image_url: img("1/7/17133_2_1.webp"),
    name: { en: "JORLAINA DINING TABLE SET 6 CHAIRS - GREY", ar: "طقم طاولة طعام 6 كرسي جورلينا - رمادي" },
    categories: cats("dining", ["Dining Table Sets", "Ashley Homestore"], ["أطقم سفرة", "Ashley Homestore"], false),
    byWebsite: book([699, 595], [2790, 2290], [3180, 2590], [255, 215], [89, 72]),
  },
  {
    sku: "159670",
    url_key: "mazagan-dining-table-set-10-chairs-dining-table-sets-midas",
    manufacturer: "Midas",
    department: "dining",
    image_url: img("4/3/43-159670_l_1.webp"),
    name: { en: "MAZAGAN DINING TABLE SET 10 CHAIRS - BEIGE", ar: "طقم طاولة طعام 10 كراسي مازاجان - بيج" },
    categories: cats("dining", ["Dining Table Sets"], ["أطقم سفرة"], true),
    byWebsite: book([1395, 1185], [5490, 4480], [6280, 4990], [505, 425], [168, 135]),
  },
  {
    sku: "143709",
    url_key: "tivoly-dining-table-set-14-chairs-with-arms",
    manufacturer: "Midas",
    department: "dining",
    image_url: img("4/3/43-143709_n.jpg"),
    name: { en: "TIVOLY DINING TABLE SET 14 - BROWN", ar: "طقم طاولة طعام 14 كرسي تيفولي - بني" },
    categories: cats("dining", ["Dining Table Sets"], ["أطقم سفرة"], false),
    byWebsite: book([2085, 1772], [8290, 6850], [9480, 7790], [755, 635], [249, 205]),
  },
  {
    sku: "160269",
    url_key: "viondra-dining-table-set-6-chairs-dining-rooms-midas",
    manufacturer: "Midas",
    department: "dining",
    image_url: img("4/3/43-160269_p.webp"),
    name: { en: "VIONDRA DINING TABLE SET 6 CHAIRS- WHITE", ar: "طقم طاولة طعام 6 كراسى ڤيوندرا - أبيض" },
    categories: cats("dining", ["Dining Table Sets"], ["أطقم سفرة"], false),
    byWebsite: book([890, 745], [3590, 2890], [3990, 3280], [325, 269], [109, 88]),
  },
  {
    sku: "150492",
    url_key: "cabalynn-dining-table-set-10-chairs",
    manufacturer: "Ashley",
    department: "dining",
    image_url: img("1/5/150492.webp"),
    name: { en: "CABALYNN DINING TABLE SET 10 CHAIRS - BROWN", ar: "طقم طاولة طعام 10 كراسي كابالين - بني" },
    categories: cats("dining", ["Dining Table Sets", "Ashley Homestore"], ["أطقم سفرة", "Ashley Homestore"], false),
    byWebsite: book([960, 816], [3850, 3180], [4290, 3490], [349, 289], [119, 98]),
  },
  {
    sku: "146947",
    url_key: "burkhaus-dining-table-set-8-chairs",
    manufacturer: "Ashley",
    department: "dining",
    image_url: img("1/4/146947.webp"),
    name: { en: "BURKHAUS DINING TABLE SET 8 CHAIRS - BROWN", ar: "طقم طاولة طعام 8 كراسي بورخاوس - بني" },
    categories: cats("dining", ["Dining Table Sets", "Ashley Homestore"], ["أطقم سفرة", "Ashley Homestore"], false),
    byWebsite: book([995, 845], [3980, 3290], [4480, 3690], [359, 299], [125, 105]),
  },
  {
    sku: "147979",
    url_key: "zerox-dining-table-set-8-chairs",
    manufacturer: "Midas",
    department: "dining",
    image_url: img("4/3/43-147979_h.jpg"),
    name: { en: "ZEROX DINING TABLE SET 8 CHAIRS - BROWN", ar: "طقم طاولة طعام 8 كراسي زيروكس - بني" },
    categories: cats("dining", ["Dining Table Sets"], ["أطقم سفرة"], false),
    byWebsite: book([1250, 1045], [4980, 4090], [5590, 4580], [449, 375], [155, 125]),
  },
  {
    sku: "160959",
    url_key: "elois-dining-table-set-8-chairs-dining-rooms-midas-qatar",
    manufacturer: "Midas",
    department: "dining",
    image_url: img("4/3/43-160959_m.webp"),
    name: { en: "ELOIS DINING TABLE SET 8 CHAIRS- WHITE", ar: "طقم طاولة طعام 8 كراسي اليوس - أبيض" },
    categories: cats("dining", ["Dining Table Sets"], ["أطقم سفرة"], false),
    byWebsite: book([1180, 995], [4690, 3850], [5280, 4290], [425, 355], [145, 119]),
  },
  {
    sku: "154534",
    url_key: "londer-bedroom-set-king-size-193-203-cm-bedrooms-midas",
    manufacturer: "Ashley",
    department: "bedrooms",
    image_url: img("1/5/154534.webp"),
    name: {
      en: "LONDER BEDROOM SET KING SIZE (193*203 CM) BLACK",
      ar: "طقم غرفة نوم لوندر كينج (193*203 سم) أسود",
    },
    categories: cats("bedrooms", ["King Size Bedroom Sets", "Ashley Homestore"], ["أطقم غرف نوم كينج", "Ashley Homestore"], true),
    byWebsite: book([995, 495], [3900, 2100], [4280, 2490], [355, 189], [118, 64], ["jordan"]),
  },
  {
    sku: "158259",
    url_key: "lemtonas-bedroom-set-king-size-193-203cm-bedrooms-midas",
    manufacturer: "Midas",
    department: "bedrooms",
    image_url: img("1/2/12-158259_v_1.webp"),
    name: {
      en: "LEMTONAS BEDROOM SET KING SIZE (193*203CM) BROWN",
      ar: "طقم غرفة نوم ليمتوناس حجم ملكى (193*203 سم) لون بني",
    },
    categories: cats("bedrooms", ["King Size Bedroom Sets"], ["أطقم غرف نوم كينج"], false),
    byWebsite: book([850, 722], [3390, 2790], [3790, 3090], [305, 259], [105, 88]),
  },
  {
    sku: "166535",
    url_key: "fago-bedroom-set-king-size-180-200cm-bedrooms-midas",
    manufacturer: "Midas",
    department: "bedrooms",
    image_url: img("1/2/12-166535_y.webp"),
    name: {
      en: "FAGO BEDROOM SET KING SIZE (180*200CM) GREY",
      ar: "طقم غرفة نوم فوجو حجم ملكى (180*200 سم) لون رمادي",
    },
    categories: cats("bedrooms", ["King Size Bedroom Sets"], ["أطقم غرف نوم كينج"], true),
    byWebsite: book([699, 455], [2790, 1790], [3180, 1990], [255, 165], [89, 55]),
  },
  {
    sku: "166541",
    url_key: "levo-bedroom-set-king-size-180-200cm-bedrooms-midas",
    manufacturer: "Midas",
    department: "bedrooms",
    image_url: img("1/2/12-166541_ww.webp"),
    name: {
      en: "LEVO BEDROOM SET KING SIZE (180*200CM) BEIGE",
      ar: "طقم غرفة نوم ليفو حجم ملكى (180*200 سم) لون بيج",
    },
    categories: cats("bedrooms", ["King Size Bedroom Sets"], ["أطقم غرف نوم كينج"], false),
    byWebsite: book([695, 590], [2790, 2290], [3090, 2590], [249, 209], [88, 72]),
  },
  {
    sku: "169819",
    url_key: "kendamor-bedroom-set-king-size-193-203cm-brown-bedrooms-midas",
    manufacturer: "Ashley",
    department: "bedrooms",
    image_url: img("1/6/169819.webp"),
    name: {
      en: "KENDAMOR BEDROOM SET KING SIZE (193*203CM) BROWN",
      ar: "طقم غرفة نوم كيندامور حجم ملكى (193*203 سم) لون بني",
    },
    categories: cats("bedrooms", ["King Size Bedroom Sets", "Ashley Homestore"], ["أطقم غرف نوم كينج", "Ashley Homestore"], false),
    byWebsite: book([1095, 766], [4390, 3090], [4890, 3390], [395, 275], [135, 95]),
  },
  {
    sku: "158256",
    url_key: "rago-bedroom-set-king-size-193-203cm-bedrooms-midas",
    manufacturer: "Midas",
    department: "bedrooms",
    image_url: img("1/2/12-158256_u_1.webp"),
    name: {
      en: "RAGO BEDROOM SET KING SIZE (193*203CM) GOLD",
      ar: "طقم غرفة نوم راجو حجم ملكى (193*203 سم) لون ذهبي",
    },
    categories: cats("bedrooms", ["King Size Bedroom Sets"], ["أطقم غرف نوم كينج"], false),
    byWebsite: book([895, 759], [3590, 2980], [3990, 3290], [325, 275], [115, 95]),
  },
  {
    sku: "157093",
    url_key: "saviola-bedroom-set-king-size-193-203-cm-bedrooms-midas",
    manufacturer: "Midas",
    department: "bedrooms",
    image_url: img("1/2/12-157093_z5_1.webp"),
    name: {
      en: "SAVIOLA BEDROOM SET KING SIZE (193*203 CM) BEIGE",
      ar: "طقم غرفة نوم سافيولا حجم ملكى (193*203 سم) لون بيج",
    },
    categories: cats("bedrooms", ["King Size Bedroom Sets"], ["أطقم غرف نوم كينج"], false),
    byWebsite: book([790, 671], [3180, 2590], [3490, 2890], [285, 239], [99, 82]),
  },
  {
    sku: "170507",
    url_key: "trulani-bedroom-set-king-size-193-203cm-white-bedrooms-midas",
    manufacturer: "Midas",
    department: "bedrooms",
    image_url: img("1/7/170507.webp"),
    name: {
      en: "TRULANI BEDROOM SET KING SIZE (193*203CM) WHITE",
      ar: "طقم غرفة نوم ترولاني حجم ملكى (193*203 سم) لون أبيض",
    },
    categories: cats("bedrooms", ["King Size Bedroom Sets"], ["أطقم غرف نوم كينج"], false),
    byWebsite: book([939, 799], [3750, 3090], [4190, 3490], [339, 285], [119, 99]),
  },
];

export function isMirrorNavSlug(value: string): value is MirrorNavSlug {
  return value in MIRROR_NAV;
}

export function onOffer(product: MirrorProduct) {
  return product.categories.en.includes(SALE_EN);
}

export function productsInDepartment(slug: MirrorNavSlug): MirrorProduct[] {
  if (slug === "offers") return MIRROR_PRODUCTS.filter(onOffer);
  return MIRROR_PRODUCTS.filter((p) => p.department === slug);
}

export function magentoItem(store: StoreCode, product: MirrorProduct) {
  const meta = STORE_MAP[store];
  const price = product.byWebsite[meta.website];
  const lang = meta.language;
  const percent =
    price.regular > price.final ? Math.round((1 - price.final / price.regular) * 1000) / 10 : 0;
  return {
    sku: product.sku,
    name: product.name[lang],
    url_key: product.url_key,
    stock_status: price.stock,
    manufacturer: product.manufacturer,
    categories: product.categories[lang].map((name) => ({ name })),
    image: { url: product.image_url },
    price_range: {
      minimum_price: {
        regular_price: { value: price.regular, currency: meta.currency },
        final_price: { value: price.final, currency: meta.currency },
        discount: { percent_off: percent },
      },
    },
  };
}

export function findBySku(sku: string) {
  return MIRROR_PRODUCTS.find((p) => p.sku === sku) ?? null;
}

export function findByUrlKey(urlKey: string) {
  const key = urlKey.replace(/\.html$/i, "").replace(/\/+$/, "");
  return MIRROR_PRODUCTS.find((p) => p.url_key === key) ?? null;
}

export function searchMirror(store: StoreCode, search: string, pageSize = 8) {
  const q = search.toLowerCase();
  const lang = STORE_MAP[store].language;
  const tokens = q.split(/\s+/).filter((t) => t.length > 1);
  const scored = MIRROR_PRODUCTS.map((p) => {
    const hay =
      `${p.sku} ${p.url_key} ${p.name.en} ${p.name.ar} ${p.categories[lang].join(" ")} ${p.manufacturer} ${p.department}`.toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (hay.includes(t)) score += 3;
    }
    if (q && hay.includes(q)) score += 4;
    return { p, score };
  });
  const hits = (tokens.length ? scored.filter((s) => s.score > 0) : scored)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.p);
  return hits.slice(0, pageSize).map((p) => magentoItem(store, p));
}

export function productsByCategoryId(store: StoreCode, ids: string[], pageSize = 12) {
  const idSet = new Set(ids.map(String));
  const meta = STORE_MAP[store];
  const wanted: MirrorProduct[] = [];
  if (idSet.has(String(MIRROR_NAV.living.id))) wanted.push(...productsInDepartment("living"));
  if (idSet.has(String(MIRROR_NAV.dining.id))) wanted.push(...productsInDepartment("dining"));
  if (idSet.has(String(MIRROR_NAV.bedrooms.id))) wanted.push(...productsInDepartment("bedrooms"));
  if (idSet.has(String(MIRROR_NAV.offers.id))) {
    wanted.push(
      ...productsInDepartment("offers").filter((p) => p.byWebsite[meta.website].stock === "IN_STOCK"),
    );
  }
  const seen = new Set<string>();
  const unique = wanted.filter((p) => {
    if (seen.has(p.sku)) return false;
    seen.add(p.sku);
    return true;
  });
  return unique.slice(0, pageSize).map((p) => magentoItem(store, p));
}

export function matchMirrorCategories(name: string) {
  const q = name.toLowerCase().trim();
  if (!q) return [MIRROR_NAV.offers];
  return MIRROR_NAV_SLUGS.map((slug) => MIRROR_NAV[slug]).filter((cat) => {
    const hay = `${cat.en} ${cat.ar} ${cat.magentoEn} ${cat.magentoAr} ${cat.slug}`.toLowerCase();
    if (hay.includes(q) || q.includes(cat.slug)) return true;
    if (cat.slug === "offers" && /sale|offer|deal|flash|عروض|خصم/.test(q)) return true;
    if (cat.slug === "living" && /living|sofa|معيشة|كنب/.test(q)) return true;
    if (cat.slug === "dining" && /dining|سفرة|طعام/.test(q)) return true;
    if (cat.slug === "bedrooms" && /bedroom|نوم/.test(q)) return true;
    return false;
  });
}
