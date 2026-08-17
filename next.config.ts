import type { NextConfig } from "next";

const supabaseHostname = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Fotos de marca/produto agora vêm do Supabase Storage (lib/storage.ts)
      // em vez de /uploads local — next/image exige o host liberado.
      ...(supabaseHostname
        ? [{ protocol: "https" as const, hostname: supabaseHostname, pathname: "/storage/v1/object/public/**" }]
        : []),
    ],
  },
};

export default nextConfig;
