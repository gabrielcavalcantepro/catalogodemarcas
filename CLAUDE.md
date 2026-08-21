@AGENTS.md

# X Performance — Catálogo e Gestão de Criadoras

Plataforma web para a agência X Performance: um catálogo onde criadoras de
conteúdo (sem senha, mas com acesso liberado por allowlist cadastrada pela
equipe) veem marcas parceiras e produtos disponíveis, solicitam amostra e
consultam o que já pediram — substituindo a explicação manual repetitiva da
equipe e a planilha de controle de divulgações (UGC).

**Especificação completa:** [`spec-plataforma-x-performance.md`](./spec-plataforma-x-performance.md)
na raiz — leia antes de mexer em regras de negócio (limite de amostras por
marca, comportamento de solicitação, o que está fora de escopo em §8). As
decisões de §9 ("em aberto") já foram tomadas e estão registradas abaixo.

**Referência de design:** [`design-x-performance.md`](./design-x-performance.md)
na raiz — style guide completo (paleta, tipografia, componente por
componente) que substitui qualquer DESIGN.md anterior. Leia antes de mexer
em CSS/componentes visuais.

## Stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript**
- **Tailwind CSS v4** — config CSS-first (sem `tailwind.config.ts`), tokens
  de tema em [`app/globals.css`](./app/globals.css) via `@theme`
- **PostgreSQL (Supabase) + Prisma 7** — driver adapter `@prisma/adapter-pg`
- **Zod** para validação de formulários/server actions
- **jose** para cookies de sessão assinados (sem biblioteca de auth completa
  — escopo do produto não pede login com senha para criadoras, e o admin usa
  uma senha única compartilhada)
- Upload de fotos: **Supabase Storage** (bucket `product-photos`) via
  [`lib/storage.ts`](./lib/storage.ts)

## Rodando localmente

O projeto roda contra **Supabase** (banco + storage) desde a migração de
produção — `.env.local` (não versionado, prioridade sobre `.env` igual o
Next.js já faz nativamente) tem `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD` e `SESSION_SECRET` reais.

```bash
npm run dev
```

`docker-compose.yml` (Postgres local, porta 5434) continua funcionando
como fallback só se `.env.local` for removido/renomeado — `.env` sozinho
ainda aponta pra ele. Trocar `SESSION_SECRET` invalida todas as sessões
ativas (criadoras e admin). Admin: `/admin/login` com a senha de
`ADMIN_PASSWORD`.

**Duas URLs do Supabase, dois usos diferentes** (ver "Prisma 7 + Supabase"
abaixo pra explicação técnica completa):
- `DATABASE_URL` — pooled via Supavisor (porta 6543, `?pgbouncer=true`),
  usada pelo app em runtime (`lib/db.ts`).
- `DIRECT_URL` — direta (porta 5432, sem pooling), usada só pelo CLI do
  Prisma (`prisma.config.ts`) pra rodar migration. **Rodar migration
  (`npm run db:deploy`) é sempre um passo manual/separado — local ou CI —
  nunca dentro de `next build`.**

## Modelo de dados

`prisma/schema.prisma`:

- **Creator** — `tiktokHandle` (`@unique`, sem senha) é a allowlist: a
  equipe cadastra só esse campo em `/admin/criadoras` antes da criadora
  poder acessar (spec §5.1/§6.3), SE `Settings.catalogLocked` for true
  (padrão). `name` e `email` (também `@unique`) ficam `null` até ela
  completar o Registro público — é ela quem escolhe o próprio e-mail
  nesse momento, não a equipe. Presença de `name`/`email` sozinha não
  basta mais como sinal de "já registrada" (era assim antes do toggle de
  catálogo destrancado existir): `approved` (`@default(true)`) distingue
  cadastro tradicional (allowlist, sempre `approved: true`, com ou sem
  `name` ainda) de auto-registro com catálogo destrancado (`registerCreator`
  cria a linha na hora com `approved: false` quando não acha nenhuma linha
  pré-existente pra aquele `tiktokHandle`). Três estados possíveis na UI
  do admin: sem `name` = "Aguardando registro"; `name` + `!approved` =
  "Aguardando aprovação" (mostra botão "Aprovar"); `name` + `approved` =
  "Registrada". A aprovação é só organizacional — não bloqueia acesso, a
  criadora já loga normal assim que se registra.
- **Brand** — marca parceira; `defaultSampleLimit` é o limite padrão de
  amostras por criadora nova (spec §6.2)
- **Product** — vinculado a `Brand`; `requestBehavior`
  (`REDIRECT_TIKTOK_SHOP` | `NOTIFY_TEAM`) define o que acontece ao clicar
  em "Solicitar Amostra" (spec §6.1); `tiktokShopUrl` só é usado quando
  `REDIRECT_TIKTOK_SHOP`. Preço/comissão são dois pares: `showcasePrice` +
  `showcaseCommissionPercent` (sempre obrigatórios) e `flashPrice` +
  `flashCommissionPercent` (opcionais — oferta relâmpago, sem agendamento,
  a equipe ativa/desativa preenchendo ou limpando os dois juntos; validado
  como tudo-ou-nada em `app/admin/(dashboard)/produtos/actions.ts`).
- **SampleRequest** — só clique em produto `NOTIFY_TEAM` vira uma linha
  aqui (mudou depois do uso real revelar dois problemas com
  `REDIRECT_TIKTOK_SHOP` também criar linha: o `redirect()` pro TikTok
  Shop não disparava de forma confiável a partir da Server Action, e
  cliques em vários produtos "brigavam" entre si — só o primeiro
  realmente persistia, os demais se perdiam. Causa raiz: misturar
  `redirect()` + `revalidatePath` + tracking na mesma action fazia o
  router do Next abortar requisições de Server Action irmãs ainda em voo
  quando a revalidação de uma delas disparava um refresh de rota.
  `REDIRECT_TIKTOK_SHOP` virou um `<a target="_blank">` puro em
  `SampleRequestControl` — nunca chama `requestSample`, sempre clicável,
  nunca "já solicitado", nunca aparece em Minhas Solicitações. Verificado
  depois disparando 3 cliques em paralelo (`Promise.all`, sem esperar) em
  3 produtos `NOTIFY_TEAM` diferentes — os 3 persistiram corretamente,
  confirmando que a raiz era mesmo a mistura de comportamentos na mesma
  action, não uma race condition genérica em Server Actions). Só as
  `NOTIFY_TEAM` entram na Fila e contam para o limite por marca (a
  restrição do §6.2 é intencional, não um bug). `status`
  (`PENDING`/`DONE`) é uma adição não explícita no spec — sem isso a fila
  cresceria indefinidamente; a equipe marca como atendido depois de mandar
  o convite no TikTok. `@@unique([creatorId, productId])` impede que a
  mesma criadora peça o mesmo produto duas vezes (spec §4.2) — é garantia
  de banco, não só uma checagem na UI; `requestSample` em
  `app/(public)/actions.ts` trata a violação dessa constraint como no-op
  idempotente (cobre o clique duplo antes do re-render), e
  `SampleRequestControl` (`components/sample-request-control.tsx`) some
  com o botão assim que existe uma solicitação, então a UI nem oferece a
  chance de duplicar.
