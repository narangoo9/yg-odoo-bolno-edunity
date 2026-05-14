"use client";

import { useRef, useCallback } from "react";
import Image from "next/image";

export interface CertificateTemplateProps {
  studentName: string;
  courseTitle: string;
  issuerName: string;
  issuerLogo?: string;
  completedDate: string;
  certificateId: string;
  instructorName: string;
  instructorSignature?: string;
  instructorRole: string;
  directorName: string;
  directorSignature?: string;
  directorRole: string;
  verificationUrl: string;
  qrCodeUrl?: string;
  platformLogo?: string;
  mascotImage?: string;
  /** Pass false to hide the download buttons (e.g. when embedding inside ScaledCertificate) */
  showButtons?: boolean;
}

// ── SVG Decorative Pieces ────────────────────────────────────────────────────

function CornerOrnament({ flip }: { flip?: boolean }) {
  return (
    <svg
      width="90"
      height="90"
      viewBox="0 0 90 90"
      fill="none"
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
    >
      <path d="M2 2 L30 2 L2 30 Z" fill="#4B1FA6" opacity="0.9" />
      <path d="M2 2 L18 2 L2 18 Z" fill="#C99A3D" opacity="0.85" />
      <path d="M2 2 L22 2" stroke="#C99A3D" strokeWidth="1.5" />
      <path d="M2 2 L2 22" stroke="#C99A3D" strokeWidth="1.5" />
      <circle cx="30" cy="2" r="2.5" fill="#C99A3D" />
      <circle cx="2" cy="30" r="2.5" fill="#C99A3D" />
      <path
        d="M8 2 Q12 8 8 14 Q12 20 8 26"
        stroke="#6D35D4"
        strokeWidth="1"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M2 8 Q8 12 14 8 Q20 12 26 8"
        stroke="#6D35D4"
        strokeWidth="1"
        fill="none"
        opacity="0.6"
      />
      <circle cx="38" cy="2" r="1.5" fill="#C99A3D" opacity="0.5" />
      <circle cx="2" cy="38" r="1.5" fill="#C99A3D" opacity="0.5" />
      <path d="M44 2 L46 4 L44 6 L42 4 Z" fill="#C99A3D" opacity="0.4" />
      <path d="M2 44 L4 46 L6 44 L4 42 Z" fill="#C99A3D" opacity="0.4" />
    </svg>
  );
}

function CornerOrnamentBottom({ flip }: { flip?: boolean }) {
  return (
    <svg
      width="90"
      height="90"
      viewBox="0 0 90 90"
      fill="none"
      style={{ transform: `scaleY(-1)${flip ? " scaleX(-1)" : ""}` }}
    >
      <path d="M2 2 L30 2 L2 30 Z" fill="#4B1FA6" opacity="0.9" />
      <path d="M2 2 L18 2 L2 18 Z" fill="#C99A3D" opacity="0.85" />
      <path d="M2 2 L22 2" stroke="#C99A3D" strokeWidth="1.5" />
      <path d="M2 2 L2 22" stroke="#C99A3D" strokeWidth="1.5" />
      <circle cx="30" cy="2" r="2.5" fill="#C99A3D" />
      <circle cx="2" cy="30" r="2.5" fill="#C99A3D" />
      <path
        d="M8 2 Q12 8 8 14 Q12 20 8 26"
        stroke="#6D35D4"
        strokeWidth="1"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M2 8 Q8 12 14 8 Q20 12 26 8"
        stroke="#6D35D4"
        strokeWidth="1"
        fill="none"
        opacity="0.6"
      />
      <circle cx="38" cy="2" r="1.5" fill="#C99A3D" opacity="0.5" />
      <circle cx="2" cy="38" r="1.5" fill="#C99A3D" opacity="0.5" />
    </svg>
  );
}

