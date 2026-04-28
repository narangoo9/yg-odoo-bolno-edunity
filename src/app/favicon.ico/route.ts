const faviconSvg = `
<svg width="64" height="64" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" rx="28" fill="url(#bg)"/>
  <path d="M38 34C38 30.6863 40.6863 28 44 28H84C87.3137 28 90 30.6863 90 34V94C90 97.3137 87.3137 100 84 100H44C40.6863 100 38 97.3137 38 94V34Z" fill="white" fill-opacity="0.96"/>
  <path d="M50 46H78" stroke="#2563EB" stroke-width="8" stroke-linecap="round"/>
  <path d="M50 62H78" stroke="#60A5FA" stroke-width="8" stroke-linecap="round"/>
  <path d="M50 78H68" stroke="#93C5FD" stroke-width="8" stroke-linecap="round"/>
  <circle cx="92" cy="92" r="18" fill="#1D4ED8"/>
  <path d="M84 92L89 97L100 86" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <defs>
    <linearGradient id="bg" x1="12" y1="12" x2="116" y2="116" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0F172A"/>
      <stop offset="0.55" stop-color="#1D4ED8"/>
      <stop offset="1" stop-color="#60A5FA"/>
    </linearGradient>
  </defs>
</svg>
`.trim();

export function GET() {
  return new Response(faviconSvg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
