"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";

export function SupportContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-800/40 dark:bg-emerald-950/30">
        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
          Мессеж хүлээн авлаа
        </p>
        <p className="mt-1 text-[13px] text-emerald-700/90 dark:text-emerald-300/80">
          Бид удахгүй танд хариу илгээнэ.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[#E9DFFF] bg-white p-5 dark:border-[#2E2146] dark:bg-[#1C142B]"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="support-name" className="text-[12px] font-semibold text-[#374151] dark:text-[#D4D4D8]">
            Нэр
          </label>
          <input
            id="support-name"
            name="name"
            required
            className="mt-1.5 flex h-10 w-full rounded-xl border border-[#E9DFFF] bg-violet-50/50 px-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 dark:border-[#2E2146] dark:bg-violet-900/20 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="support-email" className="text-[12px] font-semibold text-[#374151] dark:text-[#D4D4D8]">
            Имэйл
          </label>
          <input
            id="support-email"
            name="email"
            type="email"
            required
            className="mt-1.5 flex h-10 w-full rounded-xl border border-[#E9DFFF] bg-violet-50/50 px-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 dark:border-[#2E2146] dark:bg-violet-900/20 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="support-topic" className="text-[12px] font-semibold text-[#374151] dark:text-[#D4D4D8]">
            Сэдэв
          </label>
          <select
            id="support-topic"
            name="topic"
            className="mt-1.5 flex h-10 w-full rounded-xl border border-[#E9DFFF] bg-violet-50/50 px-3 text-sm outline-none focus:border-violet-400 dark:border-[#2E2146] dark:bg-violet-900/20 dark:text-white"
          >
            <option>Бүртгэл</option>
            <option>Төлбөр</option>
            <option>Сургалт</option>
            <option>Техникийн асуудал</option>
            <option>Бусад</option>
          </select>
        </div>
        <div>
          <label htmlFor="support-message" className="text-[12px] font-semibold text-[#374151] dark:text-[#D4D4D8]">
            Мессеж
          </label>
          <textarea
            id="support-message"
            name="message"
            required
            rows={4}
            className="mt-1.5 w-full resize-none rounded-xl border border-[#E9DFFF] bg-violet-50/50 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 dark:border-[#2E2146] dark:bg-violet-900/20 dark:text-white"
            placeholder="Асуудлаа тодорхой бичнэ үү..."
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white transition-colors hover:bg-violet-500 disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Илгээх
        </button>
      </div>
    </form>
  );
}
