# X Performance — Style Guide
> Preto estratificado, um único ponto de dourado no lugar que importa — e nenhum elemento com cara de HTML puro.

**Theme:** dark

A X Performance roda sobre um preto em camadas (void → ink → charcoal → graphite) que dá profundidade sem pesar, e usa o dourado da marca (#fad214) como o único acento cromático — reservado quase exclusivamente para o botão "Solicitar Amostra" e para o badge de comissão, que são literalmente as duas informações que fazem uma criadora agir. É esse contraste disciplinado — muito preto quieto, um ponto de dourado de alto contraste no lugar certo — que carrega a sensação de "premium", não gradiente nem efeito. Tipografia usa uma sans geométrica de personalidade forte (Space Grotesk) para títulos e números de destaque — combina com o traço técnico/diagonal do logo, o que uma serifada não fazia — com a Manrope para a interface do dia a dia. O layout parte de mobile — tela larga é o caso secundário, não o principal. Três regras não-negociáveis a partir daqui, porque a primeira versão saiu sem elas: **todo item de navegação tem ícone**, **nenhum controle de formulário usa o estilo nativo do navegador** (select, date picker, etc.), e **todo elemento interativo tem transição de estado**. Sem isso, qualquer paleta bonita ainda parece HTML cru.

## Tokens — Cores

| Nome | Valor | Token | Papel |
|------|-------|-------|-------|
| Preto Profundo | `#0f0f0f` | `--color-void` | Fundo externo da página — camada mais profunda |
| Preto Base | `#151515` | `--color-ink` | Fundo principal (canvas) — cor-base #1 da marca |
| Carvão | `#212121` | `--color-charcoal` | Superfície de cards e painéis — cor-base #2 da marca |
| Grafite | `#2c2c2c` | `--color-graphite` | Hover de card, divisores, campo de formulário em repouso |
| Papel | `#ffffff` | `--color-paper` | Texto primário, títulos, ícones |
| Névoa | `#a8a29e` | `--color-mist` | Texto secundário, placeholder, legenda — tom quente pra combinar com o dourado |
| Dourado | `#fad214` | `--color-gold` | Único acento — CTA principal, badge de comissão, foco |
| Dourado Escuro | `#e0bd0a` | `--color-gold-dark` | Hover/pressed do dourado — nunca usar opacidade, lava a cor sobre fundo escuro |
| Alerta | `#f87171` | `--color-alert` | Uso funcional só em erro de formulário — não é cor de marca |

Nenhuma outra cor "de marca" entra além de preto e dourado — inclusive o status da Fila de Solicitações (Pendente/Atendido) usa o próprio dourado (pendente = precisa de atenção) e o cinza neutro (atendido = resolvido, sai de cena), em vez de inventar um verde/vermelho de status.

## Tokens — Tipografia

### Space Grotesk — display, usada com moderação
Títulos de seção, nome do produto na tela de detalhe, número de comissão em destaque. Sans geométrica com personalidade técnica — combina com o traço diagonal/dinâmico do logo (a serifada da primeira versão não tinha nada a ver com a marca). `next/font/google`.
- Pesos: 600, 700
- Tamanhos: 24, 32, 44

### Manrope — interface, corpo
Navegação, labels, corpo de texto, botões, tabelas do admin. Legível em tela pequena, com mais caráter que a Inter batida de qualquer produto. `next/font/google`.
- Pesos: 400, 500, 700
- Tamanhos: 13, 14, 16

### JetBrains Mono — dados tabulares, utilitária
Só para números que precisam alinhar: % de comissão em tabela, datas, contagens em Limites e Divulgações. Nunca em botão ou texto corrido. `next/font/google`.
- Peso: 500
- Tamanhos: 13, 14

### Escala tipográfica

| Papel | Tamanho | Altura de linha | Token |
|---|---|---|---|
| caption | 12px | 1.4 | `--text-caption` |
| body-sm | 14px | 1.5 | `--text-body-sm` |
| body | 16px | 1.5 | `--text-body` |
| heading-sm | 20px | 1.3 | `--text-heading-sm` |
| heading-md | 28px | 1.2 | `--text-heading-md` |
| heading-lg | `clamp(28px, 6vw, 44px)` | 1.1 | `--text-heading-lg` |

`heading-lg` usa `clamp()` de propósito — escala sozinho entre mobile e desktop sem precisar de breakpoint manual pra cada título grande.

## Tokens — Espaçamento & Formas

**Unidade base:** 4px — `4, 8, 12, 16, 24, 32, 48, 64`

### Raio de borda
| Elemento | Valor |
|---|---|
| badges / pills | 999px |
| botões | 10px |
| inputs | 10px |
| cards | 20px |

Raio mais generoso que uma interface "técnica" — reforça o lado lifestyle/criadora do produto, não fintech.

### Bordas e elevação
- Anel interno sutil pra definir borda de card sobre fundo escuro: `rgba(255,255,255,0.06) 0 0 0 1px inset` — nunca drop-shadow escuro pesado, que suja sobre fundo já escuro.
- Elevação leve só no hover do card de produto: `0 8px 24px rgba(0,0,0,0.4)`.

## Tokens — Ícones

Biblioteca: **lucide-react** (SVG, leve, fácil de instalar num projeto Next.js). Tamanho padrão 20px, `stroke-width` 1.75. Todo item clicável ou de navegação leva ícone — não existe item de menu só com texto.

| Item | Ícone (lucide-react) |
|---|---|
| Início | `LayoutDashboard` |
| Criadoras | `Users` |
| Marcas | `Building2` |
| Produtos | `Package` |
| Fila de Solicitações | `Inbox` |
| Limites por Criadora | `SlidersHorizontal` |
| Divulgações | `Video` |
| Ação "Novo/Nova X" | `Plus` — todo botão de criar leva o ícone antes do texto |
| Editar | `Pencil` |
| Excluir | `Trash2` |
| Conta da criadora (header público) | `CircleUserRound` — antecede o @, deixa claro que aquilo é a conta dela |

## Tokens — Movimento

Nada nessa plataforma fica estático. Regras fixas, em qualquer componente:
- Todo elemento clicável tem `cursor: pointer` — sem exceção, isso não é polimento opcional, é o mínimo pra parecer interativo.
- Transição de cor/fundo em hover e focus: `transition-colors duration-150`.
- Botão primário no `:active`: leve encolhida, `scale-[0.98]`, pra dar feedback de toque — importante em mobile, onde não existe hover.
- Card de produto entra na tela com fade + leve deslocamento vertical (`opacity` 0→1, `translateY(8px→0)`, ~200ms); numa grade, aplicar stagger de 30–40ms entre cards.
- Ações que mudam estado (salvar produto, registrar divulgação, solicitar amostra) confirmam com um toast curto, não só com redirecionamento silencioso.

## Componentes

### Header (público)
Logo horizontal da X Performance à esquerda, mínimo 40px de altura (a primeira versão saiu pequena demais — é a única peça de marca visível o tempo todo, precisa de presença). Nav central com "Catálogo" e "Minhas Solicitações", 32px de espaço entre os dois links. Sessão ativa fica isolada à direita, separada do nav por uma divisória sutil ou margem maior — ícone `CircleUserRound` antes do @ da criadora, pra deixar óbvio que aquilo é a conta dela, não mais um item de menu.

### Filtro de Marca (pills)
Fileira horizontal com scroll, sticky no topo ao rolar em mobile. Pills 32px de altura, raio total, fundo `--color-charcoal`, texto `--color-mist`. Pill ativa inverte: fundo `--color-gold`, texto `--color-ink` — único lugar fora do CTA principal onde o dourado vira fundo cheio.

### Card de Produto (grid da vitrine)
Fundo `--color-charcoal`, raio 20px, padding 12px. Foto do produto sobre um fundo neutro claro (mat) — evita que fotos de qualidade e fundo variados, já que cada marca manda o que tem, quebrem a consistência visual do card escuro. Badge de comissão em pill `--color-gold` no canto da foto (ex. "18% comissão") — é a informação que mais pesa na decisão da criadora, precisa saltar aos olhos antes de qualquer texto. Nome da marca em caption `--color-mist`, nome do produto em `--font-sans` peso 700. Botão "Solicitar Amostra" ocupa a largura toda do card, altura mínima 44px.

### Botão Primário — "Solicitar Amostra" (elemento de assinatura)
Fundo `--color-gold` cheio, texto `--color-ink` peso 700 (nunca branco sobre dourado — contraste fraco), raio 10px, padding 12px/20px. É o único elemento que deve "gritar" na interface — o resto fica deliberadamente quieto pra esse botão ser sempre o ponto de maior contraste na tela. Hover/press troca para `--color-gold-dark`, nunca opacidade.

### Detalhe do Produto
Foto grande no topo com o mesmo tratamento de mat claro. Nome do produto em Fraunces heading-md, marca em caption. Diferenciais como tags pequenas com contorno `--color-graphite`. Comissão em destaque grande, em Fraunces — ganha peso editorial, não só numérico. Em mobile, o botão "Solicitar Amostra" fica fixo (sticky) na base da tela, pra nunca exigir rolar até o fim pra agir.

### Registro / Login
Card centralizado, largura máxima ~380px, fundo `--color-charcoal`, raio 20px. Inputs com fundo `--color-graphite`, borda transparente que vira `--color-gold` no focus (foco visível, não decorativo). Botão de submit dourado cheio, largura total. Link secundário ("Já tem cadastro? Fazer login") em `--color-mist`, sublinhado dourado no hover.

### Linha de "Minhas Solicitações"
Lista simples, sem card — divisor 1px `--color-graphite` entre linhas. Nome do produto peso 500, marca e data em caption `--color-mist` à direita, data em JetBrains Mono pra alinhamento limpo.

### Barra Lateral do Admin (sidebar)
Logo no topo, mesmo tratamento de tamanho do header público. Cada item de navegação é um par ícone + label (ver Tokens — Ícones), 12px de espaço entre eles, altura de linha de 44px com padding lateral — não é uma lista de texto corrida como saiu na primeira versão. Item ativo: barra vertical de 3px em `--color-gold` colada à esquerda + fundo em `--color-gold` a ~8% de opacidade (nunca dourado sólido — isso é fundo de item ativo, não CTA). Divisor sutil `--color-graphite` separando o bloco de navegação do rodapé (avatar/logout).

### Formulários do Admin (Marcas, Produtos, Criadoras, Divulgações...)
Todo campo de seleção (marca, produto, tipo de conteúdo) e todo campo de data usa componente customizado — nunca o `<select>` ou `<input type=date>` padrão do navegador, que não tem como ser estilizado de verdade e quebra o visual (foi exatamente o que aconteceu na tela de Divulgações da primeira versão). Usar um kit de componentes acessíveis pra isso (ex.: shadcn/ui — Select, Popover + Calendar) estilizado com os tokens deste guia.

### Tabela do Admin (Marcas / Produtos / Criadoras / Fila / Limites / Divulgações)
Em tela larga: tabela tradicional sobre `--color-ink`, cabeçalho em caption `--color-mist`, linhas divididas por 1px `--color-graphite`, hover de linha vira `--color-charcoal`. **Em mobile, cada linha vira um card empilhado** (pares label/valor) — nunca tabela com scroll horizontal, é o padrão mais comum de mobile ruim, e a equipe provavelmente vai abrir o admin do celular às vezes também.

## Do's and Don'ts

### Fazer
- Reservar o dourado cheio pro botão "Solicitar Amostra" e pro badge de comissão — as duas coisas que mais importam pra decisão da criadora, as únicas que devem competir por atenção.
- Usar o anel interno sutil, não sombra pesada, pra bordar card sobre fundo escuro.
- Manter alvo de toque mínimo de 44px em qualquer botão/link em mobile.
- Aplicar `cursor: pointer` e transição de hover/focus em todo elemento clicável, sem exceção.
- Dar ícone (lucide-react) pra todo item de navegação e todo botão de ação — ver Tokens — Ícones.

### Evitar
- Nunca branco em cima do dourado — vira ilegível.
- Não usar o dourado como fundo de área grande (seção inteira, header) — é destaque, não papel de parede. Fundo de item ativo em sidebar é a exceção, mas só a ~8% de opacidade.
- Não introduzir uma segunda cor "de marca" além de preto e dourado — qualquer cor extra dilui a identidade que vocês definiram.
- Não usar `<select>` ou `<input type=date>` nativos do navegador — ver Formulários do Admin.

## Layout (mobile-first)

- **Base (< 640px, prioridade real de uso)**: coluna única. Grid de produtos com 1 card por linha. Filtro de marca em scroll horizontal. Botão de ação principal sempre com largura total.
- **≥ 640px**: grid de produtos em 2 colunas.
- **≥ 1024px**: grid de produtos em 3–4 colunas; painel admin troca os cards empilhados por tabela tradicional.
- Largura máxima de conteúdo: 640px na área pública (é uma vitrine, não um dashboard — não precisa esticar em tela grande), 1200px no admin.

## Quick Start

Isso substitui o bloco `@theme` que já existe em `app/globals.css` (Tailwind v4 CSS-first, conforme o CLAUDE.md do projeto):

```css
@theme {
  /* Cores */
  --color-void: #0f0f0f;
  --color-ink: #151515;
  --color-charcoal: #212121;
  --color-graphite: #2c2c2c;
  --color-paper: #ffffff;
  --color-mist: #a8a29e;
  --color-gold: #fad214;
  --color-gold-dark: #e0bd0a;
  --color-alert: #f87171;

  /* Tipografia */
  --font-display: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
  --font-sans: 'Manrope', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* Escala tipográfica */
  --text-caption: 12px;
  --text-body-sm: 14px;
  --text-body: 16px;
  --text-heading-sm: 20px;
  --text-heading-md: 28px;
  --text-heading-lg: clamp(28px, 6vw, 44px);

  /* Espaçamento */
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-48: 48px;
  --spacing-64: 64px;

  /* Raio */
  --radius-pill: 999px;
  --radius-button: 10px;
  --radius-input: 10px;
  --radius-card: 20px;
}
```

## Agent Prompt Guide

1. **Card de produto**: fundo `--color-charcoal`, raio `--radius-card`, padding 12px. Foto sobre fundo neutro claro (mat), badge de comissão em pill `--color-gold` no canto superior direito da foto, texto `--color-ink` peso 700. Marca em caption `--color-mist`, produto em `--font-sans` peso 700 16px. Botão "Solicitar Amostra" largura total, fundo `--color-gold`, texto `--color-ink` peso 700, altura mínima 44px.
2. **Botão primário**: fundo `--color-gold`, texto `--color-ink` peso 700, raio `--radius-button`, padding 12px 20px, hover/press troca pra `--color-gold-dark` (nunca opacidade).
3. **Card de registro/login**: largura máxima 380px, fundo `--color-charcoal`, raio `--radius-card`, inputs com fundo `--color-graphite` e borda que vira `--color-gold` no focus.
4. **Item de sidebar do admin**: ícone lucide-react 20px + label lado a lado, gap 12px, altura 44px, padding lateral 12px. Item ativo: barra de 3px `--color-gold` à esquerda, fundo `--color-gold` a 8% de opacidade, texto `--color-paper`. Item inativo: texto `--color-mist`, sem fundo. Transição de fundo/cor 150ms.
5. **Card de produto ao carregar**: `opacity` 0→1 e `translateY(8px→0)` em ~200ms; numa grade, stagger de 30–40ms entre cards.
