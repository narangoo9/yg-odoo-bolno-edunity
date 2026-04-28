import { z } from "zod";

export const subscriptionPlans = {
  FREE: {
    name: "Үнэгүй",
    price: 0,
    features: [
      "Үнэгүй курсуудад хандах",
      "Суурь дашбоард",
      "Ахиц хяналт",
    ],
    limits: { maxEnrollments: 3, maxCertificates: 1 },
  },
  STUDENT: {
    name: "Оюутан",
    price: 19000,
    yearlyPrice: 199000,
    features: [
      "Бүх курсуудад хандах",
      "Хязгааргүй бүртгэл",
      "Сертификат олгоно",
      "Премиум материал",
    ],
    limits: { maxEnrollments: -1, maxCertificates: -1 },
  },
  INSTRUCTOR: {
    name: "Багш",
    price: 49000,
    yearlyPrice: 499000,
    features: [
      "Хязгааргүй курс үүсгэх",
      "Instructor analytics",
      "Төлбөрийн integration",
      "Custom branding",
    ],
    limits: { maxCourses: -1, revenueShare: 70 },
  },
  ORGANIZATION: {
    name: "Байгууллага",
    price: 199000,
    yearlyPrice: 1990000,
    features: [
      "Multi-tenant workspace",
      "50+ гишүүн",
      "Brand customization",
      "Priority support",
      "SSO integration",
    ],
    limits: { maxMembers: 50, maxCourses: -1 },
  },
} as const;

export const upgradePlanSchema = z.object({
  plan: z.enum(["STUDENT", "INSTRUCTOR", "ORGANIZATION"]),
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
});

export type UpgradePlanInput = z.infer<typeof upgradePlanSchema>;
