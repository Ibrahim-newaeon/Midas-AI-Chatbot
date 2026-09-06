import type { WebsiteId } from "@/lib/stores";

export type PolicyTopic =
  | "delivery"
  | "returns"
  | "payments"
  | "wallet"
  | "showrooms"
  | "hours"
  | "installation"
  | "customization";

const CUSTOMIZATION =
  "Midas does not offer customization. All products are ready-made by international factories and brands. We can help you find an in-stock alternative in a similar colour or fabric.";

const CUSTOMIZATION_AR =
  "لا نوفر خدمة التفصيل أو تغيير الأقمشة. منتجاتنا جاهزة من مصانع وعلامات عالمية. يمكننا مساعدتك في إيجاد بديل متوفر بلون أو قماش قريب.";

type Pack = Record<PolicyTopic, { en: string; ar: string }>;

const packs: Record<WebsiteId, Pack> = {
  kuwait: {
    customization: { en: CUSTOMIZATION, ar: CUSTOMIZATION_AR },
    delivery: {
      en: "Delivery and installation inside Kuwait: confirm on the FAQ for this store before promising a fee. After you order, customer care contacts you within 24 hours to schedule. Furniture is not shipped to other countries from this store.",
      ar: "التوصيل والتركيب داخل الكويت: نعتمد نص سياسة هذا المتجر قبل تأكيد أي رسوم. بعد الطلب تتواصل خدمة العملاء خلال 24 ساعة لتحديد الموعد. لا يتم شحن الأثاث من هذا المتجر إلى دولة أخرى.",
    },
    installation: {
      en: "Installation is arranged with delivery. Customer care will set a time that suits you after the order is confirmed.",
      ar: "التركيب يُنسَّق مع التوصيل. تحدد خدمة العملاء موعداً يناسبك بعد تأكيد الطلب.",
    },
    returns: {
      en: "Cancel or return by contacting customer care with your order number. See the Return Policy on midasfurniture.com for the full mechanism.",
      ar: "للإلغاء أو الاسترجاع تواصل مع خدمة العملاء مع رقم الطلب. السياسة الكاملة على موقع ميداس.",
    },
    payments: {
      en: "Online: credit cards, KNET, Apple Pay, American Express, PayPal, Google Pay. Installments: Tabby, Tamara, and Baytaly. No cash on delivery.",
      ar: "الدفع الإلكتروني: بطاقات، كي نت، Apple Pay، أمريكان إكسبريس، PayPal، Google Pay. التقسيط: تابي وتمارا وبي تالي. لا يوجد دفع عند الاستلام.",
    },
    wallet: {
      en: "Midas Wallet members earn Midas Cash and perks. Free delivery and installation as a member benefit is stated on the homepage; the FAQ also describes Kuwait delivery. Ask customer care if you need the rule confirmed for your order.",
      ar: "أعضاء محفظة ميداس يحصلون على ميداس كاش ومزايا. تأكيد توصيل الأعضاء مقابل سياسة التوصيل العامة يتم من خدمة العملاء حتى لا نخلط بين صفحتين.",
    },
    showrooms: {
      en: "Kuwait showrooms: Midas Home Furniture and Kitchens, Al Rai (behind Avenues Mall); Ashley Homestore, Al Rai; Office Furniture, Al Dajeej / Al-Sayer Complex. Customer care: 1888886, customercare@midasfurniture.com, WhatsApp via the site.",
      ar: "المعارض في الكويت: ميداس للأثاث المنزلي والمطابخ في الري (خلف الأفنيوز)؛ آشلي في الري؛ أثاث المكاتب في الضجيج / مجمع الساير. خدمة العملاء: 1888886 و customercare@midasfurniture.com.",
    },
    hours: {
      en: "Midas Future Mall Al Rai: 9:00 am–11:00 pm daily. Ashley Al Rai: 9:00 am–11:00 pm daily. Office Al Dajeej: 9:30 am–8:00 pm, closed Friday.",
      ar: "فرع فيوتشر مول الري: 9 صباحاً–11 مساءً يومياً. آشلي الري: 9 صباحاً–11 مساءً. المكاتب الضجيج: 9:30 صباحاً–8 مساءً ويغلق الجمعة.",
    },
  },
  qatar: {
    customization: { en: CUSTOMIZATION, ar: CUSTOMIZATION_AR },
    delivery: {
      en: "Qatar delivery is fulfilled from the Qatar store only. We do not move stock from Kuwait or KSA into a Qatar order. Confirm fees and slots with Qatar customer care at checkout.",
      ar: "توصيل قطر يتم من متجر قطر فقط. لا ننقل المخزون من الكويت أو السعودية إلى طلب قطري. رسوم ومواعيد التوصيل يؤكدها فريق قطر عند إتمام الطلب.",
    },
    installation: {
      en: "Installation is arranged locally in Qatar after the order is confirmed.",
      ar: "التركيب يُنسَّق داخل قطر بعد تأكيد الطلب.",
    },
    returns: {
      en: "Returns and cancellations go through Qatar customer care with your order number.",
      ar: "الإلغاء والاسترجاع عبر خدمة عملاء قطر مع رقم الطلب.",
    },
    payments: {
      en: "Pay on the Qatar Magento checkout. Do not send card details in chat.",
      ar: "ادفع عبر صفحة الدفع في متجر قطر. لا ترسل بيانات البطاقة في المحادثة.",
    },
    wallet: {
      en: "Wallet perks follow the Qatar store account. Details are on the Qatar site Wallet block.",
      ar: "مزايا المحفظة حسب حساب متجر قطر.",
    },
    showrooms: {
      en: "Use the Qatar store contact details on midasfurniture.com/qtr_en/ (or qtr_ar).",
      ar: "بيانات التواصل لمعرض قطر موجودة على متجر قطر في الموقع.",
    },
    hours: {
      en: "Please check the Qatar store page or customer care for current opening hours.",
      ar: "ساعات العمل لمعرض قطر من صفحة المتجر أو خدمة العملاء.",
    },
  },
  ksa: {
    customization: { en: CUSTOMIZATION, ar: CUSTOMIZATION_AR },
    delivery: {
      en: "Saudi orders ship from the KSA store. Stock and prices are SAR and separate from Kuwait. Confirm delivery coverage at checkout.",
      ar: "طلبات السعودية تُلبّى من متجر السعودية. الأسعار بالريال والمخزون منفصل عن الكويت.",
    },
    installation: {
      en: "Installation is scheduled locally after the KSA order is confirmed.",
      ar: "التركيب يُجدول محلياً بعد تأكيد طلب السعودية.",
    },
    returns: {
      en: "KSA customer care handles returns with your order number.",
      ar: "الاسترجاع عبر خدمة عملاء السعودية مع رقم الطلب.",
    },
    payments: {
      en: "Pay on the KSA Magento checkout only. Never share card data in chat.",
      ar: "الدفع عبر متجر السعودية فقط. لا تشارك بيانات البطاقة هنا.",
    },
    wallet: {
      en: "Wallet benefits apply to the KSA customer account on this store view.",
      ar: "مزايا المحفظة لحساب متجر السعودية.",
    },
    showrooms: {
      en: "Use the KSA store contact details on midasfurniture.com/ksa_en/.",
      ar: "تواصل معارض السعودية من صفحة متجر السعودية.",
    },
    hours: {
      en: "Confirm KSA showroom hours on the store page or with customer care.",
      ar: "ساعات معارض السعودية من صفحة المتجر أو خدمة العملاء.",
    },
  },
  jordan: {
    customization: { en: CUSTOMIZATION, ar: CUSTOMIZATION_AR },
    delivery: {
      en: "Jordan orders are priced in JOD and fulfilled from the Jordan store. Kuwait KWD prices do not apply here.",
      ar: "طلبات الأردن بالدينار الأردني ومن متجر الأردن. أسعار الكويت بالدينار الكويتي لا تنطبق هنا.",
    },
    installation: {
      en: "Installation is arranged in Jordan after order confirmation.",
      ar: "التركيب داخل الأردن بعد تأكيد الطلب.",
    },
    returns: {
      en: "Contact Jordan customer care with your order number.",
      ar: "تواصل مع خدمة عملاء الأردن مع رقم الطلب.",
    },
    payments: {
      en: "Checkout on the Jordan Magento store. No payment details in chat.",
      ar: "الدفع عبر متجر الأردن. لا بيانات دفع في الدردشة.",
    },
    wallet: {
      en: "Wallet is tied to the Jordan store account.",
      ar: "المحفظة مرتبطة بحساب متجر الأردن.",
    },
    showrooms: {
      en: "Jordan branch contacts are listed on midasfurniture.com/jo_en/.",
      ar: "بيانات معرض الأردن على متجر الأردن في الموقع.",
    },
    hours: {
      en: "Ask Jordan customer care or the store page for opening hours.",
      ar: "ساعات العمل من صفحة متجر الأردن أو خدمة العملاء.",
    },
  },
  bahrain: {
    customization: { en: CUSTOMIZATION, ar: CUSTOMIZATION_AR },
    delivery: {
      en: "Bahrain orders use BHD pricing and Bahrain stock. Other GCC warehouses are not used for this checkout.",
      ar: "طلبات البحرين بالدينار البحريني ومخزون البحرين فقط.",
    },
    installation: {
      en: "Installation is scheduled in Bahrain after confirmation.",
      ar: "التركيب في البحرين بعد التأكيد.",
    },
    returns: {
      en: "Bahrain customer care handles returns with the order number.",
      ar: "الاسترجاع عبر خدمة عملاء البحرين.",
    },
    payments: {
      en: "Pay on the Bahrain Magento checkout. Do not send card details here.",
      ar: "الدفع عبر متجر البحرين فقط.",
    },
    wallet: {
      en: "Wallet perks follow the Bahrain store account.",
      ar: "المحفظة لحساب متجر البحرين.",
    },
    showrooms: {
      en: "See midasfurniture.com/bhr_en/ for Bahrain contacts.",
      ar: "بيانات البحرين على متجر البحرين.",
    },
    hours: {
      en: "Confirm hours with Bahrain customer care.",
      ar: "ساعات العمل من خدمة عملاء البحرين.",
    },
  },
};

export function getPolicyText(website: WebsiteId, topic: PolicyTopic, language: "en" | "ar") {
  return packs[website][topic][language];
}

export const POLICY_TOPICS: PolicyTopic[] = [
  "delivery",
  "returns",
  "payments",
  "wallet",
  "showrooms",
  "hours",
  "installation",
  "customization",
];
