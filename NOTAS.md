# NOTAS de Aprendizado

Resumo dos conceitos aprendidos em cada sprint. Serve como material de estudo e como documentação de uso de IA (exigência do desafio).

---

## Sprint 1 — Fundação do backend: banco + autenticação

### Conceitos aprendidos

1. **JWT (JSON Web Token)** — Token assinado com chave secreta do servidor. Carrega `sub` (id do usuário) e `role` (papel). É *stateless*: o servidor não guarda sessão, só verifica a assinatura. Inseguro porém garantido: quem tentar adulterar o token, quebra a assinatura e recebe `401`.

2. **Migrations (Alembic) vs `create_all()`** — `create_all()` cria tabelas mas não evolui schema. Alembic versiona cada mudança (`revision --autogenerate` compara models com o banco e gera um script). Essencial em produção, onde o banco não pode ser recriado do zero.

3. **SQLAlchemy 2 (Mapped/mapped_column)** — Cada classe que herda de `Base` vira uma tabela. `ForeignKey` cria relacionamentos no banco; `relationship()` só existe em Python (permite `event.seats`). `unique=True` em coluna é proteção a nível de banco (ex: `ticket_id` único em validações bloqueia validação dupla).

4. **Hash de senha (bcrypt)** — Nunca guardar senha em texto puro. `bcrypt.hashpw()` gera um hash com salt aleatório; `bcrypt.checkpw()` compara. Limite de 72 bytes por design.

### Erros que valem anotar

- **`ImportError: cannot import name 'verificar_senha'`** — Import e definição precisam ter exatamente o mesmo nome. Erro clássico ao renomear função.
- **passlib × bcrypt 5.0.0** — passlib 1.7.4 está sem manutenção e quebra com bcrypt novo: erro "password cannot be longer than 72 bytes" mesmo com senha curta. Solução: usar `bcrypt` diretamente (menos uma camada).
- **`organizador_id` None no seed** — Objeto só recebe `id` quando o SQLAlchemy *flusha* (`db.flush()`). Com `autoflush=False`, era preciso flush explícito dentro de `criar_usuario`.
- **Pasta com typo `almebic`** — alembic.ini apontava pra pasta errada (`script_location`), falha "Path doesn't exist".

### Erros de ambiente

- **Porta 8000 ocupada** — outra app já usa 8000; a API roda na **8001**.
- **Porta 5432 ocupada** — outro Postgres na máquina; o container usa **5433**.

---

## Sprint 2 — (em andamento)
---

## Sprint 5 — Meus ingressos + Portaria (QR, câmera, validação)

### Conceitos aprendidos

1. **QR Code com HMAC** — O ingresso não é um número, é um payload JSON (`{"share_token": ..., "evento_id": ...}`) assinado com HMAC. A portaria só confia no código se a assinatura bate com a chave secreta (`hmac.compare_digest`). Assim, um código forjado quebra a assinatura → "inválido". Ver: `backend/app/services/ingresso.py`.

2. **`html5-qrcode` e o ciclo de vida da câmera** — A lib precisa que o `<div id="reader">` já exista no DOM antes de `start()`. Bugs clássicos:
   - Iniciar a câmera **no mesmo evento de clique** que monta o div (React ainda não renderizou) → falha. Correto: `useEffect` disparado por `modo === 'camera'`.
   - A lib mantém a câmera ligada mesmo quando a tela muda → precisa parar no `return` do `useEffect` (cleanup) ao sair da página.
   - Para "Ler outro", usar um **contador de sessão** (`sessaoScan`) que força o `useEffect` a reiniciar, em vez de tentar re-setar o mesmo modo.

3. **`selectinload` para N+1** — `/tickets/mine` busca tickets com `selectinload(Ticket.event, Ticket.seat)` para carregar evento e assento numa query só (sem N+1).

4. **`primaryjoin` em relationship** — `Event.tmdb_movie_id == Movie.tmdb_id` liga duas tabelas por chave lógica, sem coluna FK no banco.

### Erros que valem anotar

- **`Html5Qrcode` e a câmera** — achar que "re-setar modo igual" reinicia a câmera. Não reinicia: `useEffect` só dispara quando o valor *muda*. Solução: `sessaoScan` como dependência.
- **Assento pertence a um evento** — num teste, tentar comprar assento do evento A no evento B → 400 "assento não existe neste evento". Cada assento tem `event_id`.

### Fluxo validado na portaria (via API)

`válido` → `ja_utilizado` → `invalido` (forjado) → `evento_errado` (evento_id divergente). Todos com `mensagem` clara em português.