function CenterOrnament() {
  return (
    <svg width="80" height="28" viewBox="0 0 80 28" fill="none">
      <path d="M40 2 L43 8 L40 6 L37 8 Z" fill="#C99A3D" />
      <path d="M40 14 L43 8 L40 10 L37 8 Z" fill="#C99A3D" />
      <circle cx="40" cy="8" r="2" fill="#C99A3D" />
      <path d="M40 2 L40 14" stroke="#C99A3D" strokeWidth="1.5" />
      <path d="M28 8 Q34 5 40 8 Q46 5 52 8" stroke="#C99A3D" strokeWidth="1" fill="none" />
      <path d="M16 12 Q22 9 28 12 Q34 9 40 12 Q46 9 52 12 Q58 9 64 12" stroke="#C99A3D" strokeWidth="0.8" fill="none" opacity="0.6" />
      <circle cx="14" cy="12" r="2" fill="#C99A3D" opacity="0.7" />
      <circle cx="66" cy="12" r="2" fill="#C99A3D" opacity="0.7" />
      <path d="M2 16 L14 12" stroke="#C99A3D" strokeWidth="0.8" opacity="0.5" />
      <path d="M78 16 L66 12" stroke="#C99A3D" strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}

function DiamondDivider() {
  return (
    <div className="flex items-center gap-3 w-full max-w-lg mx-auto my-1">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#C99A3D]" />
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 0 L12 6 L6 12 L0 6 Z" fill="#C99A3D" />
      </svg>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#C99A3D]" />
    </div>
  );
}

function SparkleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 0 L9 7 L16 8 L9 9 L8 16 L7 9 L0 8 L7 7 Z" fill="#C99A3D" opacity="0.7" />
    </svg>
  );
}

function SmallSparkle({ size = 8 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" fill="none">
      <path d="M4 0 L4.5 3.5 L8 4 L4.5 4.5 L4 8 L3.5 4.5 L0 4 L3.5 3.5 Z" fill="#B99CFF" opacity="0.8" />
    </svg>
  );
}

function VerifiedSeal() {
  return (
    <svg width="120" height="150" viewBox="0 0 120 150" fill="none">
      {/* Ribbon tails */}
      <path d="M38 108 L28 148 L60 132 L92 148 L82 108 Z" fill="#4B1FA6" />
      <path d="M28 148 L40 128 L60 132 Z" fill="#3A1580" />
      <path d="M92 148 L80 128 L60 132 Z" fill="#3A1580" />
      {/* Laurel leaves left */}
      <ellipse cx="18" cy="72" rx="8" ry="4" fill="#C99A3D" opacity="0.9" transform="rotate(-40 18 72)" />
      <ellipse cx="12" cy="60" rx="8" ry="4" fill="#C99A3D" opacity="0.85" transform="rotate(-55 12 60)" />
      <ellipse cx="11" cy="47" rx="8" ry="4" fill="#C99A3D" opacity="0.8" transform="rotate(-70 11 47)" />
      <ellipse cx="14" cy="35" rx="7" ry="3.5" fill="#C99A3D" opacity="0.75" transform="rotate(-85 14 35)" />
      <ellipse cx="21" cy="24" rx="7" ry="3.5" fill="#C99A3D" opacity="0.7" transform="rotate(-100 21 24)" />
      {/* Laurel leaves right */}
      <ellipse cx="102" cy="72" rx="8" ry="4" fill="#C99A3D" opacity="0.9" transform="rotate(40 102 72)" />
      <ellipse cx="108" cy="60" rx="8" ry="4" fill="#C99A3D" opacity="0.85" transform="rotate(55 108 60)" />
      <ellipse cx="109" cy="47" rx="8" ry="4" fill="#C99A3D" opacity="0.8" transform="rotate(70 109 47)" />
      <ellipse cx="106" cy="35" rx="7" ry="3.5" fill="#C99A3D" opacity="0.75" transform="rotate(85 106 35)" />
      <ellipse cx="99" cy="24" rx="7" ry="3.5" fill="#C99A3D" opacity="0.7" transform="rotate(100 99 24)" />
      {/* Outer gold ring */}
      <circle cx="60" cy="58" r="50" fill="#C99A3D" />
      {/* Main purple circle */}
      <circle cx="60" cy="58" r="46" fill="#4B1FA6" />
      {/* Inner ring */}
      <circle cx="60" cy="58" r="40" fill="none" stroke="#C99A3D" strokeWidth="1.5" />
      <circle cx="60" cy="58" r="36" fill="none" stroke="#C99A3D" strokeWidth="0.5" opacity="0.5" />
      {/* Shield icon */}
      <path
        d="M60 36 L75 43 L75 58 Q75 70 60 78 Q45 70 45 58 L45 43 Z"
        fill="none"
        stroke="#C99A3D"
        strokeWidth="2"
      />
      <path
        d="M60 36 L75 43 L75 58 Q75 70 60 78 Q45 70 45 58 L45 43 Z"
        fill="#3A1580"
        opacity="0.5"
      />
      {/* Checkmark */}
      <path d="M52 57 L57 63 L68 50" stroke="#C99A3D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Text VERIFIED BY */}
      <text x="60" y="88" textAnchor="middle" fill="#EEE7FF" fontSize="7" fontFamily="Poppins, sans-serif" fontWeight="600" letterSpacing="1.5">
        VERIFIED BY
      </text>
      {/* Text EDUNITY */}
      <text x="60" y="100" textAnchor="middle" fill="#C99A3D" fontSize="9" fontFamily="Poppins, sans-serif" fontWeight="700" letterSpacing="2">
        EDUNITY
      </text>
    </svg>
  );
}

