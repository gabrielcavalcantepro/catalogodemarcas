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
- **PostgreSQL + Prisma 7** — driver adapter `@prisma/adapter-pg`
- **Zod** para validação de formulários/server actions
- **jose** para cookies de sessão assinados (sem biblioteca de auth completa
  — escopo do produto não pede login com senha para criadoras, e o admin usa
  uma senha única compartilhada)
- Upload de fotos: disco local via [`lib/storage.ts`](./lib/storage.ts)

## Rodando localmente

```bash
docker compose up -d   # Postgres local, porta 5434 (5432/5433 já usados por outros projetos nesta máquina)
npm run dev
```

`.env` (não versionado, ver `.env.example`) tem `DATABASE_URL`,
`ADMIN_PASSWORD` e `SESSION_SECRET`. Trocar `SESSION_SECRET` invalida todas
as sessões ativas (criadoras e admin). Admin: `/admin/login` com a senha de
`ADMIN_PASSWORD`.

## Modelo de dados

`prisma/schema.prisma`:

- **Creator** — `tiktokHandle` (`@unique`, sem senha) é a allowlist: a
  equipe cadastra só esse campo em `/admin/criadoras` antes da criadora
  poder acessar (spec §5.1/§6.3). `name` e `email` (também `@unique`) ficam
  `null` até ela completar o Registro público — é ela quem escolhe o
  próprio e-mail nesse momento, não a equipe. Presença de `name`/`email` é
  o sinal de "já registrada" (não existe campo de status separado).
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
- **SampleRequest** — todo clique em "Solicitar Amostra" (dos dois
  comportamentos) vira uma linha aqui, para alimentar "Minhas Solicitações".
  Só as `NOTIFY_TEAM` entram na Fila e contam para o limite por marca (a
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
- **`components/responsive-table.tsx`**: componente genérico orientado a
  colunas (`{ header, cell(row) }`) usado pelas 6 tabelas do admin (Marcas,
  Produtos, Criadoras, Fila, Limites, Divulgações) — renderiza `<table>`
  tradicional em `≥768px` e cards empilhados (pares label/valor) abaixo
  disso, nunca tabela com scroll horizontal. A última coluna (header `""`)
  é sempre tratada como ações e aparece sem label, no rodapé do card
  mobile — convenção que as 6 páginas já seguiam antes desse componente
  existir.
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

**Não implementado ainda / possíveis próximos passos:** deploy de produção
(hospedagem, Postgres gerenciado, storage de upload que sobreviva a
serverless — ver nota de `lib/storage.ts`), troca da `ADMIN_PASSWORD` de
exemplo antes de ir ao ar, e qualquer refinamento de UX que o usuário pedir
depois de usar o painel de verdade.
