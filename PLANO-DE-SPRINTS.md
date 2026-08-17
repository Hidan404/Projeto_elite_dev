# Plano de Desenvolvimento — Plataforma de Eventos e Ingressos

**Desafio Elite Dev 2026** — cronograma: **sábado 15/08 até sexta 21/08/2026** (6 dias de execução + setup hoje).

---

## 0. Metodologia colaborativa (como vamos trabalhar)

Este projeto é **construído em parceria**: você faz a mão na massa e eu guio. Cada sprint segue o mesmo fluxo:

1. **Mini-aula (15–20 min)** — explico os conceitos-chave da sprint (JWT, transações atômicas, HMAC, etc.) com analogias e exemplos.
2. **Você escreve o código** — com minhas dicas de estrutura, o que fazer e por quê. Eu **não** escrevo a solução por você.
3. **Eu reviso junto** — apontamos erros, você corrige, e explicamos o porquê de cada decisão.
4. **Teste prático** — rodamos o que foi construído (browser, Postman/curl) e validamos.
5. **Resumo de aprendizado** — você anota 3 bullets do que aprendeu para consolidar.

### Regras da nossa colaboração

- Eu dou estrutura, snippets pequenos, aponto bugs e explico conceitos. A lógica de negócio (reserva, QR, validação) é **sua**.
- Se travar, eu quebro o problema em passos menores em vez de resolver no seu lugar.
- A sprint só avança quando **você se sentir confortável** com o que foi feito.
- Cada mini-aula gera um `NOTAS.md` na raiz com o resumo dos conceitos aprendidos (vira material de estudo e parte da documentação de IA do desafio).

---

## 1. Decisões técnicas fechadas

| Área | Decisão | Justificativa |
|---|---|---|
| Backend | Python + FastAPI | Obrigatório pelo desafio, alto rendimento com async |
| Frontend | React + Vite | Obrigatório, build rápido e simples |
| Banco de dados | PostgreSQL (local via Docker, produção via Neon/Supabase) | Confiável, transações atômicas para não vender assento 2x |
| ORM/Migrations | SQLAlchemy 2 + Alembic | Padrão de mercado, migrations versionadas |
| Autenticação | JWT (3 papéis: organizador, cliente, portaria) | Simples e stateless |
| API de catálogo | TMDb (filmes) | Chave gratuita, combina com cinema/mapa de assentos |
| Tipo de reserva | Mapa de assentos (cinema/teatro) | Diferencial visual, alinhado ao TMDb |
| Pagamento | Simulação própria (aceita/recusa) | Sem dependência externa |
| QR Code | `qrcode` (back) + assinatura HMAC | Ingresso impossível de forjar |
| Deploy | Backend → Render; Frontend → Vercel | Vercel não roda Python; Render tem free tier |
| Documentação | README detalhado + seção de Uso de IA | Exigência do desafio |

---

## 2. Arquitetura do repositório (monorepo)

```
projeto_elite_dev/
├── backend/
│   ├── app/
│   │   ├── main.py              # criação da app FastAPI, CORS, rotas
│   │   ├── core/                # config, security (JWT, HMAC), constants
│   │   ├── db/                  # session, engine, base
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── api/
│   │   │   ├── routes/          # auth, eventos, reservas, ingressos, portaria
│   │   │   └── deps.py          # dependências (get_current_user, roles)
│   │   └── services/            # tmdb_client, reserva, pagamento, ingresso
│   ├── alembic/                 # migrations
│   ├── tests/
│   ├── scripts/seed.py          # dados de teste
│   ├── requirements.txt / pyproject.toml
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/               # Home, Detalhe, Checkout, MeusIngressos, Portaria, Painel
│   │   ├── components/          # SeatMap, TicketQR, TicketCard, EventCard...
│   │   ├── services/api.ts      # cliente axios
│   │   ├── context/             # AuthContext
│   │   └── router.tsx
│   ├── .env.example             # VITE_API_URL
│   └── package.json
├── README.md
├── NOTAS.md                    # resumo de aprendizado de cada sprint (e serve de doc de IA)
└── docker-compose.yml           # só o Postgres local
```