---

## Sprint 5.5 — Identidade visual CineElite (parecer "feito por gente")

### O que delatava "design de IA" e como corrigimos

1. **Paleta genérica** — índigo `#4f46e5` + cinza `#f7f7f8` é o combo padrão de modelos (violeta default do Tailwind). Troca por **paleta quente de cinema claro**: creme `#faf6ef`, texto café `#292524`, acento **âmbar `#d97706`**, bordas areia. Paleta quente ≠ fria muda a percepção inteira.

2. **Tipografia sem alma** — `system-ui` em tudo. Adicionada fonte display **Fraunces** (serifada editorial, Google Fonts) só nos títulos/h1/h2/h3/marca; corpo segue em system-ui. Uma fonte display em lugares certos é a mudança de maior impacto visual por menor esforço.

3. **`style={{...}}` inline espalhado** — espaçamentos sem escala, cheiro de geração de código. Criadas **classes utilitárias** em CSS (`flex`, `flex-between`, `flex-col`, `gap-sm/md/lg`, `mt-*`, `mb-*`, `form-row`) e refatoradas todas as páginas. Resultado: espaçamento consistente e JSX mais limpo.

### Peças de identidade

- **Logo** (`components/Logo.jsx`): SVG inline de ingresso com perfurações + wordmark "CineElite" em Fraunces (Elite em âmbar). Favicon recriado com o mesmo ícone.
- **Ingresso com estética de bilhete** (`.ticket`): QR em moldura à esquerda + dados + **coluna de perfuração** (`.ticket-rip`) feita com `radial-gradient` criando o "corte perfurado" de bilhete real.
- **Mapa de assentos com "Tela"** (`.screen-bar`): elipse com rótulo "TELA" no topo, como sala de cinema.
- **Cards com hover sutil** (lift + sombra), Home com header em gradiente quente.

### Lição
"Feito por gente" não é capricho: é **paleta com temperatura**, **tipografia com voz** e **consistência de escala** (nada de margem 14px num lugar e 16px noutro). IA tende ao meio-termo cinza; decisões visuais com personalidade são o que diferencia.

---

## Sprint 5.7 — Revisão de segurança (básica)

### Vulnerabilidade corrigida (crítica)
**Registro público aceitava `role` do cliente** — qualquer pessoa podia se registrar como `organizador` ou `portaria` e virar admin (escalonamento de privilégio). Correção: `UsuarioCreate` não aceita mais `role` (removido do schema) e o backend fixa `role="cliente"` no registro. Papéis privilegiados só vêm do seed.

### Endurecimentos adicionais
- **Senha mínima de 8 caracteres** — validação no schema Pydantic (`Field(min_length=8)`) + aviso no frontend. Limite de 72 bytes respeita o bcrypt.
- **JWT com `iat`** — "issued at" no token, além do `exp` (já existia).
- **Dupla checagem de role** — `get_current_user` agora valida que a role do token bate com a do banco; se o papel mudar, o token antigo é rejeitado.
- **`nome` com min_length/max_length** — evita payloads absurdos.

### O que já estava correto (confirmado por teste)
- bcrypt com salt; mensagens de login genéricas (não revela se email existe).
- JWT HS256 com expiração de 60min; `require_role` checa papel no banco.
- SQL parametrizado (SQLAlchemy) — sem SQL injection.
- `.env` no `.gitignore`; SECRET_KEY de 64 chars.
- Reserva de assento atômica (UPDATE condicional) — sem venda dupla.
- HMAC no QR — código infalsificável.
- Validação de dono em editar/cancelar evento.

### Testes de segurança executados (todos passando)
`role=organizador` no registro → vira cliente (201) · senha curta → 422 · cliente criando evento → 403 · login inválido → 401 genérico · token adulterado → 401 · org/portaria do seed seguem funcionando.

---

## Sprint 5.8 — Token em cookie HttpOnly (anti-XSS)

### Por quê
O token JWT ficava no `localStorage` — qualquer XSS (script injetado) lê `localStorage` e rouba o token. Em **cookie HttpOnly** o JavaScript nem enxerga o cookie; só o browser o envia automaticamente.

### Mudanças
- **Backend**: `login` agora define `Set-Cookie: access_token` com `HttpOnly`, `SameSite=lax` (e `secure` em produção). Novo `POST /auth/logout` que expira o cookie. Novo `GET /auth/me` que valida o cookie e devolve o usuário.
- **`deps.py`**: `get_current_user` lê o token **primeiro do cookie**, com fallback pro header `Authorization` (mantém compatibilidade com curl/scripts).
- **Frontend**: axios com `withCredentials: true`; `AuthContext` restaura a sessão chamando `/auth/me` no load; `logout` chama o endpoint. `localStorage` agora só guarda dados não sensíveis (email/role p/ roteamento).

