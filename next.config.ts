import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import { withSentryConfig } from "@sentry/nextjs";

const createNextConfig = (phase: string): NextConfig => {
  const allowedOrigins = [
    "localhost:3000",
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.AUTH_URL,
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
  ].filter((origin): origin is string => Boolean(origin));
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const socketConnectSrc = socketUrl
    ? [
        socketUrl,
        socketUrl.replace(/^http:/, "ws:").replace(/^https:/, "wss:"),
      ].join(" ")
    : "http://localhost:4000 ws://localhost:4000";
  const supabaseConnectSrc = supabaseUrl
    ? [
        supabaseUrl,
        supabaseUrl.replace(/^https:/, "wss:").replace(/^http:/, "ws:"),
      ].join(" ")
    : "";

  return {
    output: "standalone",

    images: {
      remotePatterns: [
        { protocol: "https", hostname: "**.cloudinary.com" },
        { protocol: "https", hostname: "**.amazonaws.com" },
        { protocol: "https", hostname: "lh3.googleusercontent.com" },
        { protocol: "https", hostname: "avatars.githubusercontent.com" },
        { protocol: "https", hostname: "randomuser.me" },
      ],
      formats: ["image/avif", "image/webp"],
    },

    experimental: {
      serverActions: {
        allowedOrigins,
      },
    },

    compiler: {
      removeConsole:
        process.env.NODE_ENV === "production"
          ? { exclude: ["error", "warn"] }
          : false,
    },

    async headers() {
      return [
        {
          source: "/(.*)",
          headers: [
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "X-Frame-Options", value: "DENY" },
            { key: "X-XSS-Protection", value: "1; mode=block" },
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
            { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
            {
              key: "Strict-Transport-Security",
              value: "max-age=31536000; includeSubDomains; preload",
            },
            {
              key: "Content-Security-Policy",
              value: [
                "default-src 'self'",
                "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://www.youtube.com https://www.youtube-nocookie.com",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' blob: data: https:",
                "font-src 'self'",
                "frame-src https://js.stripe.com https://www.youtube.com https://www.youtube-nocookie.com",
                `connect-src 'self' https: ${socketConnectSrc} ${supabaseConnectSrc}`,
              ].join("; "),
            },
          ],
        },
        {
          source: "/_next/static/(.*)",
          headers: [{
            key: "Cache-Control",
            value: phase === PHASE_DEVELOPMENT_SERVER
              ? "no-store"
              : "public, max-age=31536000, immutable",
          }],
        },
        {
          source: "/api/(.*)",
          headers: [{ key: "Cache-Control", value: "no-store, no-cache" }],
        },
      ];
    },
  };
};

const nextConfig = (phase: string) => createNextConfig(phase);

export default (phase: string) => {
  const config = nextConfig(phase);
  const sentryEnabled =
    process.env.NODE_ENV === "production" &&
    Boolean(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN);

  if (!sentryEnabled) {
    return config;
  }

  return withSentryConfig(config, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    silent: true,
    widenClientFileUpload: true,
    webpack: {
      treeshake: {
        removeDebugLogging: true,
      },
      automaticVercelMonitors: false,
    },
  });
};