**Regra de ouro (vem do PDF):** o fluxo inteiro simples e completo vale mais que pedaços sofisticados. Cada sprint termina com o sistema rodando de ponta a ponta no que já existe.

---

## 3. Modelo de dados resumido

- **users** — id, nome, email, senha (hash bcrypt), role (`organizador` | `cliente` | `portaria`)
- **events** — id, tmdb_movie_id, titulo, data, local, capacidade_total, preco, organizador_id, criado_em
- **seats** — id, event_id, fileira, numero, status (`livre` | `reservado` | `vendido`)
- **reservations** — id, event_id, user_id, seat_ids (ou 1 reserva por assento), status (`pendente` | `paga` | `cancelada`), criado_em
- **tickets** — id, reservation_id, event_id, user_id, seat_id, codigo (payload), hash_qr (HMAC), status (`ativo` | `utilizado`), link_compartilhado (token)
- **validations** — id, ticket_id, validado_em, resultado (evita validação duplicada)

---

## 4. Segurança do ingresso (não pode ser forjado)

- Payload JSON do QR: `{ticket_id, event_id, seat, HMAC}`.
- HMAC com chave secreta do servidor (`SECRET_KEY`).
- O QR só carrega o **código** (não é só o HMAC exposto): ao validar, o backend re-deriva o HMAC e compara.
- Compartilhamento por **link com token único** (`/share/<token>`), token aleatório de alta entropia.

---

## 5. Cronograma geral

| Dia | Sprint | Mini-aula | Você constrói |
|---|---|---|---|
| Sáb 15 (hoje) | **Setup** | O que é monorepo, Docker, venv, `.env` | Estrutura de pastas, compose, chave TMDb |
| Dom 16 | **Sprint 1** | REST, FastAPI, SQLAlchemy, JWT e roles | Models, migrations, auth, seed |
| Seg 17 | **Sprint 2** | HTTP, cliente TMDb, cache, CRUD | Catálogo, eventos, assentos |
| Ter 18 | **Sprint 3** | Transação atômica, HMAC, QR, idempotência | Reserva, pagamento simulado, portaria |
| Qua 19 | **Sprint 4** | React, Vite, rotas, contexto, axios | Setup front, login, listagem/busca |
| Qui 20 | **Sprint 5** | Estado de UI, mapa interativo, QR na câmera | Mapa de assentos, checkout, ingressos, portaria |
| Sex 21 | **Sprint 6** | Deploy, migrations em produção, README | Publicação Render+Vercel, docs, envio |

---

## Sprint 0 — Setup do ambiente (hoje, sábado)

**Objetivo:** ambiente 100% pronto para não perder tempo nas sprints.

### Mini-aula
- O que é um monorepo e por que `backend/` + `frontend/` juntos
- Docker e Docker Compose na prática (só para o Postgres)
- Virtualenv vs. dependências globais; por que `.env` nunca vai para o git

### Mão na massa (você executa, eu guio)
- [ ] Criar repositório GitHub público (`projeto-elite-dev`) e clonar local
- [ ] Verificar Node.js 20+, Python 3.11+, Docker instalados
- [ ] Criar `docker-compose.yml` com Postgres local (porta 5432)
- [ ] Obter chave da API do TMDb (developer.themoviedb.org) e salvar em `.env`
- [ ] `git init`, estrutura base de pastas `backend/` e `frontend/`
- [ ] `backend`: criar venv, instalar FastAPI, uvicorn, SQLAlchemy, alembic, pydantic-settings, python-jose, passlib[bcrypt], qrcode, httpx, psycopg2-binary
- [ ] `frontend`: `npm create vite@latest frontend -- --template react`
- [ ] Commit inicial com mensagem descritiva

### Resumo de aprendizado
- [ ] Anotar 3 coisas aprendidas no `NOTAS.md`

---

## Sprint 1 — Fundação do backend: banco + autenticação (domingo)

**Objetivo:** API rodando com banco, migrations e 3 papéis com login.

