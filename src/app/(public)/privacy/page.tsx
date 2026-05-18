import type { Metadata } from "next";
import { PublicPageShell } from "@/components/layout/PublicPageShell";
import { PublicProse } from "@/components/layout/PublicProse";

export const metadata: Metadata = { title: "Нууцлалын бодлого — EduNity" };

export default function PrivacyPage() {
  return (
    <PublicPageShell
      title="Нууцлалын бодлого"
      subtitle="Таны мэдээллийг хэрхэн цуглуулж, ашиглаж, хамгаалдаг талаар."
    >
      <PublicProse>
        <h2>Цуглуулах мэдээлэл</h2>
        <p>
          Бүртгэл үүсгэх, нэвтрэх, суралцах явцад имэйл, нэр, суралцах ахиц, төлбөрийн
          мэдээлэл (төлбөрийн системээр боловсруулагдана) зэрэг мэдээлэл цуглагдана.
        </p>
        <h2>Нэвтрэлт</h2>
        <p>
          Имэйл/нууц үг болон Google OAuth зэрэг аргаар нэвтэрнэ. Session cookie ашиглан
          нэвтрэлтийг хадгална.
        </p>
        <h2>Cookie</h2>
        <p>
          Платформын ажиллагаа, theme, analytics зориулалтаар cookie ашиглаж болно.
        </p>
        <h2>Analytics</h2>
        <p>
          Үйлчилгээг сайжруулах зорилгоор ашиглалтын статистик цуглуулж болно. Хувийн
          мэдээллийг ил болгохгүй.
        </p>
        <h2>Төлбөр</h2>
        <p>
          Төлбөрийн мэдээллийг Stripe зэрэг PCI-д нийцсэн үйлчилгээгээр боловсруулна.
          EduNity картын бүрэн дугаарыг хадгалдаггүй.
        </p>
        <h2>Байршуулсан контент</h2>
        <p>
          Төсөл, даалгавар, chat мессеж зэрэг таны оруулсан контент суралцах зорилгоор
          хадгалагдана.
        </p>
        <h2>Таны эрх</h2>
        <p>
          Мэдээллээ засах, устгах, экспортлох хүсэлт илгээх эрхтэй.{" "}
          <a href="/support">Дэмжлэг</a>-тэй холбогдоно уу.
        </p>
      </PublicProse>
    </PublicPageShell>
  );
}
