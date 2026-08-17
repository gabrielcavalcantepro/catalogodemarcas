# Spec: Plataforma de Catálogo e Gestão de Criadoras — X Performance

## 1. Contexto

A X Performance é uma agência que faz a ponte entre marcas parceiras e o TikTok Shop, usando criadoras de conteúdo como estratégia de vendas. As criadoras são adicionadas a um grupo, onde conhecem as marcas, solicitam amostras de produtos e divulgam nas suas redes.

**Problema:** o grupo recebe criadoras novas constantemente, e a equipe precisa reexplicar manualmente, toda vez, quais são as marcas parceiras e quais produtos estão disponíveis. Isso é repetitivo e não escala.

## 2. Objetivo

Construir uma plataforma web com a identidade visual da X Performance que funcione como um catálogo self-service: a criadora acessa, vê as marcas e produtos disponíveis, solicita amostra, e consulta o que já pediu — sem depender da equipe reexplicar isso manualmente. A plataforma também deve substituir a planilha de controle de divulgações (UGC) que a equipe usa hoje.

## 3. Usuários e acesso

- **Criadora**: acesso via **Registro** (primeiro acesso) e **Login** (demais vezes) — sem senha.
  - **Registro**: Nome, E-mail e @ do TikTok. O @ funciona como validação: só é aceito se a equipe já tiver cadastrado esse @ previamente no painel admin (ver 5.1). Sem esse cadastro prévio, o registro é recusado. O e-mail é escolhido pela própria criadora nesse momento — não faz parte do cadastro prévio da equipe — e passa a valer, junto com o @, para os logins seguintes.
  - **Login**: E-mail + @ do TikTok (sem nome, já capturado no registro). Sempre exigidos quando não há sessão salva no dispositivo/navegador — não existe um modo de acesso só com @ que dispense o e-mail.
  - Sessão persistente evita repetir login no mesmo dispositivo/navegador a cada acesso.
- **Equipe X Performance (admin)**: acesso interno ao painel de gestão, separado da área pública das criadoras, com sessão persistente própria.

## 4. Área da criadora (pública)

### 4.1 Vitrine / Catálogo
- Grid de produtos, com filtro por marca.
- Cada produto exibe: nome, marca, descrição (resumida), diferenciais,
  preço (de vitrine, ou o de oferta relâmpago em destaque quando houver) e
  respectiva comissão, foto.
- Clicar no produto abre a página de detalhe (mesmas informações, de forma
  completa, com galeria de fotos).
- Botão "Solicitar Amostra" em cada produto (no grid e na página de
  detalhe) — some depois do primeiro pedido, virando um indicador "já
  solicitado em [data]" (ver 4.2).

### 4.2 Minhas Solicitações
- Histórico dos produtos que a própria criadora já solicitou (produto, marca, data).
- Não exibe status de rastreio/entrega — isso está fora do controle da plataforma (ver seção 6.2).
- Serve para a criadora não solicitar o mesmo produto duas vezes e ter noção do que já pediu de cada marca.

## 5. Painel admin (interno)

### 5.1 Cadastro de Criadoras
- CRUD de criadoras pela equipe: apenas o @ do TikTok (nome e e-mail ficam em branco até ela completar o registro, ver seção 3 — o e-mail é escolhido pela própria criadora nesse momento, não faz parte do cadastro prévio da equipe).
- É o que autoriza o registro dela na plataforma — sem uma linha aqui com o @ correspondente, o registro público é recusado.
- Depois que ela se registra, nome/e-mail ficam visíveis aqui (e editáveis pela equipe, ex.: correção de erro de digitação) e alimentam as outras telas do admin (fila, limites, divulgações).

### 5.2 Gestão de Marcas
- CRUD de marcas parceiras (nome, identidade visual da marca, o que for relevante).

### 5.3 Gestão de Produtos
- CRUD de produtos, vinculados a uma marca.
- Campos: nome, descrição, diferenciais, foto(s).
- **Preço e comissão**: dois pares — preço de vitrine + comissão de vitrine
  (sempre obrigatórios) e preço de oferta relâmpago + comissão de oferta
  relâmpago (opcionais, preenchidos/limpos juntos). Quando a oferta
  relâmpago está preenchida, ela é o preço/comissão em destaque na vitrine
  e na página do produto; sem agendamento de início/fim — a equipe ativa e
  desativa manualmente.