function BackgroundWaves() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1600 1000"
      fill="none"
      preserveAspectRatio="none"
      style={{ pointerEvents: "none" }}
    >
      {/* Bottom left purple wave block */}
      <path
        d="M0 820 Q80 780 160 820 Q240 860 320 820 Q400 780 480 820 L480 1000 L0 1000 Z"
        fill="#4B1FA6"
        opacity="0.85"
      />
      <path
        d="M0 850 Q100 810 200 850 Q300 890 400 850 Q500 810 600 850 L600 1000 L0 1000 Z"
        fill="#6D35D4"
        opacity="0.5"
      />
      {/* Bottom right purple wave block */}
      <path
        d="M1120 820 Q1200 780 1280 820 Q1360 860 1440 820 Q1520 780 1600 820 L1600 1000 L1120 1000 Z"
        fill="#4B1FA6"
        opacity="0.85"
      />
      <path
        d="M1000 850 Q1100 810 1200 850 Q1300 890 1400 850 Q1500 810 1600 850 L1600 1000 L1000 1000 Z"
        fill="#6D35D4"
        opacity="0.5"
      />
      {/* Right side abstract wave lines */}
      <path
        d="M1350 100 Q1450 200 1380 350 Q1310 500 1450 620 Q1550 700 1500 820"
        stroke="#B99CFF"
        strokeWidth="2"
        fill="none"
        opacity="0.3"
      />
      <path
        d="M1420 80 Q1530 180 1460 320 Q1390 460 1530 580 Q1600 640 1580 760"
        stroke="#B99CFF"
        strokeWidth="1.5"
        fill="none"
        opacity="0.2"
      />
      <path
        d="M1480 60 Q1580 160 1520 300"
        stroke="#B99CFF"
        strokeWidth="1"
        fill="none"
        opacity="0.15"
      />
      {/* Top subtle wave accents */}
      <path
        d="M900 0 Q1000 40 1100 20 Q1200 0 1300 30"
        stroke="#C99A3D"
        strokeWidth="1"
        fill="none"
        opacity="0.15"
      />
      {/* Bottom center gold accent curves */}
      <path
        d="M450 960 Q600 930 750 960 Q900 990 1050 960 Q1150 940 1200 960"
        stroke="#C99A3D"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M500 980 Q650 955 800 980 Q950 1005 1100 980"
        stroke="#C99A3D"
        strokeWidth="1"
        fill="none"
        opacity="0.3"
      />
      {/* Subtle diagonal grid lines (background texture) */}
      {[...Array(8)].map((_, i) => (
        <line
          key={i}
          x1={200 + i * 150}
          y1={0}
          x2={200 + i * 150 + 400}
          y2={1000}
          stroke="#B99CFF"
          strokeWidth="0.5"
          opacity="0.04"
        />
      ))}
    </svg>
  );
}

