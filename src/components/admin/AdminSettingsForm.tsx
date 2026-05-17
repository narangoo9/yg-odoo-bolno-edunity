"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  Globe, CreditCard, Bell,
  CheckCircle, AlertTriangle,
} from "lucide-react";

interface SettingSection {
  id: string;
  icon: React.ElementType;
  labelKey: string;
}

const sections: SettingSection[] = [
  { id: "general", icon: Globe, labelKey: "settings.general" },
  { id: "payment", icon: CreditCard, labelKey: "settings.payment" },
  { id: "notifications", icon: Bell, labelKey: "settings.notifications" },
];

export function AdminSettingsForm() {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState("general");
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    siteName: "ELearn",
    siteDescription: "Мэдлэгийг дэлгэрүүл. Ур чадвараа нэмэгдүүл.",
    siteUrl: "https://elearn.mn",
    supportEmail: "support@elearn.mn",
    maintenanceMode: false,
    registrationOpen: true,
    emailVerification: true,
    maxLoginAttempts: 5,
    sessionDurationDays: 30,
    currency: "MNT",
    stripePublicKey: "",
    stripeSecretKey: "",
    minWithdrawal: 10000,
    platformFeePercent: 30,
    emailNotifications: true,
    enrollmentEmails: true,
    paymentEmails: true,
    marketingEmails: false,
  });

  function handleChange(key: keyof typeof settings, value: string | boolean | number) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      {/* Sidebar nav */}
      <div className="lg:col-span-1">
        <nav className="space-y-1">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                  activeSection === s.id
                    ? "bg-violet-600 dark:bg-muted text-white dark:text-foreground"
                    : "text-muted-foreground dark:text-muted-foreground/60 hover:bg-muted dark:hover:bg-violet-500"
                }`}
              >
                <Icon size={16} />
                {t(s.labelKey)}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Form */}
      <div className="lg:col-span-3 space-y-4">
        {activeSection === "general" && (
          <div className="bg-white dark:bg-[#1e1b4b] rounded-xl border border-border dark:border-border p-6 space-y-5">
            <h2 className="text-base font-semibold text-foreground dark:text-slate-100 flex items-center gap-2">
              <Globe size={16} /> {t("settings.general")}
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={t("settings.siteName")}>
                <input
                  value={settings.siteName}
                  onChange={(e) => handleChange("siteName", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border dark:border-border rounded-lg bg-white dark:bg-slate-700 text-foreground dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </Field>
              <Field label="Сайтын URL">
                <input
                  value={settings.siteUrl}
                  onChange={(e) => handleChange("siteUrl", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border dark:border-border rounded-lg bg-white dark:bg-slate-700 text-foreground dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </Field>
            </div>

            <Field label={t("settings.siteDescription")}>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => handleChange("siteDescription", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-border dark:border-border rounded-lg bg-white dark:bg-slate-700 text-foreground dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none"
              />
            </Field>

            <Field label="Дэмжлэгийн и-мэйл">
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => handleChange("supportEmail", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border dark:border-border rounded-lg bg-white dark:bg-slate-700 text-foreground dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </Field>

            <div className="border-t border-border dark:border-border pt-4 space-y-3">
              <Toggle
                label={t("settings.maintenance")}
                description="Засвар үйлчилгээний горим идэвхтэй үед хэрэглэгчид хандаж чадахгүй"
                checked={settings.maintenanceMode}
                onChange={(v) => handleChange("maintenanceMode", v)}
                danger
              />
              <Toggle
                label={t("settings.registration")}
                description="Шинэ хэрэглэгч бүртгүүлэх боломжтой эсэх"
                checked={settings.registrationOpen}
                onChange={(v) => handleChange("registrationOpen", v)}
              />
              <Toggle
                label={t("settings.emailVerification")}
                description="Бүртгэлийн дараа и-мэйлийг баталгаажуулах шаардлагатай"
                checked={settings.emailVerification}
                onChange={(v) => handleChange("emailVerification", v)}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Нэвтрэх оролдлогын хязгаар">
                <input
                  type="number"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => handleChange("maxLoginAttempts", Number(e.target.value))}
                  min={1} max={20}
                  className="w-full px-3 py-2 text-sm border border-border dark:border-border rounded-lg bg-white dark:bg-slate-700 text-foreground dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </Field>
              <Field label="Сессийн үргэлжлэх хугацаа (хоног)">
                <input
                  type="number"
                  value={settings.sessionDurationDays}
                  onChange={(e) => handleChange("sessionDurationDays", Number(e.target.value))}
                  min={1}
                  className="w-full px-3 py-2 text-sm border border-border dark:border-border rounded-lg bg-white dark:bg-slate-700 text-foreground dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </Field>
            </div>
          </div>
        )}

        {activeSection === "payment" && (
          <div className="bg-white dark:bg-[#1e1b4b] rounded-xl border border-border dark:border-border p-6 space-y-5">
            <h2 className="text-base font-semibold text-foreground dark:text-slate-100 flex items-center gap-2">
              <CreditCard size={16} /> {t("settings.payment")}
            </h2>

            <Field label={t("settings.currency")}>
              <select
                value={settings.currency}
                onChange={(e) => handleChange("currency", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border dark:border-border rounded-lg bg-white dark:bg-slate-700 text-foreground dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="MNT">MNT — Монгол төгрөг</option>
                <option value="USD">USD — Америк доллар</option>
                <option value="EUR">EUR — Евро</option>
                <option value="KRW">KRW — Солонгосын вон</option>
                <option value="JPY">JPY — Японы иен</option>
                <option value="CNY">CNY — Хятад юань</option>
              </select>
            </Field>

            <Field label={t("settings.stripeKey")}>
              <input
                value={settings.stripePublicKey}
                onChange={(e) => handleChange("stripePublicKey", e.target.value)}
                placeholder="pk_live_..."
                className="w-full px-3 py-2 text-sm border border-border dark:border-border rounded-lg bg-white dark:bg-slate-700 text-foreground dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
              />
            </Field>

            <Field label="Stripe нууц түлхүүр">
              <input
                type="password"
                value={settings.stripeSecretKey}
                onChange={(e) => handleChange("stripeSecretKey", e.target.value)}
                placeholder="sk_live_..."
                className="w-full px-3 py-2 text-sm border border-border dark:border-border rounded-lg bg-white dark:bg-slate-700 text-foreground dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Платформын комисс (%)">
                <input
                  type="number"
                  value={settings.platformFeePercent}
                  onChange={(e) => handleChange("platformFeePercent", Number(e.target.value))}
                  min={0} max={100}
                  className="w-full px-3 py-2 text-sm border border-border dark:border-border rounded-lg bg-white dark:bg-slate-700 text-foreground dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </Field>
              <Field label="Хамгийн бага татан авалт">
                <input
                  type="number"
                  value={settings.minWithdrawal}
                  onChange={(e) => handleChange("minWithdrawal", Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 text-sm border border-border dark:border-border rounded-lg bg-white dark:bg-slate-700 text-foreground dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </Field>
            </div>
          </div>
        )}

        {activeSection === "notifications" && (
          <div className="bg-white dark:bg-[#1e1b4b] rounded-xl border border-border dark:border-border p-6 space-y-5">
            <h2 className="text-base font-semibold text-foreground dark:text-slate-100 flex items-center gap-2">
              <Bell size={16} /> {t("settings.notifications")}
            </h2>

            <div className="space-y-3">
              <Toggle
                label={t("settings.emailNotifications")}
                description="Системийн бүх и-мэйл мэдэгдлийг идэвхжүүлэх"
                checked={settings.emailNotifications}
                onChange={(v) => handleChange("emailNotifications", v)}
              />
              <Toggle
                label="Бүртгэлийн мэдэгдэл"
                description="Оюутан шинэ курст бүртгэлдэхэд и-мэйл илгээх"
                checked={settings.enrollmentEmails}
                onChange={(v) => handleChange("enrollmentEmails", v)}
              />
              <Toggle
                label="Төлбөрийн мэдэгдэл"
                description="Амжилттай болон бүтэлгүйтсэн төлбөрийн тухай мэдэгдэл"
                checked={settings.paymentEmails}
                onChange={(v) => handleChange("paymentEmails", v)}
              />
              <Toggle
                label="Маркетингийн мэдэгдэл"
                description="Сурталчилгаа, урамшуулал, шинэ сонголтын мэдэгдэл"
                checked={settings.marketingEmails}
                onChange={(v) => handleChange("marketingEmails", v)}
              />
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle size={14} /> Хадгалагдлаа
            </span>
          )}
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-violet-600 dark:bg-muted text-white dark:text-foreground rounded-lg text-sm font-medium hover:bg-violet-500 dark:hover:bg-white transition-colors"
          >
            {t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground dark:text-muted-foreground/80">{label}</label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  danger,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  danger?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-muted/50 dark:bg-slate-700/50 border border-border dark:border-border">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {danger && checked && <AlertTriangle size={14} className="text-amber-500 shrink-0" />}
          <p className="text-sm font-medium text-foreground dark:text-slate-100">{label}</p>
        </div>
        {description && <p className="text-xs text-muted-foreground dark:text-muted-foreground/80 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
          checked
            ? danger ? "bg-amber-500" : "bg-emerald-500"
            : "bg-slate-300 dark:bg-slate-600"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