- **Comportamento de solicitação de amostra** (por produto — ver seção 6.1): "Redireciona para o TikTok Shop" ou "Notifica equipe (convite direto)".
- Quando o comportamento for "Redireciona para o TikTok Shop": URL da loja/produto no TikTok Shop.

### 5.4 Fila de Solicitações
- Lista dos pedidos feitos em produtos com comportamento "convite direto" (criadora, produto, marca, data do pedido).
- A equipe usa essa fila para ir até o TikTok e enviar o convite de colaboração manualmente.
- Deve sinalizar quando a criadora que pediu já atingiu o limite de amostras daquela marca (ver 6.2), para a equipe decidir se segue ou não com o convite.

### 5.5 Limites por Criadora
- Painel com o limite atual de amostras por criadora, por marca.
- Permite à equipe aumentar esse limite manualmente, criadora por criadora, marca por marca.

### 5.6 Divulgações
- Registro de conteúdo publicado por cada criadora (substitui a planilha atual): criadora, marca e/ou produto relacionado, tipo de conteúdo (vídeo / live / story), data, link (quando existir, principalmente para vídeo).
- Visão agregada com contagem de divulgações por criadora e por marca.

## 6. Regras de negócio

### 6.1 Comportamento de solicitação de amostra
Cada produto tem, no cadastro, uma configuração que define o que acontece quando uma criadora clica em "Solicitar Amostra":
- **Redireciona para o TikTok Shop**: a criadora é levada para a loja da marca dentro do próprio TikTok Shop, fora da plataforma.
- **Notifica equipe (convite direto)**: o pedido entra na Fila de Solicitações (5.4), e a equipe faz o convite de colaboração diretamente no TikTok.

### 6.2 Limite de amostras por marca
- O limite é definido **por marca**, cobrindo todos os produtos daquela marca — não é por produto individual.
- Existe um valor padrão (configurado a nível de marca) para o primeiro contato de uma criadora nova com aquela marca.
- A equipe pode aumentar esse limite individualmente, por criadora, conforme o desempenho de vendas dela — essa avaliação é manual e feita fora da plataforma; o sistema só precisa guardar e permitir editar o valor do limite.
- **Limitação conhecida e aceita**: esse limite só pode ser efetivamente controlado nos produtos com comportamento "convite direto", já que ali a equipe intermedia o convite. Nos produtos que redirecionam para o TikTok Shop, a plataforma não tem visibilidade nem controle sobre o que a criadora faz depois do clique — não é um bug a ser corrigido, é uma restrição real do modelo.

### 6.3 Controle de acesso das criadoras
- O registro público de uma criadora só é aceito se o @ bater com um cadastro já feito pela equipe (5.1). O e-mail não faz parte desse cadastro prévio — é escolhido pela própria criadora no momento do registro.
- Login subsequente sempre exige e-mail + @ quando não há sessão ativa no dispositivo — nunca só o @.

## 7. Identidade visual
- **Nome da marca:** X Performance
- **Cor base:** tons de preto — `#151515` ou `#212121`
- **Cor de destaque:** `#fad214`
- **Logo:** formato horizontal. O arquivo real deve estar na pasta `/brand/logo-horizontal.[png|svg]` do projeto — Claude Code deve usar esse arquivo (quando presente), não recriar ou gerar uma logo nova.

## 8. Fora de escopo nesta versão
Essas decisões já foram discutidas e descartadas conscientemente — não devem ser reabertas sem necessidade real comprovada:
- Login com senha / autenticação completa.
- Rastreio de status de entrega de amostra (solicitado → enviado → entregue).
- Dashboard de comissões/ganhos reais — não há integração com dados de venda do TikTok Shop.
- Conteúdo de apoio, ranking ou gamificação entre criadoras.
- Formulário de solicitação de amostra dentro da própria plataforma (a solicitação é sempre resolvida fora, no TikTok, ou via convite manual da equipe).
- Foto de perfil da criadora — nem extração automática do TikTok, nem upload manual. Pode ser revisitado numa versão futura.

## 9. Em aberto (decisão livre da implementação)
- Mecanismo técnico da sessão persistente (cookie/token) que evita repetir login no mesmo dispositivo entre visitas.
- Estrutura técnica, stack e hospedagem.
- Layout exato da vitrine e do painel admin.
- Aplicação exata da paleta na interface (proporção entre preto e amarelo de destaque, contraste, onde usar cada tom) fica a critério do design implementado.
