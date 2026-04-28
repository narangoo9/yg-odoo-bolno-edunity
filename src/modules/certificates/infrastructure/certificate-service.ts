import { db } from "@/lib/db";
import QRCode from "qrcode";
import PDFDocument from "pdfkit";
import { getAppUrl } from "@/lib/app-url";

export async function getCertificateById(id: string) {
  return db.certificate.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, name: true, email: true } },
      course: {
        include: {
          instructor: { select: { id: true, name: true } },
          organization: { select: { id: true, name: true, logoUrl: true } },
        },
      },
      program: { select: { id: true, title: true, certificateTitle: true } },
      organization: { select: { id: true, name: true, logoUrl: true, website: true } },
    },
  });
}

export async function verifyCertificate(code: string) {
  return db.certificate.findUnique({
    where: { verificationCode: code },
    include: {
      student: { select: { name: true, email: true } },
      course: {
        include: {
          instructor: { select: { name: true } },
          organization: { select: { name: true, logoUrl: true } },
        },
      },
      program: { select: { title: true, certificateTitle: true } },
      organization: { select: { name: true, logoUrl: true } },
    },
  });
}

export async function getStudentCertificates(studentId: string) {
  return db.certificate.findMany({
    where: { studentId },
    orderBy: { issuedAt: "desc" },
    include: {
      organization: { select: { name: true, logoUrl: true } },
      program: { select: { title: true, certificateTitle: true } },
      course: {
        include: {
          instructor: { select: { name: true } },
        },
      },
    },
  });
}

// ─── PDF GENERATION ───────────────────────────────────────────────────────────

export async function generateCertificatePdf(certificateId: string): Promise<Buffer> {
  const cert = await getCertificateById(certificateId);
  if (!cert) throw new Error("Certificate not found");

  const appUrl = getAppUrl();
  const verifyUrl = `${appUrl}/verify/${cert.verificationCode}`;

  const qrPngBuffer = await QRCode.toBuffer(verifyUrl, {
    width: 120,
    margin: 1,
    type: "png",
    color: { dark: "#1e293b", light: "#ffffff" },
  });

  const meta = (cert.metadata as Record<string, string> | null) ?? {};
  const isProgram = !!cert.programId;
  const orgName = cert.organization?.name ?? meta.orgName ?? "ELearn Platform";
  const certTitle = isProgram
    ? (cert.program?.certificateTitle ?? cert.program?.title ?? "Сургалтын программ")
    : (cert.course?.title ?? meta.courseTitle ?? "Курс");
  const issuerName = orgName;
  const instructorName = cert.course?.instructor?.name ?? meta.instructorName ?? null;

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: [900, 636],
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = 900;
    const H = 636;
    const BORDER = 12;
    const INNER = 24;
    const GOLD = "#c9a84c";
    const DARK = "#1e293b";
    const MID = "#64748b";

    // Outer border
    doc.rect(0, 0, W, H).fill("#fff");
    doc.rect(0, 0, W, H).lineWidth(BORDER).stroke(DARK);
    doc.rect(INNER, INNER, W - INNER * 2, H - INNER * 2).lineWidth(2).stroke(GOLD);

    // Watermark pattern (diagonal lines)
    doc.save().opacity(0.03);
    for (let x = -H; x < W + H; x += 20) {
      doc.moveTo(x, 0).lineTo(x + H, H).lineWidth(1).stroke(DARK);
    }
    doc.restore();

    const centerX = W / 2;

    // Org name (top)
    doc.fontSize(11).fillColor(MID).font("Helvetica")
      .text(issuerName.toUpperCase(), 0, 55, { align: "center", width: W, characterSpacing: 3 });

    // "СЕРТИФИКАТ" heading
    doc.fontSize(44).fillColor(DARK).font("Helvetica-Bold")
      .text("СЕРТИФИКАТ", 0, 100, { align: "center", width: W });

    doc.fontSize(11).fillColor(MID).font("Helvetica")
      .text("CERTIFICATE OF COMPLETION", 0, 152, { align: "center", width: W, characterSpacing: 2 });

    // "This certifies that" line
    doc.fontSize(12).fillColor(MID).font("Helvetica")
      .text("Энэхүү сертификатыг дараах суралцагчид олгоно", 0, 200, { align: "center", width: W });

    // Student name
    const nameY = 228;
    doc.fontSize(34).fillColor(GOLD).font("Helvetica-Bold")
      .text(cert.student.name, 0, nameY, { align: "center", width: W });

    // Underline
    const nameWidth = Math.min(cert.student.name.length * 21, 500);
    doc.moveTo(centerX - nameWidth / 2, nameY + 44)
      .lineTo(centerX + nameWidth / 2, nameY + 44)
      .lineWidth(1.5).stroke(GOLD);

    // Course/program title
    doc.fontSize(12).fillColor(MID).font("Helvetica")
      .text(isProgram ? "сургалтын программыг амжилттай дүүргэсэн" : "курсийг амжилттай дүүргэсэн", 0, nameY + 56, { align: "center", width: W });

    doc.fontSize(16).fillColor(DARK).font("Helvetica-Bold")
      .text(`"${certTitle}"`, 0, nameY + 78, { align: "center", width: W });

    // Bottom section: signature + QR + date
    const bottomY = H - 120;
    const signLineW = 160;

    // Left: instructor or org signature
    const leftX = 100;
    doc.moveTo(leftX, bottomY).lineTo(leftX + signLineW, bottomY).lineWidth(1).stroke(DARK);
    if (instructorName) {
      doc.fontSize(11).fillColor(DARK).font("Helvetica-Bold")
        .text(instructorName, leftX - 10, bottomY + 5, { width: signLineW + 20, align: "center" });
      doc.fontSize(9).fillColor(MID).font("Helvetica")
        .text("Багш / Instructor", leftX - 10, bottomY + 20, { width: signLineW + 20, align: "center" });
    } else {
      doc.fontSize(11).fillColor(DARK).font("Helvetica-Bold")
        .text(issuerName, leftX - 10, bottomY + 5, { width: signLineW + 20, align: "center" });
      doc.fontSize(9).fillColor(MID).font("Helvetica")
        .text("Байгууллага / Issuer", leftX - 10, bottomY + 20, { width: signLineW + 20, align: "center" });
    }

    // Center: QR code
    const qrX = centerX - 45;
    const qrY = bottomY - 50;
    doc.image(qrPngBuffer, qrX, qrY, { width: 90, height: 90 });
    doc.fontSize(8).fillColor(MID).font("Helvetica")
      .text(cert.certificateNo, 0, qrY + 94, { align: "center", width: W });

    // Right: date
    const rightX = W - 100 - signLineW;
    const formattedDate = new Intl.DateTimeFormat("mn-MN", {
      year: "numeric", month: "long", day: "numeric",
    }).format(cert.issuedAt);
    doc.moveTo(rightX, bottomY).lineTo(rightX + signLineW, bottomY).lineWidth(1).stroke(DARK);
    doc.fontSize(11).fillColor(DARK).font("Helvetica-Bold")
      .text(formattedDate, rightX - 10, bottomY + 5, { width: signLineW + 20, align: "center" });
    doc.fontSize(9).fillColor(MID).font("Helvetica")
      .text("Огноо / Date", rightX - 10, bottomY + 20, { width: signLineW + 20, align: "center" });

    doc.end();
  });
}