### Mini-aula
- Como funciona uma API REST e o que o FastAPI automatiza (validação, docs em `/docs`)
- SQLAlchemy: ORM, engine, sessão, e por que migrations (Alembic) em vez de `create_all`
- JWT na prática: o que é um token, claims, `sub` e `role`, e por que é stateless
- Hash de senha (bcrypt) vs. armazenar em texto puro

### Mão na massa (você escreve, eu guio)
### Backend
- [ ] Config em `app/core/config.py` via pydantic-settings (lê `.env`)
- [ ] Engine, session e Base do SQLAlchemy em `app/db/`
- [ ] Models `User`, `Event`, `Seat`, `Reservation`, `Ticket`, `Validation`
- [ ] Alembic: `alembic init`, primeira migration, `alembic upgrade head`
- [ ] Endpoints de auth:
  - `POST /auth/register` (cria usuário com role)
  - `POST /auth/login` (retorna JWT com `sub`=user_id e `role` claim)
- [ ] Dependências de proteção: `get_current_user` e guarda por role (`require_role("organizador")` etc.)
- [ ] Hash de senha com bcrypt
- [ ] Script `scripts/seed.py`: 1 organizador, 2 clientes, 1 portaria, 1 evento publicado com assentos disponíveis (exigência do PDF)

### Entregáveis
- [ ] `POST /auth/login` funciona e protege uma rota de teste
- [ ] Seed roda e popula o banco
- [ ] Tabelas criadas via migration (não manual)

**Definição de pronto:** consigo fazer login com cada um dos 3 papéis e receber JWT.

### Resumo de aprendizado
- [ ] Anotar no `NOTAS.md`: o que é JWT, o que é migration, como funciona hash de senha

---

## Sprint 2 — Catálogo TMDb + eventos + assentos (segunda)

**Objetivo:** organizador cria eventos a partir do catálogo e monta o mapa de assentos.

### Mini-aula
- HTTP: métodos, status codes (200, 201, 404, 409...) e quando usar cada um
- Consumir API externa com httpx (async) e por que cachear no banco
- CRUD de verdade: o que muda entre criar, listar, editar e deletar

### Mão na massa (você escreve, eu guio)
### Backend
- [ ] `services/tmdb_client.py`: cliente async com httpx, busca de filmes em cartaz e por texto
- [ ] Cache dos filmes no banco (tabela `movies`) para não bater na API a cada request
- [ ] `GET /events` — listar eventos publicados (filtros por data/local/preço)
- [ ] `GET /events/{id}` — detalhe com assentos e status
- [ ] `POST /events` (organizador) — cria evento a partir de `tmdb_movie_id`, data, local, preço
- [ ] `PATCH/DELETE /events/{id}` (organizador) — editar/cancelar evento
- [ ] `GET /events/search` — busca por título integrando TMDb (filmes em cartaz)
- [ ] Geração automática dos `seats` (ex: A1..A12, B1..B12) ao criar evento
- [ ] `PUT /events/{id}/seats/{seat_id}` — liberar/ocupar assento manualmente (opcional, se sobrar tempo)

### Entregáveis
- [ ] Organizador consegue criar evento buscando filme no TMDb
- [ ] Assentos do evento aparecem com status `livre`
- [ ] Listagem/busca de eventos no backend

**Definição de pronto:** API expõe eventos completos com assentos via curl/Postman.

### Resumo de aprendizado
- [ ] Anotar no `NOTAS.md`: status codes HTTP, como cachear API externa

---

## Sprint 3 — Vendas: reserva, pagamento, QR e portaria (terça)

**Objetivo:** o coração do sistema — vender sem duplicar assento e validar na portaria.

### Mini-aula
- Transação atômica e concorrência: por que `UPDATE ... WHERE status='livre'` protege contra venda dupla
- Assinatura HMAC: como tornar um dado impossível de forjar
- QR Code: o que ele carrega e como ele se relaciona com o backend
- Idempotência: por que um ingresso não pode ser validado 2x

