# CineElite 🎬 — Plataforma de Eventos e Ingressos

**Desafio Elite Dev 2026** — Plataforma onde o organizador publica eventos de cinema, o cliente compra ingressos com assento marcado e a portaria valida o QR na entrada.

Este é o meu processo de construção do zero: cada decisão técnica, cada erro que cometi no caminho e como a IA (e a minha cabeça) me ajudaram a resolver. Tudo está documentado no [`NOTAS.md`](./NOTAS.md) e no [`PLANO-DE-SPRINTS.md`](./PLANO-DE-SPRINTS.md).

---

## Sumário

- [O que o sistema faz](#o-que-o-sistema-faz)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Como rodar localmente](#como-rodar-localmente)
- [Dados de teste](#dados-de-teste)
- [Fluxo de uso](#fluxo-de-uso)
- [Endpoints da API](#endpoints-da-api)
- [Segurança](#segurança)
- [O que não funciona / limitações](#o-que-não-funciona--limitações)
- [Uso de IA — como esse projeto foi feito](#uso-de-ia--como-esse-projeto-foi-feito)

---

## O que o sistema faz

O desafio pedia uma plataforma de eventos e ingressos. Eu escolhi fazer com **cinema** como tema (em vez de shows), porque a API externa gratuita do TMDb tem um catálogo enorme de filmes, e o mapa de assentos de cinema é um diferencial visual que combina com a identidade da aplicação.

O fluxo completo é esse:

1. O **organizador** busca um filme no catálogo do TMDb, define data, local e preço, e publica o evento.
2. O **cliente** navega pelos eventos, escolhe o assento no mapa, reserva e paga (de forma simulada).
3. Ao pagar, o cliente recebe um **ingresso com QR Code** que pode ser **compartilhado por link**.
4. Na entrada, a **portaria** lê o QR pela câmera (ou digita o código manualmente) e o sistema responde: **válido, inválido, já utilizado ou evento errado**.

---

## Tecnologias

| Camada | Escolha | Por quê |
|---|---|---|
| Backend | **Python + FastAPI** | Rápido de desenvolver, documentação automática (`/docs`), async de graça |
| Frontend | **React + Vite** | O desafio pede React; Vite é rápido e simples |
| Banco | **PostgreSQL** | Transações atômicas — essencial pra nunca vender o mesmo assento 2x |
| ORM/Migrations | **SQLAlchemy 2 + Alembic** | Padrão de mercado, migrações versionadas |
| Autenticação | **JWT em cookie HttpOnly** | Stateless e mais seguro contra XSS (detalhe na seção de segurança) |
| API de catálogo | **TMDb** | Gratuita, catálogo de filmes, combina com o tema cinema |
| QR Code | **`qrcode.react` (front) + assinatura HMAC (back)** | Ingresso impossível de forjar |
| Leitura de QR | **`html5-qrcode`** | Funciona pela câmera no browser |
| Docker | **Postgres em container** | Ambiente local reproduzível |

---

## Arquitetura

Monorepo com duas aplicações e um banco:

```
projeto_elite_dev/
├── backend/                     # API FastAPI
│   ├── app/
│   │   ├── main.py              # app, CORS, rotas
│   │   ├── core/config.py       # settings (.env)
│   │   ├── db/                  # engine, session, base
│   │   ├── models/              # User, Event, Seat, Reservation, Ticket, Validation, Movie
│   │   ├── schemas/             # Pydantic (validação de entrada/saída)
│   │   ├── api/
│   │   │   ├── routes/          # auth, events, reservas, tickets, portaria
│   │   │   └── deps.py          # get_current_user, require_role
│   │   └── services/            # security (JWT/bcrypt), tmdb_client, ingresso (HMAC)
│   ├── alembic/                 # migrations do banco
│   ├── scripts/seed.py          # dados de teste
│   ├── .env.example             # modelo de configuração
│   └── requirements.txt
├── frontend/                    # SPA React
│   ├── src/
│   │   ├── pages/               # Home, EventoDetalhe, Checkout, MeusIngressos, Portaria, Painel, Login, Registro
│   │   ├── components/          # Navbar, Logo, EventCard, SeatMap
│   │   ├── services/api.js      # axios (com cookie)
│   │   ├── context/AuthContext.jsx
│   │   └── App.jsx              # rotas protegidas por papel
│   ├── .env                     # VITE_API_URL
│   └── package.json
├── docker-compose.yml           # só o Postgres
├── NOTAS.md                     # minhas notas de aprendizado (e doc de uso de IA)
└── PLANO-DE-SPRINTS.md          # planejamento das sprints
```

**Modelo de dados:** `users` (3 papéis) → `events` (por filme TMDb) → `seats` (assentos com status) → `reservations` → `tickets` (com código HMAC e share_token) → `validations` (anti-duplicação).

---

## Como rodar localmente

### Pré-requisitos

- **Docker** (pra subir o Postgres)
- **Python 3.12+** (testado no 3.14)
- **Node 20+** (testado no 22)

### 1. Suba o banco

```bash
docker compose up -d
```

Isso sobe um Postgres 16 na porta **5435** (usei essa porta porque 5432 e 5433 já estavam ocupadas na minha máquina — se a sua estiver livre, pode ajustar o `docker-compose.yml` e o `DATABASE_URL`).

### 2. Configure o backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Crie o `.env` a partir do exemplo:

```bash
cp .env.example .env
```

Preencha os valores:

```bash
DATABASE_URL=postgresql+psycopg://elite:elite_dev@localhost:5435/elite_dev
SECRET_KEY=coloque-uma-chave-aleatoria-longa-aqui
ACCESS_TOKEN_EXPIRE_MINUTES=60
TMDB_API_KEY=sua-chave-do-tmdb
TMDB_BASE_URL=https://api.themoviedb.org/3
```

> 💡 A chave do TMDb é gratuita: crie uma conta em themoviedb.org e gere uma API Key em "Settings → API".

### 3. Crie as tabelas e o seed

```bash
alembic upgrade head
python scripts/seed.py
```

O `seed.py` cria os usuários de teste e um evento publicado (com assentos). Rode uma vez só.

### 4. Rode a API

```bash
uvicorn app.main:app --reload --port 8004
```

A API sobe em `http://localhost:8004`. A documentação interativa fica em `http://localhost:8004/docs`.

> 💡 Por que a porta 8004? As portas 8000–8003 estavam ocupadas na minha máquina. Se a sua estiver livre, use a que preferir e ajuste o `frontend/.env` de acordo.

### 5. Configure e rode o frontend

```bash
cd frontend
npm install
```

Crie o `.env`:

```bash
echo "VITE_API_URL=http://localhost:8004" > .env
```

Rode:

```bash
npm run dev
```

O app abre em `http://localhost:5173`.

---

## Dados de teste

O seed cria esses usuários pra você percorrer o fluxo sem montar nada:

| Papel | Email | Senha |
|---|---|---|
| Organizador | `org@teste.com` | `org123` |
| Cliente | `ana@teste.com` | `cliente123` |
| Cliente | `bruno@teste.com` | `cliente123` |
| Portaria | `portaria@teste.com` | `portaria123` |

Além disso, publica um evento de exemplo ("Duna: Parte Dois") com assentos disponíveis.

**Cartão de teste:** use `4242 4242 4242 4242` (validade `12/30`, CVV `123`) pra **aprovar** o pagamento. Qualquer outro número **recusa** (e o estoque é liberado).

---

## Fluxo de uso

### Cliente

1. Crie uma conta ou entre como `ana@teste.com`.
2. Na Home, escolha um filme → veja o detalhe com o **mapa de assentos**.
3. Selecione 1 ou mais assentos → **Reservar** → pague com o cartão 4242.
4. Em **Meus ingressos**, você vê seu bilhete com o QR e a data/local do evento.
5. **Compartilhar** copia um link público do ingresso (`/ingresso/<token>`).

### Portaria

1. Entre como `portaria@teste.com`.
2. Na tela de portaria, escolha **Ler com câmera** (auto-valida ao ler o QR) ou **Digitar código**.
3. O dropdown de evento permite testar o retorno **"evento errado"** (selecionando um evento diferente do ingresso).

### Organizador

1. Entre como `org@teste.com`.
2. No **Painel**, busque um filme no TMDb, selecione, defina data/local/preço e publique.
3. Você pode **cancelar** um evento — só não consegue se ele já tiver ingressos vendidos (proteção que eu adicionei).

---

## Endpoints da API

| Método | Rota | Papel | Descrição |
|---|---|---|---|
| POST | `/auth/register` | público | Criar conta (sempre como **cliente** — ver segurança) |
| POST | `/auth/login` | público | Login (seta cookie HttpOnly) |
| GET | `/auth/me` | autenticado | Usuário atual |
| POST | `/auth/logout` | autenticado | Sai e expira o cookie |
| GET | `/events` | público | Lista eventos (com pôster do filme) |
| GET | `/events/search-tmdb` | público | Busca filmes no TMDb |
| GET | `/events/{id}` | público | Detalhe + assentos |
| POST | `/events` | organizador | Cria evento (gera assentos A–D) |
| PATCH | `/events/{id}` | organizador (dono) | Edita evento |
| DELETE | `/events/{id}` | organizador (dono) | Cancela evento (bloqueado com vendas) |
| POST | `/events/{id}/reserve` | cliente | Reserva assentos (atômico, 409 em conflito) |
| POST | `/reservations/{id}/pay` | cliente (dono) | Pagamento simulado (402 recusa) |
| GET | `/tickets/mine` | cliente | Meus ingressos com QR |
| GET | `/tickets/share/{token}` | público | Ingresso compartilhado por link |
| POST | `/portaria/validate` | portaria | Valida QR: `valido`, `ja_utilizado`, `evento_errado`, `invalido` |

---

## Segurança

Eu fiz uma revisão de segurança durante o projeto e corrigi uma vulnerabilidade séria que existia:

### 🔴 Corrigido: escalonamento de privilégio no registro

**Antes:** o endpoint `/auth/register` aceitava `role` no corpo da requisição. Ou seja, qualquer pessoa podia se registrar como `organizador` ou `portaria` e virar "admin" da plataforma. Grave.

**Depois:** o schema não aceita mais `role`, e o backend fixa `role="cliente"` no registro. Papéis privilegiados só existem no seed.

### O que mais foi reforçado

- **Senha mínima de 8 caracteres** — validada no backend (Pydantic) e no frontend.
- **JWT com `iat` e `exp`** — expira em 60 minutos; o `require_role` checa o papel **no banco**, não confia no token.
- **Token em cookie HttpOnly** — o JavaScript não consegue ler o cookie, então um XSS não rouba o token. Antes o token ficava no `localStorage` (lê-se com uma linha de JS).
- **QR infalsificável** — o código do ingresso é um payload JSON assinado com **HMAC-SHA256** usando a `SECRET_KEY` do servidor. Qualquer adulteração quebra a assinatura → `invalido`.
- **Assento não vendido 2x** — a reserva usa um `UPDATE` condicional atômico (`WHERE status='livre'`); se dois pedidos disputarem o mesmo assento, um recebe **409**.
- **Ingresso não validado 2x** — ao validar, o ticket vira `utilizado` e a tabela `validations` tem `ticket_id` **UNIQUE** (proteção extra no banco).
- **`SECRET_KEY` e `TMDB_API_KEY` fora do git** — o `.env` está no `.gitignore`.
- **CORS restrito** — só `localhost:5173` (em produção, o domínio do frontend).

---

## O que não funciona / limitações

Sendo honesto sobre o que não está pronto:

- **Deploy**: a aplicação roda localmente (backend `:8004`, frontend `:5173`). A publicação em produção (Render + Vercel) é o próximo passo do planejamento.
- **Câmera na portaria**: a leitura por câmera está implementada, mas eu só consegui testar o fluxo completo por digitação manual (sem uma webcam/celular no mesmo IP no momento do teste). O fluxo da câmera deve ser testado em produção (HTTPS libera acesso à câmera no browser).
- **Testes automatizados**: não há suíte de testes automatizada ainda; a validação foi feita por testes de API manuais (scripts/curl) ao longo do desenvolvimento.
- **Sem pagamento real**: a cobrança é 100% simulada (4242 aprova, qualquer outro recusa), como o desafio permite.
- **Não fazemos** (fora do escopo, como o desafio sugere): nota fiscal, revenda entre usuários, recuperação de senha, envio por e-mail.

---

## Uso de IA — como esse projeto foi feito

O desafio diz que a IA deve ser usada como ferramenta, e foi exatamente assim que eu trabalhei. Nada de colar o enunciado e receber o sistema pronto — a construção foi **em parceria com a IA, comigo escrevendo, tomando decisões e entendendo cada pedaço**.

### O que eu fiz sem IA

- **Decisões de arquitetura** — escolhi FastAPI + React + Postgres, mapa de assentos (em vez de pista), tema cinema.
- **Modelagem de dados** — pensei em como eventos, assentos, reservas, ingressos e validações se relacionam.
- **Identidade visual** — paleta âmbar quente, fonte Fraunces, ingresso com visual de bilhete perfurado, mapa de assentos com a "tela" de cinema. Eu rejeitei o primeiro design porque ele parecia genérico demais (exatamente o "AI slop" que o desafio menciona) e pedi uma direção mais autoral.
- **Fluxos de negócio** — a lógica de reserva, pagamento, compartilhamento e validação foi discutida e entendida por mim antes de implementar.
- **Testes manuais** — percorri cada fluxo na API e no browser.

### O que a IA me ajudou

- **Guiar o aprendizado** — funcionou como um professor nos conceitos (JWT, transações atômicas, HMAC, migrations).
- **Apontar bugs** — me ajudou a diagnosticar erros que eu não conseguia ver (como o bug da câmera, que iniciava antes do DOM existir).
- **Sugerir padrões** — como usar `selectinload` pra evitar N+1, e a estética do ingresso perfurado (o CSS do "rasgo" do bilhete).
- **Revisão de segurança** — a IA apontou a vulnerabilidade crítica de escalonamento de privilégio e o problema do token no `localStorage`.

### Documentação do processo

- [`NOTAS.md`](./NOTAS.md) — minhas notas de aprendizado de cada sprint, incluindo os erros que cometi (tem vários, honestamente: porta ocupada, passlib incompatível com bcrypt 5, câmera que não iniciava, assento de evento errado num teste...).
- [`PLANO-DE-SPRINTS.md`](./PLANO-DE-SPRINTS.md) — o planejamento de sprints e a metodologia colaborativa.

---

Feito com carinho pra entrega do **Desafio Elite Dev 2026** 🎬