- **CreatorBrandLimit** — override manual de limite por criadora+marca
  (`@@unique([creatorId, brandId])`). Só existe linha quando a equipe já
  ajustou manualmente; se não existir, o limite efetivo é
  `Brand.defaultSampleLimit`.
- **ContentPost** — divulgação (substitui a planilha de UGC): criadora +
  marca (obrigatório, para a contagem agregada por marca) + produto
  (opcional) + tipo + data + link.
- **Settings** — linha única fixa (`id` sempre `1`, `@default(1)` no Int
  força isso), lida/escrita via `lib/settings.ts`
  (`isCatalogLocked`/`setCatalogLocked`, sempre `upsert` — não depende de
  seed/migration de dado pra a linha existir na primeira leitura).
  `catalogLocked` (`@default(true)`) é o único campo até agora.

## Rotas

Pública: `/` (vitrine, com gate de Login — e-mail + @ — embutido quando não
há cookie de sessão), `/registro` (primeiro acesso: nome + e-mail + @, só
aceito se bater com um cadastro prévio em `/admin/criadoras`; redireciona
para `/` se já houver sessão), `/produto/[id]` (detalhe do produto —
mesmo gate de sessão que as outras rotas públicas, sem produto
inativo/inexistente cai em 404), `/minhas-solicitacoes`.

Admin (protegido por [`proxy.ts`](./proxy.ts), que substitui o antigo
`middleware.ts` no Next 16 — roda em Node runtime, não Edge):
`/admin/login`, `/admin`, `/admin/criadoras` (+`/nova`, `/[id]`),
`/admin/marcas` (+`/nova`, `/[id]`), `/admin/produtos` (+`/novo`, `/[id]`),
`/admin/fila` (+`?status=done`), `/admin/limites`, `/admin/divulgacoes`.

## Decisões e armadilhas técnicas

- **Next 16**: `middleware.ts` foi renomeado para `proxy.ts` (export
  `proxy`, não `middleware`). Se o Next reclamar de convenção depreciada,
  é isso.
- **Prisma 7**: a URL do banco não vai mais em `schema.prisma` — vai em
  [`prisma.config.ts`](./prisma.config.ts) junto com o driver adapter. O
  client é gerado em `generated/prisma` (gitignored), importado via
  `@/generated/prisma/client`. `package.json` tem `"type": "module"` por
  causa disso — cuidado ao rodar scripts Node soltos (usar `.mjs` ou ESM).
  Por ser gitignored, `generated/prisma` não existe num clone limpo (ex.:
  build da Vercel) — `package.json` tem `"postinstall": "prisma generate"`
  pra recriar sozinho depois de todo `npm install`; sem isso o build quebra
  com `Module not found: Can't resolve '@/generated/prisma/client'`. Efeito
  colateral: `prisma generate` carrega `prisma.config.ts`, que resolve
  `env("DIRECT_URL")` de forma eager só pra montar a config — então o
  `postinstall` falha se `DIRECT_URL` não estiver definida no ambiente
  (confirmado testando com as variáveis todas ausentes), mesmo sem nenhuma
  migration rodando. Na Vercel isso significa que `DIRECT_URL` (e as outras
  variáveis do Supabase) precisam estar cadastradas em Project Settings >
  Environment Variables — `.env.local` é local e nunca chega lá.
- **Sessões**: cookie `xp_creator` (creatorId, 1 ano) e `xp_admin`
  (`{admin:true}`, 30 dias), assinados com HS256/`SESSION_SECRET` via jose.
  Senha do admin comparada em tempo constante (`timingSafeEqual` em
  [`lib/auth/admin.ts`](./lib/auth/admin.ts)).
- **Identidade visual**: assets reais já estavam em `/brand` (não eram
  placeholder) e foram copiados para `/public/brand`. Design system definido
  em `design-x-performance.md`: paleta preto-em-camadas (`--color-void` →
  `--color-ink` → `--color-charcoal` → `--color-graphite`) + dourado único
  (`--color-gold`) como acento reservado praticamente só pro botão
  "Solicitar Amostra" e o badge de comissão; **Space Grotesk** (display, uso
  moderado — títulos de página, nome/comissão na página de produto — trocou
  de Fraunces na 2ª revisão do doc porque a serifada não combinava com o
  traço técnico/diagonal do logo real) + Manrope (interface/corpo) +
  JetBrains Mono (números tabulares: %, datas), carregadas via
  `next/font/google` em `app/layout.tsx`. Tokens em `app/globals.css` via
  `@theme`. Logo mínimo 40px de altura (header público e sidebar do admin).
- **Ícones (lucide-react) e movimento**: todo item de navegação e botão de
  ação tem ícone — mapeamento exato em `design-x-performance.md` §Tokens —
  Ícones (sidebar do admin em `components/admin-nav.tsx`, header público em
  `app/(public)/layout.tsx`). `Button` em `components/ui.tsx` tem
  `cursor-pointer` explícito (Tailwind zera o cursor nativo de `<button>`)
  e `active:scale-[0.98]` na variante primary. Entrada do card de produto é
  CSS puro (`@keyframes card-in` em `globals.css` + classe
  `.animate-card-in`, delay via `style` inline calculado do índice do
  `.map()`) — de propósito sem JS/estado, `ProductCard` continua Server
  Component.
- **Toast (sonner)**: ações que redirecionam ao ter sucesso (criar/editar
  Marca, Produto, Criadora) anexam `?toast=mensagem` no destino do redirect;
  `components/toast-from-query.tsx` (montado só no layout do admin, dentro
  de `<Suspense>`) lê o parâmetro no mount, mostra o toast e limpa a URL via
  `router.replace`. Ações que **não** redirecionam (ficam na mesma tela —
  `setCreatorBrandLimit`, `createContentPost`, `requestSample`) usam
  `useActionState` direto no componente e disparam o toast num `useEffect`
  quando o state retorna `{success: true}` — por isso `requestSample` virou
  `(prevState, formData) => state` em vez de só `(formData) => void`, e
  `SampleRequestControl` virou Client Component.