### Mão na massa (você escreve, eu guio)
### Backend
- [ ] `POST /events/{id}/reserve` (cliente) — recebe lista de assentos
- [ ] **Reserva atômica:** UPDATE com `WHERE status='livre'` dentro de transação; se algum assento já foi tomado → 409 com a lista dos indisponíveis (garante que nunca vende 2x)
- [ ] Timeout de reserva pendente (ex: 15 min) com liberação automática via job agendado (APScheduler) ou check lazy
- [ ] `POST /reservations/{id}/pay` — **pagamento simulado**:
  - cartão teste `4242 4242 4242 4242` → confirmação
  - cartão `4000 0000 0000 0002` → recusa (retorna erro amigável, reserva volta ao estoque)
- [ ] `services/ingresso.py`: gera payload + HMAC, cria Ticket com status `ativo`
- [ ] `GET /tickets/mine` — ingressos do cliente logado
- [ ] `GET /share/{token}` — link público do ingresso (payload sem dados sensíveis)
- [ ] `POST /portaria/validate` (portaria) — recebe código do QR:
  - retorna `valido` | `invalido` | `ja_utilizado` | `evento_errado`
  - grava em `validations` para **impedir validação dupla** (constraint única em ticket_id)
- [ ] Testes unitários dos pontos críticos (reserva concorrente, validação dupla, HMAC)

### Entregáveis
- [ ] Fluxo completo: reserva → pagamento → ingresso com QR via API
- [ ] Dois clientes não conseguem pegar o mesmo assento
- [ ] Mesmo QR validado 2x retorna `ja_utilizado`

**Definição de pronto:** script de teste (ou testes pytest) prova as 3 garantias acima.

### Resumo de aprendizado
- [ ] Anotar no `NOTAS.md`: transação atômica, HMAC, idempotência

---

## Sprint 4 — Frontend base: setup, auth, navegação (quarta)

**Objetivo:** frontend navegável, com login por papel e listagem de eventos.

### Mini-aula
- React + Vite: componentes, props, estado e por que o Vite
- React Router: rotas públicas vs. protegidas
- Context API para autenticação; axios e interceptor de token
- CORS: por que o backend precisa liberar o frontend

### Mão na massa (você escreve, eu guio)
- [ ] Estrutura Vite: react-router-dom, axios, AuthContext
- [ ] `services/api.ts` com interceptor injetando Bearer token
- [ ] Páginas: Login, Registro, Home (listagem de eventos do backend)
- [ ] Cards de evento com pôster do TMDb, data, local, preço
- [ ] Busca de eventos (integra `/events/search`)
- [ ] Proteção de rotas por papel (rota de organizador, de portaria, de cliente)
- [ ] Estilização própria e coerente (fuja do AI slop: define paleta, tipografia e espaçamento com intenção)
- [ ] Integração com a API real do backend local (CORS configurado)

**Definição de pronto:** cliente faz login, vê eventos com pôster e busca funcionando.

### Resumo de aprendizado
- [ ] Anotar no `NOTAS.md`: estado no React, Context, CORS

---

## Sprint 5 — Frontend: mapa de assentos, checkout, ingressos, portaria (quinta)

**Objetivo:** completar os 4 fluxos principais do cliente + tela da portaria.

### Mini-aula
- Estado de UI: seleção, loading, sucesso, erro
- Renderizar mapa interativo com estados visual por assento
- Leitura de QR pela câmera no browser (lib `html5-qrcode`)

### Mão na massa (você escreve, eu guio)
### Cliente
- [ ] Página de detalhe do evento com **mapa de assentos interativo** (grades por fileira, legendas livre/ocupado/selecionado)
- [ ] Seleção de assentos e botão de reserva
- [ ] Checkout com resumo (evento, assentos, total) e formulário de cartão simulado
- [ ] Estados de sucesso (ingresso gerado) e recusa (mensagem de erro + reserva liberada)
- [ ] Página **"Meus ingressos"**: cards de ingresso com **QR renderizado** (`qrcode.react`) e botão de compartilhar (copia o link `/share/<token>`)

