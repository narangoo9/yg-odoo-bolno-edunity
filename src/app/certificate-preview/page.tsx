import type { Metadata } from "next";
import { ScaledCertificate } from "@/components/certificate/ScaledCertificate";

export const metadata: Metadata = { title: "Certificate Preview — EduNity" };

// Demo page for the premium certificate template.
// Uses static props — no database required.
export default function CertificatePreviewPage() {
  return (
    <div className="min-h-screen bg-[#FAF8FF] py-10 px-4 flex flex-col items-center gap-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-[#181824]">EduNity Certificate Preview</h1>
        <p className="text-sm text-[#5B5870]">
          Premium certificate template — see how it looks with real data
        </p>
      </div>

      <div className="w-full max-w-5xl rounded-2xl border border-[#EEE7FF] bg-white shadow-lg overflow-hidden p-4">
        <ScaledCertificate
          studentName="Nomingin Erdene"
          courseTitle="UI/UX Design Fundamentals"
          issuerName="Figma Academy"
          completedDate="April 30, 2026"
          certificateId="EDU-FIGMA-2026-000128"
          instructorName="Alex Morgan"
          instructorRole="Instructor"
          directorName="Sarah Johnson"
          directorRole="Head of Figma Academy"
          verificationUrl="https://edunity.mn/verify/EDU-FIGMA-2026-000128"
          platformLogo="/brand/logo-light-mode-removebg-preview.png"
          mascotImage="/assets/mascot/mascot-certificate.png"
        />
      </div>
    </div>
  );
}
