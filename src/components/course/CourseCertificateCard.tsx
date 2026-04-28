import Image from "next/image";
import Link from "next/link";

export function CourseCertificateCard() {
  return (
    <div className="bg-gradient-to-br from-[#F5F3FF] to-white rounded-2xl border border-[#E9DFFF] p-5 flex items-center gap-4">
      <div className="shrink-0">
        <Image
          src="/assets/mascot/mascot-certificate.png"
          alt="Сертификат"
          width={72}
          height={72}
          className="select-none drop-shadow-sm"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#0F172A] mb-1">
          Сертификат авах боломжтой
        </p>
        <p className="text-xs text-gray-500 leading-relaxed mb-3">
          Курсаа дуусгаад EduNity болон байгууллагын сертификат авна.
        </p>
        <Link
          href="/certificates"
          className="inline-block px-3.5 py-1.5 bg-transparent text-violet-600 border border-violet-300 text-xs font-semibold rounded-lg hover:bg-violet-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-1"
        >
          Сертификатын нөхцөл харах
        </Link>
      </div>
    </div>
  );
}