- **Armadilha do Tailwind v4 — `--spacing-N` no `@theme`**: NÃO defina
  `--spacing-4`, `--spacing-8` etc. no bloco `@theme`. Tailwind v4 gera a
  escala de espaçamento dinamicamente (`--spacing: 0.25rem`,
  `utilitário-N = calc(N * spacing)`), então `w-64` já é 256px por padrão
  (64 × 0.25rem) — os mesmos valores em px que o design doc documenta
  (4/8/12/16/24/32/48/64) já existem nos sufixos padrão (1/2/3/4/6/8/12/16).
  Copiei o bloco "Espaçamento" do Quick Start do design doc literalmente
  uma vez e isso sobrescreveu esses tokens com valores fixos em px,
  quebrando silenciosamente `w-64` (virou 64px em vez de 256px, encolhendo
  a sidebar do admin), `mb-4`, `gap-4`, `p-4` etc. em todo o app — sem erro
  de build, só layout errado. Removido; não reintroduzir.
- **shadcn/ui (Select, Popover, Calendar, Sonner)**: instalado via
  `npx shadcn@latest add select popover calendar sonner`. Duas armadilhas:
  1. O CLI **não** é não-interativo mesmo com `-y` nessa versão — perguntou
     biblioteca de primitivos (escolhi **Base UI**, não Radix, porque foi o
     "Recommended" no prompt) e preset ("Nova"), e sozinho **sobrescreveu**
     `app/globals.css` (com a paleta padrão zinc/OKLCH em `:root`/`.dark`,
     mais `--font-heading`/`--font-sans` quebrados) e `app/layout.tsx`
     (injetou uma fonte Geist que eu não pedi). Precisei reconciliar à mão:
     mantive nosso `@theme` como fonte da verdade e criei um `@theme inline`
     + `:root` que só faz *ponte* (`--popover: var(--color-charcoal)`,
     `--accent: var(--color-graphite)`, `--ring: var(--color-gold)` etc.) —
     sem bloco `.dark` nem `@custom-variant dark`, porque o app não tem
     alternância de tema. `@import "shadcn/tailwind.css"` foi mantido de
     propósito (não é cosmético): define os custom variants
     `data-open`/`data-closed` que `select.tsx`/`popover.tsx` usam pra
     animar abertura/fechamento — removê-lo faz esses componentes abrirem
     sem transição.
  2. O gerador criou `components/ui/button.tsx` (Button próprio do shadcn,
     usado internamente por `calendar.tsx`) coexistindo com
     `components/ui.tsx` (nosso `Button`/`Input`/`Card`/etc., que já
     existia). São caminhos de import diferentes (`@/components/ui/button`
     vs. `@/components/ui`) e não colidem, mas é fácil confundir os dois ao
     importar — o nosso primitivo genérico é sempre `@/components/ui`
     (arquivo, sem barra).
  - **Base UI Select participa de `FormData` nativamente** via prop `name`
    (renderiza um input escondido) — diferente do Radix, não precisei do
    padrão hidden-input+useState que tinha planejado.
    `components/form-select.tsx` envolve isso; crucial passar `items={options}`
    no `<Select>` (mesmo formato `{value,label}[]` da prop `options`), senão
    `<SelectValue>` mostra o `value` cru (ex. o cuid) em vez do label depois
    de selecionar.
  - `Popover`/`Calendar` não têm form nativo — `components/form-date-field.tsx`
    mantém um `<input type="hidden">` formatado `"yyyy-MM-dd"` (`date-fns`),
    mesmo formato que a action de Divulgações já esperava de um
    `<input type="date">` nativo, então a action não mudou.
  - `PopoverTrigger`/`SelectTrigger` do Base UI não usam `asChild` (padrão
    Radix) — usam `render` prop, ou (mais simples, usado aqui) já renderizam
    o elemento nativo (`<button>`) sozinhos, então basta passar `className`
    direto neles em vez de embrulhar um `<Button>` customizado dentro.
  - `components/ui/sonner.tsx` gerado importava `next-themes` (não
    instalado no projeto por conta própria, veio como dependência do
    componente) — como o app não tem alternância clara/escuro, troquei
    `useTheme()` por `theme="dark"` fixo e removi a dependência
    (`npm uninstall next-themes`).
- **Cache estático do App Router silenciosamente servindo o admin
  desatualizado**: primeiro uso real em produção (depois do deploy na
  Vercel) revelou que `/admin`, `/admin/criadoras`, `/admin/marcas`,
  `/admin/divulgacoes` e `/admin/produtos/novo` apareciam como `○ Static`
  no output do `next build` — prerenderizadas uma vez no build e servidas
  como HTML congelado depois disso, ignorando criadoras/marcas cadastradas
  depois do deploy (sintoma reportado: criadora e marca recém-criadas não
  apareciam nos selects de Divulgações). Causa: a autenticação do admin
  roda em `proxy.ts`, fora da árvore de render — nenhuma página do
  dashboard chama `cookies()`/`headers()`/`searchParams` por conta própria,
  então o Next não tinha motivo pra marcá-las como dinâmicas. As páginas
  públicas nunca tiveram esse problema porque todas chamam `cookies()`
  direto (gate de sessão da criadora), o que já força renderização
  dinâmica. Também nunca apareceu localmente porque `next dev` sempre
  renderiza sob demanda, sem cache — só `next build`/produção expõe isso.
  Corrigido com um `export const dynamic = "force-dynamic"` único em
  `app/admin/(dashboard)/layout.tsx`, que cascateia pra toda a árvore do
  dashboard (confirmado comparando o output de `next build` antes/depois —
  todas as rotas de admin viraram `ƒ Dynamic`), em vez de caçar
  `revalidatePath` por página — essa era a abordagem frágil que já tinha
  causado o bug (cada action só revalida o próprio path, nunca os de
  outras entidades que dependem dos mesmos dados). Verificado rodando
  `next build && next start` localmente (não só `next dev`, que não
  reproduz o cache) e conferindo com Playwright que uma criadora/marca
  criada não precisa de nenhuma ação extra pra aparecer em Divulgações.