### Importante
- **CORS com credentials**: `allow_credentials=True` + origem explícita (`localhost:5173`) — no deploy, adicionar o domínio do Vercel.
- **`SameSite=lax`** funciona em dev (mesmo host `localhost`). Em produção (frontend e API em domínios diferentes) pode precisar `SameSite=None; Secure` — aí o backend precisa de HTTPS (Render/Vercel já têm).
- **Node não persiste cookies** por padrão — teste via curl com `-c/-b` (jar) reproduz o comportamento do browser.

## Sprint 6.1 — Deploy em produção + responsivo + câmera + SEO

### Deploy (Render + Vercel + Neon)
O projeto saiu do local e foi pra produção:
- **Backend**: Web Service no Render (Root Directory `backend`, Python). No boot roda `alembic upgrade head && python scripts/seed.py && uvicorn` (migração + seed automáticos a cada deploy).
- **Frontend**: Vercel, Root Directory `frontend`, env `VITE_API_URL` apontando pro Render. Nome do projeto: `cineelite`.
- **Banco**: Postgres gerenciado no **Neon** (gratuito, não expira como o do Render).
- **Cookie em produção**: `COOKIE_SECURE=true` + `COOKIE_SAMESITE=none` (domínios diferentes exigem isso) e `CORS_ORIGINS=https://cineelite.vercel.app`.

### Erros que valem anotar
- **Alembic não lia `DATABASE_URL`**: o `env.py` usa `config.get_main_option("sqlalchemy.url")` do `alembic.ini` (localhost). Tentei migrar o Neon com a env var e **nada aconteceu** (a migração foi pro banco local). Correção: `config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)` no `env.py`.
- **Seed antes da migração**: rodei o `seed.py` contra o Neon antes de aplicar a migração → `relation "users" does not exist`. Ordem importa: migração primeiro, seed depois (no Dockerfile/start command já está nessa ordem).
- **Render procurou `requirements.txt` na raiz**: o serviço detectou Python e tentou buildar na raiz do repo. Correção: `Root Directory: backend` no Render.
- **Links profundos quebravam no Vercel**: `/ingresso/:token` (link compartilhado!) e `/eventos/1` davam **404 no refresh** — o Vercel não sabia redirecionar pra SPA. Correção: `frontend/vercel.json` com rewrite de todas as rotas pra `/index.html`. Foi um bug real do compartilhamento, não só de SEO.

### Responsivo (era 100% desktop)
Zero media queries no CSS. Adicionei:
- **Menu hambúrguer** no mobile (`Navbar.jsx` com `useState` + fechar ao clicar fora) — foi a opção que escolhi em vez de só quebrar linha.
- Media queries `768px` (layout quebra) e `480px` (ajustes finos): ticket empilha com o rasgo na horizontal, mapa de assentos rola de lado com assentos menores, forms viram coluna, pôster do evento em largura cheia.
- Desktop permanece **inalterado** (media queries só aplicam abaixo do breakpoint).

### Câmera da portaria ("parece distante")
O `qrbox` era fixo em 250×250 — a câmera filma a cena inteira, então o QR precisava caber numa caixa pequena e você tinha que afastar o celular. Correções:
- `qrbox` proporcional à largura da tela (`min(largura * 0.8, 340)`).
- `applyVideoConstraints({ advanced: [{ zoom: 2 }] })` após iniciar (funciona em Android; é ignorado onde não suporta).
- CSS: `#reader video` em `width: 100%` (o `html5-qrcode` renderiza o vídeo pequeno/centralizado por padrão).

### SEO (aparecer no Google)
- Meta tags: `description`, `keywords`, `robots`, `canonical`, `theme-color`.
- **Open Graph** (`og:title/description/url/image`) e **Twitter Card** — prévia bonita ao compartilhar link.
- **JSON-LD** (`WebSite` + `SearchAction`) — dados estruturados pro Google.
- `public/robots.txt` + `public/sitemap.xml`.
- Escolhi **SEO estático** (meta fixas, zero dependências novas) em vez de `react-helmet-async` — limite honesto: título/meta por-página exigiria a dependência.

### Lição
**Ordem no deploy importa**: migração → seed → código. E **testar produção de verdade** (link compartilhado, refresh de rota, CORS cross-origin) pega bugs que o ambiente local nunca mostra.
