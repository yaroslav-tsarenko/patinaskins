import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { IMAGE_VARIANT_WIDTHS } from "./src/lib/image-loader";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    deviceSizes: [...IMAGE_VARIANT_WIDTHS],
    imageSizes: [],
  },
  // apex -> www lives here instead of in Vercel's domain settings, so that
  // /.well-known/* (Apple Pay merchant verification) is served on the bare
  // domain with a 200: Apple's verifier does not follow redirects.
  redirects: async () => [
    {
      source: "/:path((?!\\.well-known/).*)",
      has: [{ type: "host", value: "patinaskins.com" }],
      destination: "https://www.patinaskins.com/:path",
      permanent: true,
    },
  ],
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
      ],
    },
  ],
};

export default withNextIntl(nextConfig);