- **`components/responsive-table.tsx`**: componente genérico orientado a
  colunas (`{ header, cell(row) }`) usado pelas 6 tabelas do admin (Marcas,
  Produtos, Criadoras, Fila, Limites, Divulgações) — renderiza `<table>`
  tradicional em `≥768px` e cards empilhados (pares label/valor) abaixo
  disso. O wrapper do `<table>` tinha `overflow-hidden` (só pra cortar os
  cantos quadrados da tabela dentro do `rounded-[20px]`) — colunas de ação
  com 3 botões (Criadoras com "Aprovar" pendente, Produtos com Duplicar)
  passaram a estourar a largura da tabela em telas ~1280px, e
  `overflow-hidden` escondia os botões de verdade, sem nenhuma forma de
  alcançar Aprovar/Excluir (nem scroll). Corrigido em duas camadas: o
  wrapper virou `overflow-x-auto` (nunca mais esconde nada de verdade,
  só exige scroll no pior caso) e os 3 `<div className="flex justify-
  end gap-2">` de ações (Criadoras/Produtos/Marcas) ganharam `flex-wrap`,
  que deixa os botões empilharem em vez de forçar a coluna mais larga —
  na prática, resolve sozinho em ≥1366px (a maioria das telas reais);
  só embaixo disso ainda precisa do scroll de reserva.
  A última coluna (header `""`)
  é sempre tratada como ações e aparece sem label, no rodapé do card
  mobile — convenção que as 6 páginas já seguiam antes desse componente
  existir.
- **Prisma 7 + Supabase (pooled vs direct)**: o pedido original era um
  campo `directUrl` no `datasource` do `schema.prisma` (padrão clássico do
  Prisma pra separar conexão pooled/direct) — testei com `prisma validate`
  e o Prisma 7 **removeu esse campo** ("The datasource property `directUrl`
  is no longer supported in schema files"; confirmado na doc oficial,
  removido em favor de só `datasource.url`). Como este projeto já não tem
  `url` nenhuma em `schema.prisma` (fica em `prisma.config.ts` desde a
  migração pro Prisma 7) e o client em runtime usa `@prisma/adapter-pg`
  direto com `process.env.DATABASE_URL` em `lib/db.ts` (nunca lê
  `prisma.config.ts`), a separação pooled/direct se resolve sem o campo:
  `prisma.config.ts` aponta pra `DIRECT_URL` (usada só pelo CLI de
  migration), `lib/db.ts` continua com `DATABASE_URL` (pooled, usada pelo
  app). Resultado é o mesmo do pedido original, só o mecanismo mudou.
- **`prisma.config.ts` não carrega `.env.local` sozinho**: o arquivo usava
  `import "dotenv/config"`, que só lê `.env` — `.env.local` (onde ficam as
  credenciais reais) é convenção do Next.js, não do pacote `dotenv`. Sem
  isso, `prisma migrate deploy` rodava silenciosamente contra o Postgres
  local do docker-compose em vez do Supabase. Corrigido com duas chamadas
  `config()` explícitas (`.env` depois `.env.local` com `override: true`),
  replicando a precedência do Next. Scripts Node soltos (`.mjs`/rodados via
  `npx tsx`) que também precisam do banco/Supabase real devem carregar os
  dois arquivos na mesma ordem — só `.env` não basta.
- **Supabase com projeto compartilhado**: o projeto Supabase usado aqui já
  hospedava outra aplicação (tabelas `metricas_crm`/`metricas_instagram`/
  `metricas_meta`, confirmado com o usuário que é intencional/compartilhado).
  Isso faz `prisma migrate deploy` falhar com `P3005: database schema is
  not empty` na primeira vez (o Prisma se recusa a migrar um banco que já
  tem conteúdo e não tem a tabela `_prisma_migrations` — não sabe se é
  seguro). Sem conflito de nome de tabela com o nosso schema, resolvido
  criando manualmente uma `_prisma_migrations` vazia (mesma estrutura que
  o Prisma cria do zero — conferida direto no Postgres local antes de
  replicar) e rodando `migrate deploy` de novo, que aplicou as 4 migrations
  normalmente sem tocar nas tabelas da outra app. **Cuidado**: `migrate
  resolve --applied` (a ferramenta "oficial" de baseline) não serve pra
  esse caso — ela marca migration como aplicada sem rodar o SQL, o que
  seria errado aqui porque nossas tabelas ainda não existiam.
- **`lib/storage.ts`**: bucket `product-photos` (já existia, criado fora do
  código — o app só usa). Upload sempre com a `SUPABASE_SERVICE_ROLE_KEY`
  (bypassa RLS do bucket), guardado atrás de `import "server-only"` — essa
  chave nunca pode ter prefixo `NEXT_PUBLIC_` nem ser importada por um
  componente `"use client"` (os dois únicos chamadores,
  `app/admin/(dashboard)/marcas/actions.ts` e `.../produtos/actions.ts`,
  são Server Actions). `next.config.ts` precisa de `images.remotePatterns`
  com o host do Supabase (`new URL(SUPABASE_URL).hostname`, calculado em
  vez de hardcoded) — sem isso `next/image` recusa renderizar as fotos, já
  que a URL passou de `/uploads/...` local pra uma URL completa do bucket.
  Testado de ponta a ponta (script descartável, não faz parte do repo):
  upload real, fetch da URL pública (200, content-type de imagem), e o
  fluxo real do app (criar Marca com foto pelo admin, ver a foto renderizar
  via `next/image`) — arquivo de teste removido do bucket depois.
- **Limite de tamanho de upload — Server Actions x teto de infraestrutura
  da Vercel**: primeiro uso real do formulário de Produto em produção
  quebrou ao salvar com foto — 500 no console e "Minified React error
  #441" (que decodifica pra "erro no render de Server Components", sem
  detalhe em produção). Log do servidor (só aparece rodando `next start`
  local, não no navegador) mostrou a causa real: `Error: Body exceeded 1
  MB limit` — Server Actions no Next.js têm um limite padrão de 1MB no
  corpo da requisição, e uma foto de produto real passa disso fácil. Não
  dá pra simplesmente aumentar esse limite à vontade: a Vercel impõe um
  teto de infraestrutura de 4.5MB pra Serverless Functions que **não é
  configurável** (acima disso o pedido nem chega no Next, vira 413 antes).
  Corrigido em três camadas, já que o formulário aceita múltiplas fotos e
  nada somava o total antes: `next.config.ts` define
  `experimental.serverActions.bodySizeLimit = "4mb"` (com folga do teto da
  Vercel); `lib/upload-limits.ts` (novo, sem `server-only` — precisa ser
  importável tanto pelas actions quanto pelos client components dos
  formulários) centraliza `MAX_UPLOAD_BYTES = 3.5MB`, usado por
  `lib/storage.ts` (checagem por arquivo) e por `saveNewPhotos` em
  `produtos/actions.ts` (checagem da SOMA de todos os arquivos de um
  envio — um por um dentro do limite ainda pode estourar somado). Como
  essas duas checagens já chegam tarde (o corpo da requisição só chega no
  código depois de passar pelo teto configurado), `product-form.tsx` e
  `brand-form.tsx` também validam no `onChange` do input de arquivo e
  desabilitam o botão de salvar — é a única camada que realmente evita a
  tela de erro genérica, as outras são defesa em profundidade. Verificado
  reproduzindo o crash exato (arquivo de 2.1MB, mesmo texto de erro do
  usuário) contra `next build && next start` local, confirmando o fix (o
  mesmo arquivo passa a salvar normalmente) e o guard client-side
  (arquivo de 5MB+ bloqueado antes do submit, com mensagem clara, sem
  nenhuma requisição disparada).