// ─── HTML PREVIEW (for share page / OG) ──────────────────────────────────────

export async function buildCertificateHtml(certificateId: string): Promise<string> {
  const cert = await getCertificateById(certificateId);
  if (!cert) throw new Error("Certificate not found");

  const appUrl = getAppUrl();
  const verifyUrl = `${appUrl}/verify/${cert.verificationCode}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 120, margin: 1, color: { dark: "#1e293b", light: "#ffffff" },
  });

  const meta = (cert.metadata as Record<string, string> | null) ?? {};
  const isProgram = !!cert.programId;
  const orgName = cert.organization?.name ?? meta.orgName ?? "ELearn Platform";
  const certTitle = isProgram
    ? (cert.program?.certificateTitle ?? cert.program?.title ?? "Сургалтын программ")
    : (cert.course?.title ?? meta.courseTitle ?? "Курс");
  const instructorName = cert.course?.instructor?.name ?? meta.instructorName;
  const formattedDate = new Intl.DateTimeFormat("mn-MN", {
    year: "numeric", month: "long", day: "numeric",
  }).format(cert.issuedAt);

  return `<!DOCTYPE html>
<html lang="mn">
<head>
<meta charset="UTF-8">
<meta property="og:title" content="${cert.student.name} — ${certTitle}" />
<meta property="og:description" content="${orgName} байгууллагын сертификат" />
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:900px;height:636px;background:#fff;font-family:Arial,sans-serif}
  .cert{width:100%;height:100%;border:12px solid #1e293b;padding:40px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;position:relative}
  .cert::before{content:'';position:absolute;inset:24px;border:2px solid #c9a84c;pointer-events:none}
  .headline{font-size:42px;font-weight:700;color:#1e293b;text-align:center}
  .sub{font-size:11px;color:#64748b;letter-spacing:3px;text-transform:uppercase}
  .name{font-size:34px;color:#c9a84c;font-weight:700;border-bottom:2px solid #c9a84c;padding:0 40px 8px}
  .course-title{font-size:16px;color:#1e293b;font-weight:600;text-align:center;max-width:600px}
  .meta{display:flex;gap:60px;align-items:flex-end}
  .sign-block{text-align:center}
  .sign-line{width:180px;border-top:1px solid #1e293b;margin-bottom:4px}
  .sign-label{font-size:9px;color:#64748b;letter-spacing:1px}
</style>
</head>
<body>
<div class="cert">
  <div class="sub">${orgName}</div>
  <div style="text-align:center">
    <div class="headline">Сертификат</div>
    <div class="sub" style="margin-top:4px">Certificate of Completion</div>
  </div>
  <div style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px">
    <p style="font-size:13px;color:#64748b">Энэхүү сертификатыг</p>
    <div class="name">${cert.student.name}</div>
    <p style="font-size:13px;color:#64748b">${isProgram ? "сургалтын программыг" : "курсийг"} амжилттай дүүргэсний гэрчилгээ болгон олгоно</p>
    <div class="course-title">"${certTitle}"</div>
  </div>
  <div class="meta">
    <div class="sign-block">
      <div class="sign-line"></div>
      <div style="font-size:12px;font-weight:600;color:#1e293b">${instructorName ?? orgName}</div>
      <div class="sign-label">${instructorName ? "Багш" : "Байгууллага"}</div>
    </div>
    <div style="text-align:center">
      <img src="${qrDataUrl}" width="80" height="80" alt="QR" />
      <div style="font-size:8px;color:#94a3b8;margin-top:4px">${cert.certificateNo}</div>
    </div>
    <div class="sign-block">
      <div class="sign-line"></div>
      <div style="font-size:12px;font-weight:600;color:#1e293b">${formattedDate}</div>
      <div class="sign-label">Огноо</div>
    </div>
  </div>
</div>
</body>
</html>`;
}
