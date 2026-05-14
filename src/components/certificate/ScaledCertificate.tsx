"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { CertificateTemplate, type CertificateTemplateProps } from "./CertificateTemplate";

interface ScaledCertificateProps extends Omit<CertificateTemplateProps, "showButtons"> {
  maxWidth?: number;
}

/**
 * Renders CertificateTemplate at a scale that fits within maxWidth.
 * Keeps a hidden full-size copy in the DOM for crisp PNG/PDF exports.
 */
export function ScaledCertificate({ maxWidth = 960, ...props }: ScaledCertificateProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(maxWidth / 1600);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? maxWidth;
      setScale(Math.min(width, maxWidth) / 1600);
    });
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [maxWidth]);

  const scaledHeight = 1000 * scale;

  const handleDownloadPNG = useCallback(async () => {
    const target = hiddenRef.current;
    if (!target) return;
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: 1600,
      height: 1000,
    });
    const link = document.createElement("a");
    link.download = `certificate-${props.certificateId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [props.certificateId]);

  const handleDownloadPDF = useCallback(async () => {
    const target = hiddenRef.current;
    if (!target) return;
    const { default: html2canvas } = await import("html2canvas");
    const { jsPDF } = await import("jspdf");
    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: 1600,
      height: 1000,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [1600, 1000] });
    pdf.addImage(imgData, "PNG", 0, 0, 1600, 1000);
    pdf.save(`certificate-${props.certificateId}.pdf`);
  }, [props.certificateId]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Hidden full-size certificate used for export capture */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: -9999,
          top: 0,
          width: 1600,
          height: 1000,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <div ref={hiddenRef} style={{ width: 1600, height: 1000 }}>
          <CertificateTemplate {...props} showButtons={false} />
        </div>
      </div>

      {/* Scaled visual preview */}
      <div ref={wrapperRef} style={{ width: "100%" }}>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: scaledHeight,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              transformOrigin: "top left",
              transform: `scale(${scale})`,
              width: 1600,
              height: 1000,
            }}
          >
            <CertificateTemplate {...props} showButtons={false} />
          </div>
        </div>
      </div>

      {/* Export buttons at normal scale */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleDownloadPNG}
          style={{
            fontFamily: "'Poppins', 'Geist Sans', sans-serif",
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
          Download PNG
        </button>
        <button
          onClick={handleDownloadPDF}
          style={{
            fontFamily: "'Poppins', 'Geist Sans', sans-serif",
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
          Download PDF
        </button>
      </div>
    </div>
  );
}
