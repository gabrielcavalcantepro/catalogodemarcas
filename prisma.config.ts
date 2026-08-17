import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// dotenv só carrega .env por padrão — .env.local (onde ficam as
// credenciais reais do Supabase) é convenção do Next.js, não do dotenv.
// Replica a mesma precedência do Next aqui (.env.local vence .env), senão
// o CLI do Prisma roda contra o Postgres local do docker-compose mesmo
// com .env.local preenchido.
config({ path: ".env" });
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Direta (sem pooling) — é o que o CLI de migration precisa; o app
    // em runtime usa DATABASE_URL (pooled) direto em lib/db.ts, sem
    // passar por este arquivo.
    url: env("DIRECT_URL"),
  },
});