- **Ambiente**: o projeto já foi movido uma vez de uma pasta sincronizada
  pelo Google Drive (não é volume NTFS de verdade lá — `mklink /J` falha,
  `node_modules`/`.next` ficavam extremamente lentos). Evitar recolocar o
  projeto dentro de uma pasta com sync de nuvem ativo por cima
  (Drive/OneDrive/Dropbox) sem excluir `node_modules`/`.next` do sync.
- **Testando com Playwright**: o layout do admin
  ([`app/admin/(dashboard)/layout.tsx`](<./app/admin/(dashboard)/layout.tsx>))
  tem um `<form>` de logout com `<button type="submit">` na sidebar, que
  aparece ANTES do form principal da página no DOM. Um seletor genérico
  `button[type="submit"]` clica no botão errado (desloga em vez de
  salvar). Usar seletor por texto, ex.: `button:has-text("Salvar")`.

- **Limite efetivo**: `lib/sample-limits.ts` centraliza o cálculo (override
  de `CreatorBrandLimit` OU `Brand.defaultSampleLimit`, contagem de
  `SampleRequest` com `behaviorAtRequest: NOTIFY_TEAM` independente do
  `status`). Reusar essa função em vez de recalcular na mão — é usada por
  `/admin/fila` e serviria de base para qualquer outra tela que precise do
  mesmo número.
- **`/admin/limites`**: só lista pares criadora+marca que já têm atividade
  (`SampleRequest` NOTIFY_TEAM) ou override manual — não mostra o produto
  cartesiano de todas as criadoras × todas as marcas, que ficaria enorme e
  majoritariamente vazio.
- **Registro/Login da criadora**: o gate de acesso (spec §6.3) é só o
  `tiktokHandle` — é o único campo que a equipe cadastra em
  `/admin/criadoras/nova`. `registerCreator` busca por `tiktokHandle`
  (não por e-mail, que a equipe não tem ainda) e, se achar uma linha ainda
  sem `name`, salva nome+e-mail escolhidos pela criadora naquele momento.
  `loginCreator` já busca por `email` + `tiktokHandle` juntos (ambos
  `@unique`, então um `findFirst` simples já garante que os dois pertencem
  à mesma linha), porque depois do registro os dois existem. A normalização
  (trim + lowercase no e-mail, tira `@` + lowercase no handle) está em
  [`lib/validation/creator.ts`](./lib/validation/creator.ts) e é usada tanto
  no cadastro do admin quanto no registro/login público — se divergir entre
  os dois lados, o match nunca bate. Ver `registerCreator`/`loginCreator` em
  [`app/(public)/actions.ts`](<./app/(public)/actions.ts>). O formulário de
  edição em `/admin/criadoras/[id]` (não o de criação) expõe nome/e-mail
  para a equipe corrigir manualmente se necessário (ex.: erro de digitação
  da criadora no registro).

## Status

Todo o escopo combinado com o usuário está implementado: scaffold, schema,
tema/marca, vitrine com filtro por marca, login admin, CRUD de Criadoras
(allowlist), Marcas e Produtos (com upload de foto), registro de
`SampleRequest` ao clicar em "Solicitar Amostra" (+ `/minhas-solicitacoes`),
Fila de Solicitações com sinalização de limite atingido, Limites por
Criadora, e Divulgações com contagem agregada.

O acesso da criadora foi migrado de self-service puro (upsert por @ no
primeiro acesso) para allowlist com Registro/Login separados (spec §3/§5.1/
§6.3): a equipe cadastra só o @ em `/admin/criadoras`; a criadora só entra
se o @ bater com esse cadastro (`/registro` no primeiro acesso, preenchendo
nome e escolhendo o próprio e-mail; `/` mostra Login — e-mail+@ — nas
visitas seguintes, sem sessão salva). Testado ponta a ponta em browser real
(Playwright, script descartável — não faz parte do repo), cobrindo cadastro
do admin, registro/login com dados corretos e incorretos, redirecionamento
de sessão já ativa e tentativa de re-registro, sem erros de console/rede.

Depois disso: página de detalhe do produto (`/produto/[id]`, linkada a
partir da grade), preço duplo por produto (vitrine + oferta relâmpago, cada
um com sua comissão) e correção de um bug real encontrado no uso — o botão
"Solicitar Amostra" continuava clicável depois do primeiro pedido e cada
clique criava uma `SampleRequest` nova (cheguei a achar 3 duplicatas reais
no banco local, de um teste manual do usuário; deduplicadas na migration
que adicionou a constraint). Corrigido em duas camadas: `@@unique` no banco
+ o botão vira um badge estático assim que existe pedido, sem elemento
clicável.

Depois disso: redesign completo seguindo `design-x-performance.md`
(mobile-first nas 4 telas públicas, tokens/tipografia novos, `ProductCard`
e `SampleRequestControl` refeitos, tabelas do admin viram
`ResponsiveTable`, sidebar do admin empilha em mobile). Verificado com
Playwright em viewport mobile (375×812) e desktop (1440×900) nas 8 telas
principais, sem erros de console reais (mesmo warning de hidratação já
documentado). Achei e corrigi no processo: a armadilha do `--spacing-N`
acima, um warning real do `next/image` da logo (width/height inconsistente
— corrigido com `width=0 height=0 sizes=...`, padrão recomendado do
Next.js pra altura fixa/largura automática), e um bug de colisão visual
entre dois badges dourados no card de produto quando a oferta relâmpago
estava ativa (resolvido consolidando num único badge de comissão na foto).

Depois disso: segunda passada de design a partir do feedback de uso da
primeira (`design-x-performance.md` ganhou seções de Ícones/Movimento/
Barra Lateral/Formulários do Admin) — ícones (lucide-react) em toda
navegação e ação, cursor/transição/animação em elementos interativos,
`<select>`/`<input type=date>` nativos trocados por shadcn/ui (Base UI),
toast (sonner) em ações de salvar/registrar/solicitar, fonte Fraunces→
Space Grotesk, logo maior, sidebar do admin com item ativo destacado.
Verificado com Playwright (mobile 375×812 + desktop 1440×900): criar
marca/produto/divulgação mostrando toast, solicitar amostra sem navegação
mostrando toast, Select/Calendar abrindo com tema escuro (não o branco
padrão do shadcn), tabela do admin densa/legível (a queixa original de
"só espaço em branco" era o bug do `--spacing-N` da rodada anterior, não
falta de estilo — confirmado visualmente depois do fix). Achei e corrigi
no processo: o Select customizado mostrava o `value` cru (cuid) em vez do
label até eu passar `items` pro componente do shadcn.

