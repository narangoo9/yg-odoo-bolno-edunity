import nodemailer from "nodemailer";
import type { Attachment } from "nodemailer/lib/mailer";
import { env } from "@/lib/env";

interface SendEmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
  attachments?: Attachment[];
}

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: false,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass,
  },
});

function readString(data: Record<string, unknown>, key: string) {
  const value = data[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

const templates: Record<string, (data: Record<string, unknown>) => { html: string; text: string }> = {
  "verify-email": (data) => ({
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:40px 24px">
        <h1 style="color:#1e293b;font-size:24px;margin-bottom:8px">Сайн байна уу, ${data.name}!</h1>
        <p style="color:#64748b;margin-bottom:24px">Имэйл хаягаа баталгаажуулахын тулд доорх товчийг дарна уу.</p>
        <a href="${data.verifyUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Баталгаажуулах</a>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">Холбоос 24 цагийн дотор хүчинтэй.</p>
      </div>`,
    text: `Имэйл баталгаажуулах холбоос: ${data.verifyUrl}`,
  }),

  "reset-password": (data) => ({
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:40px 24px">
        <h1 style="color:#1e293b;font-size:24px;margin-bottom:8px">Нууц үг сэргээх</h1>
        <p style="color:#64748b;margin-bottom:24px">Та нууц үг сэргээх хүсэлт илгээсэн байна.</p>
        <a href="${data.resetUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Нууц үг сэргээх</a>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">Холбоос 1 цагийн дотор хүчинтэй. Та хүсэлт илгээгээгүй бол энэ имэйлийг үл тоомсорлоно уу.</p>
      </div>`,
    text: `Нууц үг сэргээх холбоос: ${data.resetUrl}`,
  }),

  "enrollment-success": (data) => ({
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:40px 24px">
        <h1 style="color:#1e293b;font-size:24px;margin-bottom:8px">Бүртгэл амжилттай! 🎉</h1>
        <p style="color:#64748b;margin-bottom:8px">Та <strong>${data.courseTitle}</strong> курст амжилттай бүртгүүллээ.</p>
        <a href="${data.courseUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">Сурах эхлэх</a>
      </div>`,
    text: `Та "${data.courseTitle}" курст бүртгүүллээ. ${data.courseUrl}`,
  }),

  "org-invite": (data) => ({
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:40px 24px">
        <h1 style="color:#1e293b;font-size:24px;margin-bottom:8px">Байгууллагын урилга</h1>
        <p style="color:#64748b;margin-bottom:8px"><strong>${data.inviterName}</strong> таныг <strong>${data.orgName}</strong> байгууллагад ${data.role} эрхээр урьж байна.</p>
        <a href="${data.inviteUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">Урилгыг хүлээн авах</a>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">Урилга 7 хоногийн дотор хүчинтэй.</p>
      </div>`,
    text: `${data.orgName} байгууллагын урилга: ${data.inviteUrl}`,
  }),

  "certificate-ready": (data) => {
    const courseTitle = readString(data, "courseTitle") ?? "Сургалтын программ";
    const certUrl = readString(data, "certUrl");
    const viewUrl = readString(data, "viewUrl") ?? certUrl;
    const downloadUrl = readString(data, "downloadUrl");
    const verifyUrl = readString(data, "verifyUrl");
    const hasAttachment = data.hasAttachment === true;

    const quickActions = [
      downloadUrl
        ? `<a href="${downloadUrl}" style="display:inline-block;padding:10px 18px;border-radius:8px;background:#ede9fe;color:#6d28d9;text-decoration:none;font-weight:600">PDF татах</a>`
        : "",
      verifyUrl
        ? `<a href="${verifyUrl}" style="display:inline-block;padding:10px 18px;border-radius:8px;background:#f8fafc;color:#0f172a;text-decoration:none;font-weight:600;border:1px solid #e2e8f0">Баталгаажуулах</a>`
        : "",
    ]
      .filter(Boolean)
      .join("&nbsp;");

    const textParts = [
      `Сертификат бэлэн боллоо: ${courseTitle}`,
      viewUrl ? `Харах: ${viewUrl}` : null,
      downloadUrl ? `PDF татах: ${downloadUrl}` : null,
      verifyUrl ? `Баталгаажуулах: ${verifyUrl}` : null,
    ].filter(Boolean);

    return {
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:40px 24px">
          <h1 style="color:#1e293b;font-size:24px;margin-bottom:8px">Сертификат бэлэн боллоо! 🏆</h1>
          <p style="color:#64748b;margin-bottom:8px">Та <strong>${courseTitle}</strong> сургалтыг амжилттай дуусгасан байна.</p>
          <p style="color:#64748b;margin-bottom:20px">${
            hasAttachment
              ? `Имэйлд PDF хавсралт нэмсэн${verifyUrl || downloadUrl ? ", мөн доорх холбоосуудаар сертификатаа удирдаж болно." : "."}`
              : `Доорх холбоосуудаар сертификатаа нээж, татаж эсвэл баталгаажуулж болно.`
          }</p>
          ${
            viewUrl
              ? `<a href="${viewUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">Сертификат харах</a>`
              : ""
          }
          ${quickActions ? `<div style="margin-top:16px">${quickActions}</div>` : ""}
        </div>`,
      text: textParts.join("\n"),
    };
  },
};

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const template = templates[options.template];
  if (!template) throw new Error(`Email template "${options.template}" not found`);

  const { html, text } = template(options.data);

  await transporter.sendMail({
    from: env.smtpFrom ?? `"${env.appName}" <noreply@example.com>`,
    to: options.to,
    subject: options.subject,
    html,
    text,
    attachments: options.attachments,
  });
}
