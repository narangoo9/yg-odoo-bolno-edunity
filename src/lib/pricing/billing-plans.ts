// Single source of truth for the user-facing billing plans rendered on:
//   - the landing page (/)
//   - the public /pricing page
//   - the /student/upgrade page (after login)
//
// Whenever a price, name, or feature changes, edit this file only.

export type BillingTierId = "STANDARD" | "PREMIUM" | "PRO";
export type BillingPeriod = "monthly" | "yearly";

export interface BillingTier {
  id: BillingTierId;
  name: string;
  tagline: string;
  monthlyPrice: number; // MNT
  yearlyPrice: number; // MNT
  badge?: "Most Popular" | "Best Value";
  features: string[];
}

export const BILLING_TIERS: BillingTier[] = [
  {
    id: "STANDARD",
    name: "Standard",
    tagline: "Үнэгүй хичээлээр эхлэх",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "Үнэгүй курсууд",
      "Үндсэн ахиц хянах",
      "Нийгэмлэгийн чат",
      "Курс дуусгах сертификат",
      "Leaderboard оролцоо",
      "5 GB тэмдэглэл хадгалах",
    ],
  },
  {
    id: "PREMIUM",
    name: "Premium",
    tagline: "Бүх компанийн хичээл + AI туслах",
    monthlyPrice: 29900,
    yearlyPrice: 299000,
    badge: "Most Popular",
    features: [
      "Standard бүгдийг",
      "Бүх компанийн курс",
      "Тэргүүлэх дэмжлэг",
      "Peer grading & review",
      "Дэвшилтэт аналитик",
      "Материал татаж авах",
      "20 GB тэмдэглэл хадгалах",
      "AI туслах (Beta)",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    tagline: "Хязгааргүй хандалт + Mentor хичээл",
    monthlyPrice: 79900,
    yearlyPrice: 799000,
    badge: "Best Value",
    features: [
      "Premium бүгдийг",
      "Хязгааргүй курс хандалт",
      "Амьд 1:1 mentor хичээл",
      "Карьерын зөвлөгөө & CV шалгалт",
      "Хувийн судалгааны бүлэг",
      "100 GB хадгалах сан",
      "Хамтарсан сертификат",
      "Шинэ курст эрт хандах",
    ],
  },
];

export function getBillingTier(id: BillingTierId): BillingTier {
  const tier = BILLING_TIERS.find((t) => t.id === id);
  if (!tier) throw new Error(`Unknown billing tier: ${id}`);
  return tier;
}

export interface BillingComparisonRow {
  feature: string;
  standard: boolean | string;
  premium: boolean | string;
  pro: boolean | string;
}

export const BILLING_COMPARISON: BillingComparisonRow[] = [
  { feature: "Үнэгүй курсууд", standard: true, premium: true, pro: true },
  { feature: "Компанийн бүх курс", standard: false, premium: true, pro: true },
  { feature: "Курс дуусгах сертификат", standard: true, premium: true, pro: true },
  { feature: "Peer grading", standard: false, premium: true, pro: true },
  { feature: "Ахиц дэвшлийн аналитик", standard: "Үндсэн", premium: "Дэвшилтэт", pro: "Бүрэн" },
  { feature: "AI туслах", standard: false, premium: "Beta", pro: true },
  { feature: "Амьд mentor хичээл", standard: false, premium: false, pro: true },
  { feature: "Хадгалах сан", standard: "5 GB", premium: "20 GB", pro: "100 GB" },
  { feature: "Дэмжлэг", standard: "Нийгэмлэг", premium: "Тэргүүлэх", pro: "Хувийн" },
];

export function formatTierPrice(tier: BillingTier, period: BillingPeriod): string {
  const amount = period === "monthly" ? tier.monthlyPrice : tier.yearlyPrice;
  if (amount === 0) return "Үнэгүй";
  return `₮${amount.toLocaleString()}`;
}

export function tierYearlySavings(tier: BillingTier): number {
  return Math.max(0, tier.monthlyPrice * 12 - tier.yearlyPrice);
}