### Portaria
- [ ] Tela de validação com leitura de QR pela câmera (lib `html5-qrcode`)
- [ ] Campo de digitação manual do código (alternativa exigida pelo PDF)
- [ ] Feedback visual claro: verde (válido), vermelho (inválido/evento errado), amarelo/laranja (já utilizado)

### Organizador
- [ ] Painel simples: criar evento (buscar filme no TMDb, definir data/local/preço), listar e cancelar eventos

**Definição de pronto:** de ponta a ponta no browser: navegar → reservar assento → pagar → ver QR → compartilhar → validar na portaria.

### Resumo de aprendizado
- [ ] Anotar no `NOTAS.md`: estados de UI, câmera no browser

---

## Sprint 6 — Deploy, README e entrega (sexta)

**Objetivo:** app no ar, documentada e enviada.

### Mini-aula
- Diferença entre dev e produção; variáveis de ambiente e secrets
- Migrations em produção (`alembic upgrade head`)
- O que o Render e a Vercel fazem (build, start, env vars)
- Como escrever um README que guia quem for avaliar

### Mão na massa (você executa, eu guio)
### Deploy
- [ ] **Backend no Render:** criar instância Postgres (Neon/Supabase) para produção, configurar env vars (DATABASE_URL, TMDb key, SECRET_KEY), deploy da branch main, aplicar migrations via `alembic upgrade head` no start (Release Command)
- [ ] **Frontend na Vercel:** `VITE_API_URL` apontando para a URL do Render, build e deploy
- [ ] Rodar seed em produção (usuários + evento publicado) — exigência do PDF
- [ ] Testar fluxo completo no ambiente publicado (todos os 3 papéis)

### Documentação (exigência do PDF)
- [ ] README com: visão geral, arquitetura, como rodar local (backend, frontend, banco), env vars, como rodar migrations e seed, como usar a API, limitações conhecidas
- [ ] **Seção "Uso de IA"**: quais ferramentas usadas, em que partes, o que foi feito sem IA, decisões de design e por quê (obrigatório e valorizado)
- [ ] `docker-compose.yml` documentado

### Qualidade e entrega
- [ ] Testes unitários do backend passando (pytest)
- [ ] Teste manual ponta a ponta no deploy
- [ ] Commits ao longo da semana com mensagens descritivas (histórico conta!)
- [ ] Enviar link do repositório + URLs de deploy no formulário elitedev.verzel.com.br

### Resumo de aprendizado
- [ ] Anotar no `NOTAS.md`: deploy, env vars em produção, migrations

---

## 6. Checklist final contra o PDF

- [ ] Navegação e busca de eventos (data, local, preço) ✅
- [ ] Criação/gerenciamento de eventos pelo organizador ✅
- [ ] Reserva com mapa de assentos ✅
- [ ] Pagamento simulado com confirmação e recusa ✅
- [ ] Meus ingressos com QR ✅
- [ ] Compartilhamento por link ✅
- [ ] Tela de portaria: válido / inválido / já utilizado / evento errado ✅
- [ ] Leitura de QR pela câmera + digitação manual ✅
- [ ] API externa TMDb ✅
- [ ] 3 papéis de autenticação ✅
- [ ] Assento nunca vendido 2x ✅
- [ ] QR que não pode ser forjado (HMAC) ✅
- [ ] Ingresso não validado 2x ✅
- [ ] Seed: organizador + 2 clientes + portaria + evento publicado ✅
- [ ] README detalhado + seção de IA ✅
- [ ] Deploy (acréscimo de 1 ponto) ✅

---

## 7. Dicas para usar IA sem cair em AI slop

- A IA (eu) atua como **mentor e revisor**, não como autor: você escreve, eu explico e corrijo.
- Use IA para: scaffolds repetitivos, gerar schemas/migrations, revisar código, escrever testes, montar o TMDb client.
- Faça você mesmo: as decisões de design da UI, a lógica de negócio da reserva, a modelagem do banco.
- O `NOTAS.md` acumula tudo que você aprendeu e vira a base da seção de IA do README — é o que o PDF mais valoriza.