Depois disso: migração de infraestrutura de produção pra Supabase (banco +
storage), substituindo o plano original de Neon + Vercel Blob — os dois
pendentes que faltavam pra produção. `prisma.config.ts` aponta pra
`DIRECT_URL` (migration), `lib/db.ts` continua com `DATABASE_URL` (pooled,
runtime), `lib/storage.ts` trocou de disco local pra Supabase Storage
(bucket `product-photos`). `ADMIN_PASSWORD`/`SESSION_SECRET` gerados
aleatoriamente e gravados em `.env.local` (só existiam como placeholder do
`.env.example` antes). No caminho, achei e corrigi dois problemas reais
antes de aplicar qualquer coisa em produção: o campo `directUrl` que eu ia
usar não existe mais no Prisma 7 (ver "Prisma 7 + Supabase" acima), e
`prisma.config.ts` não carregava `.env.local` (migration teria rodado
contra o banco local sem eu perceber). Também identifiquei que o
`DIRECT_URL` fornecido tinha caracteres especiais sem URL-encoding na
senha — corrigido pelo usuário copiando a connection string direto do
painel da Supabase. Testado de ponta a ponta com conexão real (não só
`tsc`/`build`): `migrate deploy` aplicou as 4 migrations no Postgres da
Supabase (projeto compartilhado com outra app — ver armadilha acima),
query de leitura + write/read/delete via `DATABASE_URL` pooled, upload +
leitura pública real no bucket, e o fluxo completo pela UI (login admin
com a senha gerada, criar Marca com foto, foto renderizando via
`next/image` do host do Supabase) — tudo limpo depois (sem dado de teste
sobrando no banco ou no bucket).

**Não implementado ainda / possíveis próximos passos:** deploy de fato na
Vercel (configurar as env vars lá, confirmar que `next build` não tenta
rodar migration sozinho — já não roda, mas vale conferir no primeiro
deploy) e qualquer refinamento de UX que o usuário pedir depois de usar o
painel de verdade.

Depois disso: deploy real na Vercel — env vars configuradas no painel do
projeto, `postinstall: prisma generate` adicionado (`generated/prisma` é
gitignored e não existe num clone limpo). Primeiro uso real em produção
revelou dois bugs que nunca apareciam localmente (`next dev` não expõe
nenhum dos dois — só build/produção): o cache estático do App Router
servindo o admin desatualizado (ver armadilha acima) e o limite de 1MB de
Server Actions estourando ao salvar produto com foto (ver armadilha
"Limite de tamanho de upload" acima). Os dois corrigidos e verificados
contra `next build && next start` local antes de subir, já que só assim
esses bugs reproduzem. Também adicionados nessa rodada: coluna "Perfil"
em Criadoras com link direto pro TikTok (`https://www.tiktok.com/@` +
`tiktokHandle`, sem precisar de campo novo) e duplicar produto (botão
"Duplicar" em `/admin/produtos` → `duplicateProduct` em
`produtos/actions.ts` cria uma cópia com nome + " (cópia)", mesmas fotos
(reaproveita as URLs, sem re-upload), `active: false` por padrão pra não
aparecer na vitrine idêntica ao original até a equipe revisar, e
redireciona direto pra tela de edição da cópia).