function QRPlaceholder() {
  // Simple QR-like grid for visual placeholder
  const cells: { row: number; col: number }[] = [];
  const pattern = [
    [1,1,1,1,1,1,1,0,1,0,0,1,0,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,1,1,0,0,1,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,0,0,1,0,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,0,1,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,0,0,1,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,1,0,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0],
    [1,1,0,1,0,1,1,0,0,0,1,0,1,0,1,0,1,0,0,1,0],
    [0,1,0,0,1,0,0,1,0,1,0,1,0,1,0,0,1,0,1,0,1],
    [1,0,1,0,0,1,1,0,1,0,0,0,1,0,1,1,0,1,0,1,0],
    [0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0],
    [1,1,1,1,1,1,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1],
    [1,0,0,0,0,0,1,0,1,0,0,0,1,0,0,0,1,0,1,0,0],
    [1,0,1,1,1,0,1,0,0,1,1,0,0,0,1,0,0,1,0,1,0],
    [1,0,1,1,1,0,1,0,1,0,0,1,0,0,0,1,0,0,1,0,1],
    [1,0,1,1,1,0,1,0,0,0,1,0,1,0,1,0,1,0,0,0,0],
    [1,0,0,0,0,0,1,0,1,1,0,0,0,0,0,1,0,1,0,1,0],
    [1,1,1,1,1,1,1,0,0,0,1,0,1,0,1,0,1,0,1,0,1],
  ];
  pattern.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell) cells.push({ row: r, col: c });
    });
  });
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      {cells.map(({ row, col }) => (
        <rect
          key={`${row}-${col}`}
          x={col * (96 / 21) + 0.5}
          y={row * (96 / 19) + 0.5}
          width={96 / 21 - 1}
          height={96 / 19 - 1}
          fill="#1e293b"
          rx="0.5"
        />
      ))}
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CertificateTemplate({
  studentName,
  courseTitle,
  issuerName,
  issuerLogo,
  completedDate,
  certificateId,
  instructorName,
  instructorSignature,
  instructorRole,
  directorName,
  directorSignature,
  directorRole,
  verificationUrl,
  qrCodeUrl,
  platformLogo,
  mascotImage,
  showButtons = true,
}: CertificateTemplateProps) {
  const certRef = useRef<HTMLDivElement>(null);

  const handleDownloadPNG = useCallback(async () => {
    if (!certRef.current) return;
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(certRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: certRef.current.scrollWidth,
      height: certRef.current.scrollHeight,
    });
    const link = document.createElement("a");
    link.download = `certificate-${certificateId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [certificateId]);

  const handleDownloadPDF = useCallback(async () => {
    if (!certRef.current) return;
    const { default: html2canvas } = await import("html2canvas");
    const { jsPDF } = await import("jspdf");
    const canvas = await html2canvas(certRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: certRef.current.scrollWidth,
      height: certRef.current.scrollHeight,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [1600, 1000] });
    pdf.addImage(imgData, "PNG", 0, 0, 1600, 1000);
    pdf.save(`certificate-${certificateId}.pdf`);
  }, [certificateId]);

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* ── Certificate Canvas ── */}
      <div
        ref={certRef}
        className="relative overflow-hidden bg-white select-none"
        style={{
          width: "1600px",
          height: "1000px",
          fontFamily: "'Poppins', 'Geist Sans', system-ui, sans-serif",
          transformOrigin: "top left",
        }}
      >
        {/* Background decoration layer */}
        <BackgroundWaves />

        {/* Outer border */}
        <div
          className="absolute inset-0"
          style={{
            border: "10px solid #4B1FA6",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
        {/* Second border */}
        <div
          className="absolute"
          style={{
            inset: "16px",
            border: "1.5px solid #B99CFF",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
        {/* Dotted inner border */}
        <div
          className="absolute"
          style={{
            inset: "22px",
            border: "1px dashed #D4C4FF",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />

        {/* Corner ornaments */}
        <div className="absolute top-0 left-0" style={{ zIndex: 2 }}>
          <CornerOrnament />
        </div>
        <div className="absolute top-0 right-0" style={{ zIndex: 2, transform: "scaleX(-1)" }}>
          <CornerOrnament />
        </div>
        <div className="absolute bottom-0 left-0" style={{ zIndex: 2, transform: "scaleY(-1)" }}>
          <CornerOrnament />
        </div>
        <div className="absolute bottom-0 right-0" style={{ zIndex: 2, transform: "scale(-1,-1)" }}>
          <CornerOrnament />
        </div>

        {/* Sparkle decorations */}
        <div className="absolute" style={{ top: 55, left: 220, zIndex: 3 }}><SparkleIcon size={14} /></div>
        <div className="absolute" style={{ top: 38, left: 560, zIndex: 3 }}><SmallSparkle size={10} /></div>
        <div className="absolute" style={{ top: 60, right: 320, zIndex: 3 }}><SparkleIcon size={12} /></div>
        <div className="absolute" style={{ top: 35, right: 580, zIndex: 3 }}><SmallSparkle size={8} /></div>
        <div className="absolute" style={{ top: 200, left: 120, zIndex: 3 }}><SmallSparkle size={9} /></div>
        <div className="absolute" style={{ top: 340, left: 90, zIndex: 3 }}><SparkleIcon size={11} /></div>
        <div className="absolute" style={{ top: 260, right: 200, zIndex: 3 }}><SmallSparkle size={8} /></div>
        <div className="absolute" style={{ bottom: 120, left: 400, zIndex: 3 }}><SmallSparkle size={10} /></div>
        <div className="absolute" style={{ bottom: 80, right: 500, zIndex: 3 }}><SparkleIcon size={13} /></div>
        <div className="absolute" style={{ top: 440, left: 105, zIndex: 3 }}><SmallSparkle size={7} /></div>
        <div className="absolute" style={{ top: 500, right: 225, zIndex: 3 }}><SmallSparkle size={9} /></div>

        {/* Mascot watermark */}
        <div
          className="absolute"
          style={{
            left: -40,
            top: "50%",
            transform: "translateY(-50%)",
            opacity: 0.1,
            zIndex: 2,
            width: 520,
            height: 520,
            pointerEvents: "none",
          }}
        >
          {mascotImage ? (
            <Image
              src={mascotImage}
              alt=""
              width={520}
              height={520}
              style={{ objectFit: "contain" }}
            />
          ) : (
            /* Fallback: simple mascot SVG silhouette */
            <svg viewBox="0 0 200 220" fill="none" width="520" height="520">
              {/* Graduation cap */}
              <ellipse cx="100" cy="55" rx="48" ry="8" fill="#4B1FA6" />
              <rect x="52" y="48" width="96" height="10" rx="3" fill="#4B1FA6" />
              <rect x="88" y="30" width="24" height="28" rx="4" fill="#4B1FA6" />
              <rect x="82" y="26" width="36" height="10" rx="3" fill="#4B1FA6" />
              <line x1="148" y1="55" x2="158" y2="75" stroke="#4B1FA6" strokeWidth="3" />
              <circle cx="158" cy="80" r="5" fill="#4B1FA6" />
              {/* Head */}
              <ellipse cx="100" cy="110" rx="46" ry="52" fill="#6D35D4" />
              {/* Eyes */}
              <ellipse cx="83" cy="98" rx="10" ry="11" fill="white" />
              <ellipse cx="117" cy="98" rx="10" ry="11" fill="white" />
              <circle cx="86" cy="100" r="6" fill="#1e293b" />
              <circle cx="120" cy="100" r="6" fill="#1e293b" />
              <circle cx="88" cy="97" r="2" fill="white" />
              <circle cx="122" cy="97" r="2" fill="white" />
              {/* Wink right eye */}
              <path d="M111 97 Q117 92 123 97" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              {/* Smile */}
              <path d="M82 118 Q100 132 118 118" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              {/* Body */}
              <ellipse cx="100" cy="185" rx="52" ry="42" fill="#6D35D4" />
              {/* Diploma/scroll */}
              <rect x="112" y="158" width="32" height="22" rx="4" fill="white" opacity="0.9" />
              <line x1="116" y1="165" x2="140" y2="165" stroke="#C99A3D" strokeWidth="1.5" />
              <line x1="116" y1="170" x2="140" y2="170" stroke="#C99A3D" strokeWidth="1.5" />
              <line x1="116" y1="175" x2="134" y2="175" stroke="#C99A3D" strokeWidth="1.5" />
            </svg>
          )}
        </div>

        {/* QR verification block — positioned absolutely on the right */}
        <div
          className="absolute"
          style={{
            right: 52,
            top: "50%",
            transform: "translateY(-52%)",
            zIndex: 10,
            width: 158,
          }}
        >
          <div
            style={{
              border: "1.5px solid #C99A3D",
              borderRadius: 16,
              backgroundColor: "rgba(255,255,255,0.97)",
              padding: "14px 14px 12px",
              boxShadow: "0 4px 20px rgba(75,31,166,0.08)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <p
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 8,
                fontWeight: 700,
                color: "#C99A3D",
                letterSpacing: "1.5px",
                textAlign: "center",
                margin: 0,
              }}
            >
              VERIFY CERTIFICATE
            </p>
            <div
              style={{
                border: "1px solid #EEE7FF",
                borderRadius: 8,
                padding: 4,
                backgroundColor: "white",
              }}
            >
              {qrCodeUrl ? (
                <Image src={qrCodeUrl} alt="QR Code" width={96} height={96} />
              ) : (
                <QRPlaceholder />
              )}
            </div>
            <p
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 8,
                color: "#5B5870",
                textAlign: "center",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              Scan to verify
              <br />
              authenticity
            </p>
          </div>
        </div>

        {/* ── Main content area ── */}
        <div
          className="relative flex flex-col h-full"
          style={{ zIndex: 5, padding: "38px 230px 30px 52px" }}
        >
          {/* TOP ROW: EduNity brand | spacer | Issuer */}
          <div className="flex items-start justify-between w-full" style={{ marginBottom: 0 }}>
            {/* EduNity branding */}
            <div className="flex items-center gap-3" style={{ minWidth: 200 }}>
              {platformLogo ? (
                <Image src={platformLogo} alt="EduNity" width={52} height={52} style={{ objectFit: "contain" }} />
              ) : (
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: "linear-gradient(135deg, #6D35D4, #4B1FA6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                    {/* Robot/mascot head simplified */}
                    <ellipse cx="15" cy="18" rx="10" ry="10" fill="white" opacity="0.2" />
                    <rect x="7" y="12" width="16" height="13" rx="5" fill="white" opacity="0.9" />
                    <circle cx="11" cy="17" r="2.5" fill="#4B1FA6" />
                    <circle cx="19" cy="17" r="2.5" fill="#4B1FA6" />
                    <rect x="10" y="22" width="10" height="2" rx="1" fill="#4B1FA6" opacity="0.4" />
                    {/* Graduation cap */}
                    <ellipse cx="15" cy="11" rx="9" ry="2.5" fill="white" opacity="0.9" />
                    <rect x="6" y="9.5" width="18" height="3" rx="1.5" fill="white" opacity="0.9" />
                    <rect x="13" y="5" width="4" height="6" rx="1" fill="white" opacity="0.9" />
                    <line x1="24" y1="11" x2="26" y2="16" stroke="white" strokeWidth="1.5" opacity="0.9" />
                    <circle cx="26" cy="17" r="1.5" fill="#C99A3D" />
                  </svg>
                </div>
              )}
              <div>
                <p
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 700,
                    fontSize: 22,
                    color: "#181824",
                    margin: 0,
                    lineHeight: 1.1,
                  }}
                >
                  EduNity
                </p>
                <p
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: 10,
                    color: "#6D35D4",
                    margin: 0,
                    marginTop: 2,
                  }}
                >
                  Learn. Grow. Achieve.
                </p>
              </div>
            </div>

            {/* Top-right issuer block */}
            <div className="flex flex-col items-end" style={{ minWidth: 180 }}>
              <p
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 10,
                  color: "#5B5870",
                  margin: 0,
                  marginBottom: 6,
                  fontWeight: 500,
                  letterSpacing: "0.5px",
                }}
              >
                Issued by
              </p>
              <div className="flex items-center gap-2">
                {issuerLogo && (
                  <Image
                    src={issuerLogo}
                    alt={issuerName}
                    width={36}
                    height={36}
                    style={{ objectFit: "contain" }}
                  />
                )}
                <p
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 700,
                    fontSize: 20,
                    color: "#181824",
                    margin: 0,
                    lineHeight: 1.1,
                  }}
                >
                  {issuerName}
                </p>
              </div>
            </div>
          </div>

          {/* CENTER TITLE AREA */}
          <div className="flex flex-col items-center" style={{ marginTop: 10, gap: 0 }}>
            <CenterOrnament />

            {/* CERTIFICATE */}
            <h1
              style={{
                fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
                fontSize: 82,
                fontWeight: 800,
                letterSpacing: "10px",
                background: "linear-gradient(135deg, #4B1FA6 0%, #6D35D4 50%, #4B1FA6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                margin: 0,
                lineHeight: 1,
                marginTop: 4,
                textTransform: "uppercase",
              }}
            >
              CERTIFICATE
            </h1>

            {/* OF COMPLETION with gold lines */}
            <div className="flex items-center gap-4" style={{ marginTop: 6 }}>
              <div
                style={{
                  height: 1.5,
                  width: 90,
                  background: "linear-gradient(to right, transparent, #C99A3D)",
                }}
              />
              <p
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#6D35D4",
                  letterSpacing: "8px",
                  margin: 0,
                  textTransform: "uppercase",
                }}
              >
                OF COMPLETION
              </p>
              <div
                style={{
                  height: 1.5,
                  width: 90,
                  background: "linear-gradient(to left, transparent, #C99A3D)",
                }}
              />
            </div>

            {/* Presented to */}
            <p
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 13,
                color: "#5B5870",
                margin: 0,
                marginTop: 18,
                letterSpacing: "0.3px",
              }}
            >
              This certificate is proudly presented to
            </p>

            {/* Recipient name */}
            <h2
              style={{
                fontFamily: "'Great Vibes', cursive",
                fontSize: 72,
                color: "#4B1FA6",
                margin: 0,
                marginTop: 2,
                lineHeight: 1.15,
                fontWeight: 400,
              }}
            >
              {studentName}
            </h2>

            <DiamondDivider />

            {/* Course completion text */}
            <p
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 13,
                color: "#5B5870",
                margin: 0,
                marginTop: 4,
                letterSpacing: "0.3px",
              }}
            >
              for successfully completing the course
            </p>

            {/* Course title */}
            <h3
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 26,
                fontWeight: 700,
                color: "#181824",
                margin: 0,
                marginTop: 6,
                textAlign: "center",
                letterSpacing: "0.5px",
              }}
            >
              {courseTitle}
            </h3>

            {/* Metadata row */}
            <div
              className="flex items-center"
              style={{ marginTop: 20, gap: 0 }}
            >
              {/* Issued by */}
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    border: "1.5px solid #B99CFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M2 18 L2 8 L10 2 L18 8 L18 18 Z" stroke="#6D35D4" strokeWidth="1.5" fill="none" />
                    <rect x="7" y="11" width="6" height="7" rx="1" fill="#B99CFF" opacity="0.5" />
                    <rect x="4" y="8" width="12" height="3" rx="1" fill="#6D35D4" opacity="0.3" />
                    <circle cx="10" cy="6" r="1.5" fill="#6D35D4" opacity="0.5" />
                  </svg>
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: 10,
                      color: "#5B5870",
                      margin: 0,
                    }}
                  >
                    Issued by:
                  </p>
                  <p
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#6D35D4",
                      margin: 0,
                    }}
                  >
                    {issuerName}
                  </p>
                </div>
              </div>

              {/* Vertical divider */}
              <div
                style={{
                  width: 1,
                  height: 40,
                  backgroundColor: "#D4C4FF",
                  margin: "0 28px",
                  flexShrink: 0,
                }}
              />

              {/* Completed on */}
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    border: "1.5px solid #B99CFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="2" y="4" width="16" height="14" rx="2" stroke="#6D35D4" strokeWidth="1.5" fill="none" />
                    <line x1="6" y1="2" x2="6" y2="6" stroke="#6D35D4" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="14" y1="2" x2="14" y2="6" stroke="#6D35D4" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="2" y1="8" x2="18" y2="8" stroke="#B99CFF" strokeWidth="1" />
                    <rect x="5" y="10" width="3" height="3" rx="0.5" fill="#B99CFF" />
                    <rect x="8.5" y="10" width="3" height="3" rx="0.5" fill="#6D35D4" opacity="0.5" />
                    <rect x="12" y="10" width="3" height="3" rx="0.5" fill="#B99CFF" />
                    <rect x="5" y="14" width="3" height="2" rx="0.5" fill="#B99CFF" opacity="0.5" />
                  </svg>
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: 10,
                      color: "#5B5870",
                      margin: 0,
                    }}
                  >
                    Completed on:
                  </p>
                  <p
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#6D35D4",
                      margin: 0,
                    }}
                  >
                    {completedDate}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION: Signatures + Seal */}
          <div
            className="flex items-end justify-between w-full"
            style={{ marginTop: "auto", paddingTop: 12 }}
          >
            {/* Left signature: Instructor */}
            <div className="flex flex-col items-center" style={{ width: 200 }}>
              <p
                style={{
                  fontFamily: "'Great Vibes', cursive",
                  fontSize: 38,
                  color: "#181824",
                  margin: 0,
                  lineHeight: 1.1,
                }}
              >
                {instructorSignature ?? instructorName}
              </p>
              <div
                style={{
                  width: 180,
                  height: 1.5,
                  backgroundColor: "#6D35D4",
                  marginTop: 6,
                  marginBottom: 6,
                }}
              />
              <p
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  color: "#181824",
                  margin: 0,
                }}
              >
                {instructorName}
              </p>
              <p
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 11,
                  color: "#5B5870",
                  margin: 0,
                  marginTop: 2,
                }}
              >
                {instructorRole}
              </p>
            </div>

            {/* Center: Verified seal */}
            <div className="flex flex-col items-center" style={{ marginBottom: -14 }}>
              <VerifiedSeal />
            </div>

            {/* Right signature: Director */}
            <div className="flex flex-col items-center" style={{ width: 200 }}>
              <p
                style={{
                  fontFamily: "'Great Vibes', cursive",
                  fontSize: 38,
                  color: "#181824",
                  margin: 0,
                  lineHeight: 1.1,
                }}
              >
                {directorSignature ?? directorName}
              </p>
              <div
                style={{
                  width: 180,
                  height: 1.5,
                  backgroundColor: "#6D35D4",
                  marginTop: 6,
                  marginBottom: 6,
                }}
              />
              <p
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  color: "#181824",
                  margin: 0,
                }}
              >
                {directorName}
              </p>
              <p
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 11,
                  color: "#5B5870",
                  margin: 0,
                  marginTop: 2,
                }}
              >
                {directorRole}
              </p>
            </div>
          </div>

          {/* VERY BOTTOM: Cert ID + Verification text */}
          <div
            className="flex items-center justify-between w-full"
            style={{ marginTop: 14 }}
          >
            {/* Certificate ID pill */}
            <div
              style={{
                border: "1px solid #B99CFF",
                borderRadius: 999,
                backgroundColor: "white",
                padding: "5px 18px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <p
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 10,
                  color: "#181824",
                  margin: 0,
                  fontWeight: 500,
                }}
              >
                Certificate ID:{" "}
                <span style={{ fontWeight: 700, fontFamily: "monospace", color: "#4B1FA6" }}>
                  {certificateId}
                </span>
              </p>
            </div>

            {/* Bottom-right verification text */}
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  backgroundColor: "#EEE7FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 0 L11 2.5 L11 7 Q11 10.5 6 12 Q1 10.5 1 7 L1 2.5 Z" fill="#6D35D4" />
                  <path d="M3.5 6 L5 7.5 L8.5 4" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#4B1FA6",
                    margin: 0,
                  }}
                >
                  Verified and secured by EduNity
                </p>
                <p
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: 9,
                    color: "#5B5870",
                    margin: 0,
                  }}
                >
                  Building skills. Building futures.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Export Buttons (outside the certificate) ── */}
      {showButtons ? <div className="flex items-center gap-3">
        <button
          onClick={handleDownloadPNG}
          style={{
            fontFamily: "'Poppins', sans-serif",
            backgroundColor: "#4B1FA6",
            color: "white",
            border: "none",
            borderRadius: 10,
            padding: "10px 24px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 4px 14px rgba(75,31,166,0.3)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1 L8 11 M4 8 L8 12 L12 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 14 L14 14" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Download as PNG
        </button>
        <button
          onClick={handleDownloadPDF}
          style={{
            fontFamily: "'Poppins', sans-serif",
            backgroundColor: "white",
            color: "#4B1FA6",
            border: "2px solid #B99CFF",
            borderRadius: 10,
            padding: "10px 24px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="1" width="12" height="14" rx="2" stroke="#4B1FA6" strokeWidth="1.5" fill="none" />
            <path d="M5 6 L11 6 M5 9 L11 9 M5 12 L8 12" stroke="#4B1FA6" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M9 1 L9 5 L13 5" stroke="#4B1FA6" strokeWidth="1.2" fill="none" />
          </svg>
          Download as PDF
        </button>
      </div> : null}
    </div>
  );
}
