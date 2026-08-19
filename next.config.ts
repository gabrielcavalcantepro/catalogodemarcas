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
  experimental: {
    serverActions: {
      // Default é 1MB — uma foto de produto real já estoura isso. A Vercel
      // impõe um teto de infraestrutura de 4.5MB pra Serverless Functions
      // que não dá pra configurar (fica acima disso e o pedido nem chega
      // aqui, vira 413 antes do Next processar) — 4mb fica com folga
      // segura abaixo desse teto.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
