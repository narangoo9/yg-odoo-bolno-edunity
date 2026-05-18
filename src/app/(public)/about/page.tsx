import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/layout/PublicPageShell";
import { PublicProse } from "@/components/layout/PublicProse";

export const metadata: Metadata = {
  title: "Бидний тухай — EduNity",
  description: "EduNity платформын зорилго, компани төслийн сургалт, peer review болон сертификатын систем.",
};

export default function AboutPage() {
  return (
    <PublicPageShell
      title="Бидний тухай"
      subtitle="Бодит компаниас суралцаж, төсөл хийж, peer review хүлээн авч, сертификат авах орчин."
    >
      <PublicProse>
        <h2>Эхлэл</h2>
        <p>
          EduNity нь суралцагчдад зөвхөн видео үзэх биш — бодит ажлын туршлага, төсөл,
          хамтын үнэлгээ, баталгаажсан сертификат авах боломжийг нэг дор олгодог
          сургалтын платформ юм.
        </p>
        <h2>Компани төслийн сургалт</h2>
        <p>
          Байгууллагууд өөрсдийн мэргэжлийн контент, төсөл, даалгавар бүхий курсуудыг
          нийтэлж, суралцагчид бодит ажлын ур чадварыг хөгжүүлнэ.
        </p>
        <h2>Peer review</h2>
        <p>
          Суралцагчид хоорондоо ажлыг үнэлж, санал хүсэлт өгч, илүү гүнзгий суралцах
          соёл бүрдүүлнэ. Энэ нь зөвхөн шалгалт биш — хамтын хөгжлийн хэсэг.
        </p>
        <h2>Сертификат</h2>
        <p>
          Хичээл, даалгавар, төсөл, peer review-ийг биелүүлсний дараа баталгаажсан
          сертификат олгогдоно. Таны ахиц ил тод, шалгах боломжтой.
        </p>
        <p>
          <Link href="/register">Эхлэх →</Link> эсвэл <Link href="/courses">курсууд үзэх</Link>
        </p>
      </PublicProse>
    </PublicPageShell>
  );
}