Depois disso: lote de feedback do primeiro uso real da vitrine pública e
do admin de Produtos. Achados relevantes, além de correções visuais
simples (nome do produto sem negrito, comissão aparecendo no card mesmo
sem oferta relâmpago — antes só aparecia com oferta ativa, inconsistente
com a página de detalhe que já mostrava nos dois casos):
- **Redesign de `SampleRequestControl`** — ver armadilha "SampleRequest"
  acima pra causa raiz. `REDIRECT_TIKTOK_SHOP` virou link externo puro
  ("Ir para a loja"); `NOTIFY_TEAM` ganhou cópia nova ("Quero solicitar
  amostra" → "Já solicitado" + "Nossa equipe vai aprovar a sua
  solicitação e enviar um convite no TikTok."). `minhas-solicitacoes`
  filtra `behaviorAtRequest: NOTIFY_TEAM` explicitamente — cobre tanto o
  comportamento novo (que nunca cria linha REDIRECT_TIKTOK_SHOP) quanto
  linhas antigas já existentes no banco de antes dessa mudança.
- **Preview de foto antes de salvar** — `product-form.tsx` e
  `brand-form.tsx` não mostravam nenhuma prévia do arquivo selecionado
  antes do submit (só o texto nativo do `<input type=file>`). Investigado
  a fundo se fotos realmente não persistiam (upload+criar, upload+editar
  e duplicar produto — os três testados via Playwright contra `next
  build && next start`, e os 7 produtos reais do banco já tinham
  `photoUrls.length === 3` cada) e não achei perda de dado nenhuma — o
  mecanismo de upload sempre funcionou. A interpretação mais plausível
  pro relato ("a foto devia aparecer também") era falta de feedback
  visual imediato, não perda de dado; corrigido com preview local via
  `URL.createObjectURL` (revogado a cada nova seleção, evita acumular
  memória) assim que o arquivo é escolhido, antes mesmo de salvar.
- **Layout do admin: sidebar fixa + conteúdo centralizado** —
  `app/admin/(dashboard)/layout.tsx` não travava altura nenhuma
  (`min-h-screen` deixa crescer à vontade), então o documento inteiro
  rolava junto, sidebar incluída. Corrigido com `md:h-screen
  md:overflow-hidden` no container e `md:overflow-y-auto` só no `<main>`
  — restrito a `md:` de propósito, mobile empilha a sidebar como barra de
  topo e depende do scroll natural da página. Conteúdo centralizado com
  `mx-auto max-w-7xl` dentro do `<main>` — fica centralizado em relação à
  área de conteúdo (à direita da sidebar), não à janela inteira; com a
  sidebar só de um lado, centralizar em relação à janela completa
  deixaria o conteúdo visualmente puxado pra direita.
- **Edição inline em `/admin/produtos`** — preço, comportamento e status
  editáveis direto na lista (`components/inline-edit-product.tsx`), sem
  abrir a tela de Editar. Três Server Actions novas em `produtos/actions.ts`
  (`quickUpdatePrice`/`quickUpdateBehavior`/`quickUpdateActive`) chamadas
  direto como função a partir do client (não presas a um `<form>`, então
  um `throw` vira Promise rejeitada, tratável com try/catch sem
  `useActionState`). Trocar pra `REDIRECT_TIKTOK_SHOP` exige que o
  produto já tenha `tiktokShopUrl` configurado — a edição rápida não pede
  esse campo inline, só a tela de Editar completa faz isso.

Depois disso: segundo lote de feedback, ainda em cima da página de
detalhe do produto e formulários do admin.
- **Formulários do admin não centralizavam dentro do wrapper novo** — o
  `mx-auto max-w-7xl` do layout centraliza um container largo, mas
  `product-form.tsx`/`brand-form.tsx`/`creator-form.tsx` têm seu próprio
  `max-w-xl`/`max-w-md` SEM `mx-auto` — um elemento mais estreito dentro
  de um pai já centralizado não herda centralização, só encosta na
  esquerda dele por padrão. As 3 formulários ganharam `mx-auto` também.
  Isso não afeta `ResponsiveTable` (sem max-width próprio, já ocupa a
  largura toda do wrapper).
- **`components/product-gallery.tsx`** (novo, client component) —
  substitui a galeria estática (foto principal fixa + miniaturas mortas)
  por navegação de verdade: setas (lucide `ChevronLeft`/`ChevronRight`)
  trocam a foto principal, miniaturas viram botões clicáveis (a
  selecionada tem `ring-2 ring-gold`). Usado só na página de detalhe —
  `ProductCard` continua com a foto única estática, que é intencional
  (card de grade não precisa de galeria).
- **`components/expandable-description.tsx`** (novo, client component) —
  trunca com `line-clamp-6` + botão "Ver mais"/"Ver menos" quando o texto
  passa de 280 caracteres (`TRUNCATE_THRESHOLD`). A página de detalhe
  também normaliza a descrição antes de passar pro componente
  (`description.replace(/\n{3,}/g, "\n\n")`) — a equipe às vezes cola
  descrição com parágrafos separados por mais de uma linha em branco, e
  como `whitespace-pre-line` preserva cada `\n` literal, isso virava um
  "espaço duplo" visível entre parágrafos. Observação à parte, não
  corrigida (arriscado demais corrigir por heurística): algumas
  descrições reais têm frases coladas sem espaço nenhum entre elas (ex.:
  "...silhuetaModelagem pensada...") — é a própria string salva assim no
  banco, não um bug de renderização; não dá pra saber com segurança onde
  inserir o espaço faltante sem risco de quebrar uma palavra legítima.
- **Página de detalhe do produto** — três ajustes de escala depois do uso
  real: (1) container passou de `max-w-[640px]` pra `max-w-4xl`, igual ao
  header (`app/(public)/layout.tsx`) — antes ficava visivelmente mais
  estreito que o cabeçalho da própria página; a home já usava `max-w-4xl`
  herdado do layout, não precisou mudar. (2) título/preço/comissão
  vieram de `font-display text-heading-md`/`text-heading-sm` (28px/20px,
  tokens de display heading) pra `text-xl md:text-2xl`/`text-lg`/`text-sm`
  — os tokens de heading são grandes demais pra esse contexto (só fazem
  sentido pra título de página, não pra texto dentro de um card de
  preço). (3) botão "Voltar ao catálogo" ganhou ícone (`ArrowLeft`) e
  weight/transição consistentes com o resto do design system, em vez de
  só texto sublinhado no hover.
- **`duplicateProduct` não copia mais `photoUrls`** — o pedido original
  (fase anterior) reaproveitava as fotos do original; uso real mostrou
  que isso não faz sentido — duplicar serve pra criar uma variante
  parecida (cor/modelo diferente), e a foto é justamente o que mais muda
  entre elas. Agora a cópia sempre nasce com `photoUrls: []`, e o
  formulário de edição já lida com isso sozinho (mostra "Nenhuma foto
  ainda.", sem checkbox de remover fantasma) — nenhuma mudança extra
  precisou em `product-form.tsx`.

Depois disso: terceiro lote — grade mobile, menu hamburguer, limite de
amostras visível pra criadora, skeleton de carregamento e mais um round
de alinhamento no admin.
- **Regressão na comissão do card corrigida** — a rodada anterior tinha
  reduzido peso/tamanho da comissão (`text-xs font-medium`) interpretando
  mal um feedback ambíguo; o pedido real era o oposto, comissão do mesmo
  tamanho que o preço. Voltou pra `text-base font-bold`, igual
  `Vitrine`/`Oferta`/preço sem oferta — mesmo padrão em todo lugar.
- **Grade pública: 2 colunas já no mobile** — `grid-cols-1` (base) virou
  `grid-cols-2`, `sm:grid-cols-2` saiu (redundante agora). `lg:grid-cols-3`
  continua igual.
- **`components/mobile-nav.tsx`** (novo) — menu hamburguer client-side
  pro header público abaixo de `md:`. Antes só tinha um ícone solto de
  "Minhas Solicitações"; agora abre um dropdown com Catálogo, Minhas
  Solicitações e o @ da criadora — mesmo conteúdo que já existia
  descoberto em `md:flex`, só que escondido atrás do menu no mobile.
- **Limite de amostras por marca visível pra criadora** —
  `lib/sample-limits.ts` (`getLimitStatusForPairs`) já existia e já era
  usado pelo admin em `/admin/fila`; passou a ser chamado também no
  catálogo (`app/(public)/page.tsx`) e na página de detalhe
  (`produto/[id]/page.tsx`), reaproveitando a mesma função em vez de
  duplicar a lógica. Mostra "N amostras restantes nesta marca" ou
  "Limite de amostras desta marca atingido" — mesma copy do badge do
  admin (`{used}/{limit}` + "— limite atingido"), adaptada pra leitura da
  criadora. É por marca, não por produto (spec §6.2) — aparece igual em
  todos os produtos de uma mesma marca, independente do
  `requestBehavior` de cada um (mesmo em produtos `REDIRECT_TIKTOK_SHOP`,
  já que o limite é sobre a marca como um todo, não sobre aquele fluxo
  específico).
- **`components/catalog-shell.tsx`** (novo, client component) — skeleton
  de carregamento ao trocar de filtro de marca. Primeira tentativa foi a
  convenção padrão do App Router (`<Suspense key={brandId} fallback=
  {...}>` envolvendo um Server Component `ProductGrid` separado) — não
  disparava o fallback de forma confiável, nem sob delay artificial de
  1.5s injetado via interceptação de rede em teste (`page.route`),
  provavelmente por causa de como o router do Next decide quando trocar
  a árvore visível numa navegação client-side já teve o `<Link>` prefetch
  disparado. Trocado por uma abordagem client-side direta:
  `useTransition()` + `router.push()` nos pills de filtro (viraram
  `<button>`, não `<Link>` mais — perdem o auto-prefetch do Next, o que
  também ajuda a não gastar banda pré-buscando marcas que a criadora não
  vai clicar), com `isPending` controlando skeleton vs. `children` (a
  grade real, renderizada no servidor, passada como children pro
  shell). `components/product-grid-skeleton.tsx` é o skeleton
  reaproveitado também em `app/(public)/loading.tsx` (esse continua
  útil pra navegação vinda de FORA da rota "/", ex.: "Voltar ao
  catálogo" a partir do detalhe — cenário onde o Suspense padrão
  funciona normalmente, só não pra troca de searchParams dentro da
  mesma página).
- **Alinhamento heading+form nos 6 formulários do admin** — o
  `mx-auto` adicionado na rodada anterior foi só no `<form>`, então o
  `<h1>` da página (fora do form) continuava colado na esquerda enquanto
  o form ficava centralizado abaixo — heading e conteúdo visualmente
  desalinhados. Corrigido movendo `mx-auto max-w-xl`/`max-w-md` pro
  `<div>` que envolve heading+form nas 6 páginas (`produtos/novo`,
  `produtos/[id]`, `marcas/nova`, `marcas/[id]`, `criadoras/nova`,
  `criadoras/[id]`), removendo o `mx-auto` que tinha ficado só no
  `<form>` dos 3 componentes de formulário (agora herdam a largura do
  wrapper da página).

Depois disso: catálogo destrancável. Toggle "Catálogo trancado" em
`/admin/criadoras` (`Settings.catalogLocked`, ver "Modelo de dados"
acima) — trancado (padrão) mantém o comportamento allowlist original;
destrancado permite `registerCreator` criar a linha do Creator na hora
pra qualquer `@`, com `approved: false`. Isso trouxe um bug que já
existia mas nunca importava até agora: `deleteCreator` sempre apagou a
linha do banco, mas `getCreatorId()` (`lib/auth/creator.ts`) só validava
a assinatura do cookie, nunca conferia se a linha ainda existia — então
excluir uma criadora que já tinha sessão salva não derrubava o acesso
dela de verdade (o cookie assinado continuava "válido", só o registro
sumia, e as páginas públicas simplesmente tratavam como uma criadora sem
histórico, não como deslogada). Corrigido fazendo `getCreatorId()`
confirmar a existência da linha no banco antes de devolver o id — sem
isso, "perde login do catálogo" ao excluir (comportamento pedido
explicitamente) não acontecia de verdade pra sessões já abertas.
Verificado em Playwright contra `next build && next start`: registro com
`@` desconhecido é recusado com o catálogo trancado, aceito e loga na
hora quando destrancado, aparece "Aguardando aprovação" com botão
"Aprovar" em `/admin/criadoras`, aprovar limpa o badge, excluir de fato
desloga uma sessão já aberta (testado com o mesmo browser context: perde
acesso, reloga se destrancado). "Sair" (logout) também ficou faltando no
catálogo até agora — `logoutCreator` (`app/(public)/actions.ts`, só
`clearCreatorSession` + redirect) adicionado no menu mobile
(`components/mobile-nav.tsx`) e no header desktop
(`app/(public)/layout.tsx`), os dois só apareciam pra criadora logada.

Depois disso: polimento visual do card de produto na grade pública.
- **Título com degradê em 2 linhas** (`.title-fade-clamp` em
  `globals.css`) — títulos longos estouravam a altura do card e
  deixavam a grade desalinhada. `line-clamp` sozinho cortaria seco ou
  com "…"; como isso não deixa nada "sobrando" pra aplicar um degradê
  em cima, a saída foi mascarar (`mask-image`/`-webkit-mask-image`) a
  última ~35% da altura do próprio bloco já clampado em 2 linhas — o
  texto parece se apagar em vez de ser cortado.
- **Linhas tracejadas entre Vitrine/Oferta/Comissão/limite** — trocado
  `space-y-1` por `divide-y divide-dashed divide-graphite` no container
  desses campos em `ProductCard`; a linha de limite de amostras
  (`limitStatus`) foi movida pra dentro do mesmo container (antes era
  um `<div>` irmão fora dele) especificamente pra herdar o divisor
  tracejado entre ela e Comissão/preço.
- **Skeleton usava `bg-mat`** (`#eae7e1`, tom claro pensado pra fundo de
  foto de produto ausente, não pra loading state) — trocado por
  `bg-graphite` em `components/product-grid-skeleton.tsx`, consistente
  com o resto da paleta escura.

Depois disso: copy do limite de amostras trocada de "N amostras
restantes nesta marca"/gold pra "Você pode solicitar até N amostras"/
`text-orange-400` — cor nova de propósito (não reaproveita `--color-gold`
existente), já que o pedido era destacar essa mensagem das outras cores
douradas já presentes no card (preço de oferta, comissão, botão). Mesma
mudança em `ProductCard` e na página de detalhe; a copy do caso "limite
atingido" não mudou (só a cor), porque a frase nova ("pode solicitar até
N") não faz sentido quando restam 0.

Depois disso: segunda rodada na correção de overflow das tabelas do
admin (a primeira, com `overflow-x-auto` + `flex-wrap`, resolvia só
parcialmente — dependia de scroll horizontal em telas mais estreitas).
Com criadoras reais preenchendo nome/e-mail de verdade (antes era só
"—"), essas colunas cresceram e voltaram a espremer o resto: o botão
"Ver no TikTok" e os badges de status ("Aguardando registro"/"Aguardando
aprovação") quebravam texto em 2 linhas de forma feia. Corrigido com
`whitespace-nowrap` — no `buttonBase` de `components/ui.tsx` (todo botão
do app, não só esse) e nos badges de status em `criadoras/page.tsx`.
Também: botões "Editar"/"Excluir" viram ícone-só (sem o texto ao lado,
`className="px-3"` + `aria-label` no lugar do texto) nas 3 tabelas que
os usam (Criadoras, Marcas, Produtos) — `ConfirmSubmitButton` já
aceitava `children` opcional (só o ícone `Trash2` é fixo), então bastou
não passar texto. Reduz a largura da coluna de ações o suficiente pra
casos comuns (nome normal, 2-3 botões) caberem sem nenhum scroll em
telas ≥1440px; nomes muito longos combinados com "Aguardando aprovação"
(3 botões) ainda podem exigir o scroll de reserva do `overflow-x-auto` —
aceitável, já que o objetivo era nunca mais esconder um botão sem
nenhuma forma de alcançá-lo, não eliminar 100% dos casos extremos.
