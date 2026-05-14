import type { Metadata } from "next";
import Link from "next/link";
import { Search, Sparkles, Building2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { CompanyCard } from "@/components/marketplace/CompanyCard";
import { getApprovedCompanies } from "@/lib/company-marketplace";

export const metadata: Metadata = { title: "Companies - EduNity" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ search?: string; category?: string }>;
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const companies = await getApprovedCompanies(sp.search, sp.category).catch(() => []);
  const categories = Array.from(new Set(companies.map((company) => company.marketplace.category)));

  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-violet-800 via-violet-700 to-fuchsia-600 px-4 py-16 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 20%,white 0,transparent 24%),radial-gradient(circle at 80% 0,white 0,transparent 20%)" }} />
        <div className="relative mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-black">
              <Building2 size={14} /> Company marketplace
            </div>
            <h1 className="text-4xl font-black tracking-tight">Компаниудаас суралцах шинэ EduNity</h1>
            <p className="mt-4 text-sm leading-6 text-violet-100">
              Code, beauty, language, business, design, productivity зэрэг өөр өөр company catalog-оос free preview үзээд Standard эсвэл Pro access сонго.
            </p>
          </div>

          <form className="mt-8 flex max-w-xl gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-200" />
              <input
                name="search"
                defaultValue={sp.search}
                placeholder="Company хайх"
                className="w-full rounded-2xl border border-white/20 bg-white/15 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-violet-200 focus:ring-2 focus:ring-white/40"
              />
            </div>
            <button className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-violet-700 transition-colors hover:bg-violet-50">
              Search
            </button>
          </form>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          <Link href="/companies" className="shrink-0 rounded-full border border-violet-100 bg-white px-4 py-2 text-xs font-black text-violet-700">
            Бүгд
          </Link>
          {categories.map((category) => (
            <Link
              key={category}
              href={`/companies?category=${encodeURIComponent(category)}`}
              className="shrink-0 rounded-full border border-violet-100 bg-white px-4 py-2 text-xs font-black text-slate-600 transition-colors hover:bg-violet-50 hover:text-violet-700"
            >
              {category}
            </Link>
          ))}
        </div>

        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-slate-950">{companies.length} approved companies</p>
            <p className="text-xs text-slate-500">Each company owns course packages, lessons, certificates, and review flow.</p>
          </div>
          <div className="hidden items-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-bold text-violet-700 shadow-sm sm:flex">
            <Sparkles size={14} /> Free preview available
          </div>
        </div>

        {companies.length === 0 ? (
          <div className="rounded-3xl border border-violet-100 bg-white p-10 text-center">
            <p className="text-lg font-black text-slate-950">Company олдсонгүй</p>
            <p className="mt-2 text-sm text-slate-500">Approved company эсвэл course organization холбоос seed хийгдээгүй байна.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

